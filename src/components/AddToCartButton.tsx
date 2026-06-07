"use client";

import { useState } from "react";
import { useCart, type CartProduct } from "@/store/cart";

type Props = {
  product: CartProduct;
};

export default function AddToCartButton({ product }: Props) {
  const addItem = useCart((s) => s.addItem);
  const removeItem = useCart((s) => s.removeItem);
  const inCart = useCart((s) => s.items.some((i) => i.id === product.id));
  const [added, setAdded] = useState(false);
  const [qtyText, setQtyText] = useState("1");
  const outOfStock = product.stock <= 0;
  const maxQty = product.stock > 0 ? product.stock : 9999;

  const quantity = Math.min(Math.max(1, parseInt(qtyText || "0", 10) || 0), maxQty);

  function changeQty(delta: number) {
    setQtyText(String(Math.min(Math.max(1, quantity + delta), maxQty)));
  }

  function onQtyChange(value: string) {
    // Permite apagar e digitar livremente; mantém só dígitos.
    const digits = value.replace(/\D/g, "");
    setQtyText(digits);
  }

  function onQtyBlur() {
    const n = parseInt(qtyText || "0", 10) || 0;
    setQtyText(String(Math.min(Math.max(1, n), maxQty)));
  }

  function handleAdd() {
    if (outOfStock) return;
    addItem(product, quantity);
    setQtyText(String(quantity));
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  if (outOfStock) {
    return (
      <button
        type="button"
        disabled
        className="mt-3 h-12 w-full cursor-not-allowed rounded-xl bg-slate-200 px-4 text-sm font-semibold text-slate-500"
      >
        Sem estoque
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-1.5 py-1">
        <button
          type="button"
          onClick={() => changeQty(-1)}
          disabled={quantity <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg leading-none text-slate-600 shadow-sm transition hover:text-[#0f4c81] disabled:opacity-40"
          aria-label="Diminuir quantidade"
        >
          −
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={qtyText}
          onChange={(e) => onQtyChange(e.target.value)}
          onBlur={onQtyBlur}
          onFocus={(e) => e.target.select()}
          aria-label="Quantidade"
          className="min-w-0 flex-1 bg-transparent text-center text-sm font-semibold text-slate-800 outline-none"
        />
        <button
          type="button"
          onClick={() => changeQty(1)}
          disabled={quantity >= maxQty}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg leading-none text-slate-600 shadow-sm transition hover:text-[#0f4c81] disabled:opacity-40"
          aria-label="Aumentar quantidade"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0f4c81] px-3 text-sm font-semibold text-white transition hover:bg-[#0c3c64]"
      >
        {added ? (
          "Adicionado ✓"
        ) : (
          <>
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
            Adicionar ao Carrinho
          </>
        )}
      </button>

      {inCart && (
        <button
          type="button"
          onClick={() => removeItem(product.id)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          Remover do carrinho
        </button>
      )}
    </div>
  );
}
