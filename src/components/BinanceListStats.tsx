import { useEffect, useMemo, useState } from "react";
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

type Stats = {
  count: number;
  latest: number | null;
  min: number | null;
  max: number | null;
  avg: number | null;
  latestAt: string | null;
};

const priceFormatter = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function parsePrice(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildStats(list: BinanceRateItem[] = []): Stats {
  const values = list.map((item) => parsePrice(item.price)).filter((value): value is number => value !== null);
  const count = values.length;

  const min = count ? Math.min(...values) : null;
  const max = count ? Math.max(...values) : null;
  const avg = count ? values.reduce((sum, value) => sum + value, 0) / count : null;

  const latestItem = list.reduce<BinanceRateItem | null>((latest, item) => {
    if (!latest) return item;
    if (!item.CreatedAt) return latest;
    if (!latest.CreatedAt) return item;

    return new Date(item.CreatedAt).getTime() > new Date(latest.CreatedAt).getTime()
      ? item
      : latest;
  }, list[0] ?? null);

  const latest = latestItem ? parsePrice(latestItem.price) : null;
  const latestAt = latestItem?.CreatedAt ?? latestItem?.UpdatedAt ?? null;

  return {
    count,
    latest,
    min,
    max,
    avg,
    latestAt,
  };
}

function formatValue(value: number | null) {
  return value === null ? "—" : priceFormatter.format(value);
}

export default function BinanceListStats() {
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
        setError("No se pudo cargar el listado de Binance.");
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

  const buyStats = useMemo(() => buildStats(data?.buy_list ?? []), [data?.buy_list]);
  const sellStats = useMemo(() => buildStats(data?.sell_list ?? []), [data?.sell_list]);

  const updatedAt = useMemo(() => {
    const timestamps = [buyStats.latestAt, sellStats.latestAt].filter(Boolean) as string[];
    if (!timestamps.length) return "Sin fecha";

    const latest = timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    return formatEsVeDateTime(latest);
  }, [buyStats.latestAt, sellStats.latestAt]);

  return (
    <div className="mt-4 w-full max-w-2xl rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-[var(--shadow-soft)] mx-auto">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--foreground-subtle)]">
            Binance historico
          </p>
          <h3 className="text-lg font-medium text-[color:var(--foreground)]">Compra y venta</h3>
        </div>
        <span className="text-xs text-[color:var(--foreground-subtle)]">{updatedAt}</span>
      </div>

      {isLoading ? (
        <div className="mt-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-xs text-[color:var(--foreground-muted)]">
          Cargando estadisticas...
        </div>
      ) : error ? (
        <div className="mt-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-xs text-rose-200">
          {error}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <StatsCard label="Compra" stats={buyStats} tone="text-emerald-200" />
          <StatsCard label="Venta" stats={sellStats} tone="text-amber-200" />
        </div>
      )}
    </div>
  );
}

function StatsCard({ label, stats, tone }: { label: string; stats: Stats; tone: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${tone}`}>{label}</span>
        <span className="text-[0.65rem] uppercase tracking-[0.3em] text-[color:var(--foreground-subtle)]">
          {stats.count} muestras
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[color:var(--foreground-muted)]">
        <StatRow label="Ultimo" value={formatValue(stats.latest)} />
        <StatRow label="Promedio" value={formatValue(stats.avg)} />
        <StatRow label="Min" value={formatValue(stats.min)} />
        <StatRow label="Max" value={formatValue(stats.max)} />
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="uppercase tracking-[0.25em] text-[0.6rem] text-[color:var(--foreground-subtle)]">
        {label}
      </span>
      <span className="font-mono text-sm text-[color:var(--foreground)]">{value}</span>
    </div>
  );
}
