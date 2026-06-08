"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/format";
import OrderShareButtons, { type ShareOrder } from "@/components/vendedor/OrderShareButtons";

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
type PaymentMethod = { id: string; name: string };

export type EditOrder = {
  id: string;
  customerId: string;
  paymentMethod: string;
  notes: string;
  quantities: Record<string, number>;
};

export default function SellerOrderBuilder({
  clients,
  products,
  paymentMethods,
  sellerName,
  editOrder,
}: {
  clients: Client[];
  products: Product[];
  paymentMethods: PaymentMethod[];
  sellerName: string;
  editOrder?: EditOrder;
}) {
  const router = useRouter();
  const isEdit = Boolean(editOrder);
  const [customerId, setCustomerId] = useState(editOrder?.customerId ?? clients[0]?.id ?? "");
  const [clientSearch, setClientSearch] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>(editOrder?.quantities ?? {});
  const [notes, setNotes] = useState(editOrder?.notes ?? "");
  const [paymentMethod, setPaymentMethod] = useState(
    editOrder?.paymentMethod ?? paymentMethods[0]?.name ?? "",
  );
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ShareOrder | null>(null);

  const selectedClient = clients.find((c) => c.id === customerId) ?? null;

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.document ?? "").toLowerCase().includes(q),
    );
  }, [clients, clientSearch]);

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

  function bump(id: string, delta: number) {
    setQty((q) => {
      const next = Math.max(0, (q[id] ?? 0) + delta);
      return { ...q, [id]: next };
    });
  }

  function newOrder() {
    if (isEdit) {
      router.push("/vendedor/pedidos");
      return;
    }
    setCreated(null);
    setQty({});
    setNotes("");
    setSearch("");
    router.refresh();
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
    setSaving(true);
    try {
      const url = isEdit ? `/api/vendedor/pedido/${editOrder!.id}` : "/api/vendedor/pedido";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          notes,
          paymentMethod: paymentMethod || undefined,
          items: lines.map((l) => ({ id: l.product.id, quantity: l.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível salvar o pedido.");
        return;
      }
      setCreated(data.order as ShareOrder);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  // ----- Tela de sucesso (pedido criado) -----
  if (created) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            ✓
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Pedido #{created.number.slice(-6)} {isEdit ? "atualizado" : "criado"}!
            </h2>
            <p className="text-sm text-slate-500">
              {new Date(created.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 text-sm">
          <p>
            <span className="text-slate-500">Cliente:</span>{" "}
            <span className="font-medium">{created.customer.name}</span>
          </p>
          {created.paymentMethod && (
            <p>
              <span className="text-slate-500">Pagamento:</span>{" "}
              <span className="font-medium">{created.paymentMethod}</span>
            </p>
          )}
          <ul className="mt-2 space-y-1 border-t border-slate-200 pt-2">
            {created.items.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-2">
                <span className="min-w-0 truncate text-slate-600">
                  {i.quantity}× {i.name}
                </span>
                <span className="shrink-0 font-medium">{formatBRL(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
            <span>Total</span>
            <span className="text-[#0f4c81]">{formatBRL(created.total)}</span>
          </div>
        </div>

        <OrderShareButtons order={created} />
        <button
          onClick={newOrder}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {isEdit ? "Voltar para meus pedidos" : "Novo pedido"}
        </button>
      </div>
    );
  }

  // ----- Montagem do pedido -----
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-1 block text-sm font-medium text-slate-700">Cliente</label>
          <div className="relative">
            <input
              value={clientOpen ? clientSearch : selectedClient?.name ?? ""}
              onChange={(e) => {
                setClientSearch(e.target.value);
                setClientOpen(true);
              }}
              onFocus={() => {
                setClientOpen(true);
                setClientSearch("");
              }}
              placeholder="Buscar cliente por nome ou CNPJ..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0f4c81]"
            />
            {clientOpen && (
              <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {filteredClients.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-slate-500">Nenhum cliente encontrado.</li>
                ) : (
                  filteredClients.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerId(c.id);
                          setClientOpen(false);
                        }}
                        className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                          c.id === customerId ? "bg-[#0f4c81]/5 font-medium" : ""
                        }`}
                      >
                        {c.name}{" "}
                        <span className="text-xs text-slate-400">
                          {c.document ? `· ${c.document}` : ""} ({c.type})
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          {selectedClient && !clientOpen && (
            <p className="mt-1 text-xs text-slate-500">
              {selectedClient.document ? `${selectedClient.document} · ` : ""}
              {selectedClient.type}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto por nome ou SKU..."
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0f4c81]"
          />
          <ul className="divide-y divide-slate-100">
            {filtered.map((p) => {
              const q = qty[p.id] ?? 0;
              return (
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
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => bump(p.id, -1)}
                      disabled={q === 0}
                      aria-label="Diminuir"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-lg font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={qty[p.id] ?? ""}
                      onChange={(e) => setQuantity(p.id, Number(e.target.value))}
                      placeholder="0"
                      className="w-14 rounded-lg border border-slate-300 px-1 py-1.5 text-center text-sm outline-none focus:border-[#0f4c81]"
                    />
                    <button
                      type="button"
                      onClick={() => bump(p.id, 1)}
                      aria-label="Aumentar"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-lg font-medium text-slate-600 hover:bg-slate-50"
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
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

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Forma de pagamento</label>
            {paymentMethods.length === 0 ? (
              <p className="text-xs text-slate-400">
                Nenhuma forma cadastrada. Configure no painel admin.
              </p>
            ) : (
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0f4c81]"
              >
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
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
            {saving
              ? "Salvando..."
              : isEdit
                ? "Salvar alterações"
                : "Criar pedido"}
          </button>
          <p className="text-center text-xs text-slate-400">Vendedor: {sellerName}</p>
        </div>
      </div>
    </div>
  );
}
