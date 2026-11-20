import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  History,
  Scale,
  User as UserIcon,
} from 'lucide-react';
import { CategoryName, Product, UserProfile } from '../types';
import { CATEGORIES, PRODUCTS, formatINR } from '../data/products';
import { ProductCard } from './ProductCard';

interface ProfileAndPlansPageProps {
  profile: UserProfile;
  onUpdateProfile: (next: UserProfile) => void;
  compareIds: string[];
  onToggleCompare: (product: Product) => void;
  onToggleSave: (productId: string) => void;
  onOpenDetail: (product: Product) => void;
  onOpenComparison: (productIds: string[]) => void;
}

export const ProfileAndPlansPage: React.FC<ProfileAndPlansPageProps> = ({
  profile,
  onUpdateProfile,
  compareIds,
  onToggleCompare,
  onToggleSave,
  onOpenDetail,
  onOpenComparison,
}) => {
  const [nameInput, setNameInput] = useState(profile.name);
  const [emailInput, setEmailInput] = useState(profile.email);
  const [budgetInput, setBudgetInput] = useState(profile.maxBudgetInr);
  const [savedNotice, setSavedNotice] = useState(false);

  const savedProducts = useMemo(
    () => PRODUCTS.filter((p) => profile.savedProductIds.includes(p.id)),
    [profile.savedProductIds]
  );

  const personalizedPicks = useMemo(() => {
    const preferred = PRODUCTS.filter(
      (p) =>
        (profile.preferredCategories.length === 0 ||
          profile.preferredCategories.includes(p.category)) &&
        p.price <= profile.maxBudgetInr
    );

    const sorted = [...preferred].sort((a, b) => {
      if (profile.priorityFocus === 'Lowest Price') return a.price - b.price;
      if (profile.priorityFocus === 'Top Specifications')
        return b.rating - a.rating;
      return b.valueScore - a.valueScore;
    });

    if (sorted.length > 0) return sorted.slice(0, 3);
    return PRODUCTS.filter((p) => p.price <= profile.maxBudgetInr).slice(0, 3);
  }, [
    profile.maxBudgetInr,
    profile.preferredCategories,
    profile.priorityFocus,
  ]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      name: nameInput.trim() || 'Student Shopper',
      email: emailInput.trim() || profile.email,
      maxBudgetInr: Number(budgetInput) || 50000,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const toggleCategory = (cat: CategoryName) => {
    const exists = profile.preferredCategories.includes(cat);
    const nextCats = exists
      ? profile.preferredCategories.filter((c) => c !== cat)
      : [...profile.preferredCategories, cat];
    onUpdateProfile({
      ...profile,
      preferredCategories: nextCats,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#4C1D95] text-white flex items-center justify-center shrink-0">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950">
              {profile.name}
            </h1>
            <p className="text-sm text-slate-600">
              {profile.email} ·{' '}
              <span className="font-medium text-[#4C1D95]">
                {profile.plan === 'plus' ? 'SkillBridge Plus' : 'Free Plan'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Preferences & Budget Form */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <form
          onSubmit={handleSaveSettings}
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-6"
        >
          <h2 className="font-display text-lg font-bold text-slate-950">
            Account & Shopping Preferences
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">
                Full Name
              </span>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4C1D95]"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">
                Email Address
              </span>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#4C1D95]"
              />
            </label>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 block">
              Preferred Product Categories
            </span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const active = profile.preferredCategories.includes(cat.name);
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => toggleCategory(cat.name)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#4C1D95] text-white'
                        : 'bg-[#F5F3FF] text-slate-700 hover:text-[#4C1D95]'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">
                Typical Max Budget ({formatINR(budgetInput)})
              </span>
              <input
                type="range"
                min={500}
                max={85000}
                step={500}
                value={budgetInput}
                onChange={(e) => setBudgetInput(Number(e.target.value))}
                className="w-full accent-[#4C1D95]"
              />
            </label>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 block">
                Decision Priority
              </span>
              <select
                value={profile.priorityFocus}
                onChange={(e) =>
                  onUpdateProfile({
                    ...profile,
                    priorityFocus: e.target
                      .value as UserProfile['priorityFocus'],
                  })
                }
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4C1D95]"
              >
                <option value="Value for Money">Value for Money</option>
                <option value="Lowest Price">Lowest Price</option>
                <option value="Top Specifications">Top Specifications</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#4C1D95] hover:bg-[#3B0764] rounded-lg transition-colors min-h-[42px]"
            >
              {savedNotice ? 'Preferences Saved' : 'Save Preferences'}
            </button>
          </div>
        </form>

        {/* Comparison History */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-950 flex items-center gap-2">
              <History className="w-4 h-4 text-[#4C1D95]" />
              <span>Comparison History</span>
            </h2>
            <span className="text-xs text-slate-500 tabular-nums">
              {profile.comparisonHistory.length} saved
            </span>
          </div>

          {profile.comparisonHistory.length === 0 ? (
            <p className="text-sm text-slate-500 py-6">
              Your saved side-by-side comparisons will appear here.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {profile.comparisonHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {entry.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {entry.productIds.length} products · {entry.createdAt}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenComparison(entry.productIds)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#4C1D95] bg-[#F5F3FF] hover:bg-[#EDE9FE] rounded-lg whitespace-nowrap shrink-0"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Personalized Recommendations */}
      <section className="space-y-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-950">
            Personalized Recommendations
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Matched to your {profile.priorityFocus.toLowerCase()} focus under{' '}
            {formatINR(profile.maxBudgetInr)}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personalizedPicks.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isCompared={compareIds.includes(product.id)}
              isSaved={profile.savedProductIds.includes(product.id)}
              onToggleCompare={onToggleCompare}
              onToggleSave={onToggleSave}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      </section>

      {/* Saved Products */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-950">
              Saved Products
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Shortlisted products ready to move into your comparison matrix.
            </p>
          </div>
          {savedProducts.length >= 2 && (
            <button
              type="button"
              onClick={() =>
                onOpenComparison(savedProducts.slice(0, 4).map((p) => p.id))
              }
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4C1D95] hover:underline"
            >
              <span>Compare saved items</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {savedProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-600">
            No saved products yet. Click the bookmark icon on any product card
            to shortlist it here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isCompared={compareIds.includes(product.id)}
                isSaved={true}
                onToggleCompare={onToggleCompare}
                onToggleSave={onToggleSave}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        )}
      </section>

      {/* Freemium and Premium Model */}
      <section className="space-y-6 pt-4 border-t border-slate-200">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#4C1D95]">
            Membership Plans
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-slate-950">
            Free & SkillBridge Plus
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Core comparison tools are always free. Upgrade for deeper AI
            analysis, price-drop alerts, and unlimited saved history.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <div
            className={`rounded-2xl p-6 sm:p-8 border transition-colors ${
              profile.plan === 'free'
                ? 'bg-white border-[#4C1D95] ring-1 ring-[#4C1D95]'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-950">
                  Free Plan
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Essential everyday shopping & comparison
                </p>
              </div>
              <p className="font-mono text-2xl font-bold text-slate-950 tabular-nums">
                ₹0
                <span className="text-xs font-sans font-normal text-slate-500">
                  /month
                </span>
              </p>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              {[
                'Basic product search and category/budget filters',
                'Side-by-side comparison of 2–4 products',
                'Up to 10 SkillBridge AI recommendations per day',
                'Save favorite products & recent comparisons',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#4C1D95] mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => onUpdateProfile({ ...profile, plan: 'free' })}
              disabled={profile.plan === 'free'}
              className="mt-6 w-full py-2.5 px-4 text-sm font-semibold rounded-lg border border-slate-200 text-slate-800 hover:bg-slate-50 disabled:bg-[#F5F3FF] disabled:text-[#4C1D95] disabled:border-violet-200 transition-colors"
            >
              {profile.plan === 'free' ? 'Current Active Plan' : 'Switch to Free'}
            </button>
          </div>

          {/* SkillBridge Plus */}
          <div
            className={`rounded-2xl p-6 sm:p-8 border transition-colors ${
              profile.plan === 'plus'
                ? 'bg-[#3B0764] text-white border-[#3B0764]'
                : 'bg-[#F5F3FF] text-slate-950 border-violet-200'
            }`}
          >
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold">
                  SkillBridge Plus
                </h3>
                <p
                  className={`text-xs mt-1 ${
                    profile.plan === 'plus'
                      ? 'text-violet-200'
                      : 'text-slate-600'
                  }`}
                >
                  Student & Pro annual discount available (₹1,499/yr)
                </p>
              </div>
              <p className="font-mono text-2xl font-bold tabular-nums">
                ₹199
                <span
                  className={`text-xs font-sans font-normal ${
                    profile.plan === 'plus'
                      ? 'text-violet-200'
                      : 'text-slate-600'
                  }`}
                >
                  /month
                </span>
              </p>
            </div>

            <ul className="mt-6 space-y-3 text-sm">
              {[
                'Unlimited SkillBridge AI deep-dive verdicts & smart searches',
                'Verified bank & student offer alerts when prices drop',
                'Unlimited saved products and full comparison archive',
                'Priority specification matrix breakdowns across categories',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      profile.plan === 'plus'
                        ? 'text-violet-200'
                        : 'text-[#4C1D95]'
                    }`}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => onUpdateProfile({ ...profile, plan: 'plus' })}
              disabled={profile.plan === 'plus'}
              className={`mt-6 w-full py-2.5 px-4 text-sm font-semibold rounded-lg transition-colors ${
                profile.plan === 'plus'
                  ? 'bg-white text-[#3B0764]'
                  : 'bg-[#4C1D95] text-white hover:bg-[#3B0764]'
              }`}
            >
              {profile.plan === 'plus'
                ? 'Active: SkillBridge Plus'
                : 'Upgrade to SkillBridge Plus'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
