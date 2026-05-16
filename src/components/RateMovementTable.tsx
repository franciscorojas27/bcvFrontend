import { useMemo, useState } from "react";
import type { RateReport } from "../types/index.type";

const moneyFormatter = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const rowsPerPage = 6;

function parseNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;

  const parsed = Number(value.replace(/,/g, "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatChange(value: string | number | null | undefined) {
  const parsed = parseNumber(value);
  if (parsed === null) return "—";
  const fixed = Math.abs(parsed).toFixed(2);
  return `${parsed >= 0 ? "+" : "-"}${fixed}%`;
}

function formatPrice(value: string | number | null | undefined) {
  const parsed = parseNumber(value);
  return parsed === null ? "—" : moneyFormatter.format(parsed);
}

function getLatestReport(reports: RateReport[]) {
  return reports.at(-1) ?? null;
}

function getReportDate(report: RateReport) {
  return report.bcv_date || report.fetched_at || report.CreatedAt || report.UpdatedAt || "";
}

function getChangeValue(item: RateReport["list"][number]) {
  return parseNumber(item.change_pct) ?? Number.NEGATIVE_INFINITY;
}

export default function RateMovementTable({ reports }: { reports: RateReport[] }) {
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const latestReport = getLatestReport(reports);
    if (!latestReport) return [];

    return [...latestReport.list]
      .filter((item) => item.symbol === "USD" || item.symbol === "EUR")
      .sort((left, right) => getChangeValue(right) - getChangeValue(left));
  }, [reports]);

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const visibleRows = rows.slice(startIndex, startIndex + rowsPerPage);

  const latestReport = getLatestReport(reports);

  return (
    <section className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[color:var(--surface-strong)] shadow-[0_24px_70px_rgba(0,0,0,0.55)] sm:rounded-[2.5rem]">
      <div className="border-b border-white/10 px-4 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--foreground-subtle)]">
              Tabla de subida
            </p>
            <h3 className="font-[var(--font-display)] text-[clamp(1.5rem,4vw,2.6rem)] leading-[0.98] text-[color:var(--foreground)]">
              Cuánto subió cada moneda
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--foreground-muted)]">
              {latestReport ? `Reporte ${latestReport.ID ?? "actual"}` : "Sin reporte"}
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--foreground-muted)]">
              {latestReport ? new Date(getReportDate(latestReport)).toLocaleDateString("es-VE") : "Sin fecha"}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 pb-4 sm:px-8 sm:pb-8">
        <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="overflow-x-auto ">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead className="bg-black/30 text-[0.62rem] uppercase tracking-[0.3em] text-[color:var(--foreground-subtle)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Moneda</th>
                  <th className="px-4 py-3 font-semibold">Precio</th>
                  <th className="px-4 py-3 text-right font-semibold">Subida</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length ? (
                  visibleRows.map((item) => {
                    const changeValue = parseNumber(item.change_pct);
                    const isPositive = (changeValue ?? 0) >= 0;

                    return (
                      <tr
                        key={item.ID ?? item.symbol}
                        className="border-t border-white/10 transition-colors hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className={`h-10 w-1.5 rounded-full ${isPositive ? "bg-emerald-400/90" : "bg-rose-400/90"}`} />
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[0.75rem] font-semibold text-[color:var(--foreground)]">
                                {item.symbol}
                              </span>
                              <div>
                                <p className="text-sm font-semibold tracking-wide text-[color:var(--foreground)]">{item.symbol}</p>
                                <p className="text-[0.7rem] uppercase tracking-[0.25em] text-[color:var(--foreground-subtle)]">Último reporte</p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-[1.05rem] font-semibold tabular-nums text-[color:var(--foreground)]">
                          {formatPrice(item.price)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span
                            className={`inline-flex min-w-[5.5rem] justify-center rounded-full border px-3 py-1.5 text-xs font-semibold tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${
                              isPositive
                                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                                : "border-rose-400/25 bg-rose-400/10 text-rose-200"
                            }`}
                          >
                            {formatChange(item.change_pct)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-sm text-[color:var(--foreground-muted)]">
                      No hay datos suficientes para mostrar la subida.
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