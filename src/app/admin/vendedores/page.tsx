import { prisma } from "@/lib/prisma";
import { createSeller, toggleSeller, resetSellerPassword, updateSellerCommission } from "./actions";

export const metadata = { title: "Vendedores — Painel" };

export default async function AdminVendedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const { ok, err } = await searchParams;

  let sellers: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    active: boolean;
    clients: number;
    commissionPercent: number;
  }> = [];

  try {
    const rows = await prisma.seller.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { customers: true } } },
    });
    sellers = rows.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      active: s.active,
      clients: s._count.customers,
      commissionPercent: s.commissionPercent,
    }));
  } catch {
    // banco offline
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81]";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Vendedores externos</h1>
        <p className="text-sm text-slate-600">
          Crie acessos para vendedores atenderem lojistas presencialmente. Eles entram em{" "}
          <code className="rounded bg-slate-100 px-1">/vendedor</code> para cadastrar clientes e
          montar pedidos.
        </p>
      </header>

      {ok === "created" && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Vendedor cadastrado!</p>
      )}
      {ok === "password" && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Senha atualizada!</p>
      )}
      {ok === "commission" && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Comissão atualizada!</p>
      )}
      {err && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(err)}</p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Novo vendedor</h2>
        <form action={createSeller} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nome *</label>
            <input name="name" required className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Telefone</label>
            <input name="phone" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">E-mail (login) *</label>
            <input name="email" type="email" required className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Senha *</label>
            <input name="password" type="text" minLength={6} required className={inputCls} placeholder="mín. 6 caracteres" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Comissão (%)</label>
            <input
              name="commissionPercent"
              type="number"
              step="0.1"
              min={0}
              max={100}
              defaultValue={0}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-[#0f4c81] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c3c64]"
            >
              Cadastrar vendedor
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Vendedores ({sellers.length})</h2>
        {sellers.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum vendedor cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-3 font-medium">Nome</th>
                  <th className="py-2 pr-3 font-medium">E-mail</th>
                  <th className="py-2 pr-3 font-medium">Clientes</th>
                  <th className="py-2 pr-3 font-medium">Comissão</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Nova senha</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 align-middle">
                    <td className="py-2 pr-3 font-medium text-slate-800">{s.name}</td>
                    <td className="py-2 pr-3 text-slate-600">{s.email}</td>
                    <td className="py-2 pr-3 text-slate-600">{s.clients}</td>
                    <td className="py-2 pr-3">
                      <form
                        action={updateSellerCommission.bind(null, s.id)}
                        className="flex items-center gap-1"
                      >
                        <input
                          name="commissionPercent"
                          type="number"
                          step="0.1"
                          min={0}
                          max={100}
                          defaultValue={s.commissionPercent}
                          className="w-16 rounded-md border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#0f4c81]"
                        />
                        <span className="text-xs text-slate-400">%</span>
                        <button
                          type="submit"
                          className="rounded-md bg-slate-700 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800"
                        >
                          OK
                        </button>
                      </form>
                    </td>
                    <td className="py-2 pr-3">
                      <form action={toggleSeller.bind(null, s.id, !s.active)}>
                        <button
                          type="submit"
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            s.active
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                          }`}
                        >
                          {s.active ? "Ativo" : "Inativo"}
                        </button>
                      </form>
                    </td>
                    <td className="py-2 pr-3">
                      <form
                        action={resetSellerPassword.bind(null, s.id)}
                        className="flex items-center gap-1"
                      >
                        <input
                          name="password"
                          type="text"
                          placeholder="nova senha"
                          minLength={6}
                          required
                          className="w-28 rounded-md border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#0f4c81]"
                        />
                        <button
                          type="submit"
                          className="rounded-md bg-slate-700 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800"
                        >
                          Resetar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
