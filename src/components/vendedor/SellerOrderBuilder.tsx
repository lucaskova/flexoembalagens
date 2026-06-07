"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/format";

type Client = { id: string; name: string; type: string; document: string | null };
type Product = {
  id: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  stock: number;
  price: number;
  listPrice: number;
};

export default function SellerOrderBuilder({
  clients,
  products,
}: {
  clients: Client[];
  products: Product[];
}) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(clients[0]?.id ?? "");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [products, search]);

  const lines = useMemo(
    () =>
      products
        .map((p) => ({ product: p, quantity: qty[p.id] ?? 0 }))
        .filter((l) => l.quantity > 0),
    [products, qty],
  );

  const subtotal = lines.reduce((s, l) => s + l.product.price * l.quantity, 0);

  function setQuantity(id: string, value: number) {
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.floor(value) || 0) }));
  }

  async function submit() {
    if (!customerId) {
      setError("Selecione o cliente.");
      return;
    }
    if (lines.length === 0) {
      setError("Adicione ao menos um produto.");
      return;
    }
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const res = await fetch("/api/vendedor/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          notes,
          items: lines.map((l) => ({ id: l.product.id, quantity: l.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível criar o pedido.");
        return;
      }
      setSuccess(`Pedido #${data.order.number.slice(-6)} criado — ${formatBRL(data.order.total)}.`);
      setQty({});
      setNotes("");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-1 block text-sm font-medium text-slate-700">Cliente</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0f4c81]"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.document ? `· ${c.document}` : ""} ({c.type})
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto por nome ou SKU..."
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0f4c81]"
          />
          <ul className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-contain p-1" />
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-500">
                    {p.sku} · {formatBRL(p.price)}
                    {p.price < p.listPrice && (
                      <span className="ml-1 text-slate-400 line-through">{formatBRL(p.listPrice)}</span>
                    )}
                  </p>
                </div>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={qty[p.id] ?? ""}
                  onChange={(e) => setQuantity(p.id, Number(e.target.value))}
                  placeholder="0"
                  className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-center text-sm outline-none focus:border-[#0f4c81]"
                />
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="py-4 text-center text-sm text-slate-500">Nenhum produto encontrado.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-20 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Resumo do pedido</h2>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          {success && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>
          )}

          {lines.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum item adicionado.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {lines.map((l) => (
                <li key={l.product.id} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate text-slate-600">
                    {l.quantity}× {l.product.name}
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatBRL(l.product.price * l.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold">
            <span>Total</span>
            <span className="text-[#0f4c81]">{formatBRL(subtotal)}</span>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações (opcional)"
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0f4c81]"
          />

          <button
            onClick={submit}
            disabled={saving || lines.length === 0}
            className="w-full rounded-lg bg-[#0f4c81] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c3c64] disabled:opacity-50"
          >
            {saving ? "Criando pedido..." : "Criar pedido"}
          </button>
        </div>
      </div>
    </div>
  );
}
