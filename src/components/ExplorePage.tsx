import React, { useEffect, useMemo, useState } from 'react';
import { Bot, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { AISearchResponse, CategoryName, Product, SortOption } from '../types';
import {
  CATEGORIES,
  EXAMPLE_SEARCHES,
  PRODUCTS,
  formatINR,
} from '../data/products';
import { ProductCard } from './ProductCard';

interface ExplorePageProps {
  initialQuery: string;
  initialCategory: CategoryName | 'All';
  triggerAiOnMount: boolean;
  onConsumeAiTrigger: () => void;
  compareIds: string[];
  savedIds: string[];
  onToggleCompare: (product: Product) => void;
  onToggleSave: (productId: string) => void;
  onOpenDetail: (product: Product) => void;
}

const PRICE_PRESETS = [
  { label: 'All Budgets', max: null },
  { label: 'Under ₹500', max: 500 },
  { label: 'Under ₹5,000', max: 5000 },
  { label: 'Under ₹20,000', max: 20000 },
  { label: 'Under ₹50,000', max: 50000 },
];

export const ExplorePage: React.FC<ExplorePageProps> = ({
  initialQuery,
  initialCategory,
  triggerAiOnMount,
  onConsumeAiTrigger,
  compareIds,
  savedIds,
  onToggleCompare,
  onToggleSave,
  onOpenDetail,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<CategoryName | 'All'>(
    initialCategory
  );
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AISearchResponse | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setSelectedCategory(initialCategory);
    setSelectedBrand('All');
  }, [initialCategory]);

  const runAiSearch = async (searchText: string) => {
    const trimmed = searchText.trim();
    if (!trimmed) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Smart search failed.');
      }
      setAiResult(data as AISearchResponse);
      if (data.suggestedCategory && data.suggestedCategory !== 'All') {
        setSelectedCategory(data.suggestedCategory as CategoryName);
      } else {
        setSelectedCategory('All');
      }
      if (typeof data.maxBudgetInr === 'number') {
        setMaxPrice(data.maxBudgetInr);
      } else {
        setMaxPrice(null);
      }
      setSelectedBrand('All');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to reach AI search.');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (triggerAiOnMount && initialQuery.trim()) {
      onConsumeAiTrigger();
      void runAiSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerAiOnMount, initialQuery]);

  const availableBrands = useMemo(() => {
    const base =
      selectedCategory === 'All'
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === selectedCategory);
    return Array.from(new Set(base.map((p) => p.brand))).sort();
  }, [selectedCategory]);

  const filteredProducts = useMemo(() => {
    let list = [...PRODUCTS];

    if (aiResult && aiResult.matchedProductIds.length > 0) {
      const orderMap = new Map(
        aiResult.matchedProductIds.map((id, idx) => [id, idx])
      );
      list = list.filter((p) => orderMap.has(p.id));
      if (selectedCategory !== 'All') {
        list = list.filter((p) => p.category === selectedCategory);
      }
      if (maxPrice !== null) {
        list = list.filter((p) => p.price <= maxPrice);
      }
      if (selectedBrand !== 'All') {
        list = list.filter((p) => p.brand === selectedBrand);
      }
      if (sortBy === 'recommended') {
        list.sort(
          (a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99)
        );
        return list;
      }
    } else {
      if (selectedCategory !== 'All') {
        list = list.filter((p) => p.category === selectedCategory);
      }
      if (maxPrice !== null) {
        list = list.filter((p) => p.price <= maxPrice);
      }
      if (selectedBrand !== 'All') {
        list = list.filter((p) => p.brand === selectedBrand);
      }
      if (query.trim()) {
        const terms = query
          .toLowerCase()
          .replace(/₹|,/g, '')
          .split(/\s+/)
          .filter((t) => t.length > 1 && !['best', 'for', 'under'].includes(t));

        if (terms.length > 0) {
          list = list.filter((p) => {
            const haystack = [
              p.name,
              p.brand,
              p.category,
              p.tagline,
              p.bestFor,
              ...Object.values(p.specs),
              ...p.features,
            ]
              .join(' ')
              .toLowerCase();
            return terms.some((t) => haystack.includes(t));
          });
        }
      }
    }

    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating-desc') list.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'value-desc')
      list.sort((a, b) => b.valueScore - a.valueScore);
    else list.sort((a, b) => b.valueScore - a.valueScore);

    return list;
  }, [aiResult, maxPrice, query, selectedBrand, selectedCategory, sortBy]);

  const handleReset = () => {
    setQuery('');
    setSelectedCategory('All');
    setMaxPrice(null);
    setSelectedBrand('All');
    setSortBy('recommended');
    setAiResult(null);
    setAiError(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header + Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-950">
              Smart Product Search
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Search by product name, budget, or natural-language requirement.
            </p>
          </div>
          {(query ||
            selectedCategory !== 'All' ||
            maxPrice !== null ||
            selectedBrand !== 'All' ||
            aiResult) && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4C1D95] hover:underline self-start md:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset all filters</span>
            </button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runAiSearch(query);
          }}
          className="flex flex-col sm:flex-row gap-2.5 p-1.5 bg-white rounded-xl border border-slate-200 shadow-xs focus-within:border-[#4C1D95] focus-within:ring-2 focus-within:ring-violet-200"
        >
          <div className="flex-1 flex items-center gap-2.5 px-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (aiResult) setAiResult(null);
              }}
              placeholder="What are you looking for today? (e.g., Best laptop for MBA students under ₹50,000)"
              aria-label="Search products"
              className="w-full py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={aiLoading || !query.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#4C1D95] hover:bg-[#3B0764] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[42px]"
          >
            <Bot className="w-4 h-4" />
            <span>{aiLoading ? 'Analyzing...' : 'AI Smart Search'}</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
          <span>Quick searches:</span>
          {EXAMPLE_SEARCHES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setQuery(example);
                void runAiSearch(example);
              }}
              className="text-[#4C1D95] hover:underline"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* AI Interpretation Banner or Error */}
      {aiError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800 flex items-center justify-between gap-4"
        >
          <span>{aiError}</span>
          <button
            type="button"
            onClick={() => setAiError(null)}
            className="text-xs font-semibold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {aiResult && (
        <div className="p-5 rounded-xl bg-[#F5F3FF] border border-violet-200/80 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4C1D95] font-medium">
            <span>
              AI Search Intent: {aiResult.interpretedIntent}
              {aiResult.maxBudgetInr
                ? ` · Budget ceiling ${formatINR(aiResult.maxBudgetInr)}`
                : ''}
            </span>
            <button
              type="button"
              onClick={() => setAiResult(null)}
              className="underline hover:text-[#3B0764]"
            >
              Switch to manual filter
            </button>
          </div>
          <p className="text-sm text-slate-800 leading-relaxed">
            {aiResult.explanation}
          </p>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSelectedBrand('All');
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === 'All'
                ? 'bg-[#4C1D95] text-white'
                : 'bg-[#F5F3FF] text-slate-700 hover:text-[#4C1D95]'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.name);
                setSelectedBrand('All');
              }}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat.name
                  ? 'bg-[#4C1D95] text-white'
                  : 'bg-[#F5F3FF] text-slate-700 hover:text-[#4C1D95]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Budget, Brand, Sort Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Budget:
            </span>
            {PRICE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setMaxPrice(preset.max)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  maxPrice === preset.max
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <span>Brand</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#4C1D95]"
              >
                <option value="All">All Brands</option>
                {availableBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-600">
              <span>Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#4C1D95]"
              >
                <option value="recommended">Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating-desc">Customer Rating</option>
                <option value="value-desc">Best Value Score</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="tabular-nums">
          Showing {filteredProducts.length} product
          {filteredProducts.length === 1 ? '' : 's'}
          {maxPrice !== null ? ` under ${formatINR(maxPrice)}` : ''}
        </span>
      </div>

      {/* Grid or Empty State */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isCompared={compareIds.includes(product.id)}
              isSaved={savedIds.includes(product.id)}
              onToggleCompare={onToggleCompare}
              onToggleSave={onToggleSave}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <p className="font-display text-lg font-semibold text-slate-900">
            No products matched those exact filters
          </p>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Try widening your budget ceiling or clearing the brand filter to
            view comparable alternatives.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-2 px-4 py-2 text-sm font-semibold text-white bg-[#4C1D95] hover:bg-[#3B0764] rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
