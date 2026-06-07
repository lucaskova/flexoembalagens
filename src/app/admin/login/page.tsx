import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, checkAdminPassword, expectedAdminToken } from "@/lib/admin-auth";

export const metadata = { title: "Entrar — Painel" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; next?: string }>;
}) {
  const { err, next } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const password = String(formData.get("password") ?? "");
    const dest = String(formData.get("next") ?? "/admin") || "/admin";

    if (!checkAdminPassword(password)) {
      redirect(`/admin/login?err=1${dest ? `&next=${encodeURIComponent(dest)}` : ""}`);
    }

    const token = await expectedAdminToken();
    const jar = await cookies();
    jar.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12, // 12h
    });

    redirect(dest.startsWith("/admin") ? dest : "/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <p className="text-lg font-bold text-[#0f4c81]">Painel administrativo</p>
          <p className="text-sm text-slate-500">Entre com a senha de administrador.</p>
        </div>

        {err && (
          <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Senha incorreta.
          </p>
        )}

        <form action={login} className="space-y-4">
          <input type="hidden" name="next" value={next ?? "/admin"} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Senha</label>
            <input
              type="password"
              name="password"
              autoFocus
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81]"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-[#0f4c81] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c3c64]"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
