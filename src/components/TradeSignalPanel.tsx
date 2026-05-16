import { useEffect, useMemo, useState } from "react";
import type { TradeSignal } from "../types/index.type";

const actionStyles: Record<TradeSignal["action"], { chip: string; glow: string; label: string }> = {
  BUY: {
    chip: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
    glow: "from-emerald-400/20 via-emerald-400/8 to-transparent",
    label: "Comprar",
  },
  SELL: {
    chip: "border-rose-400/35 bg-rose-400/10 text-rose-200",
    glow: "from-rose-400/20 via-rose-400/8 to-transparent",
    label: "Vender",
  },
  HOLD: {
    chip: "border-amber-400/35 bg-amber-400/10 text-amber-200",
    glow: "from-amber-400/20 via-amber-400/8 to-transparent",
    label: "Mantener",
  },
};

export default function TradeSignalPanel() {
  const [signal, setSignal] = useState<TradeSignal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchSignal() {
      try {
        const response = await fetch("/api/trade-signal", { cache: "no-store" });
        if (!response.ok) throw new Error("Fetch failed");

        const json = (await response.json()) as TradeSignal;
        if (!mounted) return;

        setSignal(json);
        setError(null);
      } catch {
        if (!mounted) return;
        setError("No se pudo cargar la señal de mercado.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchSignal();
    const intervalId = window.setInterval(fetchSignal, 30000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const createdAt = useMemo(() => {
    if (!signal?.created_at) return null;
    return new Date(signal.created_at).toLocaleString();
  }, [signal?.created_at]);

  const action = signal?.action ?? "HOLD";
  const styles = actionStyles[action];
  const guidance = {
    BUY: "La lectura actual favorece una entrada.",
    SELL: "La lectura actual sugiere reducir exposición.",
    HOLD: "La lectura actual favorece esperar una mejor oportunidad.",
  }[action];
  const updatedLabel = createdAt ? `Actualizado ${createdAt}` : "Actualizando señal";
  const confidenceLabel = signal ? `${signal.accuracy_rate}% de precisión` : "Cargando precisión";

  return (
    <section className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[color:var(--surface)] shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:rounded-[2.5rem]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_30%)]" />
      <div className={`absolute inset-x-0 top-0 h-44 bg-gradient-to-br ${styles.glow}`} />

      <div className="relative border-b border-white/10 px-4 py-5 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[color:var(--foreground-subtle)]">
                Señal de mercado
              </p>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${styles.chip}`}>
                <span className="h-2 w-2 rounded-full bg-current" />
                {confidenceLabel}
              </span>
            </div>

            <div className="max-w-3xl space-y-3">
              <h2 className="font-[var(--font-display)] text-[clamp(2rem,8vw,3.55rem)] leading-[1.02] text-[color:var(--foreground)]">
                {styles.label}
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-[color:var(--foreground-muted)] sm:text-lg">
                {guidance}
              </p>
            </div>
          </div>

          <div className="w-full max-w-none rounded-[1.25rem] border border-white/10 bg-black/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:max-w-sm sm:rounded-[1.5rem]">
            <div className="flex items-start justify-between gap-3 sm:items-center">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-[color:var(--foreground-subtle)]">
                  Decisión
                </p>
                <p className="mt-2 text-xl font-semibold text-[color:var(--foreground)] sm:text-2xl">
                  {action}
                </p>
              </div>
              <div className={`rounded-[1.1rem] border px-3 py-2 text-right sm:px-4 sm:py-3 ${styles.chip}`}>
                <div className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] opacity-80">
                  Precisión
                </div>
                <div className="mt-1 text-lg font-semibold sm:text-xl">{signal ? `${signal.accuracy_rate}%` : "—"}</div>
              </div>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div
                className={`relative h-full rounded-full ${
                  action === "BUY"
                    ? "bg-emerald-400"
                    : action === "SELL"
                      ? "bg-rose-400"
                      : "bg-amber-400"
                }`}
                style={{ width: signal ? `${signal.accuracy_rate}%` : "35%" }}
              />
            </div>

            <p className="mt-3 text-sm leading-6 text-[color:var(--foreground-muted)]">
              Esta lectura resume el escenario actual en una sola decisión clara.
            </p>
          </div>
        </div>
      </div>

      <div className="relative grid gap-4 px-4 py-5 sm:px-8 sm:py-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6">
        <div className="space-y-5">
          {isLoading ? (
            <div className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5 text-sm text-[color:var(--foreground-muted)] sm:rounded-[1.5rem] sm:p-6">
              Cargando señal de mercado...
            </div>
          ) : error ? (
            <div className="rounded-[1.25rem] border border-rose-400/30 bg-rose-400/10 p-5 text-sm text-rose-200 sm:rounded-[1.5rem] sm:p-6">
              {error}
            </div>
          ) : null}

          {signal ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Precisión" value={`${signal.accuracy_rate}%`} />
                <Metric label="Puntos" value={signal.win_points.toFixed(1)} />
                <Metric label="Actualización" value={updatedLabel} mono={false} />
              </div>

              <div className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:rounded-[1.5rem] sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-[color:var(--foreground-subtle)]">
                    Lectura
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[color:var(--foreground-muted)]">
                    {signal.action}
                  </span>
                </div>

                <p className="text-sm leading-7 text-[color:var(--foreground-muted)] sm:text-[17px]">
                  {signal.rationale}
                </p>
              </div>
            </>
          ) : null}
        </div>

        <div className="space-y-5">
          {signal ? (
            <div className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:rounded-[1.5rem] sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-[color:var(--foreground-subtle)]">
                  Factores clave
                </h3>
                <span className="text-xs text-[color:var(--foreground-subtle)]">
                  {signal.key_factors.length} puntos
                </span>
              </div>

              <div className="space-y-3">
                {signal.key_factors.length ? (
                  signal.key_factors.map((factor, index) => (
                    <div
                      key={factor}
                      className="flex items-start gap-3 rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-[color:var(--foreground-muted)]"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[0.68rem] font-semibold text-[color:var(--foreground)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="leading-6">{factor}</span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-[color:var(--foreground-muted)]">
                    No hay factores clave disponibles.
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div className="rounded-[1.25rem] border border-white/10 bg-black/30 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:rounded-[1.5rem] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-[color:var(--foreground-subtle)]">
                Estado
              </span>
              <span className={`rounded-full border px-4 py-2 text-sm font-semibold tracking-wide ${styles.chip}`}>
                {action}
              </span>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--foreground-muted)]">
              <p>{guidance}</p>
              <p>
                Esto solo es una guía basada en datos históricos y no garantiza resultados futuros. Siempre haz tu propia investigación antes de tomar decisiones de inversión.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-black/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--foreground-subtle)]">
        {label}
      </div>
      <div className={`${mono ? "font-mono tabular-nums" : ""} mt-2 text-lg font-semibold text-[color:var(--foreground)]`}>
        {value}
      </div>
    </div>
  );
}