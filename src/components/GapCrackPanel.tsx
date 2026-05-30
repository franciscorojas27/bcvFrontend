import { useMemo } from "react";
import type { RateList, CointRate } from "../types/index.type";
import { formatEsVeDateTime } from "../utils/dateFormat";

type GapSnapshot = {
  symbol: string;
  parallel: number | null;
  bcv: number | null;
  gapValue: number | null;
  gapPercent: number | null;
};

const moneyFormatter = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function parseNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.includes(",") && trimmed.includes(".")
    ? trimmed.replace(/\./g, "").replace(/,/g, ".")
    : trimmed.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatValue(value: number | null) {
  return value === null ? "—" : moneyFormatter.format(value);
}

function formatPercent(value: number | null) {
  return value === null ? "—" : `${percentFormatter.format(value)}%`;
}

function toSnapshot(rate: CointRate | undefined, symbol: string): GapSnapshot {
  return {
    symbol,
    parallel: parseNumber(rate?.gap?.binance_rate?.price),
    bcv: parseNumber(rate?.price),
    gapValue: parseNumber(rate?.gap?.value),
    gapPercent: parseNumber(rate?.gap?.value_porcentual),
  };
}

function GapCard({ snapshot }: { snapshot: GapSnapshot }) {
  const crackStyle = {
    clipPath:
      "polygon(40% 0%, 60% 0%, 56% 10%, 66% 22%, 50% 34%, 62% 48%, 46% 60%, 60% 72%, 50% 86%, 58% 100%, 42% 100%, 48% 86%, 36% 72%, 50% 60%, 38% 48%, 52% 34%, 34% 22%, 44% 10%)",
  } as const;

  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[color:var(--surface)] shadow-[0_18px_40px_rgba(0,0,0,0.55)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      <div className="relative grid grid-cols-[1fr_110px_1fr] items-stretch">
        <div className="flex flex-col justify-between gap-3 border-r border-white/10 px-4 py-4 sm:px-5 sm:py-5">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[color:var(--foreground-subtle)]">
              Paralelo
            </p>
            <h4 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)] sm:text-[1.85rem]">
              {formatValue(snapshot.parallel)}
            </h4>
            <p className="mt-1 text-xs text-[color:var(--foreground-muted)]">Binance USDT</p>
          </div>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-200">
            {snapshot.symbol}
          </span>
        </div>

        <div className="relative flex items-center justify-center px-2">
          <div
            className="absolute inset-y-2 left-1/2 w-14 -translate-x-1/2 bg-[linear-gradient(180deg,rgba(248,113,113,0.55),rgba(251,191,36,0.18))] shadow-[0_0_24px_rgba(248,113,113,0.28)]"
            style={crackStyle}
            aria-hidden
          />
          <div className="relative z-10 text-center">
            <p className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-[color:var(--foreground-subtle)]">
              Brecha
            </p>
            <p className="mt-2 text-lg font-semibold text-amber-200">
              {formatPercent(snapshot.gapPercent)}
            </p>
            <p className="mt-1 text-xs text-[color:var(--foreground-muted)]">
              {snapshot.gapValue !== null ? `+${formatValue(snapshot.gapValue)}` : "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-l border-white/10 px-4 py-4 text-right sm:px-5 sm:py-5">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[color:var(--foreground-subtle)]">
              BCV
            </p>
            <h4 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)] sm:text-[1.85rem]">
              {formatValue(snapshot.bcv)}
            </h4>
            <p className="mt-1 text-xs text-[color:var(--foreground-muted)]">Oficial {snapshot.symbol}</p>
          </div>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-cyan-200">
            {snapshot.symbol}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function GapCrackPanel({ rates }: { rates?: RateList | null }) {
  const list = Array.isArray(rates?.list) ? rates?.list : [];

  const snapshots = useMemo(() => {
    return ["USD", "EUR"].map((symbol) =>
      toSnapshot(list.find((rate) => rate.symbol === symbol), symbol),
    );
  }, [list]);

  const hasData = snapshots.some(
    (snapshot) =>
      snapshot.parallel !== null ||
      snapshot.bcv !== null ||
      snapshot.gapPercent !== null ||
      snapshot.gapValue !== null,
  );

  const updatedAt = rates?.bcv_date ? formatEsVeDateTime(rates.bcv_date) : "Sin fecha";

  return (
    <section className="mt-6 w-full max-w-2xl rounded-[1.9rem] border border-white/10 bg-[color:var(--surface-strong)] px-4 py-5 shadow-[0_20px_45px_rgba(0,0,0,0.6)] mx-auto sm:px-6 sm:py-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--foreground-subtle)]">
            Brecha cambiaria
          </p>
          <h3 className="text-lg font-semibold text-[color:var(--foreground)]">Grieta paralelo vs BCV</h3>
        </div>
        <span className="text-xs text-[color:var(--foreground-subtle)]">{updatedAt}</span>
      </div>

      {hasData ? (
        <div className="mt-5 grid gap-4">
          {snapshots.map((snapshot) => (
            <GapCard key={snapshot.symbol} snapshot={snapshot} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[1.1rem] border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-[color:var(--foreground-muted)]">
          No hay datos de brecha disponibles.
        </div>
      )}
    </section>
  );
}
