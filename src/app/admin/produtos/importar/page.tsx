import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listAllBlingProducts, type BlingListItem } from "@/lib/integrations/sync-bling";
import { fetchBlingStores, type BlingStore } from "@/lib/integrations/bling";
import BlingImportList from "@/components/admin/BlingImportList";

export const metadata = { title: "Importar do Bling — Painel" };

export default async function ImportarBlingPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const { err } = await searchParams;

  let products: BlingListItem[] = [];
  let stores: BlingStore[] = [];
  let storesError: string | null = null;
  let loadError: string | null = null;
  let connected = false;

  const configuredStoreId = process.env.BLING_STORE_ID?.trim() || null;

  try {
    const integration = await prisma.integration.findUnique({ where: { provider: "BLING" } });
    if (!integration?.accessToken) {
      loadError = "Bling não conectado. Conecte primeiro no painel.";
    } else {
      connected = true;
      try {
        stores = await fetchBlingStores(integration.accessToken);
      } catch (e) {
        storesError = e instanceof Error ? e.message : "Não foi possível listar as lojas do Bling.";
      }
      products = await listAllBlingProducts(integration.accessToken);
    }
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Erro ao carregar produtos do Bling.";
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/produtos" className="text-sm text-emerald-700 hover:underline">
            ← Produtos
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Importar do Bling</h1>
          <p className="text-sm text-slate-600">
            Selecione quais produtos do Bling quer trazer para a loja.
          </p>
        </div>
      </header>

      {err && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(err)}</p>
      )}

      {connected && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800">
            Suas lojas / canais de venda no Bling
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Para importar só os produtos de um canal, copie o ID abaixo e configure a variável{" "}
            <code className="rounded bg-slate-100 px-1">BLING_STORE_ID</code> na Vercel.
            {configuredStoreId ? (
              <>
                {" "}
                Atualmente filtrando pela loja{" "}
                <span className="font-semibold text-emerald-700">{configuredStoreId}</span>.
              </>
            ) : (
              <> Hoje nenhum filtro está ativo (traz produtos de todos os canais).</>
            )}
          </p>

          {storesError ? (
            <p className="mt-3 text-sm text-amber-700">{storesError}</p>
          ) : stores.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nenhuma loja encontrada no Bling.</p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Loja / canal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stores.map((s) => {
                    const active = String(s.id) === configuredStoreId;
                    return (
                      <tr key={s.id} className={active ? "bg-emerald-50" : ""}>
                        <td className="px-3 py-2 font-mono font-medium text-slate-800">
                          {s.id}
                          {active && (
                            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700">
                              em uso
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {s.nome || s.descricao || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {loadError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          {loadError}
          {!connected && (
            <Link href="/admin" className="ml-2 font-semibold underline">
              Ir para o painel
            </Link>
          )}
        </div>
      ) : (
        <BlingImportList products={products} />
      )}
    </div>
  );
}
