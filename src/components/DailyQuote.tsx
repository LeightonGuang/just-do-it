import { useEffect, useState } from "react";

import { twMerge } from "tailwind-merge";

import type { ZenQuote } from "../pages/api/quote";

const CACHE_KEY = "daily-quote";

const getToday = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const DailyQuote = ({ className }: { className?: string }) => {
  const [quote, setQuote] = useState<ZenQuote>();

  useEffect(() => {
    async function getQuote() {
      const cached = localStorage.getItem(CACHE_KEY);

      if (cached) {
        const cachedQuote: ZenQuote = JSON.parse(cached);

        if (cachedQuote.date === getToday()) {
          setQuote(cachedQuote);
          return;
        }
      }

      // not cached or cached quote is expired, fetch new quote
      try {
        const res = await fetch("/api/quote");

        if (!res.ok) throw new Error("Failed to fetch quote");

        const data: ZenQuote = await res.json();
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        setQuote(data);
      } catch (err) {
        console.error(err);
      }
    }

    getQuote();
  }, []);

  return (
    <a
      target="_blank"
      title="Zen Quotes"
      href="https://zenquotes.io/"
      className={twMerge(
        "flex h-max max-w-3xl items-center gap-2 bg-card p-1 md:w-max",
        className,
      )}
    >
      <img className="size-10 rounded-full" src={quote?.i} alt={quote?.a} />

      <div className="flex flex-col">
        <span className="font-medium italic">{quote?.q}</span>
        <span>-{quote?.a}</span>
      </div>
    </a>
  );
};

export default DailyQuote;
