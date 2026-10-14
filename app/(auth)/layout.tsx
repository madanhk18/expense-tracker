import { ArrowDownLeft, HandCoins, PiggyBank, Repeat, Wallet } from "lucide-react";

/**
 * Split screen: a dark brand panel that previews what the app does (desktop
 * only), and the form on a calm surface beside it. The panel is the same in
 * light and dark mode — it's a showcase, not part of the themed app.
 */

const PREVIEW = [
  { icon: Wallet, label: "Spent this month", value: "₹17,580", hint: "8% less than September", tone: "oklch(0.78 0.12 250)" },
  { icon: PiggyBank, label: "Savings rate", value: "56%", hint: "₹22,420 kept", tone: "oklch(0.8 0.15 155)" },
  { icon: Repeat, label: "SIP added for you", value: "₹8,000", hint: "Every 15th, automatically", tone: "oklch(0.83 0.13 85)" },
  { icon: HandCoins, label: "Ravi owes you", value: "₹300", hint: "₹200 of ₹500 paid back", tone: "oklch(0.78 0.13 300)" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside
        className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col"
        style={{
          background:
            "radial-gradient(120% 80% at 0% 0%, oklch(0.32 0.06 255) 0%, transparent 60%), radial-gradient(90% 70% at 100% 100%, oklch(0.3 0.07 160) 0%, transparent 55%), oklch(0.16 0.01 260)",
        }}
      >
        {/* Fine grid texture — purely visual. */}
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

        <div className="relative flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-white text-[oklch(0.16_0.01_260)]">
            <Wallet className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">Expenses</span>
        </div>

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
              <li
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_20px_40px_-24px_black] backdrop-blur-sm"
                style={{ transform: `translateY(${i % 2 === 1 ? 18 : 0}px)` }}
              >
                <span
                  className="grid size-8 place-items-center rounded-lg"
                  style={{ backgroundColor: `color-mix(in oklch, ${item.tone} 22%, transparent)`, color: item.tone }}
                >
                  <item.icon className="size-4" />
                </span>
                <p className="mt-3 text-xs text-white/55">{item.label}</p>
                <p className="text-2xl font-semibold tracking-tight tabular-nums">{item.value}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/45">
                  {i === 0 && <ArrowDownLeft className="size-3" style={{ color: item.tone }} />}
                  {item.hint}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">Private by default — only you can see your numbers.</p>
      </aside>

      <main className="flex flex-col px-6 py-10 sm:px-10">
        {/* Phones and tablets: a compact mark instead of the brand panel. */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <span className="btn-solid grid size-10 place-items-center rounded-xl">
            <Wallet className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">Expenses</span>
        </div>

        <div className="mx-auto my-auto w-full max-w-sm py-10">{children}</div>
      </main>
    </div>
  );
}
