import AddToCartButton from "@/components/AddToCartButton";
import { formatBRL } from "@/lib/format";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  stock: number;
  imageUrl?: string | null;
  featured?: boolean;
};

type Props = {
  product: ProductCardData;
  price: number;
  originalPrice?: number | null;
  discountLabel?: string | null;
};

// Extrai dimensões do nome, ex.: "Caixa de Papelão G (30×30×20 cm)" -> "30×30×20 cm"
function extractDimensions(name: string): string | null {
  const match = name.match(/\(([^)]*\d[^)]*(?:cm|mm|m)[^)]*)\)/i);
  return match ? match[1].trim() : null;
}

export default function ProductCard({ product, price, originalPrice, discountLabel }: Props) {
  const onSale = originalPrice != null && originalPrice > price;
  const savings = onSale ? originalPrice! - price : 0;
  const dimensions = extractDimensions(product.name);

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-[#e8edf3] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition duration-200 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(15,76,129,0.14)]">
      <div className="relative flex h-[220px] items-center justify-center rounded-t-2xl bg-white p-5">
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {onSale && discountLabel && (
            <span className="rounded-full bg-[#ff2d55] px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
              {discountLabel}
            </span>
          )}
          {product.featured && (
            <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-amber-950 shadow-sm">
              Mais Vendido
            </span>
          )}
        </div>

        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="max-h-[180px] max-w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
            Sem foto
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-800">
          {product.name}
        </h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
          <span>SKU {product.sku}</span>
          {dimensions && <span className="font-medium text-slate-600">{dimensions}</span>}
        </div>

        <p className="mt-0.5 text-xs text-slate-500">
          {product.stock > 0 ? (
            <span className="text-emerald-600">{product.stock} em estoque</span>
          ) : (
            <span className="text-rose-500">Sem estoque</span>
          )}
        </p>

        <div className="mt-3">
          {onSale && (
            <p className="text-xs text-slate-400 line-through">{formatBRL(originalPrice!)}</p>
          )}
          <p className="text-2xl font-extrabold text-[#0f4c81]">{formatBRL(price)}</p>
          {onSale && (
            <p className="mt-0.5 inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
              Economize {formatBRL(savings)}
            </p>
          )}
        </div>

        <div className="mt-auto">
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price,
              imageUrl: product.imageUrl,
              sku: product.sku,
              stock: product.stock,
            }}
          />
        </div>
      </div>
    </li>
  );
}
