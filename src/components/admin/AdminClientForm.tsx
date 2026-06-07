"use client";

import { useState } from "react";
import { createCustomer } from "@/app/admin/clientes/actions";

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81]";

export default function AdminClientForm() {
  const [document, setDocument] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  async function lookupCnpj() {
    const clean = document.replace(/\D/g, "");
    if (clean.length !== 14) {
      setLookupError("Digite um CNPJ válido (14 dígitos).");
      return;
    }
    setLookupError(null);
    setLookingUp(true);
    try {
      const res = await fetch(`/api/cnpj/${clean}`);
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error ?? "CNPJ não encontrado.");
        return;
      }
      if (data.name) setName(data.name);
      if (data.email) setEmail(data.email);
      if (data.phone) setPhone(data.phone);
      if (data.zipCode) setZipCode(data.zipCode);
      if (data.street) setStreet(data.street);
      if (data.number) setNumber(data.number);
      if (data.complement) setComplement(data.complement);
      if (data.district) setDistrict(data.district);
      if (data.city) setCity(data.city);
      if (data.state) setState(data.state);
    } catch {
      setLookupError("Falha ao consultar o CNPJ.");
    } finally {
      setLookingUp(false);
    }
  }

  return (
    <form action={createCustomer} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">CNPJ / CPF</label>
        <div className="flex gap-2">
          <input
            name="document"
            value={document}
            onChange={(e) => setDocument(e.target.value)}
            placeholder="Digite o CNPJ e clique na lupa"
            className={inputCls}
          />
          <button
            type="button"
            onClick={lookupCnpj}
            disabled={lookingUp}
            title="Buscar dados pelo CNPJ"
            aria-label="Buscar dados pelo CNPJ"
            className="flex shrink-0 items-center justify-center rounded-lg bg-[#0f4c81] px-4 text-white transition hover:bg-[#0c3c64] disabled:opacity-50"
          >
            {lookingUp ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
          </button>
        </div>
        {lookupError && <p className="mt-1 text-xs text-rose-600">{lookupError}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nome / Razão social *</label>
        <input name="name" value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Tipo de cliente</label>
        <select name="type" defaultValue="PJ" className={inputCls}>
          <option value="PJ">PJ — Pessoa Jurídica (atacado/B2B)</option>
          <option value="PF">PF — Pessoa Física (varejo)</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">E-mail (login) *</label>
        <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Senha *</label>
        <input name="password" type="text" minLength={6} required className={inputCls} placeholder="mín. 6 caracteres" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Telefone</label>
        <input name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
      </div>

      <div className="sm:col-span-2">
        <p className="mb-2 mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Endereço (opcional)
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">CEP</label>
        <input name="zipCode" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Rua</label>
        <input name="street" value={street} onChange={(e) => setStreet(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Número</label>
        <input name="number" value={number} onChange={(e) => setNumber(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Complemento</label>
        <input name="complement" value={complement} onChange={(e) => setComplement(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Bairro</label>
        <input name="district" value={district} onChange={(e) => setDistrict(e.target.value)} className={inputCls} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Cidade</label>
          <input name="city" value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">UF</label>
          <input name="state" value={state} onChange={(e) => setState(e.target.value)} maxLength={2} className={inputCls} />
        </div>
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          className="rounded-lg bg-[#0f4c81] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c3c64]"
        >
          Cadastrar cliente
        </button>
      </div>
    </form>
  );
}
