"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StoreHeader from "@/components/StoreHeader";
import { useCart, formatBRL } from "@/store/cart";
import { useAuth } from "@/store/auth";
import {
  type FreightContext,
  resolveFreightCost,
  qualifiesFreeShipping,
  freeShippingThreshold,
  freeShippingActive,
} from "@/lib/freight-rules";

export default function CarrinhoPage() {
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const clear = useCart((s) => s.clear);
  const subtotal = useCart((s) => s.subtotal());

  const customer = useAuth((s) => s.customer);
  const authLoaded = useAuth((s) => s.loaded);
  const refreshAuth = useAuth((s) => s.refresh);

  const [cep, setCep] = useState("");
  const [freight, setFreight] = useState<
    { value: number; rawValue: number; deadlineDays: number; carrier: string } | null
  >(null);
  const [freightMsg, setFreightMsg] = useState("");
  const [loadingFreight, setLoadingFreight] = useState(false);

  const [freightCtx, setFreightCtx] = useState<FreightContext>({
    isB2B: false,
    freeShippingEnabled: false,
    freeShippingThreshold: 0,
    b2bMinFreight: 0,
    b2bFreeShippingEnabled: false,
    b2bFreeShippingThreshold: 0,
  });

  useEffect(() => {
    if (!authLoaded) refreshAuth();
  }, [authLoaded, refreshAuth]);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((s) => {
        const isB2B = !!s.b2bEnabled && customer?.type === "PJ";
        setFreightCtx({
          isB2B,
          freeShippingEnabled: !!s.freeShippingEnabled,
          freeShippingThreshold: Number(s.freeShippingThreshold ?? 0) || 0,
          b2bMinFreight: Number(s.b2bMinFreight ?? 0) || 0,
          b2bFreeShippingEnabled: !!s.b2bFreeShippingEnabled,
          b2bFreeShippingThreshold: Number(s.b2bFreeShippingThreshold ?? 0) || 0,
        });
      })
      .catch(() => {});
  }, [customer?.type]);

  const qualifies = qualifiesFreeShipping(subtotal, freightCtx);
  const threshold = freeShippingThreshold(freightCtx);
  const showFreeShippingBar = freeShippingActive(freightCtx) && threshold != null;

  const missingForFreeShipping =
    showFreeShippingBar && threshold != null && subtotal < threshold
      ? threshold - subtotal
      : 0;

  const freightCost = resolveFreightCost(freight?.rawValue, subtotal, freightCtx);

  async function quoteFreight() {
    setFreightMsg("");
    setFreight(null);
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) {
      setFreightMsg("Digite um CEP válido (8 dígitos).");
      return;
    }
    setLoadingFreight(true);
    try {
      const res = await fetch("/api/freight/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toCep: clean,
          subtotal,
          items: items.map((i) => ({ sku: i.sku, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (data?.value != null) {
        const rawValue = Number(data.value);
        const finalValue = resolveFreightCost(rawValue, subtotal, freightCtx);
        setFreight({
          value: finalValue,
          rawValue,
          deadlineDays: data.deadlineDays,
          carrier: data.carrier,
        });
      } else {
        setFreightMsg("Cálculo de frete indisponível no momento.");
      }
    } catch {
      setFreightMsg("Não foi possível calcular o frete agora.");
    } finally {
      setLoadingFreight(false);
    }
  }

  const total = subtotal + freightCost;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <StoreHeader />

      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold">Seu carrinho</h1>

        {items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-slate-600">Seu carrinho está vazio.</p>
            <Link
              href="/produtos"
              className="mt-4 inline-flex rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Ver produtos
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">
                        Sem foto
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold leading-tight">{item.name}</h3>
                        <p className="text-xs text-slate-500">SKU {item.sku}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-xs font-medium text-slate-400 hover:text-red-600"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 text-lg leading-none text-slate-600 hover:text-emerald-700"
                          aria-label="Diminuir"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 text-lg leading-none text-slate-600 hover:text-emerald-700"
                          aria-label="Aumentar"
                        >
                          +
                        </button>
                      </div>
                      <p className="font-bold text-emerald-800">
                        {formatBRL(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}

              <button
                type="button"
                onClick={clear}
                className="text-sm font-medium text-slate-400 hover:text-red-600"
              >
                Esvaziar carrinho
              </button>
            </ul>

            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold">Resumo</h2>

              {freightCtx.isB2B && freightCtx.b2bMinFreight > 0 && (
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Frete mínimo para atacado (CNPJ):{" "}
                  <strong>{formatBRL(freightCtx.b2bMinFreight)}</strong>
                </p>
              )}

              {showFreeShippingBar && threshold != null && (
                <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm">
                  {qualifies ? (
                    <p className="font-medium text-emerald-800">🎉 Você ganhou frete grátis!</p>
                  ) : (
                    <p className="text-emerald-800">
                      Faltam <strong>{formatBRL(missingForFreeShipping)}</strong> para{" "}
                      <strong>frete grátis</strong>
                      {freightCtx.isB2B ? " (atacado)" : ""}.
                    </p>
                  )}
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
                    <div
                      className="h-full bg-emerald-600 transition-all"
                      style={{
                        width: `${Math.min(100, (subtotal / threshold) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-1">
                <label className="text-sm font-medium text-slate-700">Calcular frete</label>
                <div className="flex gap-2">
                  <input
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="CEP de entrega"
                    inputMode="numeric"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={quoteFreight}
                    disabled={loadingFreight}
                    className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                  >
                    {loadingFreight ? "..." : "OK"}
                  </button>
                </div>
                {freightMsg && <p className="text-xs text-amber-600">{freightMsg}</p>}
                {freight && (
                  <p className="text-xs text-slate-600">
                    {freight.carrier}: {formatBRL(freight.value)} — até {freight.deadlineDays} dias
                    úteis
                    {freightCtx.isB2B &&
                      freightCtx.b2bMinFreight > 0 &&
                      freight.rawValue < freightCtx.b2bMinFreight && (
                        <> (mínimo atacado aplicado)</>
                      )}
                  </p>
                )}
              </div>

              <dl className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600">Subtotal</dt>
                  <dd className="font-medium">{formatBRL(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">Frete</dt>
                  <dd className="font-medium">
                    {qualifies ? (
                      <span className="text-emerald-700">Grátis</span>
                    ) : freight ? (
                      formatBRL(freight.value)
                    ) : freightCtx.isB2B && freightCtx.b2bMinFreight > 0 ? (
                      `a partir de ${formatBRL(freightCtx.b2bMinFreight)}`
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-base">
                  <dt className="font-bold">Total</dt>
                  <dd className="font-bold text-emerald-800">{formatBRL(total)}</dd>
                </div>
              </dl>

              <Link
                href="/checkout"
                className="mt-6 block rounded-xl bg-emerald-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Finalizar compra
              </Link>
              <Link
                href="/produtos"
                className="mt-2 block text-center text-sm font-medium text-emerald-700 hover:underline"
              >
                Continuar comprando
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
