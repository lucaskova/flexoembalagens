import Link from "next/link";
import StoreHeader from "@/components/StoreHeader";
import SiteFooter from "@/components/SiteFooter";
import { getPublicSettings } from "@/lib/settings";

export default async function FavoritosPage() {
  const settings = await getPublicSettings();

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7fa] text-slate-900">
      <StoreHeader storeName={settings.name} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0f4c81]/10 text-[#0f4c81]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold">Seus favoritos</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          Em breve você poderá salvar produtos como favoritos para comprar depois. Enquanto isso,
          explore nosso catálogo completo.
        </p>
        <Link
          href="/produtos"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0f4c81] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0c3c64]"
        >
          Ver catálogo
        </Link>
      </main>

      <SiteFooter storeName={settings.name} />
    </div>
  );
}
