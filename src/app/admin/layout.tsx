import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AdminNav from "@/components/admin/AdminNav";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";

  // A tela de login não usa a moldura do painel.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function logout() {
    "use server";
    const jar = await cookies();
    jar.delete(ADMIN_COOKIE);
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:flex-row md:p-6">
        <aside className="w-full shrink-0 md:w-56">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-4 px-1">
              <p className="text-sm font-bold text-emerald-800">Lambari Pesca</p>
              <p className="text-xs text-slate-500">Painel administrativo</p>
            </div>
            <AdminNav />
            <Link
              href="/"
              className="mt-4 block rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              ← Ver loja
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                Sair
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
