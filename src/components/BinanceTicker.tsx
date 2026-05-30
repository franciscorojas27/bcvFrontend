import { useEffect, useMemo, useRef, useState } from "react";

type BinanceWsItem = {
  price: string | number;
  type_value?: "buy" | "sell" | string;
  CreatedAt?: string;
  UpdatedAt?: string;
};

type BinanceData = {
  buyPrice: string | number | null;
  sellPrice: string | number | null;
};

function getBackendUrl() {
  const envUrl = import.meta.env.PUBLIC_BCV_BACKEND_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.__BCV_BACKEND_URL__) {
    return window.__BCV_BACKEND_URL__.replace(/\/$/, "");
  }

  return "";
}

function getSocketUrl() {
  const explicitUrl = import.meta.env.PUBLIC_BCV_BACKEND_WS_URL;
  if (explicitUrl) return explicitUrl;

  const httpBase = getBackendUrl();
  if (!httpBase) return "";

  try {
    const url = new URL(httpBase);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = `${url.pathname.replace(/\/$/, "")}/api/ws`;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function extractTimestamp(items: BinanceWsItem[]) {
  const timestamps = items
    .map((item) => item.CreatedAt || item.UpdatedAt)
    .filter((value): value is string => Boolean(value) && value !== "0001-01-01T00:00:00Z");

  if (!timestamps.length) return null;

  return timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

export default function BinanceTicker() {
  const [data, setData] = useState<BinanceData>({ buyPrice: null, sellPrice: null });
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const reconnectTimer = useRef<number | null>(null);

  const socketUrl = useMemo(() => getSocketUrl(), []);
  const baseUrl = useMemo(() => getBackendUrl(), []);

  useEffect(() => {
    if (!baseUrl) return;

    let active = true;

    const fetchInitial = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/binance`, { cache: "no-store" });
        if (!response.ok) throw new Error("Fetch failed");

        const json = await response.json();
        if (!active) return;

        const items = Array.isArray(json) ? json : [];
        let buyPrice = null;
        let sellPrice = null;

        items.forEach((item: BinanceWsItem) => {
          if (item.type_value === "buy") buyPrice = item.price;
          if (item.type_value === "sell") sellPrice = item.price;
        });

        setData({ buyPrice, sellPrice });

        const timestamp = extractTimestamp(items);
        setLastUpdated(
          timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
        );
        setError(null);
      } catch {
        if (!active) return;
        setError("No se pudo cargar Binance.");
      }
    };

    fetchInitial();

    return () => {
      active = false;
    };
  }, [baseUrl]);

  useEffect(() => {
    if (!socketUrl || typeof WebSocket === "undefined") {
      if (!socketUrl) {
        setError("WS de Binance no configurado");
      }
      return;
    }

    let active = true;
    let socket: WebSocket | null = null;

    const connect = () => {
      if (!active) return;
      socket = new WebSocket(socketUrl);

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as BinanceWsItem | BinanceWsItem[];
          const items = Array.isArray(payload) ? payload : [payload];

          setData((current) => {
            let buyPrice = current.buyPrice;
            let sellPrice = current.sellPrice;

            items.forEach((item) => {
              if (item.type_value === "buy") buyPrice = item.price;
              if (item.type_value === "sell") sellPrice = item.price;
            });

            return { buyPrice, sellPrice };
          });

          const timestamp = extractTimestamp(items);
          setLastUpdated(
            timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
          );
          setError(null);
        } catch {
          setError("Error al procesar los datos de Binance");
        }
      };

      socket.onerror = () => {
        setError("Error de conexion con Binance");
      };

      socket.onclose = () => {
        if (!active) return;
        if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
        reconnectTimer.current = window.setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      active = false;
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
      if (socket && socket.readyState === WebSocket.OPEN) socket.close();
    };
  }, [socketUrl]);

  return (
    <div className="mt-6 w-full max-w-2xl rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-[var(--shadow-soft)] mx-auto">
      <h2 className="mb-2 text-lg font-medium text-[color:var(--foreground)]">USDT (Binance)</h2>
      {error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex gap-6">
            <div>
              <div className="text-xs text-[color:var(--foreground-subtle)]">Compra</div>
              <div className="font-mono text-lg text-[color:var(--foreground)]">{data.buyPrice ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-[color:var(--foreground-subtle)]">Venta</div>
              <div className="font-mono text-lg text-[color:var(--foreground)]">{data.sellPrice ?? "—"}</div>
            </div>
          </div>
          <div className="text-xs text-[color:var(--foreground-subtle)]">{lastUpdated ?? "—"}</div>
        </div>
      )}
    </div>
  );
}