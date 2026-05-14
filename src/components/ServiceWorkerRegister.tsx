import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
