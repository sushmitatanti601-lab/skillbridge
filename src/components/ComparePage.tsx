import React, { useMemo, useState } from 'react';
import {
  Award,
  BookmarkCheck,
  Bot,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
} from 'lucide-react';
import { AICompareVerdictResponse, Product, RecommendationSlot } from '../types';
import { PRODUCTS, formatINR } from '../data/products';

interface ComparePageProps {
  compareIds: string[];
  onSetCompareIds: (ids: string[]) => void;
  onSaveComparison: (title: string, productIds: string[]) => void;
  onOpenDetail: (product: Product) => void;
}

const PRESET_COMPARISONS = [
  {
    label: 'Smartphones under ₹20k',
    ids: [
      'phone-redmi-note-13-pro',
      'phone-realme-narzo-70-pro',
      'phone-samsung-m35',
    ],
  },
  {
    label: 'MBA Laptops under ₹50k',
    ids: [
      'laptop-asus-vivobook-16',
      'laptop-lenovo-ideapad-slim-3',
      'laptop-hp-15s-i5',
    ],
  },
  {
    label: 'Sunscreens under ₹500',
    ids: [
      'beauty-minimalist-spf50',
      'beauty-derma-co-hyaluronic',
      'beauty-dot-key-watermelon',
    ],
  },
  {
    label: 'Daily ANC Headphones',
    ids: [
      'audio-soundcore-space-one',
      'audio-sony-wh-ch720n',
      'audio-jbl-tune-770nc',
    ],
  },
];

function computeBaselineRecommendations(items: Product[]): RecommendationSlot[] {
  if (items.length < 2) return [];

  const byOverall = [...items].sort(
    (a, b) => b.valueScore * 0.6 + b.rating * 8 - (a.valueScore * 0.6 + a.rating * 8)
  );
  const byBudget = [...items].sort((a, b) => a.price - b.price);
  const byValue = [...items].sort((a, b) => b.valueScore - a.valueScore);
  const byFeatures = [...items].sort(
    (a, b) => b.rating * 10 + b.features.length - (a.rating * 10 + a.features.length)
  );

  const used = new Set<string>();
  const overall = byOverall[0];
  used.add(overall.id);

  const budget = byBudget.find((p) => !used.has(p.id)) ?? byBudget[0];
  used.add(budget.id);

  const value = byValue.find((p) => !used.has(p.id)) ?? byValue[0];
  used.add(value.id);

  const features = byFeatures.find((p) => !used.has(p.id)) ?? byFeatures[0];
  used.add(features.id);

  const alternative = items.find((p) => !used.has(p.id)) ?? byOverall[1] ?? overall;

  return [
    {
      role: 'Best Overall',
      productId: overall.id,
      reason: `Balances a ${overall.rating.toFixed(1)} rating with ${overall.valueScore}/100 value for ${overall.bestFor.toLowerCase()}.`,
    },
    {
      role: 'Best Budget Option',
      productId: budget.id,
      reason: `Lowest upfront cost at ${formatINR(budget.price)} without sacrificing everyday essentials.`,
    },
    {
      role: 'Best Value for Money',
      productId: value.id,
      reason: `Scores ${value.valueScore}/100 on spec-to-price ratio across verified specifications.`,
    },
    {
      role: 'Best Features',
      productId: features.id,
      reason: `Stands out for ${features.features[0].toLowerCase()} and ${features.rating.toFixed(1)}★ buyer feedback.`,
    },
    {
      role: 'Best Alternative',
      productId: alternative.id,
      reason: `Strong runner-up if you prioritize ${alternative.bestFor.toLowerCase()}.`,
    },
  ];
}

export const ComparePage: React.FC<ComparePageProps> = ({
  compareIds,
  onSetCompareIds,
  onSaveComparison,
  onOpenDetail,
}) => {
  const [addCandidateId, setAddCandidateId] = useState<string>('');
  const [priorityInput, setPriorityInput] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiVerdict, setAiVerdict] = useState<AICompareVerdictResponse | null>(
    null
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const comparedProducts = useMemo(
    () =>
      compareIds
        .map((id) => PRODUCTS.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p))
        .slice(0, 4),
    [compareIds]
  );

  const availableToAdd = useMemo(
    () => PRODUCTS.filter((p) => !compareIds.includes(p.id)),
    [compareIds]
  );

  const allSpecKeys = useMemo(() => {
    const keys: string[] = [];
    comparedProducts.forEach((p) => {
      Object.keys(p.specs).forEach((k) => {
        if (!keys.includes(k)) keys.push(k);
      });
    });
    return keys;
  }, [comparedProducts]);

  // Deterministic highlights
  const minPrice = comparedProducts.length
    ? Math.min(...comparedProducts.map((p) => p.price))
    : 0;
  const maxRating = comparedProducts.length
    ? Math.max(...comparedProducts.map((p) => p.rating))
    : 0;
  const maxValue = comparedProducts.length
    ? Math.max(...comparedProducts.map((p) => p.valueScore))
    : 0;

  const mixedCategories =
    new Set(comparedProducts.map((p) => p.category)).size > 1;

  const baselineRecs = useMemo(
    () => computeBaselineRecommendations(comparedProducts),
    [comparedProducts]
  );

  const handleAddProduct = () => {
    if (!addCandidateId || compareIds.length >= 4) return;
    onSetCompareIds([...compareIds, addCandidateId]);
    setAddCandidateId('');
    setAiVerdict(null);
  };

  const handleRemoveProduct = (id: string) => {
    onSetCompareIds(compareIds.filter((cId) => cId !== id));
    setAiVerdict(null);
  };

  const handleGenerateVerdict = async () => {
    if (comparedProducts.length < 2) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/compare-verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: comparedProducts.map((p) => p.id),
          userPriorities: priorityInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not generate AI comparison verdict.');
      }
      setAiVerdict(data as AICompareVerdictResponse);
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : 'Unable to reach AI comparison engine.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleBookmarkComparison = () => {
    if (comparedProducts.length < 2) return;
    const title = comparedProducts.map((p) => p.name.split('(')[0].trim()).join(' vs ');
    onSaveComparison(
      title,
      comparedProducts.map((p) => p.id)
    );
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const displayRecommendations =
    aiVerdict && aiVerdict.recommendations.length > 0
      ? aiVerdict.recommendations
      : baselineRecs;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-950">
            Side-by-Side Comparison
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Compare 2 to 4 products across price, specs, pros & cons, value score,
            and verified offers.
          </p>
        </div>

        {/* Preset Quick Comparisons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 mr-1">
            Popular matrices:
          </span>
          {PRESET_COMPARISONS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                onSetCompareIds(preset.ids);
                setAiVerdict(null);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#F5F3FF] text-[#4C1D95] hover:bg-[#EDE9FE] transition-colors whitespace-nowrap shrink-0"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Product & Save Comparison Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <select
            value={addCandidateId}
            onChange={(e) => setAddCandidateId(e.target.value)}
            disabled={comparedProducts.length >= 4}
            aria-label="Select a product to add to comparison"
            className="flex-1 min-w-[220px] max-w-md px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#4C1D95] disabled:opacity-50"
          >
            <option value="">
              {comparedProducts.length >= 4
                ? 'Maximum 4 products selected'
                : 'Add a product to compare...'}
            </option>
            {availableToAdd.map((p) => (
              <option key={p.id} value={p.id}>
                {p.category} — {p.name} ({formatINR(p.price)})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddProduct}
            disabled={!addCandidateId || comparedProducts.length >= 4}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#4C1D95] hover:bg-[#3B0764] disabled:opacity-40 rounded-lg transition-colors min-h-[38px] whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add ({comparedProducts.length}/4)</span>
          </button>
        </div>

        {comparedProducts.length >= 2 && (
          <button
            type="button"
            onClick={handleBookmarkComparison}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors min-h-[38px] whitespace-nowrap shrink-0"
          >
            <BookmarkCheck className="w-4 h-4 text-[#4C1D95]" />
            <span>
              {savedNotice ? 'Saved to History' : 'Save Comparison'}
            </span>
          </button>
        )}
      </div>

      {mixedCategories && (
        <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          You are comparing products from different categories. Spec rows are
          aligned where applicable; select items from the same category for an
          apples-to-apples technical breakdown.
        </div>
      )}

      {/* Comparison Matrix Table */}
      {comparedProducts.length < 2 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <h2 className="font-display text-xl font-semibold text-slate-950">
            Select at least 2 products to compare side by side
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Add products from the dropdown above, pick a popular preset matrix,
            or browse Explore to build your comparison.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-[#FAFAFC]">
                  <th className="w-48 p-5 align-bottom text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Comparison Criteria
                  </th>
                  {comparedProducts.map((product) => (
                    <th
                      key={product.id}
                      className="p-5 align-top min-w-[220px] border-l border-slate-100"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                            {product.brand}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(product.id)}
                            aria-label={`Remove ${product.name} from comparison`}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenDetail(product)}
                          className="block w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#F5F3FF] border border-slate-200/70"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenDetail(product)}
                          className="text-left font-display text-base font-bold text-slate-950 hover:text-[#4C1D95] leading-snug block"
                        >
                          {product.name}
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm">
                {/* Price Row */}
                <tr>
                  <td className="p-5 font-medium text-slate-700 bg-[#FAFAFC]">
                    Price
                  </td>
                  {comparedProducts.map((p) => {
                    const isBest = p.price === minPrice;
                    return (
                      <td
                        key={p.id}
                        className={`p-5 border-l border-slate-100 ${
                          isBest ? 'bg-[#F5F3FF]/60' : ''
                        }`}
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-lg font-bold text-slate-950 tabular-nums">
                            {formatINR(p.price)}
                          </span>
                          {p.mrp > p.price && (
                            <span className="font-mono text-xs text-slate-400 line-through tabular-nums">
                              {formatINR(p.mrp)}
                            </span>
                          )}
                        </div>
                        {isBest && (
                          <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#4C1D95]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Best Price</span>
                          </p>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Customer Rating Row */}
                <tr>
                  <td className="p-5 font-medium text-slate-700 bg-[#FAFAFC]">
                    Customer Rating
                  </td>
                  {comparedProducts.map((p) => {
                    const isBest = p.rating === maxRating;
                    return (
                      <td
                        key={p.id}
                        className={`p-5 border-l border-slate-100 ${
                          isBest ? 'bg-[#F5F3FF]/60' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1.5 tabular-nums">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="font-semibold text-slate-950">
                            {p.rating.toFixed(1)} / 5
                          </span>
                          <span className="text-xs text-slate-500">
                            ({p.reviewCount.toLocaleString('en-IN')})
                          </span>
                        </div>
                        {isBest && (
                          <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#4C1D95]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Highest Rated</span>
                          </p>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Value for Money Row */}
                <tr>
                  <td className="p-5 font-medium text-slate-700 bg-[#FAFAFC]">
                    Value for Money
                  </td>
                  {comparedProducts.map((p) => {
                    const isBest = p.valueScore === maxValue;
                    return (
                      <td
                        key={p.id}
                        className={`p-5 border-l border-slate-100 ${
                          isBest ? 'bg-[#F5F3FF]/60' : ''
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between font-mono text-sm tabular-nums">
                            <span className="font-semibold text-slate-950">
                              {p.valueScore}/100
                            </span>
                            {isBest && (
                              <span className="text-xs font-sans font-semibold text-[#4C1D95]">
                                Best Value
                              </span>
                            )}
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isBest ? 'bg-[#4C1D95]' : 'bg-slate-400'
                              }`}
                              style={{ width: `${p.valueScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Dynamic Spec Rows */}
                {allSpecKeys.map((specKey) => (
                  <tr key={specKey}>
                    <td className="p-5 font-medium text-slate-700 bg-[#FAFAFC]">
                      {specKey}
                    </td>
                    {comparedProducts.map((p) => (
                      <td
                        key={p.id}
                        className="p-5 border-l border-slate-100 text-slate-800"
                      >
                        {p.specs[specKey] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Key Features */}
                <tr>
                  <td className="p-5 font-medium text-slate-700 bg-[#FAFAFC] align-top">
                    Key Features
                  </td>
                  {comparedProducts.map((p) => (
                    <td
                      key={p.id}
                      className="p-5 border-l border-slate-100 align-top"
                    >
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {p.features.map((feat, idx) => (
                          <li key={idx}>· {feat}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>

                {/* Pros */}
                <tr>
                  <td className="p-5 font-medium text-slate-700 bg-[#FAFAFC] align-top">
                    Pros
                  </td>
                  {comparedProducts.map((p) => (
                    <td
                      key={p.id}
                      className="p-5 border-l border-slate-100 align-top"
                    >
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {p.pros.map((pro, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">+</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>

                {/* Cons */}
                <tr>
                  <td className="p-5 font-medium text-slate-700 bg-[#FAFAFC] align-top">
                    Cons
                  </td>
                  {comparedProducts.map((p) => (
                    <td
                      key={p.id}
                      className="p-5 border-l border-slate-100 align-top"
                    >
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {p.cons.map((con, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-rose-600 font-bold">−</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>

                {/* Verified Offers */}
                <tr>
                  <td className="p-5 font-medium text-slate-700 bg-[#FAFAFC] align-top">
                    Verified Offers
                  </td>
                  {comparedProducts.map((p) => (
                    <td
                      key={p.id}
                      className="p-5 border-l border-slate-100 align-top"
                    >
                      {p.verifiedOffers.length > 0 ? (
                        <div className="space-y-2">
                          {p.verifiedOffers.map((offer, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-1.5 text-xs text-slate-800"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-[#4C1D95] mt-0.5 shrink-0" />
                              <div>
                                <p className="font-medium">{offer.label}</p>
                                <p className="text-slate-400">
                                  {offer.partner} · {offer.verifiedDate}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          No active offer verified
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Intelligent Recommendation System & AI Final Verdict */}
      {comparedProducts.length >= 2 && (
        <section className="space-y-6">
          <div className="bg-[#F5F3FF] border border-violet-200 rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#4C1D95]">
                  Intelligent Recommendation System
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-slate-950">
                  {aiVerdict
                    ? aiVerdict.headline
                    : 'Decision Breakdown & Final Verdict'}
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
                <input
                  type="text"
                  value={priorityInput}
                  onChange={(e) => setPriorityInput(e.target.value)}
                  placeholder="Optional priority (e.g. battery for classes)"
                  className="px-3.5 py-2 text-sm bg-white border border-violet-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4C1D95] min-w-[240px]"
                />
                <button
                  type="button"
                  onClick={handleGenerateVerdict}
                  disabled={aiLoading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#4C1D95] hover:bg-[#3B0764] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[42px]"
                >
                  <Bot className="w-4 h-4" />
                  <span>
                    {aiLoading ? 'Analyzing...' : 'Generate AI Verdict'}
                  </span>
                </button>
              </div>
            </div>

            {aiError && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800"
              >
                {aiError}
              </div>
            )}

            {aiVerdict && (
              <div className="bg-white rounded-xl border border-violet-200/80 p-5 space-y-4">
                <p className="text-sm text-slate-800 leading-relaxed">
                  {aiVerdict.summary}
                </p>
                {aiVerdict.categoryWinners.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                    {aiVerdict.categoryWinners.map((cw, idx) => {
                      const winner = PRODUCTS.find(
                        (p) => p.id === cw.winnerProductId
                      );
                      return (
                        <div key={idx} className="p-3 rounded-lg bg-[#FAFAFC]">
                          <p className="text-xs font-medium text-slate-500">
                            {cw.criterion}
                          </p>
                          <p className="font-display text-sm font-bold text-[#4C1D95] mt-0.5">
                            {winner?.name ?? cw.winnerProductId}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">{cw.note}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Final Recommendation
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-950 leading-relaxed">
                    {aiVerdict.finalVerdict}
                  </p>
                </div>
              </div>
            )}

            {/* 5 Recommendation Roles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {displayRecommendations.map((slot, idx) => {
                const prod = PRODUCTS.find((p) => p.id === slot.productId);
                if (!prod) return null;
                return (
                  <div
                    key={`${slot.role}-${idx}`}
                    className="bg-white rounded-xl border border-violet-200/70 p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4C1D95]">
                        <Award className="w-3.5 h-3.5 shrink-0" />
                        <span>{slot.role}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenDetail(prod)}
                        className="mt-2 text-left font-display text-sm font-bold text-slate-950 hover:text-[#4C1D95] leading-snug block"
                      >
                        {prod.name}
                      </button>
                      <p className="mt-1 font-mono text-xs font-semibold text-slate-700 tabular-nums">
                        {formatINR(prod.price)}
                      </p>
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                        {slot.reason}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
