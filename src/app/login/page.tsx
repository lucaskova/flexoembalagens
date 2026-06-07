"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import StoreHeader from "@/components/StoreHeader";
import { useAuth } from "@/store/auth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setCustomer = useAuth((s) => s.setCustomer);

  const redirectTo = searchParams.get("redirect") || "/minha-conta";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    document: "",
    type: "PF" as "PF" | "PJ",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email: form.email, password: form.password }
          : {
              name: form.name,
              email: form.email,
              password: form.password,
              phone: form.phone || undefined,
              document: form.document || undefined,
              type: form.type,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Não foi possível continuar.");
        return;
      }
      setCustomer(data.customer);
      router.push(redirectTo);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <StoreHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                mode === "login" ? "bg-white text-emerald-800 shadow" : "text-slate-500"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                mode === "register" ? "bg-white text-emerald-800 shadow" : "text-slate-500"
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Tipo de conta
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => update("type", "PF")}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        form.type === "PF"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : "border-slate-300 text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      Pessoa Física (CPF)
                    </button>
                    <button
                      type="button"
                      onClick={() => update("type", "PJ")}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        form.type === "PJ"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : "border-slate-300 text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      Pessoa Jurídica (CNPJ)
                    </button>
                  </div>
                  {form.type === "PJ" && (
                    <p className="mt-1 text-xs text-emerald-700">
                      Contas CNPJ têm acesso aos preços de atacado.
                    </p>
                  )}
                </div>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    {form.type === "PJ" ? "Razão social / Nome *" : "Nome completo *"}
                  </span>
                  <input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className="input"
                    required
                  />
                </label>
              </>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">E-mail *</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="input"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Senha *</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="input"
                required
                minLength={mode === "register" ? 6 : undefined}
              />
            </label>

            {mode === "register" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Telefone</span>
                  <input
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="input"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    {form.type === "PJ" ? "CNPJ" : "CPF"}
                  </span>
                  <input
                    value={form.document}
                    onChange={(e) => update("document", e.target.value)}
                    className="input"
                  />
                </label>
              </div>
            )}

            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {submitting
                ? "Aguarde..."
                : mode === "login"
                  ? "Entrar"
                  : "Criar conta e continuar"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/" className="text-emerald-700 hover:underline">
            Voltar à loja
          </Link>
        </p>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
