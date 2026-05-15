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
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200/70 bg-white/70 p-6 text-sm text-slate-500 shadow-sm backdrop-blur">
        No hay datos de tasas disponibles.
      </div>
    );
  }
  return (
    <section className="relative w-full max-w-5xl">
      <div className="relative rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-strong)] backdrop-blur sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[color:var(--accent)]">Calculadora BCV</p>
            <h1 className="mt-3 text-3xl font-[var(--font-display)] text-[color:var(--foreground)] sm:text-4xl">Convierte con confianza, en segundos</h1>
            <p className="mt-3 text-sm text-[color:var(--foreground-muted)]">Elige la fuente y escribe un monto en la moneda o en VES; el otro campo se calcula automaticamente.</p>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3 text-xs text-[color:var(--foreground-muted)] shadow-[var(--shadow-soft)]">
            <div className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--foreground-subtle)]">Actualizado</div>
            <div className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">{formatUpdatedAt(rates.bcv_date)}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5 shadow-[var(--shadow-soft)]">
            <div className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="source" className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--foreground-subtle)]">Fuente</label>
                  <select
                    id="source"
                    value={source}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSource(e.target.value as RateSource)}
                    className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm transition focus:border-[color:var(--accent)] focus:outline-none focus:ring-4 focus:ring-[color:var(--ring)]"
                  >
                    <option value="bcv">BCV</option>
                    {hasBinance ? (
                      <>
                        <option value="binance-buy">Binance compra</option>
                        <option value="binance-sell">Binance venta</option>
                      </>
                    ) : null}
                  </select>
                  {!hasBinance ? <p className="mt-2 text-xs text-[color:var(--foreground-subtle)]">Binance no esta disponible en este momento.</p> : null}
                </div>

                <div>
                  <label htmlFor="currency" className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--foreground-subtle)]">Moneda</label>
                  <select
                    id="currency"
                    value={symbol}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSymbol(e.target.value)}
                    disabled={source !== "bcv"}
                    className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm transition focus:border-[color:var(--accent)] focus:outline-none focus:ring-4 focus:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {symbols.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  {source !== "bcv" ? <p className="mt-2 text-xs text-[color:var(--foreground-subtle)]">Binance trabaja con USDT de referencia.</p> : null}
                </div>
              </div>

              <div>
                <label htmlFor="source-amount" className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--foreground-subtle)]">Monto en {displaySymbol || "--"}</label>
                <input
                  id="source-amount"
                  type="text"
                  inputMode="decimal"
                  value={displayedSource}
                  placeholder="Ej: 1200,50"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { setLastEdited("source"); setSourceAmount(e.target.value); }}
                  className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-lg font-semibold text-[color:var(--foreground)] shadow-sm transition focus:border-[color:var(--accent)] focus:outline-none focus:ring-4 focus:ring-[color:var(--ring)]"
                />

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {["10", "50", "100", "500", "1000"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => { setLastEdited("source"); setSourceAmount(v); }}
                      className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 font-semibold text-[color:var(--foreground-muted)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent-strong)]"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5 shadow-[var(--shadow-soft)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--foreground-subtle)]">Monto en VES</div>
            <input
              id="ves-amount"
              type="text"
              inputMode="decimal"
              value={displayedVes}
              placeholder="Ej: 1200,50"
              onChange={(e: ChangeEvent<HTMLInputElement>) => { setLastEdited("ves"); setVesAmount(e.target.value); }}
              className="mt-3 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-2xl font-semibold text-[color:var(--foreground)] shadow-sm transition focus:border-[color:var(--accent)] focus:outline-none focus:ring-4 focus:ring-[color:var(--ring)]"
              aria-live="polite"
            />

            <div className="mt-3 text-sm text-[color:var(--foreground-muted)]">
              {rate ? `1 ${displaySymbol} = ${formatNumber(rate)} VES` : "Selecciona una tasa valida para continuar."}
            </div>

            <div className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm">
              <div className="flex items-center justify-between text-[color:var(--foreground-subtle)]"><span>Fuente aplicada</span><span className="font-semibold text-[color:var(--foreground)]">{sourceLabels[source]}</span></div>
              <div className="mt-2 flex items-center justify-between text-[color:var(--foreground-subtle)]"><span>Moneda base</span><span className="font-semibold text-[color:var(--foreground)]">{displaySymbol || "-"}</span></div>
              <div className="mt-2 flex items-center justify-between text-[color:var(--foreground-subtle)]"><span>Precision</span><span className="font-semibold text-[color:var(--foreground)]">Hasta 6 decimales</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
