"use client";

import { useRef } from "react";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import { formatBRL } from "@/store/cart";

export type FeaturedItem = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  stock: number;
  imageUrl: string | null;
  price: number;
  originalPrice: number | null;
  discountLabel: string | null;
};

type Props = {
  title: string;
  items: FeaturedItem[];
};

export default function FeaturedCarousel({ title, items }: Props) {
  const trackRef = useRef<HTMLUListElement>(null);

  function scroll(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const amount = track.clientWidth * 0.8 * direction;
    track.scrollBy({ left: amount, behavior: "smooth" });
  }

  if (items.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:border-emerald-500 hover:text-emerald-700"
            aria-label="Anterior"
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
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:border-emerald-500 hover:text-emerald-700"
            aria-label="Próximo"
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
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <ul
        ref={trackRef}
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((p) => {
          const onSale = p.originalPrice != null;
          return (
            <li
              key={p.id}
              className="w-60 shrink-0 snap-start overflow-hidden rounded-2xl border border-[#e8edf3] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition duration-200 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(15,76,129,0.14)]"
            >
              <Link href={`/produtos`} className="block">
                <div className="relative flex h-[220px] items-center justify-center rounded-t-2xl bg-white p-5">
                  {onSale && (
                    <span className="absolute left-3 top-3 z-10 rounded-full bg-[#ff2d55] px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                      {p.discountLabel}
                    </span>
                  )}
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} loading="lazy" className="max-h-[180px] max-w-full object-contain" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      Sem foto
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-800">{p.name}</h3>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-xl font-extrabold text-[#0f4c81]">{formatBRL(p.price)}</p>
                  {onSale && (
                    <p className="text-xs text-slate-400 line-through">
                      {formatBRL(p.originalPrice!)}
                    </p>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {p.stock > 0 ? `${p.stock} em estoque` : "Sem estoque"}
                </p>
                <AddToCartButton
                  product={{
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    price: p.price,
                    imageUrl: p.imageUrl,
                    sku: p.sku,
                    stock: p.stock,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
