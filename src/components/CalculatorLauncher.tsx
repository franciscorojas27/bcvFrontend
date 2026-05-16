import { useEffect, useState } from "react";
import CurrencyCalculator from "./CurrencyCalculator";
import type { RateList } from "../types/index.type";

interface BinanceData {
  buyPrice: string | number;
  sellPrice: string | number;
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
    document.body.style.overflow = open ? "hidden" : "";

    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)] shadow-[0_10px_24px_rgba(0,0,0,0.42)] transition duration-200 hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.5)]"
        aria-label="Abrir calculadora"
      >
        <span className="text-xl leading-none text-[color:var(--accent-strong)] transition group-hover:scale-110">
          ⇄
        </span>
      </button>

      {open ? (
        <div
          className="calculator-modal fixed inset-0 z-50 flex items-stretch justify-center overflow-hidden bg-black/92 px-0 py-0 sm:items-center sm:px-6 sm:py-6"
          role="dialog"
          aria-modal="true"
          aria-label="Calculadora de divisas"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative z-10 flex h-full w-full max-w-none overflow-hidden rounded-none sm:h-auto sm:max-w-4xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-[28px]"
            onClick={(event) => event.stopPropagation()}
          >
            <CurrencyCalculator rates={rates} binance={binance} onClose={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}