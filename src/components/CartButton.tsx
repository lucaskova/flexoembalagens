"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart, formatBRL } from "@/store/cart";

export default function CartButton({ light = false }: { light?: boolean }) {
  const items = useCart((s) => s.items);
  const totalItems = useCart((s) => s.totalItems());
  const subtotal = useCart((s) => s.subtotal());
  const removeItem = useCart((s) => s.removeItem);

  // Evita mismatch de hidratação: só mostra os dados após montar no cliente.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hasItems = mounted && items.length > 0;

  return (
    <div className="group relative">
      <Link
        href="/carrinho"
        className={`relative inline-flex items-center gap-2 rounded-lg px-2 py-1 ${
          light ? "text-white hover:text-white/80" : "text-slate-600 hover:text-emerald-700"
        }`}
        aria-label="Carrinho"
      >
        <span className="relative">
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
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {mounted && totalItems > 0 && (
            <span
              className={`absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                light ? "bg-white text-emerald-800" : "bg-emerald-600 text-white"
              }`}
            >
              {totalItems}
            </span>
          )}
        </span>
        <span className="font-semibold">
          {mounted ? formatBRL(subtotal) : formatBRL(0)}
        </span>
      </Link>

      {hasItems && (
        <div className="invisible absolute right-0 top-full z-50 w-72 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[9px] text-slate-400">
                        s/ foto
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.quantity}× {formatBRL(item.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      removeItem(item.id);
                    }}
                    className="shrink-0 rounded p-1 text-slate-300 hover:text-rose-600"
                    aria-label={`Remover ${item.name}`}
                  >
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
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm text-slate-600">Subtotal</span>
              <span className="text-sm font-bold text-emerald-800">{formatBRL(subtotal)}</span>
            </div>

            <Link
              href="/carrinho"
              className="mt-3 block rounded-xl bg-emerald-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Ver carrinho
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
