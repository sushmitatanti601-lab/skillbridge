import React, { useState } from 'react';
import { ArrowRight, Bot, Scale, Search } from 'lucide-react';
import { CategoryName, ComparisonHistoryEntry, Product } from '../types';
import {
  CATEGORIES,
  EXAMPLE_SEARCHES,
  HERO_IMAGE,
  PRODUCTS,
  formatINR,
} from '../data/products';
import { ProductCard } from './ProductCard';

interface HomePageProps {
  compareIds: string[];
  savedIds: string[];
  recentComparisons: ComparisonHistoryEntry[];
  onSearchSubmit: (query: string, useAi?: boolean) => void;
  onSelectCategory: (category: CategoryName) => void;
  onGoToAI: (initialPrompt?: string) => void;
  onGoToCompare: (productIds?: string[]) => void;
  onToggleCompare: (product: Product) => void;
  onToggleSave: (productId: string) => void;
  onOpenDetail: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  compareIds,
  savedIds,
  recentComparisons,
  onSearchSubmit,
  onSelectCategory,
  onGoToAI,
  onGoToCompare,
  onToggleCompare,
  onToggleSave,
  onOpenDetail,
}) => {
  const [heroQuery, setHeroQuery] = useState('');
  const [showcaseTab, setShowcaseTab] = useState<'trending' | 'deals' | 'recent'>(
    'trending'
  );

  const trendingProducts = PRODUCTS.filter((p) => p.isTrending).slice(0, 6);
  const dealProducts = PRODUCTS.filter((p) => p.isBestDeal)
    .sort((a, b) => b.valueScore - a.valueScore)
    .slice(0, 6);

  const recentlyComparedProducts = (() => {
    const ids = new Set<string>();
    recentComparisons.forEach((entry) =>
      entry.productIds.forEach((id) => ids.add(id))
    );
    const list = PRODUCTS.filter((p) => ids.has(p.id));
    return list.length > 0 ? list.slice(0, 6) : PRODUCTS.slice(0, 3);
  })();

  const displayedProducts =
    showcaseTab === 'trending'
      ? trendingProducts
      : showcaseTab === 'deals'
        ? dealProducts
        : recentlyComparedProducts;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroQuery.trim()) return;
    onSearchSubmit(heroQuery.trim(), true);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Section 1: Storefront Hero */}
      <section className="bg-gradient-to-b from-[#F5F3FF] via-[#FAF8FF] to-[#FAFAFC] border-b border-violet-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left Copy & Search Focal Anchor */}
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#4C1D95]">
                  SkillBridge · Smart Shopping & Comparison
                </p>
                <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-950 leading-[1.1] text-balance">
                  Compare Smart. Choose Better.
                </h1>
                <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                  Built for college students, young professionals, and thoughtful
                  shoppers. Compare real specs, verified offers, and customer
                  trade-offs side by side—guided by SkillBridge AI.
                </p>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5 p-1.5 bg-white rounded-xl border border-violet-200 shadow-sm focus-within:border-[#4C1D95] focus-within:ring-2 focus-within:ring-violet-200 transition-all">
                  <div className="flex-1 flex items-center gap-2.5 px-3">
                    <Search
                      className="w-4 h-4 text-slate-400 shrink-0"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={heroQuery}
                      onChange={(e) => setHeroQuery(e.target.value)}
                      placeholder="What are you looking for today?"
                      aria-label="What are you looking for today?"
                      className="w-full py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#4C1D95] hover:bg-[#3B0764] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[42px]"
                  >
                    Smart Search
                  </button>
                </div>

                {/* Quick Example Search Links */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                  <span className="font-medium text-slate-500">Try:</span>
                  {EXAMPLE_SEARCHES.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => onSearchSubmit(example, true)}
                      className="text-left text-[#4C1D95] hover:underline underline-offset-2 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </form>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onGoToAI()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#4C1D95] hover:bg-[#3B0764] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
                >
                  <Bot className="w-4 h-4" aria-hidden="true" />
                  <span>Ask SkillBridge AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => onGoToCompare()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
                >
                  <Scale className="w-4 h-4 text-[#4C1D95]" aria-hidden="true" />
                  <span>Compare Side-by-Side</span>
                </button>
              </div>
            </div>

            {/* Right Column Hero Visual (16:9 aligned stretch) */}
            <div className="lg:col-span-6 flex">
              <div className="relative w-full min-h-[280px] sm:min-h-[340px] rounded-2xl overflow-hidden border border-violet-200/70 bg-[#EDE9FE]">
                <img
                  src={HERO_IMAGE}
                  alt="Curated laptop, smartphone, and wireless headphones on a lavender travertine desk"
                  referrerPolicy="no-referrer"
                  className="w-full h-full lg:h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-6 text-white">
                  <p className="text-xs uppercase tracking-wider text-violet-200 font-medium">
                    Popular Comparison · MBA Laptops
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-4">
                    <p className="font-display text-base sm:text-lg font-semibold">
                      ASUS Vivobook 16 vs Lenovo IdeaPad Slim 3
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        onGoToCompare([
                          'laptop-asus-vivobook-16',
                          'laptop-lenovo-ideapad-slim-3',
                          'laptop-hp-15s-i5',
                        ])
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-white hover:text-violet-200 whitespace-nowrap shrink-0"
                    >
                      <span>View matrix</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-950">
              Popular Categories
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Jump directly into verified specs and honest pros & cons.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelectCategory(cat.name)}
              className="group text-left bg-white rounded-xl border border-slate-200/90 hover:border-violet-300 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-700"
            >
              <div className="aspect-[4/3] bg-[#F5F3FF] overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-3.5">
                <h3 className="font-display text-sm font-semibold text-slate-950 group-hover:text-[#4C1D95] transition-colors">
                  {cat.name}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                  {cat.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Section 3: Curated Collection (Trending / Budget Deals / Recently Compared) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-950">
              Curated Picks & Best Value
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Ranked by performance per rupee, verified offers, and real ratings.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Curated collections"
            className="inline-flex items-center gap-1 p-1 bg-[#F5F3FF] rounded-lg border border-violet-100 self-start"
          >
            {[
              { id: 'trending' as const, label: 'Trending' },
              { id: 'deals' as const, label: 'Best Budget Deals' },
              { id: 'recent' as const, label: 'Recently Compared' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={showcaseTab === tab.id}
                onClick={() => setShowcaseTab(tab.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  showcaseTab === tab.id
                    ? 'bg-white text-[#4C1D95] shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProducts.map((product) => (
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
      </section>

      {/* Section 4: AI Assistant & Recent Comparison Bridge */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#3B0764] text-white rounded-2xl p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-3">
            <p className="text-xs uppercase tracking-widest text-violet-200 font-medium">
              SkillBridge AI Advisor
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-balance">
              Not sure which specs actually matter for your daily routine?
            </h2>
            <p className="text-sm sm:text-base text-violet-100 leading-relaxed max-w-2xl">
              Tell SkillBridge AI your budget, must-have features, and use case—like
              an MBA laptop under {formatINR(50000)} or a daily sunscreen under{' '}
              {formatINR(500)}—and get transparent, side-by-side reasoning in
              seconds.
            </p>
          </div>
          <div className="lg:col-span-5 flex flex-wrap lg:justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                onGoToAI('I need a laptop under ₹50,000 for my MBA studies.')
              }
              className="px-5 py-3 text-sm font-semibold text-[#3B0764] bg-white hover:bg-violet-50 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
            >
              Try MBA Laptop Prompt
            </button>
            <button
              type="button"
              onClick={() => onGoToAI()}
              className="px-5 py-3 text-sm font-semibold text-white border border-violet-300/40 hover:bg-white/10 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
            >
              Open SkillBridge AI
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
