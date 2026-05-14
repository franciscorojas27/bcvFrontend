import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
    const baseUrl = import.meta.env.BCV_BACKEND_URL;
    if (!baseUrl) {
        return new Response(
            JSON.stringify({ error: "Missing BCV_BACKEND_URL" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }

    const response = await fetch(`${baseUrl}/binance`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        return new Response(
            JSON.stringify({ error: "Failed to fetch Binance data" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};