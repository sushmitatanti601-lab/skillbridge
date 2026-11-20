import React, { useEffect } from 'react';
import { Bookmark, Check, Plus, ShieldCheck, Star, X } from 'lucide-react';
import { Product } from '../types';
import { formatINR } from '../data/products';

interface ProductDetailModalProps {
  product: Product | null;
  isCompared: boolean;
  isSaved: boolean;
  onClose: () => void;
  onToggleCompare: (product: Product) => void;
  onToggleSave: (productId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isCompared,
  isSaved,
  onClose,
  onToggleCompare,
  onToggleSave,
}) => {
  useEffect(() => {
    if (!product) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const discountPct =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-sm border-b border-slate-100">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {product.brand} · {product.category}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product details"
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Gallery */}
          <div className="md:col-span-5 space-y-4">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#F5F3FF] border border-slate-200/70">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#F5F3FF] space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Value for Money Index</span>
                <span className="font-mono font-semibold text-[#4C1D95] tabular-nums">
                  {product.valueScore} / 100
                </span>
              </div>
              <div className="h-2 rounded-full bg-violet-200/70 overflow-hidden">
                <div
                  className="h-full bg-[#4C1D95] rounded-full"
                  style={{ width: `${product.valueScore}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 pt-1">
                Best suited for: <span className="font-medium text-slate-900">{product.bestFor}</span>
              </p>
            </div>
          </div>

          {/* Right Contiguous Purchase & Spec Module */}
          <div className="md:col-span-7 space-y-6">
            <div>
              <h2
                id="pdp-modal-title"
                className="font-display text-2xl font-bold text-slate-950 text-balance"
              >
                {product.name}
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {product.tagline}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <span className="font-mono text-2xl font-bold text-slate-950 tabular-nums">
                  {formatINR(product.price)}
                </span>
                {discountPct > 0 && (
                  <span className="font-mono text-sm text-slate-400 line-through tabular-nums">
                    {formatINR(product.mrp)}
                  </span>
                )}
                {discountPct > 0 && (
                  <span className="text-xs font-semibold text-[#4C1D95] tabular-nums">
                    Save {discountPct}%
                  </span>
                )}
                <span className="text-slate-300" aria-hidden="true">
                  |
                </span>
                <div className="flex items-center gap-1.5 text-sm text-slate-700 tabular-nums">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-semibold">{product.rating.toFixed(1)}</span>
                  <span className="text-slate-500">
                    ({product.reviewCount.toLocaleString('en-IN')} reviews)
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onToggleCompare(product)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors min-h-[42px] whitespace-nowrap shrink-0 ${
                    isCompared
                      ? 'bg-[#4C1D95] text-white hover:bg-[#3B0764]'
                      : 'bg-[#4C1D95] text-white hover:bg-[#3B0764]'
                  }`}
                >
                  {isCompared ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Compare</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add to Compare</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onToggleSave(product.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors min-h-[42px] whitespace-nowrap shrink-0 ${
                    isSaved
                      ? 'border-violet-300 bg-[#F5F3FF] text-[#4C1D95]'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Bookmark
                    className={`w-4 h-4 ${isSaved ? 'fill-[#4C1D95]' : ''}`}
                  />
                  <span>{isSaved ? 'Saved' : 'Save Product'}</span>
                </button>
              </div>
            </div>

            {/* Verified Offers */}
            {product.verifiedOffers.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Verified Available Offers
                </h3>
                {product.verifiedOffers.map((offer, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-sm text-slate-800 bg-[#FAFAFC] border border-slate-200/80 rounded-lg px-3.5 py-2.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#4C1D95] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">{offer.label}</p>
                      <p className="text-xs text-slate-500">
                        {offer.partner} · Verified {offer.verifiedDate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Key Specs */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Key Specifications
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex flex-col py-1.5 border-b border-slate-100"
                  >
                    <dt className="text-xs text-slate-500">{key}</dt>
                    <dd className="font-medium text-slate-900 mt-0.5">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Pros & Cons */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-2">
                  Pros
                </h3>
                <ul className="space-y-1.5 text-sm text-slate-700">
                  {product.pros.map((pro, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-semibold mt-0.5">+</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-700 mb-2">
                  Cons
                </h3>
                <ul className="space-y-1.5 text-sm text-slate-700">
                  {product.cons.map((con, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-600 font-semibold mt-0.5">−</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
