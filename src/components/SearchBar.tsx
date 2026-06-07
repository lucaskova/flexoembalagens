"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [hasTyped, setHasTyped] = useState(false);

  // Mantém o campo sincronizado com a URL (ex.: ao abrir /produtos?q=vara).
  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    if (!hasTyped) return;

    const timeout = setTimeout(() => {
      const q = query.trim();
      router.replace(q ? `/produtos?q=${encodeURIComponent(q)}` : "/produtos");
    }, 350);

    return () => clearTimeout(timeout);
  }, [hasTyped, query, router]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/produtos?q=${encodeURIComponent(q)}` : "/produtos");
  }

  return (
    <form onSubmit={submit} className="relative w-full">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </span>
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setHasTyped(true);
          setQuery(e.target.value);
        }}
        placeholder="Buscar produtos..."
        aria-label="Buscar produtos"
        className="w-full rounded-full border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
      />
    </form>
  );
}
