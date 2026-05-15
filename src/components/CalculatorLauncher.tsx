import { useEffect, useState } from "react";
import CurrencyCalculator from "./CurrencyCalculator";
import type { RateList } from "../types/index.type";

interface BinanceData {
  buyPrice: string;
  sellPrice: string;
}

export default function CalculatorLauncher({
  rates,
  binance,
}: {
  rates: RateList;
  binance: BinanceData | null;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(24,28,38,0.96),rgba(12,15,21,0.96))] text-[color:var(--foreground)] shadow-[0_18px_38px_rgba(0,0,0,0.45)] transition duration-200 hover:-translate-y-1 hover:border-[color:var(--accent)] hover:shadow-[0_22px_50px_rgba(0,0,0,0.55)]"
        aria-label="Abrir calculadora"
      >
        <span className="text-2xl leading-none text-[color:var(--accent-strong)] transition group-hover:scale-110">
          ⇄
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 backdrop-blur-sm sm:items-center sm:p-6">
          <button
            type="button"
            className="absolute inset-0 z-0 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Cerrar calculadora"
          />
          <div className="relative z-10 w-full max-w-5xl max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-h-[calc(100vh-3rem)]">
            <CurrencyCalculator rates={rates} binance={binance} onClose={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}