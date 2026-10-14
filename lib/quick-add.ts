import type { PaymentMethod } from "@/lib/constants";

/**
 * Turns a one-line note like "450 petrol upi" or "1.2k swiggy dinner card
 * yesterday" into expense fields. Pure — no I/O — and forgiving: anything it
 * doesn't recognise becomes the description.
 */

export interface QuickAddCategory {
  id: string;
  name: string;
}

export interface QuickAddResult {
  amountPaise: number | null;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  paymentMethod: PaymentMethod | null;
  merchant: string | null;
  /** 0 = today, -1 = yesterday; null when no day was mentioned. */
  dayOffset: number | null;
}

const PAYMENT_WORDS: Record<string, PaymentMethod> = {
  upi: "UPI",
  gpay: "UPI",
  googlepay: "UPI",
  phonepe: "UPI",
  paytm: "UPI",
  bhim: "UPI",
  cash: "Cash",
  card: "Credit Card",
  cc: "Credit Card",
  credit: "Credit Card",
  creditcard: "Credit Card",
  debit: "Debit Card",
  dc: "Debit Card",
  debitcard: "Debit Card",
  netbanking: "Net Banking",
  neft: "Bank Transfer",
  imps: "Bank Transfer",
  rtgs: "Bank Transfer",
  transfer: "Bank Transfer",
  bank: "Bank Transfer",
};

const DAY_WORDS: Record<string, number> = {
  today: 0,
  tdy: 0,
  yesterday: -1,
  yday: -1,
  ystd: -1,
};

/** Words that never mean anything here. */
const FILLER = new Set(["via", "paid", "spent", "rs", "rs.", "inr", "₹"]);
/** Small words kept inside a description ("coffee with friends") but trimmed off its ends ("for lunch" → "lunch"). */
const CONNECTORS = new Set(["for", "on", "at", "by", "with", "to", "in", "the", "a", "and", "from"]);

/** Brand → [display name, default category]. */
const MERCHANTS: Record<string, [string, string]> = {
  swiggy: ["Swiggy", "Food"],
  zomato: ["Zomato", "Food"],
  dominos: ["Domino's", "Food"],
  starbucks: ["Starbucks", "Food"],
  blinkit: ["Blinkit", "Groceries"],
  zepto: ["Zepto", "Groceries"],
  instamart: ["Instamart", "Groceries"],
  bigbasket: ["BigBasket", "Groceries"],
  dmart: ["DMart", "Groceries"],
  uber: ["Uber", "Transportation"],
  ola: ["Ola", "Transportation"],
  rapido: ["Rapido", "Transportation"],
  amazon: ["Amazon", "Shopping"],
  flipkart: ["Flipkart", "Shopping"],
  myntra: ["Myntra", "Shopping"],
  ajio: ["Ajio", "Shopping"],
  meesho: ["Meesho", "Shopping"],
  netflix: ["Netflix", "Subscriptions"],
  spotify: ["Spotify", "Subscriptions"],
  hotstar: ["Hotstar", "Subscriptions"],
  prime: ["Prime", "Subscriptions"],
  youtube: ["YouTube", "Subscriptions"],
  bookmyshow: ["BookMyShow", "Entertainment"],
  pvr: ["PVR", "Entertainment"],
  irctc: ["IRCTC", "Travel"],
  makemytrip: ["MakeMyTrip", "Travel"],
  apollo: ["Apollo", "Healthcare"],
  pharmeasy: ["PharmEasy", "Healthcare"],
  airtel: ["Airtel", "Bills"],
  jio: ["Jio", "Bills"],
};

/** Everyday words → default category name. */
const KEYWORDS: Record<string, string> = {
  petrol: "Transportation",
  diesel: "Transportation",
  fuel: "Transportation",
  auto: "Transportation",
  cab: "Transportation",
  taxi: "Transportation",
  metro: "Transportation",
  bus: "Transportation",
  train: "Travel",
  flight: "Travel",
  hotel: "Travel",
  trip: "Travel",
  lunch: "Food",
  dinner: "Food",
  breakfast: "Food",
  snacks: "Food",
  coffee: "Food",
  tea: "Food",
  chai: "Food",
  food: "Food",
  biryani: "Food",
  pizza: "Food",
  grocery: "Groceries",
  groceries: "Groceries",
  vegetables: "Groceries",
  veggies: "Groceries",
  milk: "Groceries",
  fruits: "Groceries",
  rent: "Rent",
  electricity: "Bills",
  recharge: "Bills",
  wifi: "Bills",
  internet: "Bills",
  water: "Bills",
  gas: "Bills",
  emi: "Bills",
  movie: "Entertainment",
  movies: "Entertainment",
  medicine: "Healthcare",
  medicines: "Healthcare",
  doctor: "Healthcare",
  pharmacy: "Healthcare",
  hospital: "Healthcare",
  gym: "Personal",
  haircut: "Personal",
  salon: "Personal",
  clothes: "Shopping",
  shoes: "Shopping",
  books: "Education",
  course: "Education",
  fees: "Education",
};

function parseAmount(token: string): number | null {
  const t = token.toLowerCase().replace(/^(₹|rs\.?|inr)/, "").replace(/(rs|₹|\/-)$/, "").replace(/,/g, "");
  const match = /^(\d+(?:\.\d{1,2})?)(k)?$/.exec(t);
  if (!match) return null;
  const value = Number(match[1]) * (match[2] ? 1000 : 1);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

function findCategory(name: string, categories: QuickAddCategory[]) {
  const n = name.toLowerCase();
  return categories.find((c) => c.name.toLowerCase() === n) ?? null;
}

/** Match a word against the user's own category names (exact, plural, or a 4+ letter prefix). */
function matchCategoryName(word: string, categories: QuickAddCategory[]) {
  return (
    categories.find((c) => {
      const name = c.name.toLowerCase();
      return name === word || name === `${word}s` || `${name}s` === word || (word.length >= 4 && name.startsWith(word));
    }) ?? null
  );
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function parseQuickAdd(text: string, categories: QuickAddCategory[]): QuickAddResult {
  const tokens = text.trim().split(/\s+/).filter(Boolean);

  let amountPaise: number | null = null;
  let paymentMethod: PaymentMethod | null = null;
  let dayOffset: number | null = null;
  let merchant: string | null = null;
  let category: QuickAddCategory | null = null;
  let guessedCategory: QuickAddCategory | null = null;
  const rest: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const raw = tokens[i]!;
    const word = raw.toLowerCase().replace(/[.,!]+$/, "");
    const pair = i + 1 < tokens.length ? `${word}${tokens[i + 1]!.toLowerCase()}` : "";

    if (amountPaise === null) {
      const amount = parseAmount(raw);
      if (amount !== null) {
        amountPaise = amount;
        continue;
      }
    }
    // Two-word payment names: "net banking", "credit card", "google pay".
    if (!paymentMethod && (pair === "netbanking" || pair === "creditcard" || pair === "debitcard" || pair === "googlepay")) {
      paymentMethod = PAYMENT_WORDS[pair]!;
      i++;
      continue;
    }
    if (!paymentMethod && PAYMENT_WORDS[word]) {
      paymentMethod = PAYMENT_WORDS[word]!;
      continue;
    }
    if (dayOffset === null && word in DAY_WORDS) {
      dayOffset = DAY_WORDS[word]!;
      continue;
    }
    if (FILLER.has(word)) continue;

    // The user's own categories beat every built-in guess ("petrol" → Petrol).
    const own: QuickAddCategory | null = !category ? matchCategoryName(word, categories) : null;
    if (own) category = own;

    const brand = MERCHANTS[word];
    if (brand && !merchant) {
      merchant = brand[0];
      guessedCategory ??= findCategory(brand[1], categories);
    } else if (KEYWORDS[word]) {
      guessedCategory ??= findCategory(KEYWORDS[word]!, categories);
    }
    rest.push(raw);
  }

  category ??= guessedCategory;
  while (rest.length && CONNECTORS.has(rest[0]!.toLowerCase())) rest.shift();
  while (rest.length && CONNECTORS.has(rest[rest.length - 1]!.toLowerCase())) rest.pop();
  const description = capitalise(rest.join(" ")) || merchant || category?.name || "";

  return {
    amountPaise,
    description,
    categoryId: category?.id ?? null,
    categoryName: category?.name ?? null,
    paymentMethod,
    merchant,
    dayOffset,
  };
}
