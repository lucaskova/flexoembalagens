import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listAllBlingProducts, type BlingListItem } from "@/lib/integrations/sync-bling";
import BlingImportList from "@/components/admin/BlingImportList";

export const metadata = { title: "Importar do Bling — Painel" };

export default async function ImportarBlingPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const { err } = await searchParams;

  let products: BlingListItem[] = [];
  let loadError: string | null = null;
  let connected = false;

  try {
    const integration = await prisma.integration.findUnique({ where: { provider: "BLING" } });
    if (!integration?.accessToken) {
      loadError = "Bling não conectado. Conecte primeiro no painel.";
    } else {
      connected = true;
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
