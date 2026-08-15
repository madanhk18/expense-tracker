"use client";

import { useState } from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { validateImportRows, type ValidatedImportRow } from "@/lib/validations/import.schema";

export function ImportDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ValidatedImportRow[]>([]);
  const [importing, setImporting] = useState(false);

  function handleFile(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => setRows(validateImportRows(result.data)),
      error: () => toast.error("Couldn't read that CSV file."),
    });
  }

  const validRows = rows.filter((r) => r.valid);

  async function handleConfirm() {
    setImporting(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows.map((r) => r.raw) }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Import failed");

      toast.success(`Imported ${result.inserted} expense${result.inserted === 1 ? "" : "s"}.`);
      if (result.errors?.length) {
        toast.warning(`${result.errors.length} row(s) couldn't be imported.`);
      }
      setOpen(false);
      setRows([]);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="icon" aria-label="Import" onClick={() => setOpen(true)}>
        <Upload className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90svh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import expenses from CSV</DialogTitle>
          </DialogHeader>

          {rows.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Columns expected: Date, Time, Item, Category, Merchant, Payment Method, Amount, Notes — same format as
                the CSV export.
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="text-sm"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm">
                <span className="font-medium">{validRows.length}</span> of {rows.length} rows look valid.
              </p>
              <ScrollArea className="h-72 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.index}>
                        <TableCell>
                          {row.valid ? (
                            <Badge variant="secondary">OK</Badge>
                          ) : (
                            <Badge variant="destructive" title={row.error}>
                              Error
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{row.raw.Date}</TableCell>
                        <TableCell className="max-w-40 truncate">{row.raw.Item}</TableCell>
                        <TableCell>{row.raw.Amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRows([])}>
                  Choose different file
                </Button>
                <Button onClick={handleConfirm} disabled={importing || validRows.length === 0}>
                  {importing ? "Importing…" : `Import ${validRows.length} expense${validRows.length === 1 ? "" : "s"}`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
