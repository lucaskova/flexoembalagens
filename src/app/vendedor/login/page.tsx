import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { createSellerSession } from "@/lib/seller-auth";

export const metadata = { title: "Portal do Vendedor — Entrar" };

export default async function SellerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; next?: string }>;
}) {
  const { err, next } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const dest = String(formData.get("next") ?? "/vendedor") || "/vendedor";

    const fail = () =>
      redirect(`/vendedor/login?err=1${dest ? `&next=${encodeURIComponent(dest)}` : ""}`);

    const seller = await prisma.seller.findUnique({ where: { email } });
    if (!seller || !seller.active) fail();
    const valid = await verifyPassword(password, seller!.passwordHash);
    if (!valid) fail();

    await createSellerSession(seller!.id);
    redirect(dest.startsWith("/vendedor") ? dest : "/vendedor");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <p className="text-lg font-bold text-[#0f4c81]">Portal do Vendedor</p>
          <p className="text-sm text-slate-500">Atendimento B2B presencial.</p>
        </div>

        {err && (
          <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            E-mail ou senha incorretos.
          </p>
        )}

        <form action={login} className="space-y-4">
          <input type="hidden" name="next" value={next ?? "/vendedor"} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
            <input
              type="email"
              name="email"
              autoFocus
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Senha</label>
            <input
              type="password"
              name="password"
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
