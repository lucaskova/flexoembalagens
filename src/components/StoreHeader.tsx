import Link from "next/link";
import { Suspense } from "react";
import CartButton from "@/components/CartButton";
import SearchBar from "@/components/SearchBar";
import AnnouncementBar from "@/components/AnnouncementBar";
import CategoryMenu from "@/components/CategoryMenu";
import AccountButton from "@/components/AccountButton";
import BrandLogo from "@/components/BrandLogo";

type Props = {
  storeName?: string;
};

export default function StoreHeader({ storeName }: Props) {
  const name = storeName ?? process.env.NEXT_PUBLIC_STORE_NAME ?? "Lambari Pesca";

  return (
    <>
      <AnnouncementBar />

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        {/* Linha principal: logo + busca centralizada + atalhos */}
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 lg:gap-8">
          <BrandLogo storeName={name} large />

          <div className="order-last w-full flex-1 lg:order-none lg:w-auto lg:max-w-2xl">
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
          </div>

          <nav className="ml-auto flex items-center gap-1 sm:gap-2 lg:ml-0">
            <AccountButton />
            <Link
              href="/minha-conta"
              className="hidden flex-col items-center rounded-lg px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-[#0f4c81] sm:flex"
              aria-label="Meus pedidos"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              Pedidos
            </Link>
            <Link
              href="/favoritos"
              className="hidden flex-col items-center rounded-lg px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-[#0f4c81] sm:flex"
              aria-label="Favoritos"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
              </svg>
              Favoritos
            </Link>
            <CartButton />
          </nav>
        </div>

        {/* Linha de navegação: categorias + atalhos */}
        <div className="border-t border-slate-100 bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-sm">
            <CategoryMenu />
            <span className="h-4 w-px bg-slate-200" />
            <Link href="/produtos" className="px-2 py-1 font-medium text-slate-700 hover:text-[#0f4c81]">
              Produtos
            </Link>
            <Link
              href="/promocoes"
              className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#ff2d55] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95"
            >
              Promoções
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
