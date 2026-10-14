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
  // Food delivery & eating out
  swiggy: ["Swiggy", "Food"],
  zomato: ["Zomato", "Food"],
  dominos: ["Domino's", "Food"],
  pizzahut: ["Pizza Hut", "Food"],
  mcdonalds: ["McDonald's", "Food"],
  mcd: ["McDonald's", "Food"],
  kfc: ["KFC", "Food"],
  burgerking: ["Burger King", "Food"],
  subway: ["Subway", "Food"],
  starbucks: ["Starbucks", "Food"],
  chaayos: ["Chaayos", "Food"],
  haldiram: ["Haldiram's", "Food"],
  haldirams: ["Haldiram's", "Food"],
  // Groceries
  blinkit: ["Blinkit", "Groceries"],
  zepto: ["Zepto", "Groceries"],
  instamart: ["Instamart", "Groceries"],
  bigbasket: ["BigBasket", "Groceries"],
  bbdaily: ["BB Daily", "Groceries"],
  dmart: ["DMart", "Groceries"],
  jiomart: ["JioMart", "Groceries"],
  // Getting around
  uber: ["Uber", "Transportation"],
  ola: ["Ola", "Transportation"],
  rapido: ["Rapido", "Transportation"],
  namma: ["Namma Yatri", "Transportation"],
  bmtc: ["BMTC", "Transportation"],
  fastag: ["FASTag", "Transportation"],
  // Trips
  irctc: ["IRCTC", "Travel"],
  redbus: ["redBus", "Travel"],
  makemytrip: ["MakeMyTrip", "Travel"],
  mmt: ["MakeMyTrip", "Travel"],
  goibibo: ["Goibibo", "Travel"],
  ixigo: ["ixigo", "Travel"],
  oyo: ["OYO", "Travel"],
  airbnb: ["Airbnb", "Travel"],
  indigo: ["IndiGo", "Travel"],
  // Shopping
  amazon: ["Amazon", "Shopping"],
  flipkart: ["Flipkart", "Shopping"],
  myntra: ["Myntra", "Shopping"],
  ajio: ["Ajio", "Shopping"],
  meesho: ["Meesho", "Shopping"],
  nykaa: ["Nykaa", "Shopping"],
  decathlon: ["Decathlon", "Shopping"],
  croma: ["Croma", "Shopping"],
  ikea: ["IKEA", "Shopping"],
  // Subscriptions & fun
  netflix: ["Netflix", "Subscriptions"],
  spotify: ["Spotify", "Subscriptions"],
  hotstar: ["Hotstar", "Subscriptions"],
  jiohotstar: ["JioHotstar", "Subscriptions"],
  prime: ["Prime", "Subscriptions"],
  youtube: ["YouTube", "Subscriptions"],
  chatgpt: ["ChatGPT", "Subscriptions"],
  icloud: ["iCloud", "Subscriptions"],
  bookmyshow: ["BookMyShow", "Entertainment"],
  bms: ["BookMyShow", "Entertainment"],
  pvr: ["PVR", "Entertainment"],
  inox: ["INOX", "Entertainment"],
  // Health & self-care
  apollo: ["Apollo", "Healthcare"],
  pharmeasy: ["PharmEasy", "Healthcare"],
  netmeds: ["Netmeds", "Healthcare"],
  "1mg": ["Tata 1mg", "Healthcare"],
  practo: ["Practo", "Healthcare"],
  cult: ["cult.fit", "Personal"],
  cultfit: ["cult.fit", "Personal"],
  urbancompany: ["Urban Company", "Personal"],
  // Bills
  airtel: ["Airtel", "Bills"],
  jio: ["Jio", "Bills"],
  vi: ["Vi", "Bills"],
  bsnl: ["BSNL", "Bills"],
  bescom: ["BESCOM", "Bills"],
  tatasky: ["Tata Play", "Bills"],
  tataplay: ["Tata Play", "Bills"],
  // Learning
  udemy: ["Udemy", "Education"],
  coursera: ["Coursera", "Education"],
};

/**
 * Everyday words → default category. Groceries = things bought to cook or
 * use at home; Food = eating out or ready to eat; Transportation = daily
 * commute; Travel = trips. Plurals are handled automatically.
 */
const CATEGORY_WORDS: Record<string, string[]> = {
  Food: [
    "food", "lunch", "dinner", "breakfast", "brunch", "snack", "meal", "tiffin", "canteen", "mess",
    "restaurant", "cafe", "dhaba", "takeaway", "parcel", "coffee", "tea", "chai", "juice", "lassi",
    "milkshake", "shake", "smoothie", "biryani", "pizza", "burger", "sandwich", "dosa", "idli", "vada",
    "upma", "poori", "puri", "samosa", "kachori", "chaat", "panipuri", "golgappa", "pakoda", "pakora",
    "momo", "noodle", "maggi", "pasta", "roll", "shawarma", "kebab", "paratha", "thali", "chole",
    "bhature", "pavbhaji", "vadapav", "frankie", "fries", "omelette", "tikka", "curry", "manchurian", "cake", "pastry", "dessert", "icecream",
    "kulfi", "sweet", "mithai", "chocolate", "softdrink", "colddrink", "cooldrink", "coke", "pepsi",
    "soda", "bakery", "treat",
  ],
  Groceries: [
    "grocery", "groceries", "kirana", "provisions", "ration", "vegetable", "veggie", "veg", "sabzi",
    "sabji", "onion", "tomato", "potato", "aloo", "carrot", "beans", "spinach", "palak", "coriander",
    "fruit", "banana", "apple", "mango", "orange", "grapes", "papaya", "watermelon", "milk", "doodh",
    "curd", "dahi", "yogurt", "buttermilk", "paneer", "butter", "ghee", "cheese", "cream", "bread",
    "egg", "anda", "rice", "chawal", "atta", "aata", "flour", "maida", "rava", "sooji", "poha", "dal",
    "daal", "pulses", "oil", "sugar", "salt", "jaggery", "spices", "masala", "biscuit", "namkeen",
    "cereal", "oats", "chicken", "mutton", "fish", "prawns", "meat", "detergent", "soap", "shampoo",
    "toothpaste", "toiletries", "cleaning", "tissue", "household",
  ],
  Transportation: [
    "petrol", "diesel", "fuel", "cng", "ev", "charging", "auto", "rickshaw", "cab", "taxi", "metro",
    "bus", "local", "commute", "parking", "toll", "bike", "scooter", "puncture", "carwash", "ride",
  ],
  Travel: [
    "train", "railway", "flight", "airport", "airline", "hostel", "stay", "resort", "trip",
    "tour", "travel", "holiday", "vacation", "visa", "luggage", "booking", "tickets",
  ],
  Bills: [
    "bill", "electricity", "current", "power", "water", "gas", "cylinder", "lpg", "recharge", "prepaid",
    "postpaid", "wifi", "broadband", "internet", "fiber", "dth", "emi", "loan", "insurance",
    "premium", "maintenance", "society", "tax",
  ],
  Rent: ["rent", "pg", "deposit", "brokerage", "lease"],
  Shopping: [
    "shopping", "clothes", "shirt", "tshirt", "jeans", "trouser", "dress", "kurta", "saree",
    "jacket", "shoe", "sandal", "chappal", "slipper", "watch", "bag", "wallet", "jewellery", "ring",
    "gift", "electronics", "headphone", "earphone", "earbuds", "charger", "cable", "laptop", "gadget",
    "cosmetics", "makeup", "perfume", "furniture", "decor", "utensils",
  ],
  Entertainment: [
    "movie", "cinema", "film", "show", "concert", "game", "gaming", "party", "pub", "bar", "beer",
    "drinks", "outing", "bowling", "amusement", "event",
  ],
  Healthcare: [
    "medicine", "meds", "tablet", "pill", "syrup", "doctor", "clinic", "hospital", "pharmacy",
    "chemist", "medical", "lab", "test", "checkup", "dentist", "dental", "scan", "xray", "physio",
    "vaccine", "spectacles", "glasses", "lens",
  ],
  Personal: [
    "gym", "haircut", "hair", "salon", "parlour", "barber", "spa", "massage", "grooming", "laundry",
    "dryclean", "ironing", "tailor", "skincare", "yoga",
  ],
  Education: [
    "book", "course", "fees", "fee", "tuition", "coaching", "school", "college", "exam", "stationery",
    "pen", "notebook", "class", "workshop", "certification",
  ],
  Subscriptions: ["subscription", "membership", "renewal", "ott"],
};

/** A grocery word gives way to any other category word in the same note. */
const WEAK_CATEGORY = "Groceries";

const KEYWORDS: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_WORDS).flatMap(([category, words]) => words.map((w) => [w, category]))
);

/** Try the word as typed, then without a plural ending ("fruits" → "fruit", "tomatoes" → "tomato"). */
function lookup<T>(table: Record<string, T>, word: string): T | undefined {
  return table[word] ?? (word.endsWith("es") ? table[word.slice(0, -2)] : undefined) ?? (word.endsWith("s") ? table[word.slice(0, -1)] : undefined);
}

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
    const keyword = lookup(KEYWORDS, word);
    if (brand && !merchant) {
      merchant = brand[0];
      guessedCategory ??= findCategory(brand[1], categories);
    } else if (keyword) {
      // Ingredient words are weak: "masala dosa" and "chicken biryani" are Food.
      const weakSoFar = !guessedCategory || guessedCategory.name.toLowerCase() === WEAK_CATEGORY.toLowerCase();
      if (weakSoFar && (keyword !== WEAK_CATEGORY || !guessedCategory)) {
        guessedCategory = findCategory(keyword, categories) ?? guessedCategory;
      }
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
