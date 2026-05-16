import { useMemo } from "react";
import { LineChart } from "@tremor/react";
import type { RateReport } from "../types/index.type";

type ChartPoint = {
  date: string;
  USD: number | null;
  EUR: number | null;
};

const moneyFormatter = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactDateFormatter = new Intl.DateTimeFormat("es-VE", {
  day: "2-digit",
  month: "short",
});

const reportDateFormatter = new Intl.DateTimeFormat("es-VE", {
  dateStyle: "medium",
  timeStyle: "short",
});

function parsePrice(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;

  const normalized = value.trim().replace(/,/g, "");
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getReportDate(report: RateReport) {
  return report.fetched_at ?? report.bcv_date ?? report.CreatedAt ?? report.UpdatedAt ?? "";
}

function getRate(report: RateReport, symbol: string) {
  return report.list.find((item) => item.symbol === symbol)?.price;
}

function formatDelta(delta: number | null) {
  if (delta === null) return "—";
  const formatted = moneyFormatter.format(Math.abs(delta));
  return `${delta >= 0 ? "+" : "-"} ${formatted}`;
}

function DeltaPill({
  delta,
  label,
}: {
  delta: number | null;
  label: string;
}) {
  const isPositive = (delta ?? 0) >= 0;
  const tone = delta === null ? "text-[color:var(--foreground-muted)] border-white/10 bg-white/[0.03]" : isPositive ? "text-emerald-200 border-emerald-400/25 bg-emerald-400/10" : "text-rose-200 border-rose-400/25 bg-rose-400/10";

  return (
    <div className={`rounded-full border px-3 py-1.5 text-xs font-medium ${tone}`}>
      <span className="mr-2 uppercase tracking-[0.24em] text-[0.62rem] opacity-75">{label}</span>
      <span className="font-semibold tabular-nums">{formatDelta(delta)}</span>
    </div>
  );
}

export default function MarketMovementSection({ reports }: { reports: RateReport[] }) {
  const sortedReports = useMemo(() => {
    return [...reports]
      .filter((report) => report.list.length > 0)
      .sort((left, right) => {
        const leftTime = new Date(getReportDate(left)).getTime();
        const rightTime = new Date(getReportDate(right)).getTime();
        return leftTime - rightTime;
      });
  }, [reports]);

  const chartData = useMemo<ChartPoint[]>(() => {
    return sortedReports
      .map((report) => ({
        date: compactDateFormatter.format(new Date(getReportDate(report))),
        USD: parsePrice(getRate(report, "USD")),
        EUR: parsePrice(getRate(report, "EUR")),
      }));
  }, [sortedReports]);

  const latestPoint = chartData.at(-1) ?? null;
  const previousPoint = chartData.at(-2) ?? null;
  const latestReport = sortedReports.at(-1) ?? null;

  const usdLatest = latestPoint?.USD ?? null;
  const eurLatest = latestPoint?.EUR ?? null;
  const usdPrevious = previousPoint?.USD ?? null;
  const eurPrevious = previousPoint?.EUR ?? null;

  const usdDelta = usdLatest !== null && usdPrevious !== null ? usdLatest - usdPrevious : null;
  const eurDelta = eurLatest !== null && eurPrevious !== null ? eurLatest - eurPrevious : null;

  const hasChartData = chartData.length > 0;
  const latestLabel = latestReport ? reportDateFormatter.format(new Date(getReportDate(latestReport))) : "Sin histórico";

  return (
    <section className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_24px_70px_rgba(0,0,0,0.55)] sm:rounded-[2.5rem]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_28%)]" />

      <div className="relative grid gap-4 px-4 pb-4 pt-5 sm:px-8 sm:pb-8 sm:pt-8 xl:grid-cols-[1.15fr_0.85fr] xl:gap-6">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_40px_rgba(0,0,0,0.28)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-[color:var(--foreground-subtle)]">
                Tendencia
              </p>
              <h3 className="font-[var(--font-display)] text-[clamp(1.5rem,3.6vw,2.35rem)] leading-[0.98] text-[color:var(--foreground)]">
                USD / EUR
              </h3>
              <p className="max-w-xl text-sm leading-6 text-[color:var(--foreground-muted)]">
                Evolución de los dos valores principales en los reportes más recientes.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <DeltaPill label="USD" delta={usdDelta} />
              <DeltaPill label="EUR" delta={eurDelta} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              USD
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              EUR
            </span>
          </div>

          <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-black/20 p-3 sm:p-4">
            {hasChartData ? (
              <LineChart
                data={chartData}
                index="date"
                categories={["USD", "EUR"]}
                colors={["amber", "cyan"]}
                curveType="natural"
                connectNulls
                valueFormatter={(value) => moneyFormatter.format(value)}
                showLegend={false}
                showGridLines
                showYAxis
                autoMinValue
                yAxisWidth={70}
                className="h-[320px] sm:h-[360px]"
              />
            ) : (
              <div className="flex h-[320px] flex-col items-center justify-center rounded-[1.1rem] border border-dashed border-white/10 bg-black/20 px-6 text-center">
                <p className="text-[0.8rem] font-semibold uppercase tracking-[0.35em] text-[color:var(--foreground-subtle)]">
                  Sin datos
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 text-xs leading-6 text-[color:var(--foreground-subtle)]">
            {latestPoint ? `Actualizado ${latestLabel}` : "Esperando histórico suficiente para trazar la tendencia."}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_40px_rgba(0,0,0,0.24)] sm:p-6">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-[color:var(--foreground-subtle)]">
              Lectura actual
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-[color:var(--foreground-muted)]">USD</span>
                  <span className="font-mono text-[1.35rem] tabular-nums text-[color:var(--foreground)]">
                    {usdLatest !== null ? moneyFormatter.format(usdLatest) : "—"}
                  </span>
                </div>
              </div>
              <div className="rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-[color:var(--foreground-muted)]">EUR</span>
                  <span className="font-mono text-[1.35rem] tabular-nums text-[color:var(--foreground)]">
                    {eurLatest !== null ? moneyFormatter.format(eurLatest) : "—"}
                  </span>
                </div>
              </div>
              <div className="pt-1 text-xs leading-6 text-[color:var(--foreground-subtle)]">
                {latestPoint ? "Valores del reporte más reciente." : "Esperando histórico suficiente para trazar la tendencia."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
