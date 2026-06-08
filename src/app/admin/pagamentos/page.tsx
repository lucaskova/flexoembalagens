import { prisma } from "@/lib/prisma";
import {
  createPaymentMethod,
  updatePaymentMethod,
  togglePaymentMethod,
  deletePaymentMethod,
} from "./actions";

export const metadata = { title: "Formas de pagamento — Painel" };

export default async function AdminPagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const { ok, err } = await searchParams;

  let methods: Array<{
    id: string;
    name: string;
    instructions: string | null;
    active: boolean;
    sortOrder: number;
  }> = [];

  try {
    methods = await prisma.paymentMethod.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  } catch {
    // banco offline
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81]";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Formas de pagamento</h1>
        <p className="text-sm text-slate-600">
          Cadastre as formas de pagamento que os vendedores poderão selecionar nos pedidos.
        </p>
      </header>

      {ok === "created" && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Forma cadastrada!</p>
      )}
      {ok === "updated" && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Forma atualizada!</p>
      )}
      {err && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(err)}</p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Nova forma de pagamento</h2>
        <form action={createPaymentMethod} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nome *</label>
            <input name="name" required placeholder="Ex.: Pix, Boleto, Cartão, A prazo 30 dias" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ordem</label>
            <input name="sortOrder" type="number" defaultValue={0} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Instruções (opcional)
            </label>
            <input name="instructions" placeholder="Ex.: chave Pix, prazo, etc." className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-[#0f4c81] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c3c64]"
            >
              Adicionar
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Formas cadastradas ({methods.length})</h2>
        {methods.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma forma de pagamento ainda.</p>
        ) : (
          <ul className="space-y-3">
            {methods.map((m) => (
              <li key={m.id} className="rounded-xl border border-slate-200 p-4">
                <form
                  action={updatePaymentMethod.bind(null, m.id)}
                  className="grid gap-3 sm:grid-cols-[1fr_5rem_auto]"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input name="name" defaultValue={m.name} className={inputCls} />
                    <input
                      name="instructions"
                      defaultValue={m.instructions ?? ""}
                      placeholder="Instruções"
                      className={inputCls}
                    />
                  </div>
                  <input name="sortOrder" type="number" defaultValue={m.sortOrder} className={inputCls} />
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-sm text-slate-600">
                      <input type="checkbox" name="active" defaultChecked={m.active} />
                      Ativo
                    </label>
                    <button
                      type="submit"
                      className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
                <div className="mt-2 flex gap-3">
                  <form action={togglePaymentMethod.bind(null, m.id, !m.active)}>
                    <button
                      type="submit"
                      className="text-xs font-medium text-slate-500 hover:text-slate-800"
                    >
                      {m.active ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                  <form action={deletePaymentMethod.bind(null, m.id)}>
                    <button type="submit" className="text-xs font-medium text-rose-500 hover:text-rose-700">
                      Excluir
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
