import { useMemo, useState } from "react";
import type { RateReport } from "../types/index.type";

const moneyFormatter = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const shortDateFormatter = new Intl.DateTimeFormat("es-VE", {
  dateStyle: "medium",
  timeStyle: "short",
});

const rowsPerPage = 8;

function parseNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.includes(",") ? trimmed.replace(/\./g, "").replace(/,/g, ".") : trimmed;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPrice(value: string | number | null | undefined) {
  const parsed = parseNumber(value);
  return parsed === null ? "—" : moneyFormatter.format(parsed);
}

function getReportDate(report: RateReport) {
  return report.bcv_date || report.fetched_at || report.CreatedAt || report.UpdatedAt || "";
}

function getRate(report: RateReport, symbol: string) {
  return report.list.find((item) => item.symbol === symbol)?.price;
}

type MovementRow = {
  date: string;
  usd: number | null;
  eur: number | null;
  usdDelta: number | null;
  eurDelta: number | null;
};

function formatDelta(value: number | null) {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : "-"} ${moneyFormatter.format(Math.abs(value))}`;
}

export default function RateMovementTable({ reports }: { reports: RateReport[] }) {
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const sortedReports = [...reports]
      .filter((report) => report.list.length > 0)
      .sort((left, right) => new Date(getReportDate(left)).getTime() - new Date(getReportDate(right)).getTime());

    return sortedReports.reduce<MovementRow[]>((accumulator, report, index) => {
      const usd = parseNumber(getRate(report, "USD"));
      const eur = parseNumber(getRate(report, "EUR"));
      const previous = accumulator.at(-1) ?? null;
      const previousUsd = previous ? previous.usd : null;
      const previousEur = previous ? previous.eur : null;

      accumulator.push({
        date: shortDateFormatter.format(new Date(getReportDate(report))),
        usd,
        eur,
        usdDelta: usd !== null && previousUsd !== null ? usd - previousUsd : null,
        eurDelta: eur !== null && previousEur !== null ? eur - previousEur : null,
      });

      return accumulator;
    }, []);
  }, [reports]);

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const visibleRows = rows.slice(startIndex, startIndex + rowsPerPage);

  const latestReport = reports.at(-1) ?? null;

  return (
    <section className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[color:var(--surface-strong)] shadow-[0_24px_70px_rgba(0,0,0,0.65)] sm:rounded-[2.5rem]">
      <div className="border-b border-white/10 px-4 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--foreground-subtle)]">
              Historial de avance
            </p>
            <h3 className="font-[var(--font-display)] text-[clamp(1.5rem,4vw,2.6rem)] leading-[0.98] text-[color:var(--foreground)]">
              USD y EUR por reporte
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--foreground-muted)]">
              {rows.length ? `${rows.length} reportes` : "Sin reporte"}
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--foreground-muted)]">
              {latestReport ? new Date(getReportDate(latestReport)).toLocaleDateString("es-VE") : "Sin fecha"}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 pb-4 sm:px-8 sm:pb-8">
        <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="overflow-x-auto ">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-black/35 text-[0.62rem] uppercase tracking-[0.3em] text-[color:var(--foreground-subtle)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-right font-semibold">USD</th>
                  <th className="px-4 py-3 text-right font-semibold">Avance USD</th>
                  <th className="px-4 py-3 text-right font-semibold">EUR</th>
                  <th className="px-4 py-3 text-right font-semibold">Avance EUR</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length ? (
                  visibleRows.map((item, index) => {
                    const usdPositive = (item.usdDelta ?? 0) >= 0;
                    const eurPositive = (item.eurDelta ?? 0) >= 0;

                    return (
                      <tr
                        key={`${item.date}-${startIndex + index}`}
                        className="border-t border-white/10 transition-colors hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold tracking-wide text-[color:var(--foreground)]">{item.date}</p>
                            <p className="text-[0.7rem] uppercase tracking-[0.25em] text-[color:var(--foreground-subtle)]">Reporte histórico</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-[1.05rem] font-semibold tabular-nums text-[color:var(--foreground)]">
                          {formatPrice(item.usd)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span
                            className={`inline-flex min-w-[6.5rem] justify-center rounded-full border px-3 py-1.5 text-xs font-semibold tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
                              usdPositive
                                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                                : "border-rose-400/25 bg-rose-400/10 text-rose-200"
                            }`}
                          >
                            {formatDelta(item.usdDelta)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-[1.05rem] font-semibold tabular-nums text-[color:var(--foreground)]">
                          {formatPrice(item.eur)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span
                            className={`inline-flex min-w-[6.5rem] justify-center rounded-full border px-3 py-1.5 text-xs font-semibold tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
                              eurPositive
                                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                                : "border-rose-400/25 bg-rose-400/10 text-rose-200"
                            }`}
                          >
                            {formatDelta(item.eurDelta)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-[color:var(--foreground-muted)]">
                      No hay datos suficientes para mostrar el historial.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {rows.length > rowsPerPage ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[color:var(--foreground-subtle)]">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage === 1}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-[color:var(--foreground)] transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage === totalPages}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-[color:var(--foreground)] transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}