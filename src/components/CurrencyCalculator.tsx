import { useEffect, useMemo, useState, ChangeEvent } from "react";
import type { RateList } from "../types/index.type";

type RateSource = "bcv" | "binance-buy" | "binance-sell";

interface BinanceData {
  buyPrice: string;
  sellPrice: string;
}

const parsePrice = (value: string) => Number(value.replace(/,/g, ""));
const formatNumber = (value: number, maximumFractionDigits = 6) =>
  new Intl.NumberFormat("es-VE", { maximumFractionDigits }).format(value);

const parseAmount = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return Number.NaN;
  if (trimmed.includes(",") && trimmed.includes(".")) {
    const normalized = trimmed.replace(/\./g, "").replace(",", ".");
    return Number(normalized);
  }
  return Number(trimmed.replace(/\s/g, "").replace(",", "."));
};

const sourceLabels: Record<RateSource, string> = {
  bcv: "BCV",
  "binance-buy": "Binance (compra)",
  "binance-sell": "Binance (venta)",
};

const dateFormatter = new Intl.DateTimeFormat("es-VE", {
  dateStyle: "medium",
  timeStyle: "short",
});

const quickAmounts = ["10", "50", "100", "500", "1000"];

const formatUpdatedAt = (value: string) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return dateFormatter.format(date);
};

export default function CurrencyCalculator({
  rates,
  binance,
}: {
  rates: RateList;
  binance: BinanceData | null;
}) {
  const symbols = useMemo(
    () => rates.list.map((rate) => rate.symbol).sort(),
    [rates.list],
  );

  const preferredSymbol = symbols.includes("USD") ? "USD" : symbols[0] ?? "";
  const [source, setSource] = useState<RateSource>("bcv");
  const [symbol, setSymbol] = useState(preferredSymbol);
  const [sourceAmount, setSourceAmount] = useState("1");
  const [vesAmount, setVesAmount] = useState("");
  const [lastEdited, setLastEdited] = useState<"source" | "ves">("source");
  const hasBinance = Boolean(binance?.buyPrice && binance?.sellPrice);

  useEffect(() => {
    if (!symbol && symbols.length) {
      setSymbol(preferredSymbol);
    }
  }, [preferredSymbol, symbol, symbols]);

  useEffect(() => {
    if (!hasBinance && source !== "bcv") {
      setSource("bcv");
    }
  }, [hasBinance, source]);

  const rateMap = useMemo(() => {
    const map = new Map<string, number>();
    rates.list.forEach((rate) => {
      const parsed = parsePrice(rate.price);
      if (Number.isFinite(parsed)) {
        map.set(rate.symbol, parsed);
      }
    });
    return map;
  }, [rates.list]);

  const binanceRate = useMemo(() => {
    if (!hasBinance) return null;
    const value = source === "binance-buy" ? binance?.buyPrice : binance?.sellPrice;
    if (!value) return null;
    const parsed = parsePrice(value);
    return Number.isFinite(parsed) ? parsed : null;
  }, [binance?.buyPrice, binance?.sellPrice, hasBinance, source]);

  const displaySymbol = source === "bcv" ? symbol : "USDT";
  const rate =
    source === "bcv" ? (symbol ? rateMap.get(symbol) ?? null : null) : binanceRate;
  const sourceValue = useMemo(() => parseAmount(sourceAmount), [sourceAmount]);
  const vesValue = useMemo(() => parseAmount(vesAmount), [vesAmount]);

  const calculatedVes = useMemo(() => {
    if (!rate || !Number.isFinite(sourceValue)) return null;
    return sourceValue * rate;
  }, [rate, sourceValue]);

  const calculatedSource = useMemo(() => {
    if (!rate || !Number.isFinite(vesValue)) return null;
    return vesValue / rate;
  }, [rate, vesValue]);

  const displayedSource =
    lastEdited === "source"
      ? sourceAmount
      : calculatedSource !== null
        ? formatNumber(calculatedSource)
        : "";
  const displayedVes =
    lastEdited === "ves"
      ? vesAmount
      : calculatedVes !== null
        ? formatNumber(calculatedVes)
        : "";

  if (!symbols.length) {
    return (
      <div className="w-full max-w-5xl rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8 text-sm text-[color:var(--foreground-muted)] shadow-[var(--shadow-soft)]">
        No hay datos de tasas disponibles.
      </div>
    );
  }
  return (
    <section className="relative w-full max-w-5xl">
      <div className="relative overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-6 shadow-[var(--shadow-strong)] sm:p-8">
        <div className="absolute right-0 top-0 h-52 w-52 -translate-y-1/2 translate-x-1/4 rounded-full bg-[color:var(--accent-soft)] blur-3xl" aria-hidden />

        <div className="relative grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[color:var(--accent)]">Calculadora BCV</p>
            <h1 className="mt-3 text-3xl font-[var(--font-display)] leading-tight text-[color:var(--foreground)] sm:text-4xl">Calcula rapido, decide mejor</h1>
            <p className="mt-3 text-sm text-[color:var(--foreground-muted)]">Escribe un monto en la moneda base o en VES. El otro campo se actualiza al instante.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="source" className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--foreground-subtle)]">Fuente</label>
                <select
                  id="source"
                  value={source}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSource(e.target.value as RateSource)}
                  className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm transition focus:border-[color:var(--accent)] focus:outline-none focus:ring-4 focus:ring-[color:var(--ring)]"
                >
                  <option value="bcv">BCV</option>
                  {hasBinance ? (
                    <>
                      <option value="binance-buy">Binance compra</option>
                      <option value="binance-sell">Binance venta</option>
                    </>
                  ) : null}
                </select>
              </div>

              <div>
                <label htmlFor="currency" className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--foreground-subtle)]">Moneda</label>
                <select
                  id="currency"
                  value={symbol}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSymbol(e.target.value)}
                  disabled={source !== "bcv"}
                  className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm transition focus:border-[color:var(--accent)] focus:outline-none focus:ring-4 focus:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {symbols.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="source-amount" className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--foreground-subtle)]">Monto en {displaySymbol || "--"}</label>
              <input
                id="source-amount"
                type="text"
                inputMode="decimal"
                value={displayedSource}
                placeholder="Ej: 1200,50"
                onChange={(e: ChangeEvent<HTMLInputElement>) => { setLastEdited("source"); setSourceAmount(e.target.value); }}
                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3 text-xl font-semibold text-[color:var(--foreground)] shadow-sm transition focus:border-[color:var(--accent)] focus:outline-none focus:ring-4 focus:ring-[color:var(--ring)]"
              />

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {quickAmounts.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => { setLastEdited("source"); setSourceAmount(v); }}
                    className="rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-strong)] px-3 py-1 font-semibold text-[color:var(--foreground-muted)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent-strong)]"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-xs text-[color:var(--foreground-subtle)]">
              {!hasBinance ? "Binance no esta disponible en este momento." : source !== "bcv" ? "Binance trabaja con USDT de referencia." : "Puedes alternar entre BCV y Binance cuando Binance este disponible."}
            </div>
          </div>

          <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--foreground-subtle)]">Total en VES</div>
                <div className="mt-1 text-xs text-[color:var(--foreground-muted)]">Actualizado: {formatUpdatedAt(rates.bcv_date)}</div>
              </div>
              <div className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[color:var(--accent)]">{sourceLabels[source]}</div>
            </div>

            <input
              id="ves-amount"
              type="text"
              inputMode="decimal"
              value={displayedVes}
              placeholder="Ej: 1200,50"
              onChange={(e: ChangeEvent<HTMLInputElement>) => { setLastEdited("ves"); setVesAmount(e.target.value); }}
              className="mt-5 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-4 text-3xl font-semibold text-[color:var(--foreground)] shadow-sm transition focus:border-[color:var(--accent)] focus:outline-none focus:ring-4 focus:ring-[color:var(--ring)]"
              aria-live="polite"
            />

            <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--foreground-subtle)]">Cambio actual</div>
              <div className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">{rate ? `1 ${displaySymbol} = ${formatNumber(rate)} VES` : "Selecciona una tasa valida para continuar."}</div>
            </div>

            <div className="mt-4 space-y-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm">
              <div className="flex items-center justify-between text-[color:var(--foreground-subtle)]"><span>Moneda base</span><span className="font-semibold text-[color:var(--foreground)]">{displaySymbol || "-"}</span></div>
              <div className="flex items-center justify-between text-[color:var(--foreground-subtle)]"><span>Precision</span><span className="font-semibold text-[color:var(--foreground)]">Hasta 6 decimales</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
