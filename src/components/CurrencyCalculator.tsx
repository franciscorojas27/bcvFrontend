import { useEffect, useMemo, useState } from "react";
import type { RateList } from "../types/index.type";

type Mode = "to-ves" | "from-ves";
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
  const [mode, setMode] = useState<Mode>("to-ves");
  const [source, setSource] = useState<RateSource>("bcv");
  const [symbol, setSymbol] = useState(preferredSymbol);
  const [amount, setAmount] = useState("1");
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

  const displaySymbol = source === "bcv" ? symbol : "USD";
  const rate =
    source === "bcv" ? (symbol ? rateMap.get(symbol) ?? null : null) : binanceRate;
  const amountValue = useMemo(() => parseAmount(amount), [amount]);

  const result = useMemo(() => {
    if (!rate || !Number.isFinite(amountValue)) return null;
    return mode === "to-ves" ? amountValue * rate : amountValue / rate;
  }, [amountValue, mode, rate]);

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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
              Calculadora BCV
            </p>
            <h1 className="mt-2 text-3xl font-[var(--font-display)] text-slate-900 sm:text-4xl dark:text-slate-100">
              Convierte con confianza, en segundos
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Elige la fuente, define el monto y obten el resultado listo para usar.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-300">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Actualizado
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {rates.bcv_date || "Sin fecha"}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/70">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Modo de conversion
                </label>
                <div className="mt-3 inline-flex w-full rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900/70">
                  <button
                    type="button"
                    onClick={() => setMode("to-ves")}
                    aria-pressed={mode === "to-ves"}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      mode === "to-ves"
                        ? "bg-white text-slate-900 shadow dark:bg-slate-950 dark:text-slate-100"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    Moneda a VES
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("from-ves")}
                    aria-pressed={mode === "from-ves"}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      mode === "from-ves"
                        ? "bg-white text-slate-900 shadow dark:bg-slate-950 dark:text-slate-100"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    VES a moneda
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="source"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
                  >
                    Fuente
                  </label>
                  <select
                    id="source"
                    value={source}
                    onChange={(event) => setSource(event.target.value as RateSource)}
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
                  {!hasBinance ? (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Binance no esta disponible en este momento.
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="currency"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
                  >
                    Moneda
                  </label>
                  <select
                    id="currency"
                    value={symbol}
                    onChange={(event) => setSymbol(event.target.value)}
                    disabled={source !== "bcv"}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-teal-400/20 dark:disabled:bg-slate-900"
                  >
                    {symbols.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  {source !== "bcv" ? (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Binance trabaja en USD de referencia.
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <label
                  htmlFor="amount"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
                >
                  {mode === "to-ves" ? `Monto en ${displaySymbol}` : "Monto en VES"}
                </label>
                <input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  placeholder="Ej: 1200,50"
                  onChange={(event) => setAmount(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-teal-400/20"
                />
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {["10", "50", "100", "500", "1000"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAmount(value)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600 transition hover:border-teal-200 hover:text-teal-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-teal-500/40 dark:hover:text-teal-300"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Resultado
            </div>
            <div
              className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100"
              aria-live="polite"
            >
              {result === null ? "—" : formatNumber(result)}
              <span className="ml-2 text-base font-semibold text-slate-500 dark:text-slate-300">
                {mode === "to-ves" ? "VES" : displaySymbol}
              </span>
            </div>
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {rate
                ? `1 ${displaySymbol} = ${formatNumber(rate)} VES`
                : "Selecciona una tasa valida para continuar."}
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Fuente aplicada</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {sourceLabels[source]}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Moneda base</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {displaySymbol || "—"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Precision</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Hasta 6 decimales
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
