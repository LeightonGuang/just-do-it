import type { APIRoute } from "astro";

export interface ZenQuote {
  q: string;    // quote
  a: string;    // author
  i: string;    // author image
  h: string;    // html
  date: string; // yyyy-mm-dd
}

export const GET: APIRoute = async () => {
  try {
    const res = await fetch("https://zenquotes.io/api/today");

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch quote" }), {
        status: 500,
      });
    }

    const data: ZenQuote[] = await res.json();

    return new Response(JSON.stringify(data[0]), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
    });
  }
};
