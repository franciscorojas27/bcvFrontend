import { useRef } from "react";
import { toBlob } from "html-to-image";
import BinanceTicker from "./BinanceTicker";
import type { RateList } from "../types/index.type";
import { formatEsVeDateTime } from "../utils/dateFormat";

export default function PriceTable({ rates }: { rates: RateList }) {
  const captureRef = useRef<HTMLDivElement>(null);
  const shareData = async () => {
    if (!captureRef.current) return;

    try {
      const blob = await toBlob(captureRef.current, {
        cacheBust: true,
        backgroundColor: "#000000",
      });
      const file = new File([blob!], "bcv-rates.png", { type: blob!.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "BCV Rates",
          text: "Check out the latest BCV rates!",
        });
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob!);
        link.download = "bcv-rates.png";
        link.click();
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div ref={captureRef} className="w-full max-w-3xl sm:items-start">
        <h1 className="mb-5 text-center text-4xl font-[var(--font-display)] text-[color:var(--foreground)] sm:text-left sm:text-5xl">
          Precios BCV
        </h1>
        {rates.list.length ? (
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--shadow-soft)]">
            <div className="overflow-x-auto px-2 sm:px-0">
              <table className="sm:min-w-[320px] w-full text-left text-sm text-[color:var(--foreground-muted)]">
                <thead className="border-b border-[color:var(--border)] bg-[color:var(--surface-muted)] text-xs uppercase tracking-wider text-[color:var(--foreground-subtle)]">
                  <tr>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-4 font-medium">
                      Symbol
                    </th>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-4 font-medium text-right">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)]">
                  {rates.list.map((rate: { symbol: string; price: string | number }) => (
                    <tr
                      key={rate.symbol}
                      className="transition-colors hover:bg-[color:var(--surface-muted)]"
                    >
                      <td className="whitespace-nowrap px-3 py-2 sm:px-6 sm:py-4 font-medium text-[color:var(--foreground)]">
                        {rate.symbol}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 sm:px-6 sm:py-4 text-right font-mono tabular-nums text-[color:var(--foreground-muted)]">
                        {rate.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--foreground-muted)] shadow-[var(--shadow-soft)]">
            No hay datos de tasas disponibles.
          </div>
        )}
        <BinanceTicker />
        <span className="mt-6 text-sm text-[color:var(--foreground-subtle)]">
          {rates.bcv_date
            ? formatEsVeDateTime(rates.bcv_date)
            : "No date available"}
        </span>
      </div>
      <button
        onClick={shareData}
        className="mb-6 mt-8 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent-strong)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
      >
        Compartir precios
      </button>
    </div>
  );
}
