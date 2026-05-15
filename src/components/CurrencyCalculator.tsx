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
    <section className="w-full max-w-4xl">
      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">Calculadora BCV</p>
            <h1 className="mt-2 text-3xl font-[var(--font-display)] text-slate-900 sm:text-4xl dark:text-slate-100">Convierte con confianza, en segundos</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Elige la fuente y escribe un monto en la moneda o en VES; el otro campo se calcula automáticamente.</p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-300">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Actualizado</div>
            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{rates.bcv_date || "Sin fecha"}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/70">
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="source" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Fuente</label>
                  <select
                    id="source"
                    value={source}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSource(e.target.value as RateSource)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-teal-400/20"
                  >
                    <option value="bcv">BCV</option>
                    {hasBinance ? (
                      <>
                        <option value="binance-buy">Binance Buy</option>
                        <option value="binance-sell">Binance Sell</option>
                      </>
                    ) : null}
                  </select>
                  {!hasBinance ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Binance no está disponible en este momento.</p> : null}
                </div>

                <div>
                  <label htmlFor="currency" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Moneda</label>
                  <select
                    id="currency"
                    value={symbol}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSymbol(e.target.value)}
                    disabled={source !== "bcv"}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-teal-400/20 dark:disabled:bg-slate-900"
                  >
                    {symbols.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  {source !== "bcv" ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Binance trabaja en USDT de referencia.</p> : null}
                </div>
              </div>

              <div>
                <label htmlFor="source-amount" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Monto en {displaySymbol || "--"}</label>
                <input
                  id="source-amount"
                  type="text"
                  inputMode="decimal"
                  value={lastEdited === "source" ? sourceAmount : (calculatedSource !== null ? String(calculatedSource) : "")}
                  placeholder="Ej: 1200,50"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { setLastEdited("source"); setSourceAmount(e.target.value); }}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-teal-400/20"
                />

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {['10','50','100','500','1000'].map((v) => (
                    <button key={v} type="button" onClick={() => { setLastEdited('source'); setSourceAmount(v); }} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600 transition hover:border-teal-200 hover:text-teal-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-teal-500/40 dark:hover:text-teal-300">{v}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Monto en VES</div>
            <input
              id="ves-amount"
              type="text"
              inputMode="decimal"
              value={lastEdited === 'ves' ? vesAmount : (calculatedVes !== null ? String(calculatedVes) : '')}
              placeholder="Ej: 1200,50"
              onChange={(e: ChangeEvent<HTMLInputElement>) => { setLastEdited('ves'); setVesAmount(e.target.value); }}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-2xl font-semibold text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-teal-400/20"
              aria-live="polite"
            />

            <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">{rate ? `1 ${displaySymbol} = ${formatNumber(rate)} VES` : 'Selecciona una tasa valida para continuar.'}</div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400"><span>Fuente aplicada</span><span className="font-semibold text-slate-900 dark:text-slate-100">{sourceLabels[source]}</span></div>
              <div className="mt-2 flex items-center justify-between text-slate-500 dark:text-slate-400"><span>Moneda base</span><span className="font-semibold text-slate-900 dark:text-slate-100">{displaySymbol || '—'}</span></div>
              <div className="mt-2 flex items-center justify-between text-slate-500 dark:text-slate-400"><span>Precision</span><span className="font-semibold text-slate-900 dark:text-slate-100">Hasta 6 decimales</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
