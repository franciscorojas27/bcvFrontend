import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!window.isSecureContext) return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js", { type: "module" }).catch(() => {});
  }, []);

  return null;
}
