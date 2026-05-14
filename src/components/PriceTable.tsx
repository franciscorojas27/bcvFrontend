import { useRef } from "react";
import { toBlob } from "html-to-image";
import BinanceTicker from "./BinanceTicker";
import type { RateList } from "../types/index.type";

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
        <h1 className="mb-5 text-center text-5xl font-bold sm:text-left">
          Price BCV!
        </h1>
        {rates.list.length ? (
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="border-b border-gray-200 bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-4 font-medium">
                    Symbol
                  </th>
                  <th scope="col" className="px-6 py-4 font-medium text-right">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rates.list.map((rate: { symbol: string; price: string }) => (
                  <tr
                    key={rate.symbol}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50"
                  >
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                      {rate.symbol}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right font-mono tabular-nums text-gray-700 dark:text-gray-300">
                      {rate.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
            No rate data available.
          </div>
        )}
        <BinanceTicker />
        <span className="mt-6 text-sm text-gray-500">
          {rates.bcv_date
            ? new Date(rates.bcv_date).toLocaleString()
            : "No date available"}
        </span>
      </div>
      <button
        onClick={shareData}
        className="mb-6 mt-8 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Share Rates
      </button>
    </div>
  );
}
