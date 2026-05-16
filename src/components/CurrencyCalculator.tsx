import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { RateList } from "../types/index.type";

type RateSource = "bcv" | "binance-buy" | "binance-sell";

interface BinanceData {
  buyPrice: string | number;
  sellPrice: string | number;
}

const moneyFormatter = new Intl.NumberFormat("es-VE", {
  maximumFractionDigits: 6,
});

const parsePrice = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return Number.NaN;
  if (typeof value === "number") return value;

  const trimmed = value.trim();
  if (!trimmed) return Number.NaN;

  return Number(trimmed.replace(/,/g, ""));
};
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

const currencyLabels: Record<string, string> = {
  VES: "Bolívares",
  USDT: "USDT",
  USD: "Dólares",
};

const formatUpdatedAt = (value: string) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return dateFormatter.format(date);
};

export default function CurrencyCalculator({
  rates,
  binance,
  onClose,
}: {
  rates: RateList;
  binance: BinanceData | null;
  onClose?: () => void;
}) {
  const symbols = useMemo(
    () => rates.list.map((rate) => rate.symbol).sort(),
    [rates.list],
  );

  const preferredSymbol = symbols.includes("USD") ? "USD" : symbols[0] ?? "VES";
  const [source, setSource] = useState<RateSource>("bcv");
  const [fromCurrency, setFromCurrency] = useState(preferredSymbol);
  const [toCurrency, setToCurrency] = useState("VES");
  const [sourceAmount, setSourceAmount] = useState("1");
  const hasBinance = Boolean(binance?.buyPrice && binance?.sellPrice);

  const currencyOptions = useMemo(() => {
    if (source === "bcv") {
      return ["VES", ...symbols];
    }

    return ["VES", "USDT"];
  }, [source, symbols]);

  useEffect(() => {
    if (!currencyOptions.includes(fromCurrency)) {
      setFromCurrency(source === "bcv" ? preferredSymbol : "USDT");
    }
    if (!currencyOptions.includes(toCurrency)) {
      setToCurrency("VES");
    }
  }, [currencyOptions, fromCurrency, preferredSymbol, source, toCurrency]);

  useEffect(() => {
    if (!hasBinance && source !== "bcv") {
      setSource("bcv");
    }
  }, [hasBinance, source]);

  const rateMap = useMemo(() => {
    const map = new Map<string, number>();
    map.set("VES", 1);

    rates.list.forEach((rate) => {
      const parsed = parsePrice(rate.price);
      if (Number.isFinite(parsed)) {
        map.set(rate.symbol, parsed);
      }
    });

    if (hasBinance) {
      const rawValue = source === "binance-buy" ? binance?.buyPrice : binance?.sellPrice;
      const parsed = rawValue ? parsePrice(rawValue) : Number.NaN;
      if (Number.isFinite(parsed)) {
        map.set("USDT", parsed);
      }
    }

    return map;
  }, [binance?.buyPrice, binance?.sellPrice, hasBinance, rates.list, source]);

  const sourceValue = useMemo(() => parseAmount(sourceAmount), [sourceAmount]);

  const fromRate = fromCurrency === "VES" ? 1 : rateMap.get(fromCurrency) ?? null;
  const toRate = toCurrency === "VES" ? 1 : rateMap.get(toCurrency) ?? null;

  const convertedAmount = useMemo(() => {
    if (!Number.isFinite(sourceValue) || !fromRate || !toRate) return null;

    const sourceInVes = fromCurrency === "VES" ? sourceValue : sourceValue * fromRate;
    return toCurrency === "VES" ? sourceInVes : sourceInVes / toRate;
  }, [fromCurrency, fromRate, sourceValue, toCurrency, toRate]);

  const activeSourceRate = fromCurrency === "VES" ? 1 : fromRate;
  const activeTargetRate = toCurrency === "VES" ? 1 : toRate;

  const exchangeLabel =
    activeSourceRate && activeTargetRate
      ? `1 ${fromCurrency} = ${formatNumber(activeSourceRate / activeTargetRate)} ${toCurrency}`
      : "Selecciona monedas válidas para ver la tasa.";

  const convertedDisplay = convertedAmount !== null ? formatNumber(convertedAmount) : "";

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    if (convertedAmount !== null) {
      setSourceAmount(moneyFormatter.format(convertedAmount));
    }
  };

  if (!symbols.length) {
    return (
      <div className="w-full max-w-4xl rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-8 text-sm text-[color:var(--foreground-muted)] shadow-[var(--shadow-soft)]">
        No hay datos de tasas disponibles.
      </div>
    );
  }

  return (
    <section className="relative flex h-full min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-none border-0 bg-[linear-gradient(180deg,#0b0b0b_0%,#070707_100%)] p-2 shadow-[var(--shadow-strong)] sm:h-auto sm:max-h-[calc(100dvh-3rem)] sm:rounded-[28px] sm:border sm:border-[color:var(--border)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" aria-hidden></div>

      <div className="flex flex-col gap-1 border-b border-[color:var(--border)] pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:pb-4">
        <div className="max-w-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[color:var(--foreground-subtle)] sm:text-[11px]">Calculadora</p>
          <h1 className="mt-1 text-[1.05rem] font-semibold tracking-tight text-[color:var(--foreground)] sm:mt-2 sm:text-[28px]">Conversión limpia</h1>
          <p className="mt-1 hidden text-xs text-[color:var(--foreground-muted)] sm:block sm:text-sm">Fondo negro mate y controles directos.</p>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center self-end rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground-muted)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--foreground)] sm:h-10 sm:w-10 sm:self-auto"
            aria-label="Cerrar calculadora"
          >
            ×
          </button>
        ) : null}
      </div>

      <div className="mt-2 grid min-h-0 gap-2 lg:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] lg:items-stretch sm:mt-5 sm:gap-4">
        <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:rounded-[24px] sm:p-6">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[color:var(--foreground-subtle)] sm:text-[11px]">Desde</p>
              <p className="mt-0.5 hidden text-[11px] text-[color:var(--foreground-muted)] sm:block sm:mt-1 sm:text-xs">Fuente y monto</p>
            </div>
            <select
              value={source}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSource(e.target.value as RateSource)}
              className="min-h-9 w-full rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 text-[10px] font-semibold text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--border-strong)] sm:min-h-11 sm:w-auto sm:px-4 sm:text-xs"
            >
              <option value="bcv">BCV</option>
              {hasBinance ? <option value="binance-buy">Binance compra</option> : null}
              {hasBinance ? <option value="binance-sell">Binance venta</option> : null}
            </select>
          </div>

          <div className="mt-2 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-2.5 py-2.5 sm:mt-4 sm:rounded-[22px] sm:px-4 sm:py-4">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:gap-3">
              <input
                id="from-amount"
                type="text"
                inputMode="decimal"
                value={sourceAmount}
                placeholder="1,00"
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSourceAmount(e.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent font-[var(--font-display)] text-[1.55rem] leading-none tracking-tight text-[color:var(--foreground)] outline-none placeholder:text-[color:var(--foreground-subtle)] sm:text-4xl"
              />
              <select
                id="from-currency"
                value={fromCurrency}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFromCurrency(e.target.value)}
                className="min-h-10 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 text-[10px] font-semibold text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--border-strong)] sm:w-auto sm:text-sm"
              >
                {currencyOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2 sm:mt-4">
            {quickAmounts.slice(0, 2).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSourceAmount(value)}
                className="min-h-8 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-[10px] font-semibold text-[color:var(--foreground-muted)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--foreground)] sm:min-h-10 sm:text-xs"
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center py-0 lg:py-6">
          <button
            type="button"
            onClick={swapCurrencies}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground-muted)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--foreground)] sm:h-14 sm:w-14"
            aria-label="Intercambiar monedas"
          >
            ⇄
          </button>
        </div>

        <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:rounded-[24px] sm:p-6">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[color:var(--foreground-subtle)] sm:text-[11px]">Hacia</p>
              <p className="mt-0.5 hidden text-[11px] text-[color:var(--foreground-muted)] sm:block sm:mt-1 sm:text-xs">Salida y detalle</p>
            </div>
            <select
              value={toCurrency}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setToCurrency(e.target.value)}
              className="min-h-9 w-full rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 text-[10px] font-semibold text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--border-strong)] sm:min-h-11 sm:w-auto sm:px-4 sm:text-xs"
            >
              {currencyOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-2 rounded-[16px] border border-[color:var(--border)] bg-[linear-gradient(180deg,#111111_0%,#0a0a0a_100%)] px-2.5 py-2.5 sm:mt-4 sm:rounded-[22px] sm:px-4 sm:py-4">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[color:var(--foreground-subtle)] sm:text-[11px] sm:tracking-[0.28em]">Monto convertido</p>
                <div className="mt-1 break-words font-[var(--font-display)] text-[1.55rem] leading-none text-[color:var(--foreground)] sm:mt-3 sm:text-4xl">
                  {convertedDisplay || "--"}
                </div>
              </div>
              <div className="pb-0 text-left text-[9px] font-semibold uppercase tracking-[0.22em] text-[color:var(--foreground-subtle)] sm:pb-1 sm:text-right sm:text-xs sm:tracking-[0.28em]">
                {currencyLabels[toCurrency] ?? toCurrency}
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-1 text-[9px] text-[color:var(--foreground-subtle)] sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:text-xs">
            <span>{exchangeLabel}</span>
            <span>{sourceLabels[source]} · {formatUpdatedAt(rates.bcv_date)}</span>
          </div>

          {onClose ? (
            <div className="mt-3 flex justify-end sm:mt-5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-[color:var(--foreground)] px-4 py-1.5 text-[10px] font-semibold text-[color:var(--accent-contrast)] transition hover:bg-[color:var(--accent-strong)] sm:px-5 sm:py-2.5 sm:text-sm"
              >
                Listo
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
