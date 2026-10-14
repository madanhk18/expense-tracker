import { ArrowDownLeft, HandCoins, PiggyBank, Repeat, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Desktop: split screen — a dark brand panel previewing the app, the form
 * beside it. Phones: the same brand as a hero across the top, with the form
 * on a sheet that rises over it. The brand surfaces stay dark in both themes
 * on purpose; they're a showcase, not part of the themed app.
 */

const BRAND_BACKGROUND =
  "radial-gradient(120% 80% at 0% 0%, oklch(0.34 0.07 255) 0%, transparent 60%), radial-gradient(90% 70% at 100% 100%, oklch(0.32 0.08 160) 0%, transparent 55%), oklch(0.16 0.01 260)";

const PREVIEW = [
  { icon: Wallet, label: "Spent this month", value: "₹17,580", hint: "8% less than September", tone: "oklch(0.78 0.12 250)" },
  { icon: PiggyBank, label: "Savings rate", value: "56%", hint: "₹22,420 kept", tone: "oklch(0.8 0.15 155)" },
  { icon: Repeat, label: "SIP added for you", value: "₹8,000", hint: "Every 15th, automatically", tone: "oklch(0.83 0.13 85)" },
  { icon: HandCoins, label: "Ravi owes you", value: "₹300", hint: "₹200 of ₹500 paid back", tone: "oklch(0.78 0.13 300)" },
];

function GridTexture() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage:
          "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
        backgroundSize: "44px 44px",
        maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
      }}
    />
  );
}

function Logo() {
  return (
    <div className="relative flex items-center gap-2.5">
      <span className="grid size-10 place-items-center rounded-xl bg-white text-[oklch(0.16_0.01_260)]">
        <Wallet className="size-5" />
      </span>
      <span className="text-lg font-bold tracking-tight">Expenses</span>
    </div>
  );
}

function PreviewCard({ item, index, compact }: { item: (typeof PREVIEW)[number]; index: number; compact?: boolean }) {
  return (
    <li
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.06] shadow-[0_20px_40px_-24px_black] backdrop-blur-sm",
        compact ? "w-40 shrink-0 snap-start p-3.5" : "p-4"
      )}
      style={compact ? undefined : { transform: `translateY(${index % 2 === 1 ? 18 : 0}px)` }}
    >
      <span
        className="grid size-8 place-items-center rounded-lg"
        style={{ backgroundColor: `color-mix(in oklch, ${item.tone} 22%, transparent)`, color: item.tone }}
      >
        <item.icon className="size-4" />
      </span>
      <p className="mt-3 text-xs text-white/55">{item.label}</p>
      <p className={cn("font-semibold tracking-tight tabular-nums", compact ? "text-xl" : "text-2xl")}>{item.value}</p>
      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/45">
        {index === 0 && <ArrowDownLeft className="size-3" style={{ color: item.tone }} />}
        {item.hint}
      </p>
    </li>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* Desktop brand panel */}
      <aside className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col" style={{ background: BRAND_BACKGROUND }}>
        <GridTexture />
        <Logo />

        <div className="relative my-auto max-w-md space-y-8 py-12">
          <div className="space-y-3">
            <h2 className="text-4xl leading-[1.1] font-bold tracking-tight">
              Every rupee,
              <br />
              <span className="text-white/60">accounted for.</span>
            </h2>
            <p className="text-base text-white/65">
              Spending, income, SIPs and money lent to friends — in one quiet place.
            </p>
          </div>

          <ul className="grid grid-cols-2 gap-3">
            {PREVIEW.map((item, i) => (
              <PreviewCard key={item.label} item={item} index={i} />
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">Private by default — only you can see your numbers.</p>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Phone & tablet hero */}
        <header
          className="relative overflow-hidden px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-14 text-white lg:hidden"
          style={{ background: BRAND_BACKGROUND }}
        >
          <GridTexture />
          <Logo />
          <h2 className="relative mt-7 text-3xl leading-[1.1] font-bold tracking-tight">
            Every rupee,
            <br />
            <span className="text-white/60">accounted for.</span>
          </h2>
          <ul className="relative -mx-6 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PREVIEW.map((item, i) => (
              <PreviewCard key={item.label} item={item} index={i} compact />
            ))}
          </ul>
        </header>

        {/* The form: a sheet over the hero on phones, centred beside the panel on desktop. */}
        <main className="relative -mt-8 flex flex-1 flex-col rounded-t-[2rem] bg-background px-6 pt-8 pb-10 shadow-[0_-12px_40px_-20px_black] sm:px-10 lg:mt-0 lg:rounded-none lg:shadow-none">
          <div className="mx-auto w-full max-w-sm lg:my-auto lg:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
