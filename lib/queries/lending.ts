import { createClient } from "@/lib/supabase/server";
import type { LendingInsertValues } from "@/lib/validations/lending.schema";
import type {
  LendingPerson,
  LendingRecord,
  LendingRecordWithSettlements,
  LendingSettlement,
  LendingStatus,
} from "@/types/domain";

type RecordRow = LendingRecord & { settlements: LendingSettlement[] | null };

function withBalance(row: RecordRow): LendingRecordWithSettlements {
  const settlements = [...(row.settlements ?? [])].sort(
    (a, b) => new Date(b.settled_at).getTime() - new Date(a.settled_at).getTime()
  );
  const settledPaise = settlements.reduce((sum, s) => sum + s.amount_paise, 0);
  return {
    ...row,
    settlements,
    settledPaise,
    remainingPaise: Math.max(0, row.amount_paise - settledPaise),
  };
}

export async function listLendingRecords(): Promise<LendingRecordWithSettlements[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lending_records")
    .select("*, settlements:lending_settlements(*)")
    .order("lent_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as unknown as RecordRow[]).map(withBalance);
}

export async function getLendingRecord(id: string): Promise<LendingRecordWithSettlements> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lending_records")
    .select("*, settlements:lending_settlements(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return withBalance(data as unknown as RecordRow);
}

/**
 * Group records by person (case-insensitive name) and net what's still open:
 * positive netPaise = they owe you, negative = you owe them. People with
 * everything settled sort last.
 */
export function groupByPerson(records: LendingRecordWithSettlements[]): LendingPerson[] {
  const people = new Map<string, LendingPerson>();

  for (const record of records) {
    const key = record.person_name.trim().toLowerCase();
    let person = people.get(key);
    if (!person) {
      person = { name: record.person_name.trim(), netPaise: 0, owedToYouPaise: 0, youOwePaise: 0, records: [] };
      people.set(key, person);
    }
    person.records.push(record);
    if (record.direction === "lent") person.owedToYouPaise += record.remainingPaise;
    else person.youOwePaise += record.remainingPaise;
  }

  for (const person of people.values()) person.netPaise = person.owedToYouPaise - person.youOwePaise;

  return [...people.values()].sort((a, b) => {
    const aOpen = a.owedToYouPaise + a.youOwePaise;
    const bOpen = b.owedToYouPaise + b.youOwePaise;
    if ((aOpen === 0) !== (bOpen === 0)) return aOpen === 0 ? 1 : -1;
    return Math.abs(b.netPaise) - Math.abs(a.netPaise);
  });
}

export async function createLendingRecord(input: LendingInsertValues) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("lending_records").insert({ ...input, user_id: user.id, status: "open" });
  if (error) throw error;
}

export async function deleteLendingRecord(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("lending_records").delete().eq("id", id);
  if (error) throw error;
}

function statusFor(amountPaise: number, settledPaise: number): LendingStatus {
  if (settledPaise <= 0) return "open";
  return settledPaise >= amountPaise ? "settled" : "partially_settled";
}

/**
 * Record a repayment. Never lets the total repaid exceed what was lent or
 * borrowed, then keeps the record's status in step with its balance.
 */
export async function addSettlement(recordId: string, amountPaise: number, note: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const record = await getLendingRecord(recordId);
  if (amountPaise > record.remainingPaise) {
    throw new Error("REPAYMENT_TOO_LARGE");
  }

  const { error } = await supabase.from("lending_settlements").insert({
    user_id: user.id,
    lending_record_id: recordId,
    amount_paise: amountPaise,
    note,
  });
  if (error) throw error;

  const { error: statusError } = await supabase
    .from("lending_records")
    .update({ status: statusFor(record.amount_paise, record.settledPaise + amountPaise) })
    .eq("id", recordId);
  if (statusError) throw statusError;
}

export async function deleteSettlement(settlementId: string, recordId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("lending_settlements").delete().eq("id", settlementId);
  if (error) throw error;

  const record = await getLendingRecord(recordId);
  const { error: statusError } = await supabase
    .from("lending_records")
    .update({ status: statusFor(record.amount_paise, record.settledPaise) })
    .eq("id", recordId);
  if (statusError) throw statusError;
}
