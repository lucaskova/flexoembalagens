import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentSeller, destroySellerSession } from "@/lib/seller-auth";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (pathname === "/vendedor/login") {
    return <>{children}</>;
  }

  const seller = await getCurrentSeller();
  if (!seller) redirect("/vendedor/login");

  async function logout() {
    "use server";
    await destroySellerSession();
    redirect("/vendedor/login");
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/vendedor" className="font-bold text-[#0f4c81]">
              Portal do Vendedor
            </Link>
            <nav className="hidden gap-4 text-sm font-medium text-slate-600 sm:flex">
              <Link href="/vendedor/clientes/novo" className="hover:text-[#0f4c81]">
                Cadastrar cliente
              </Link>
              <Link href="/vendedor/pedido" className="hover:text-[#0f4c81]">
                Novo pedido
              </Link>
              <Link href="/vendedor/pedidos" className="hover:text-[#0f4c81]">
                Meus pedidos
              </Link>
              <Link href="/vendedor/relatorio" className="hover:text-[#0f4c81]">
                Relatório
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">{seller.name}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
