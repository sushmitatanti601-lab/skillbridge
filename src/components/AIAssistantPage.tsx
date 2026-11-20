import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Award,
  Bookmark,
  Bot,
  Check,
  Plus,
  Scale,
  Send,
} from 'lucide-react';
import { AIAdvisorResponse, Product } from '../types';
import { PRODUCTS, formatINR } from '../data/products';

interface AIAssistantPageProps {
  initialPrompt: string;
  onConsumeInitialPrompt: () => void;
  compareIds: string[];
  savedIds: string[];
  onToggleCompare: (product: Product) => void;
  onToggleSave: (productId: string) => void;
  onCompareBatch: (productIds: string[]) => void;
  onOpenDetail: (product: Product) => void;
  onTrackAiQuery: () => void;
}

const SCENARIO_PRESETS = [
  {
    label: 'MBA Laptop under ₹50,000',
    productNeed: 'Laptop',
    budget: 'Under ₹50,000',
    mustHaveFeatures: '16GB RAM, crisp display, reliable battery, Excel speed',
    primaryUseCase: 'MBA studies, spreadsheets, case presentations, and travel',
    freeformQuery: 'I need a laptop under ₹50,000 for my MBA studies.',
  },
  {
    label: 'Smartphone under ₹20,000',
    productNeed: '5G Smartphone',
    budget: 'Under ₹20,000',
    mustHaveFeatures: 'Good OIS camera, AMOLED screen, all-day battery',
    primaryUseCase: 'College classes, photography, and smooth daily multitasking',
    freeformQuery: 'Recommend the best smartphone under ₹20,000 for daily college use.',
  },
  {
    label: 'Daily Sunscreen under ₹500',
    productNeed: 'Sunscreen',
    budget: 'Under ₹500',
    mustHaveFeatures: 'SPF 50 PA++++, zero white cast, lightweight non-greasy finish',
    primaryUseCase: 'Humid daily commute and outdoor classes',
    freeformQuery: 'Best sunscreen for under ₹500 with no white cast.',
  },
  {
    label: 'Wireless Headphones for Daily Use',
    productNeed: 'Wireless Headphones',
    budget: 'Under ₹10,000',
    mustHaveFeatures: 'Active Noise Cancellation, long battery life, comfortable fit',
    primaryUseCase: 'Hostel studying, library focus, and daily metro commute',
    freeformQuery: 'Best wireless ANC headphones for daily study and commute.',
  },
];

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  initialPrompt,
  onConsumeInitialPrompt,
  compareIds,
  savedIds,
  onToggleCompare,
  onToggleSave,
  onCompareBatch,
  onOpenDetail,
  onTrackAiQuery,
}) => {
  const [productNeed, setProductNeed] = useState('Laptop');
  const [budget, setBudget] = useState('Under ₹50,000');
  const [mustHaveFeatures, setMustHaveFeatures] = useState(
    '16GB RAM, good battery life, sharp display'
  );
  const [primaryUseCase, setPrimaryUseCase] = useState(
    'MBA studies, Excel, presentations, and everyday classes'
  );
  const [freeformQuery, setFreeformQuery] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AIAdvisorResponse | null>(null);

  const submitRecommendation = async (payload: {
    productNeed: string;
    budget: string;
    mustHaveFeatures: string;
    primaryUseCase: string;
    freeformQuery: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'SkillBridge AI request failed.');
      }
      setResponse(data as AIAdvisorResponse);
      onTrackAiQuery();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to SkillBridge AI.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPrompt.trim()) {
      const prompt = initialPrompt.trim();
      setFreeformQuery(prompt);
      onConsumeInitialPrompt();
      void submitRecommendation({
        productNeed: '',
        budget: '',
        mustHaveFeatures: '',
        primaryUseCase: '',
        freeformQuery: prompt,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  const handleGuidedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitRecommendation({
      productNeed,
      budget,
      mustHaveFeatures,
      primaryUseCase,
      freeformQuery,
    });
  };

  const applyPreset = (preset: (typeof SCENARIO_PRESETS)[number]) => {
    setProductNeed(preset.productNeed);
    setBudget(preset.budget);
    setMustHaveFeatures(preset.mustHaveFeatures);
    setPrimaryUseCase(preset.primaryUseCase);
    setFreeformQuery(preset.freeformQuery);
    void submitRecommendation(preset);
  };

  const recommendedIds =
    response?.recommendations
      .map((r) => r.productId)
      .filter((id, idx, arr) => arr.indexOf(id) === idx)
      .slice(0, 4) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="max-w-3xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#4C1D95]">
          Interactive Shopping Advisor
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-950 text-balance">
          SkillBridge AI
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Answer four quick questions—or type what you need directly—and get
          transparent recommendations explaining why each pick fits your budget
          and daily workflow.
        </p>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 mr-1">
          Try a scenario:
        </span>
        {SCENARIO_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#F5F3FF] text-[#4C1D95] hover:bg-[#EDE9FE] transition-colors whitespace-nowrap shrink-0"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Guided 4-Question Form */}
        <form
          onSubmit={handleGuidedSubmit}
          className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#4C1D95] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-slate-950">
                Tell SkillBridge AI what you need
              </h2>
              <p className="text-xs text-slate-500">
                Personalized to your requirements, not price alone
              </p>
            </div>
          </div>

          {/* Question 1 */}
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-800">
              1. What product are you looking for?
            </span>
            <input
              type="text"
              value={productNeed}
              onChange={(e) => setProductNeed(e.target.value)}
              placeholder="e.g., Laptop, 5G Smartphone, Sunscreen, Headphones"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-[#4C1D95]"
            />
          </label>

          {/* Question 2 */}
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-800">
              2. What is your budget?
            </span>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g., Under ₹50,000 or Around ₹20,000"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-[#4C1D95]"
            />
          </label>

          {/* Question 3 */}
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-800">
              3. What features matter most to you?
            </span>
            <input
              type="text"
              value={mustHaveFeatures}
              onChange={(e) => setMustHaveFeatures(e.target.value)}
              placeholder="e.g., Battery life, 16GB RAM, OIS camera, lightweight"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-[#4C1D95]"
            />
          </label>

          {/* Question 4 */}
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-800">
              4. What will you use the product for?
            </span>
            <input
              type="text"
              value={primaryUseCase}
              onChange={(e) => setPrimaryUseCase(e.target.value)}
              placeholder="e.g., MBA studies, daily commute, hostel studying"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-[#4C1D95]"
            />
          </label>

          {/* Optional direct prompt */}
          <label className="block space-y-1.5 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-800">
              Anything else? (Optional direct question)
            </span>
            <textarea
              rows={2}
              value={freeformQuery}
              onChange={(e) => setFreeformQuery(e.target.value)}
              placeholder='e.g., "I need a laptop under ₹50,000 for my MBA studies."'
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-[#4C1D95] resize-none"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#4C1D95] hover:bg-[#3B0764] disabled:opacity-50 rounded-lg transition-colors min-h-[44px]"
          >
            <Send className="w-4 h-4" />
            <span>
              {loading ? 'Finding Best Matches...' : 'Get AI Recommendations'}
            </span>
          </button>
        </form>

        {/* Right: AI Output & Ranked Recommendations */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800"
            >
              {error}
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
              <div className="h-5 w-48 bg-violet-100 rounded animate-pulse" />
              <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="h-36 bg-[#F5F3FF] rounded-xl animate-pulse" />
                <div className="h-36 bg-[#F5F3FF] rounded-xl animate-pulse" />
              </div>
            </div>
          )}

          {!loading && !response && !error && (
            <div className="bg-[#F5F3FF] rounded-2xl border border-violet-200/80 p-8 sm:p-10 space-y-5">
              <h2 className="font-display text-xl font-bold text-slate-950">
                How SkillBridge AI evaluates products
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700">
                <div className="bg-white rounded-xl p-4 border border-violet-100">
                  <p className="font-semibold text-[#4C1D95]">
                    Use-Case Fit First
                  </p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Instead of sorting only by lowest price, we match RAM,
                    battery, finish, or comfort to your daily workflow.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-violet-100">
                  <p className="font-semibold text-[#4C1D95]">
                    Transparent Trade-Offs
                  </p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Every recommendation explains why it was chosen and lets you
                    compare top picks side by side in one click.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => applyPreset(SCENARIO_PRESETS[0])}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#4C1D95] hover:underline"
              >
                <span>Run example: MBA laptop under ₹50,000</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {!loading && response && (
            <div className="space-y-6">
              {/* Advisor Summary */}
              <div className="bg-[#F5F3FF] border border-violet-200 rounded-2xl p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-[#4C1D95]">
                    {response.parsedCriteria.category}
                    {response.parsedCriteria.maxBudgetInr
                      ? ` · Budget ${formatINR(response.parsedCriteria.maxBudgetInr)}`
                      : ''}
                  </div>
                  {recommendedIds.length >= 2 && (
                    <button
                      type="button"
                      onClick={() => onCompareBatch(recommendedIds)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#4C1D95] hover:bg-[#3B0764] rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Compare Top {recommendedIds.length} Picks</span>
                    </button>
                  )}
                </div>

                <p className="text-sm sm:text-base text-slate-900 leading-relaxed">
                  {response.advisorSummary}
                </p>

                {response.parsedCriteria.priorities.length > 0 && (
                  <p className="text-xs text-slate-600">
                    Priorities weighted:{' '}
                    {response.parsedCriteria.priorities.join(' · ')}
                  </p>
                )}
              </div>

              {/* Ranked Recommendation Cards */}
              <div className="space-y-4">
                {response.recommendations.map((rec, idx) => {
                  const product = PRODUCTS.find((p) => p.id === rec.productId);
                  if (!product) return null;
                  const isCompared = compareIds.includes(product.id);
                  const isSaved = savedIds.includes(product.id);

                  return (
                    <article
                      key={`${rec.role}-${product.id}-${idx}`}
                      className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row gap-5 items-start"
                    >
                      <button
                        type="button"
                        onClick={() => onOpenDetail(product)}
                        className="w-full sm:w-44 aspect-[4/3] rounded-xl overflow-hidden bg-[#F5F3FF] shrink-0"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>

                      <div className="flex-1 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4C1D95]">
                            <Award className="w-3.5 h-3.5" />
                            <span>{rec.role}</span>
                          </span>
                          <span className="font-mono text-base font-bold text-slate-950 tabular-nums">
                            {formatINR(product.price)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenDetail(product)}
                          className="text-left font-display text-lg font-bold text-slate-950 hover:text-[#4C1D95] block"
                        >
                          {product.name}
                        </button>

                        <p className="text-xs text-slate-500">
                          {product.brand} · Rating {product.rating.toFixed(1)}/5 ·
                          Value {product.valueScore}/100
                        </p>

                        <p className="text-sm text-slate-700 leading-relaxed">
                          <span className="font-semibold text-slate-900">
                            Why it fits:{' '}
                          </span>
                          {rec.reason}
                        </p>

                        <div className="pt-2 flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => onToggleCompare(product)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                              isCompared
                                ? 'bg-[#4C1D95] text-white'
                                : 'bg-[#F5F3FF] text-[#4C1D95] hover:bg-[#EDE9FE]'
                            }`}
                          >
                            {isCompared ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>In Compare</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add to Compare</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleSave(product.id)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                              isSaved
                                ? 'border-violet-300 bg-[#F5F3FF] text-[#4C1D95]'
                                : 'border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 ${
                                isSaved ? 'fill-[#4C1D95]' : ''
                              }`}
                            />
                            <span>{isSaved ? 'Saved' : 'Save'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenDetail(product)}
                            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-950"
                          >
                            Full Specs
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
