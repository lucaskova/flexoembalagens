"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

export default function CategoryMenu() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (active && Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="group relative">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-slate-700 hover:text-[#0f4c81]"
        aria-label="Categorias"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
        Categorias
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5 transition group-hover:rotate-180"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Painel que abre ao passar o mouse (igual ao mini-carrinho) */}
      <div className="invisible absolute left-0 top-full z-50 w-64 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          <Link
            href="/produtos"
            className="block rounded-lg px-3 py-2 text-sm font-semibold text-[#0f4c81] hover:bg-[#0f4c81]/5"
          >
            Todos os produtos
          </Link>

          <div className="my-1 h-px bg-slate-100" />

          {categories.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-slate-400">
              Nenhuma categoria disponível.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/produtos?categoria=${encodeURIComponent(c.slug)}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-[#0f4c81]/5 hover:text-[#0f4c81]"
                >
                  <span>{c.name}</span>
                  <span className="text-xs text-slate-400">{c.productCount}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
