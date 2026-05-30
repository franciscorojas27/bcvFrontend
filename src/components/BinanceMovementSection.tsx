import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatEsVeDateTime } from "../utils/dateFormat";

function getBackendUrl() {
  const envUrl = import.meta.env.PUBLIC_BCV_BACKEND_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.__BCV_BACKEND_URL__) {
    return window.__BCV_BACKEND_URL__.replace(/\/$/, "");
  }

  return "";
}

type BinanceRateItem = {
  price: string | number;
  CreatedAt?: string;
  UpdatedAt?: string;
};

type BinanceListResponse = {
  buy_list?: BinanceRateItem[];
  sell_list?: BinanceRateItem[];
};

type ChartPoint = {
  timestamp: string;
  time: string;
  label: string;
  buy: number | null;
  sell: number | null;
};

const moneyFormatter = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const timeFormatter = new Intl.DateTimeFormat("es-VE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Caracas",
});

const chartAxisStyle = {
  fill: "var(--foreground-subtle)",
  fontSize: 11,
  letterSpacing: "0.08em",
};

function parsePrice(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatChartValue(value: number | null) {
  return value === null ? "—" : moneyFormatter.format(value);
}

function formatDelta(delta: number | null) {
  if (delta === null) return "—";
  const formatted = moneyFormatter.format(Math.abs(delta));
  return `${delta >= 0 ? "+" : "-"} ${formatted}`;
}

function buildChartData(data: BinanceListResponse | null): ChartPoint[] {
  if (!data) return [];

  const rawMap = new Map<string, { buy?: number; sell?: number }>();

  const pushEntry = (item: BinanceRateItem, key: "buy" | "sell") => {
    const timestamp = item.CreatedAt ?? item.UpdatedAt;
    if (!timestamp) return;

    const parsed = parsePrice(item.price);
    if (parsed === null) return;

    const existing = rawMap.get(timestamp) ?? {};
    rawMap.set(timestamp, { ...existing, [key]: parsed });
  };

  (data.buy_list ?? []).forEach((item) => pushEntry(item, "buy"));
  (data.sell_list ?? []).forEach((item) => pushEntry(item, "sell"));

  const timestamps = Array.from(rawMap.keys()).sort(
    (left, right) => new Date(left).getTime() - new Date(right).getTime(),
  );

  let lastBuy: number | null = null;
  let lastSell: number | null = null;

  return timestamps.map((timestamp) => {
    const entry = rawMap.get(timestamp) ?? {};
    if (typeof entry.buy === "number") lastBuy = entry.buy;
    if (typeof entry.sell === "number") lastSell = entry.sell;

    return {
      timestamp,
      time: timeFormatter.format(new Date(timestamp)),
      label: formatEsVeDateTime(timestamp),
      buy: lastBuy,
      sell: lastSell,
    };
  });
}

function DeltaPill({ label, delta, tone }: { label: string; delta: number | null; tone: string }) {
  return (
    <div className={`rounded-full border px-3 py-1.5 text-xs font-medium ${tone}`}>
      <span className="mr-2 uppercase tracking-[0.24em] text-[0.62rem] opacity-75">{label}</span>
      <span className="font-semibold tabular-nums">{formatDelta(delta)}</span>
    </div>
  );
}

export default function BinanceMovementSection() {
  const [data, setData] = useState<BinanceListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const baseUrl = getBackendUrl();

    if (!baseUrl) {
      setError("Backend no configurado.");
      setIsLoading(false);
      return () => {
        mounted = false;
      };
    }

    async function fetchData() {
      try {
        const response = await fetch(`${baseUrl}/api/binance-list`, { cache: "no-store" });
        if (!response.ok) throw new Error("Fetch failed");

        const json = (await response.json()) as BinanceListResponse;
        if (!mounted) return;

        setData(json);
        setError(null);
      } catch {
        if (!mounted) return;
        setError("No se pudo cargar el historico de Binance.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchData();
    const id = window.setInterval(fetchData, 15000);

    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const chartData = useMemo(() => buildChartData(data), [data]);
  const latestPoint = chartData.at(-1) ?? null;
  const previousPoint = chartData.at(-2) ?? null;

  const buyLatest = latestPoint?.buy ?? null;
  const sellLatest = latestPoint?.sell ?? null;
  const buyPrev = previousPoint?.buy ?? null;
  const sellPrev = previousPoint?.sell ?? null;

  const buyDelta = buyLatest !== null && buyPrev !== null ? buyLatest - buyPrev : null;
  const sellDelta = sellLatest !== null && sellPrev !== null ? sellLatest - sellPrev : null;

  const tooltipStyle = {
    background: "rgba(6, 6, 6, 0.96)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.45)",
    padding: "12px 14px",
  } as const;

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ name?: string; value?: number | null; color?: string }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;

    return (
      <div style={tooltipStyle}>
        <p className="mb-2 text-[0.7rem] uppercase tracking-[0.28em] text-[color:var(--foreground-subtle)]">
          {label}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-6 text-sm">
              <span className="flex items-center gap-2 text-[color:var(--foreground-muted)]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color ?? "#fff" }} />
                {entry.name}
              </span>
              <span className="font-mono tabular-nums text-[color:var(--foreground)]">
                {formatChartValue(entry.value ?? null)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[color:var(--surface-strong)] shadow-[0_24px_70px_rgba(0,0,0,0.72)] sm:rounded-[2.5rem]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.035),transparent_22%)]" />

      <div className="relative grid gap-4 px-4 pb-4 pt-5 sm:px-8 sm:pb-8 sm:pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-[color:var(--foreground-subtle)]">
              Binance historico
            </p>
            <h3 className="font-[var(--font-display)] text-[clamp(1.5rem,3.6vw,2.35rem)] leading-[0.98] text-[color:var(--foreground)]">
              Compra vs venta USDT
            </h3>
            <p className="max-w-xl text-sm leading-6 text-[color:var(--foreground-muted)]">
              Variacion reciente de precios para operaciones de compra y venta.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <DeltaPill
              label="Compra"
              delta={buyDelta}
              tone="text-emerald-200 border-emerald-400/20 bg-emerald-400/8"
            />
            <DeltaPill
              label="Venta"
              delta={sellDelta}
              tone="text-amber-200 border-amber-400/20 bg-amber-400/8"
            />
          </div>
        </div>

        <div className="mt-2 rounded-[1.25rem] border border-white/10 bg-black/35 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-4">
          {isLoading ? (
            <div className="flex h-[320px] items-center justify-center rounded-[1.1rem] border border-dashed border-white/10 bg-black/20 px-6 text-center text-sm text-[color:var(--foreground-muted)]">
              Cargando historico de Binance...
            </div>
          ) : error ? (
            <div className="flex h-[320px] items-center justify-center rounded-[1.1rem] border border-rose-400/30 bg-rose-400/10 px-6 text-center text-sm text-rose-200">
              {error}
            </div>
          ) : chartData.length ? (
            <div className="h-[320px] w-full sm:h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="buyFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="sellFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 8" vertical={false} />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={12} tick={chartAxisStyle} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={74}
                    tickMargin={10}
                    tickFormatter={(value) => moneyFormatter.format(value)}
                    tick={chartAxisStyle}
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  <Tooltip shared content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.12)", strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="buy"
                    name="Compra"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    fill="url(#buyFill)"
                    connectNulls
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sell"
                    name="Venta"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fill="url(#sellFill)"
                    connectNulls
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[320px] items-center justify-center rounded-[1.1rem] border border-dashed border-white/10 bg-black/20 px-6 text-center text-sm text-[color:var(--foreground-muted)]">
              No hay datos suficientes para mostrar la grafica.
            </div>
          )}
        </div>

        <div className="text-xs leading-6 text-[color:var(--foreground-subtle)]">
          {latestPoint ? `Actualizado ${latestPoint.label}` : "Esperando datos de Binance."}
        </div>
      </div>
    </section>
  );
}
