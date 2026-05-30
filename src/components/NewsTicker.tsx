import { useEffect, useMemo, useState } from "react";

function getBackendUrl() {
  const envUrl = import.meta.env.PUBLIC_BCV_BACKEND_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.__BCV_BACKEND_URL__) {
    return window.__BCV_BACKEND_URL__.replace(/\/$/, "");
  }

  return "";
}

export default function NewsTicker() {
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const baseUrl = getBackendUrl();

    if (!baseUrl) {
      setError("Backend no configurado.");
      return () => {
        mounted = false;
      };
    }

    async function fetchNews() {
      try {
        const response = await fetch(`${baseUrl}/api/news`, { cache: "no-store" });
        if (!response.ok) throw new Error("Fetch failed");

        const json = (await response.json()) as string[];
        if (!mounted) return;

        setHeadlines(Array.isArray(json) ? json.filter(Boolean) : []);
        setError(null);
      } catch {
        if (!mounted) return;
        setError("No se pudieron cargar las noticias.");
      }
    }

    fetchNews();
    const id = window.setInterval(fetchNews, 60000);

    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const items = useMemo(() => {
    if (headlines.length) return headlines;
    if (error) return [error];
    return ["Cargando noticias..."];
  }, [error, headlines]);

  const duration = Math.max(40, items.length * 10);

  return (
    <div className="fixed bottom-6 left-1/2 z-40 w-[min(100%-2rem,64rem)] -translate-x-1/2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-3 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-3">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-[color:var(--foreground-subtle)]">
          Noticias
        </span>
        <div className="news-ticker-mask flex-1">
          <div
            className="news-ticker-track"
            style={{ ["--ticker-duration" as never]: `${duration}s` }}
          >
            {items.map((item, index) => (
              <span key={`news-${index}`} className="news-ticker-item">
                {item}
              </span>
            ))}
            {items.map((item, index) => (
              <span key={`news-dup-${index}`} className="news-ticker-item" aria-hidden="true">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
