import { useEffect, useState } from "react";

interface BinanceData {
  buyPrice: string;
  sellPrice: string;
}

export default function BinanceTicker() {
  const [data, setData] = useState<BinanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const res = await fetch("/api/binance");
        if (!res.ok) throw new Error("Fetch failed");
        const json = await res.json();
        if (!mounted) return;
        setData({ buyPrice: json.buyPrice, sellPrice: json.sellPrice });
        setLastUpdated(new Date().toLocaleTimeString());
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError("Error fetching Binance data");
      }
    }

    fetchData();
    const id = setInterval(fetchData, 5000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="mt-6 w-full max-w-2xl rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-2 text-lg font-medium">Binance</h2>
      {error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex gap-6">
            <div>
              <div className="text-xs text-gray-500">Buy</div>
              <div className="font-mono text-lg">{data?.sellPrice ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Sell</div>
              <div className="font-mono text-lg">{data?.buyPrice ?? "—"}</div>
            </div>
          </div>
          <div className="text-xs text-gray-400">{lastUpdated ?? "—"}</div>
        </div>
      )}
    </div>
  );
}
