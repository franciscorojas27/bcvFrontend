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
        className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)] shadow-[0_10px_24px_rgba(0,0,0,0.32)] transition duration-200 hover:border-[color:var(--accent)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.42)]"
        aria-label="Abrir calculadora"
      >
        <span className="text-xl leading-none text-[color:var(--accent-strong)] transition group-hover:scale-110">
          ⇄
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/72 p-4 sm:items-center sm:p-6">
          <button
            type="button"
            className="absolute inset-0 z-0 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Cerrar calculadora"
          />
          <div className="relative z-10 w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-h-[calc(100vh-3rem)]">
            <CurrencyCalculator rates={rates} binance={binance} onClose={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}