"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import StoreHeader from "@/components/StoreHeader";
import { useCart, formatBRL } from "@/store/cart";
import { useAuth } from "@/store/auth";

export default function CheckoutPage() {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clear);

  const customer = useAuth((s) => s.customer);
  const loaded = useAuth((s) => s.loaded);
  const refresh = useAuth((s) => s.refresh);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ number: string; total: number } | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [b2b, setB2b] = useState({
    enabled: false,
    minOrder: 0,
    minFreight: 0,
    freeShippingEnabled: false,
    freeShippingThreshold: 0,
  });

  useEffect(() => {
    if (!loaded) refresh();
  }, [loaded, refresh]);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((s) =>
        setB2b({
          enabled: !!s.b2bEnabled,
          minOrder: Number(s.b2bMinOrder ?? 0) || 0,
          minFreight: Number(s.b2bMinFreight ?? 0) || 0,
          freeShippingEnabled: !!s.b2bFreeShippingEnabled,
          freeShippingThreshold: Number(s.b2bFreeShippingThreshold ?? 0) || 0,
        }),
      )
      .catch(() => {});
  }, []);

  const isB2B = b2b.enabled && customer?.type === "PJ";
  const belowMin = isB2B && b2b.minOrder > 0 && subtotal < b2b.minOrder;

  // Pré-preenche os dados a partir da conta logada.
  useEffect(() => {
    if (customer) {
      setForm((f) => ({
        ...f,
        name: f.name || customer.name,
        email: customer.email,
        phone: f.phone || customer.phone || "",
        document: f.document || customer.document || "",
        zipCode: f.zipCode || customer.zipCode || "",
        street: f.street || customer.street || "",
        number: f.number || customer.number || "",
        complement: f.complement || customer.complement || "",
        district: f.district || customer.district || "",
        city: f.city || customer.city || "",
        state: f.state || customer.state || "",
      }));
    }
  }, [customer]);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Autopreenche o endereço pelo CEP (ViaCEP).
  async function lookupCep(rawCep: string) {
    const cep = rawCep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`/api/cep/${cep}`);
      if (res.ok) {
        const data = await res.json();
        setForm((f) => ({
          ...f,
          street: data.street || f.street,
          district: data.district || f.district,
          city: data.city || f.city,
          state: data.state || f.state,
        }));
      }
    } catch {
      // silencioso — usuário pode preencher manualmente
    } finally {
      setCepLoading(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name) {
      setError("Preencha seu nome.");
      return;
    }
    if (
      form.zipCode.replace(/\D/g, "").length !== 8 ||
      !form.street ||
      !form.number ||
      !form.district ||
      !form.city ||
      !form.state
    ) {
      setError("Preencha o endereço de entrega (CEP, rua, número, bairro, cidade e UF).");
      return;
    }
    if (belowMin) {
      setError(
        `Pedido mínimo para atacado (CNPJ) é de ${formatBRL(b2b.minOrder)}. Adicione mais itens.`,
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone || undefined,
            document: form.document || undefined,
          },
          shipping: {
            zipCode: form.zipCode,
            street: form.street,
            number: form.number,
            complement: form.complement || undefined,
            district: form.district,
            city: form.city,
            state: form.state,
          },
          notes: form.notes || undefined,
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            sku: i.sku,
            price: i.price,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Erro ao finalizar pedido.");
        return;
      }
      setDone({ number: data.order.number, total: data.order.total });
      clear();
    } catch {
      setError("Não foi possível enviar o pedido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <StoreHeader />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="rounded-2xl border border-emerald-200 bg-white p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
              ✓
            </div>
            <h1 className="mt-4 text-2xl font-bold">Pedido recebido!</h1>
            <p className="mt-2 text-slate-600">
              Seu pedido <strong>#{done.number.slice(-8).toUpperCase()}</strong> foi registrado.
            </p>
            <p className="mt-1 text-lg font-bold text-emerald-800">{formatBRL(done.total)}</p>
            <p className="mt-4 text-sm text-slate-500">
              Em breve entraremos em contato pelo e-mail informado para confirmar o pagamento e o
              envio.
            </p>
            <Link
              href="/produtos"
              className="mt-6 inline-flex rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Voltar à loja
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (loaded && !customer) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <StoreHeader />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="rounded-2xl border border-slate-200 bg-white p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
              🔒
            </div>
            <h1 className="mt-4 text-xl font-bold">Entre para finalizar</h1>
            <p className="mt-2 text-sm text-slate-600">
              Você precisa estar logado para concluir o pedido. Faça login ou crie sua conta — leva
              menos de um minuto.
            </p>
            <Link
              href="/login?redirect=/checkout"
              className="mt-6 inline-flex rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Entrar ou criar conta
            </Link>
            <Link
              href="/carrinho"
              className="mt-3 block text-sm font-medium text-emerald-700 hover:underline"
            >
              Voltar ao carrinho
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <StoreHeader />

      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold">Finalizar compra</h1>

        {isB2B && (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Conta <strong>Pessoa Jurídica</strong>: preços de atacado aplicados.
            {b2b.minOrder > 0 && <> Pedido mínimo de {formatBRL(b2b.minOrder)}.</>}
            {b2b.minFreight > 0 && <> Frete mínimo de {formatBRL(b2b.minFreight)}.</>}
            {b2b.freeShippingEnabled && b2b.freeShippingThreshold > 0 && (
              <> Frete grátis acima de {formatBRL(b2b.freeShippingThreshold)}.</>
            )}
          </p>
        )}

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
          <form onSubmit={submit} className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold">Seus dados</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome completo *">
                  <input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className="input"
                    required
                  />
                </Field>
                <Field label="E-mail *">
                  <input
                    type="email"
                    value={form.email}
                    readOnly
                    className="input bg-slate-50 text-slate-500"
                    title="E-mail vinculado à sua conta"
                    required
                  />
                </Field>
                <Field label="Telefone / WhatsApp">
                  <input
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="CPF/CNPJ">
                  <input
                    value={form.document}
                    onChange={(e) => update("document", e.target.value)}
                    className="input"
                  />
                </Field>
              </div>

              <h2 className="pt-2 text-lg font-bold">Endereço de entrega</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="CEP *">
                  <div className="relative">
                    <input
                      value={form.zipCode}
                      onChange={(e) => {
                        const v = e.target.value;
                        update("zipCode", v);
                        if (v.replace(/\D/g, "").length === 8) lookupCep(v);
                      }}
                      onBlur={(e) => lookupCep(e.target.value)}
                      inputMode="numeric"
                      placeholder="00000-000"
                      className="input"
                      required
                    />
                    {cepLoading && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        buscando...
                      </span>
                    )}
                  </div>
                </Field>
                <Field label="Rua / Logradouro *">
                  <input
                    value={form.street}
                    onChange={(e) => update("street", e.target.value)}
                    className="input"
                    required
                  />
                </Field>
                <Field label="Número *">
                  <input
                    value={form.number}
                    onChange={(e) => update("number", e.target.value)}
                    className="input"
                    required
                  />
                </Field>
                <Field label="Complemento">
                  <input
                    value={form.complement}
                    onChange={(e) => update("complement", e.target.value)}
                    placeholder="Apto, bloco, referência"
                    className="input"
                  />
                </Field>
                <Field label="Bairro *">
                  <input
                    value={form.district}
                    onChange={(e) => update("district", e.target.value)}
                    className="input"
                    required
                  />
                </Field>
                <Field label="Cidade *">
                  <input
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    className="input"
                    required
                  />
                </Field>
                <Field label="Estado (UF) *">
                  <input
                    value={form.state}
                    onChange={(e) => update("state", e.target.value.toUpperCase().slice(0, 2))}
                    maxLength={2}
                    placeholder="SP"
                    className="input"
                    required
                  />
                </Field>
              </div>
              <Field label="Observações">
                <textarea
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  rows={3}
                  className="input"
                />
              </Field>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}
            </div>

            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold">Resumo</h2>
              <ul className="mt-4 space-y-2 text-sm">
                {items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-2">
                    <span className="text-slate-600">
                      {i.quantity}× {i.name}
                    </span>
                    <span className="font-medium">{formatBRL(i.price * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-base">
                <span className="font-bold">Total</span>
                <span className="font-bold text-emerald-800">{formatBRL(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Frete calculado após confirmação.</p>

              {belowMin && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  Faltam {formatBRL(b2b.minOrder - subtotal)} para o pedido mínimo de atacado (
                  {formatBRL(b2b.minOrder)}).
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || belowMin}
                className="mt-6 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {submitting ? "Enviando..." : "Confirmar pedido"}
              </button>
              <Link
                href="/carrinho"
                className="mt-2 block text-center text-sm font-medium text-emerald-700 hover:underline"
              >
                Voltar ao carrinho
              </Link>
            </aside>
          </form>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
