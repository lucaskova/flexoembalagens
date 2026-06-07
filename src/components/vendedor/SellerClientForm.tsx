"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Form = {
  name: string;
  email: string;
  password: string;
  document: string;
  phone: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};

const EMPTY: Form = {
  name: "",
  email: "",
  password: "",
  document: "",
  phone: "",
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
};

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81]";

export default function SellerClientForm() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [lookingUp, setLookingUp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function set<K extends keyof Form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function lookupCnpj() {
    const clean = form.document.replace(/\D/g, "");
    if (clean.length !== 14) {
      setError("Digite um CNPJ válido (14 dígitos).");
      return;
    }
    setError(null);
    setLookingUp(true);
    try {
      const res = await fetch(`/api/cnpj/${clean}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "CNPJ não encontrado.");
        return;
      }
      setForm((f) => ({
        ...f,
        name: data.name || f.name,
        email: data.email || f.email,
        phone: data.phone || f.phone,
        zipCode: data.zipCode || f.zipCode,
        street: data.street || f.street,
        number: data.number || f.number,
        complement: data.complement || f.complement,
        district: data.district || f.district,
        city: data.city || f.city,
        state: data.state || f.state,
      }));
    } catch {
      setError("Falha ao consultar o CNPJ.");
    } finally {
      setLookingUp(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const res = await fetch("/api/vendedor/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: "PJ" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível cadastrar.");
        return;
      }
      setSuccess(`Cliente "${data.customer.name}" cadastrado!`);
      setForm(EMPTY);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}
      {success && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">CNPJ</label>
          <div className="flex gap-2">
            <input
              value={form.document}
              onChange={(e) => set("document", e.target.value)}
              placeholder="00.000.000/0000-00"
              className={inputCls}
            />
            <button
              type="button"
              onClick={lookupCnpj}
              disabled={lookingUp}
              className="shrink-0 rounded-lg bg-slate-700 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {lookingUp ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Razão social / Nome *</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} required className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">E-mail (login) *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Senha de acesso *</label>
          <input
            type="text"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            minLength={6}
            required
            placeholder="mín. 6 caracteres"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Telefone</label>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">CEP</label>
          <input value={form.zipCode} onChange={(e) => set("zipCode", e.target.value)} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Rua</label>
          <input value={form.street} onChange={(e) => set("street", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Número</label>
          <input value={form.number} onChange={(e) => set("number", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Complemento</label>
          <input value={form.complement} onChange={(e) => set("complement", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Bairro</label>
          <input value={form.district} onChange={(e) => set("district", e.target.value)} className={inputCls} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Cidade</label>
            <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">UF</label>
            <input
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              maxLength={2}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-5 rounded-lg bg-[#0f4c81] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c3c64] disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Cadastrar cliente"}
      </button>
    </form>
  );
}
