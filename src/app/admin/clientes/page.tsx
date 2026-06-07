import { prisma } from "@/lib/prisma";
import { resetCustomerPassword } from "./actions";
import AdminClientForm from "@/components/admin/AdminClientForm";

export const metadata = { title: "Clientes — Painel" };

export default async function AdminClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const { ok, err } = await searchParams;

  let customers: Array<{
    id: string;
    name: string;
    email: string;
    type: string;
    document: string | null;
    phone: string | null;
    hasPassword: boolean;
    seller: string | null;
    createdAt: Date;
  }> = [];

  try {
    const rows = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { seller: { select: { name: true } } },
    });
    customers = rows.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      type: c.type,
      document: c.document,
      phone: c.phone,
      hasPassword: Boolean(c.passwordHash),
      seller: c.seller?.name ?? null,
      createdAt: c.createdAt,
    }));
  } catch {
    // banco offline
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-slate-600">
          Cadastre clientes B2B (atacado) manualmente e crie login e senha de acesso.
        </p>
      </header>

      {ok === "created" && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Cliente cadastrado!</p>
      )}
      {ok === "password" && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Senha atualizada!</p>
      )}
      {err && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(err)}</p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Novo cliente</h2>
        <AdminClientForm />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Clientes cadastrados ({customers.length})</h2>
        {customers.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum cliente ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-3 font-medium">Nome</th>
                  <th className="py-2 pr-3 font-medium">E-mail</th>
                  <th className="py-2 pr-3 font-medium">Tipo</th>
                  <th className="py-2 pr-3 font-medium">Acesso</th>
                  <th className="py-2 pr-3 font-medium">Vendedor</th>
                  <th className="py-2 pr-3 font-medium">Senha</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 align-middle">
                    <td className="py-2 pr-3 font-medium text-slate-800">{c.name}</td>
                    <td className="py-2 pr-3 text-slate-600">{c.email}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          c.type === "PJ"
                            ? "bg-[#0f4c81]/10 text-[#0f4c81]"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      {c.hasPassword ? (
                        <span className="text-emerald-700">✓ ativo</span>
                      ) : (
                        <span className="text-amber-600">sem senha</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-slate-500">{c.seller ?? "—"}</td>
                    <td className="py-2 pr-3">
                      <form
                        action={resetCustomerPassword.bind(null, c.id)}
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
