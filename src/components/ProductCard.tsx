import React, { useState } from 'react';
import { Bookmark, Check, Plus, Star } from 'lucide-react';
import { Product } from '../types';
import { formatINR } from '../data/products';

interface ProductCardProps {
  product: Product;
  isCompared: boolean;
  isSaved: boolean;
  onToggleCompare: (product: Product) => void;
  onToggleSave: (productId: string) => void;
  onOpenDetail: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isCompared,
  isSaved,
  onToggleCompare,
  onToggleSave,
  onOpenDetail,
}) => {
  const [imgError, setImgError] = useState(false);
  const discountPct =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  return (
    <article className="group bg-white rounded-2xl border border-slate-200/90 hover:border-violet-300 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col overflow-hidden">
      {/* Studio Product Image (4:3, ~65% visual anchor) */}
      <button
        type="button"
        onClick={() => onOpenDetail(product)}
        className="relative w-full aspect-[4/3] bg-[#F5F3FF] overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-700"
      >
        {!imgError ? (
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] text-center">
            <span className="text-xs font-medium uppercase tracking-wider text-violet-700">
              {product.brand}
            </span>
            <span className="mt-1 font-display font-semibold text-sm text-slate-800">
              {product.name}
            </span>
          </div>
        )}
      </button>

      {/* Card Body with identical field order across grid */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          {/* Unboxed clean metadata with typographic separator */}
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
            <span className="uppercase tracking-wider font-medium truncate">
              {product.brand} · {product.category}
            </span>
            <span className="tabular-nums font-mono text-slate-700 shrink-0">
              Value {product.valueScore}/100
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpenDetail(product)}
            className="mt-2 text-left block w-full focus:outline-none focus-visible:underline"
          >
            <h3 className="font-display text-base font-semibold text-slate-950 leading-snug line-clamp-2 group-hover:text-[#4C1D95] transition-colors">
              {product.name}
            </h3>
          </button>

          <p className="mt-1.5 text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {product.tagline}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 space-y-3">
          {/* Price + Ratings */}
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-lg font-semibold text-slate-950 tabular-nums">
                {formatINR(product.price)}
              </span>
              {discountPct > 0 && (
                <span className="text-xs text-slate-400 line-through font-mono tabular-nums">
                  {formatINR(product.mrp)}
                </span>
              )}
              {discountPct > 0 && (
                <span className="text-xs font-medium text-[#4C1D95] tabular-nums">
                  {discountPct}% off
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-700 shrink-0 tabular-nums">
              <Star
                className="w-3.5 h-3.5 text-amber-500 fill-amber-500"
                aria-hidden="true"
              />
              <span className="font-semibold">{product.rating.toFixed(1)}</span>
              <span className="text-slate-400">
                ({product.reviewCount.toLocaleString('en-IN')})
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleCompare(product)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors min-h-[40px] whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 ${
                isCompared
                  ? 'bg-[#4C1D95] text-white hover:bg-[#3B0764]'
                  : 'bg-[#F5F3FF] text-[#4C1D95] hover:bg-[#EDE9FE]'
              }`}
            >
              {isCompared ? (
                <>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>In Compare</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Compare</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onToggleSave(product.id)}
              aria-label={
                isSaved
                  ? `Remove ${product.name} from saved products`
                  : `Save ${product.name}`
              }
              className={`w-10 h-10 inline-flex items-center justify-center rounded-lg border transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 ${
                isSaved
                  ? 'border-violet-300 bg-[#F5F3FF] text-[#4C1D95]'
                  : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Bookmark
                className={`w-4 h-4 ${isSaved ? 'fill-[#4C1D95]' : ''}`}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={() => onOpenDetail(product)}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-950 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors min-h-[40px] whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-700"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
