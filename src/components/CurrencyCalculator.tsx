import { useEffect, useMemo, useState } from "react";
import type { RateList } from "../types/index.type";

type Mode = "to-ves" | "from-ves";
type RateSource = "bcv" | "binance-buy" | "binance-sell";

interface BinanceData {
  buyPrice: string;
  sellPrice: string;
}

const parsePrice = (value: string) => Number(value.replace(/,/g, ""));
const formatNumber = (value: number) =>
  new Intl.NumberFormat("es-VE", { maximumFractionDigits: 6 }).format(value);

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
  const amountValue = Number(amount);

  const result = useMemo(() => {
    if (!rate || !Number.isFinite(amountValue)) return null;
    return mode === "to-ves" ? amountValue * rate : amountValue / rate;
  }, [amountValue, mode, rate]);

  if (!symbols.length) {
    return (
      <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
        No rate data available.
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Calculadora</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Convierte entre VES y cualquier moneda del BCV, con opcion Binance.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Modo
          </div>
          <div className="mt-2 inline-flex w-full rounded-md border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-900">
            <button
              type="button"
              onClick={() => setMode("to-ves")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                mode === "to-ves"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-950 dark:text-gray-100"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Moneda a VES
            </button>
            <button
              type="button"
              onClick={() => setMode("from-ves")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                mode === "from-ves"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-950 dark:text-gray-100"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              VES a moneda
            </button>
          </div>
        </div>
        <div className="w-full sm:w-52">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Moneda
          </div>
          <select
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
            disabled={source !== "bcv"}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
          >
            {symbols.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-52">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Fuente
          </div>
          <select
            value={source}
            onChange={(event) => setSource(event.target.value as RateSource)}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-gray-400 focus:outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
          >
            <option value="bcv">BCV</option>
            {hasBinance ? (
              <>
                <option value="binance-buy">Binance Buy</option>
                <option value="binance-sell">Binance Sell</option>
              </>
            ) : null}
          </select>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {mode === "to-ves" ? `Monto en ${displaySymbol}` : "Monto en VES"}
        </div>
        <input
          type="number"
          inputMode="decimal"
          step="any"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-lg text-gray-900 shadow-sm focus:border-gray-400 focus:outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
        />
      </div>

      <div className="mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Resultado
        </div>
        <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {result === null ? "—" : formatNumber(result)}
          <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            {mode === "to-ves" ? "VES" : displaySymbol}
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {rate ? `1 ${displaySymbol} = ${formatNumber(rate)} VES` : "—"}
        </div>
      </div>
    </div>
  );
}
