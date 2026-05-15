import { useEffect, useMemo, useState, ChangeEvent } from "react";
import type { RateList } from "../types/index.type";

type RateSource = "bcv" | "binance-buy" | "binance-sell";

interface BinanceData {
  buyPrice: string;
  sellPrice: string;
}

const moneyFormatter = new Intl.NumberFormat("es-VE", {
  maximumFractionDigits: 6,
});

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
    <section className="relative w-full max-w-4xl overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(180deg,#0b0b0b_0%,#070707_100%)] p-5 shadow-[var(--shadow-strong)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" aria-hidden></div>

      <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] pb-4">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[color:var(--foreground-subtle)]">Calculadora</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-[28px]">Conversión limpia</h1>
          <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">Diseño sobrio, fondo negro mate y controles directos.</p>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground-muted)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--foreground)]"
            aria-label="Cerrar calculadora"
          >
            ×
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
        <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--foreground-subtle)]">Desde</p>
              <p className="mt-1 text-xs text-[color:var(--foreground-muted)]">Selecciona la fuente de tasa</p>
            </div>
            <select
              value={source}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSource(e.target.value as RateSource)}
              className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-xs font-semibold text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--border-strong)]"
            >
              <option value="bcv">BCV</option>
              {hasBinance ? <option value="binance-buy">Binance compra</option> : null}
              {hasBinance ? <option value="binance-sell">Binance venta</option> : null}
            </select>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <input
              id="from-amount"
              type="text"
              inputMode="decimal"
              value={sourceAmount}
              placeholder="1,00"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSourceAmount(e.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent font-[var(--font-display)] text-4xl leading-none tracking-tight text-[color:var(--foreground)] outline-none placeholder:text-[color:var(--foreground-subtle)]"
            />
            <select
              id="from-currency"
              value={fromCurrency}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setFromCurrency(e.target.value)}
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-3 text-sm font-semibold text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--border-strong)]"
            >
              {currencyOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickAmounts.slice(0, 4).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSourceAmount(value)}
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground-muted)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--foreground)]"
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={swapCurrencies}
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground-muted)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--foreground)] lg:self-center"
          aria-label="Intercambiar monedas"
        >
          ⇄
        </button>

        <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--foreground-subtle)]">Hacia</p>
              <p className="mt-1 text-xs text-[color:var(--foreground-muted)]">Resultado estimado</p>
            </div>
            <select
              value={toCurrency}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setToCurrency(e.target.value)}
              className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-xs font-semibold text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--border-strong)]"
            >
              {currencyOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex min-h-24 items-end justify-between gap-4 rounded-[22px] border border-[color:var(--border)] bg-[linear-gradient(180deg,#111111_0%,#0a0a0a_100%)] px-4 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--foreground-subtle)]">Monto convertido</p>
              <div className="mt-3 font-[var(--font-display)] text-4xl leading-none text-[color:var(--foreground)]">
                {convertedDisplay || "--"}
              </div>
            </div>
            <div className="pb-1 text-right text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--foreground-subtle)]">
              {currencyLabels[toCurrency] ?? toCurrency}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-xs text-[color:var(--foreground-subtle)] sm:flex-row sm:items-center sm:justify-between">
            <span>{exchangeLabel}</span>
            <span>{sourceLabels[source]} · {formatUpdatedAt(rates.bcv_date)}</span>
          </div>

          {onClose ? (
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-[color:var(--foreground)] px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-contrast)] transition hover:bg-[color:var(--accent-strong)]"
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
