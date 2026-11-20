import React, { useEffect, useState } from 'react';
import { Scale, X } from 'lucide-react';
import { CategoryName, Product, UserProfile } from './types';
import { PRODUCTS } from './data/products';
import { ActiveTab, Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { ExplorePage } from './components/ExplorePage';
import { ComparePage } from './components/ComparePage';
import { AIAssistantPage } from './components/AIAssistantPage';
import { ProfileAndPlansPage } from './components/ProfileAndPlansPage';
import { ProductDetailModal } from './components/ProductDetailModal';

const STORAGE_KEY_PROFILE = 'skillbridge_user_profile_v1';
const STORAGE_KEY_COMPARE = 'skillbridge_compare_ids_v1';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Sushmita Tanti',
  email: 'sushmitatanti601@gmail.com',
  preferredCategories: ['Laptops', 'Smartphones', 'Beauty & Skincare'],
  maxBudgetInr: 50000,
  priorityFocus: 'Value for Money',
  plan: 'free',
  dailyAiQueriesUsed: 0,
  savedProductIds: [
    'laptop-asus-vivobook-16',
    'phone-redmi-note-13-pro',
    'beauty-minimalist-spf50',
  ],
  comparisonHistory: [
    {
      id: 'hist-mba-laptops',
      title: 'ASUS Vivobook 16 vs Lenovo IdeaPad Slim 3 vs HP 15s',
      productIds: [
        'laptop-asus-vivobook-16',
        'laptop-lenovo-ideapad-slim-3',
        'laptop-hp-15s-i5',
      ],
      createdAt: 'Nov 19, 2026',
    },
    {
      id: 'hist-phones-20k',
      title: 'Redmi Note 13 Pro vs Realme Narzo 70 Pro vs Galaxy M35',
      productIds: [
        'phone-redmi-note-13-pro',
        'phone-realme-narzo-70-pro',
        'phone-samsung-m35',
      ],
      createdAt: 'Nov 18, 2026',
    },
  ],
};

const DEFAULT_COMPARE_IDS = [
  'laptop-asus-vivobook-16',
  'laptop-lenovo-ideapad-slim-3',
  'laptop-hp-15s-i5',
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [exploreQuery, setExploreQuery] = useState('');
  const [exploreCategory, setExploreCategory] = useState<CategoryName | 'All'>(
    'All'
  );
  const [triggerExploreAi, setTriggerExploreAi] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (raw) return JSON.parse(raw) as UserProfile;
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_PROFILE;
  });

  const [compareIds, setCompareIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COMPARE);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) return parsed.slice(0, 4);
      }
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_COMPARE_IDS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch {
      // Ignore storage errors
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMPARE, JSON.stringify(compareIds));
    } catch {
      // Ignore storage errors
    }
  }, [compareIds]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  const handleNavigate = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleCompare = (product: Product) => {
    setCompareIds((prev) => {
      if (prev.includes(product.id)) {
        return prev.filter((id) => id !== product.id);
      }
      if (prev.length >= 4) {
        showToast('Maximum 4 products can be compared side by side.');
        return prev;
      }
      showToast(`Added ${product.name} to Compare.`);
      return [...prev, product.id];
    });
  };

  const handleToggleSave = (productId: string) => {
    setProfile((prev) => {
      const exists = prev.savedProductIds.includes(productId);
      const nextSaved = exists
        ? prev.savedProductIds.filter((id) => id !== productId)
        : [productId, ...prev.savedProductIds];
      return {
        ...prev,
        savedProductIds: nextSaved,
      };
    });
  };

  const handleSaveComparison = (title: string, productIds: string[]) => {
    const newEntry = {
      id: `hist-${Date.now()}`,
      title,
      productIds,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
    setProfile((prev) => ({
      ...prev,
      comparisonHistory: [newEntry, ...prev.comparisonHistory].slice(0, 12),
    }));
  };

  const handleSearchSubmit = (query: string, useAi = true) => {
    setExploreQuery(query);
    setExploreCategory('All');
    setTriggerExploreAi(useAi);
    handleNavigate('explore');
  };

  const handleSelectCategory = (category: CategoryName) => {
    setExploreQuery('');
    setExploreCategory(category);
    setTriggerExploreAi(false);
    handleNavigate('explore');
  };

  const handleGoToAI = (initialPrompt?: string) => {
    if (initialPrompt) setAiInitialPrompt(initialPrompt);
    handleNavigate('ai');
  };

  const handleGoToCompare = (productIds?: string[]) => {
    if (productIds && productIds.length > 0) {
      setCompareIds(productIds.slice(0, 4));
    }
    handleNavigate('compare');
  };

  const comparedProductsPreview = PRODUCTS.filter((p) =>
    compareIds.includes(p.id)
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFC] text-slate-900">
      <Navbar
        activeTab={activeTab}
        onNavigate={handleNavigate}
        compareCount={compareIds.length}
      />

      <main className="flex-1">
        {activeTab === 'home' && (
          <HomePage
            compareIds={compareIds}
            savedIds={profile.savedProductIds}
            recentComparisons={profile.comparisonHistory}
            onSearchSubmit={handleSearchSubmit}
            onSelectCategory={handleSelectCategory}
            onGoToAI={handleGoToAI}
            onGoToCompare={handleGoToCompare}
            onToggleCompare={handleToggleCompare}
            onToggleSave={handleToggleSave}
            onOpenDetail={setDetailProduct}
          />
        )}

        {activeTab === 'explore' && (
          <ExplorePage
            initialQuery={exploreQuery}
            initialCategory={exploreCategory}
            triggerAiOnMount={triggerExploreAi}
            onConsumeAiTrigger={() => setTriggerExploreAi(false)}
            compareIds={compareIds}
            savedIds={profile.savedProductIds}
            onToggleCompare={handleToggleCompare}
            onToggleSave={handleToggleSave}
            onOpenDetail={setDetailProduct}
          />
        )}

        {activeTab === 'compare' && (
          <ComparePage
            compareIds={compareIds}
            onSetCompareIds={(ids) => setCompareIds(ids.slice(0, 4))}
            onSaveComparison={handleSaveComparison}
            onOpenDetail={setDetailProduct}
          />
        )}

        {activeTab === 'ai' && (
          <AIAssistantPage
            initialPrompt={aiInitialPrompt}
            onConsumeInitialPrompt={() => setAiInitialPrompt('')}
            compareIds={compareIds}
            savedIds={profile.savedProductIds}
            onToggleCompare={handleToggleCompare}
            onToggleSave={handleToggleSave}
            onCompareBatch={(ids) => handleGoToCompare(ids)}
            onOpenDetail={setDetailProduct}
            onTrackAiQuery={() =>
              setProfile((prev) => ({
                ...prev,
                dailyAiQueriesUsed: prev.dailyAiQueriesUsed + 1,
              }))
            }
          />
        )}

        {activeTab === 'profile' && (
          <ProfileAndPlansPage
            profile={profile}
            onUpdateProfile={setProfile}
            compareIds={compareIds}
            onToggleCompare={handleToggleCompare}
            onToggleSave={handleToggleSave}
            onOpenDetail={setDetailProduct}
            onOpenComparison={(ids) => handleGoToCompare(ids)}
          />
        )}
      </main>

      {/* Compact Sticky Compare Tray (shown outside Compare view when items selected; stays compact < 15% mobile height) */}
      {activeTab !== 'compare' && comparedProductsPreview.length > 0 && (
        <div className="sticky bottom-3 z-30 max-w-4xl mx-auto px-4 w-full pointer-events-none">
          <div className="pointer-events-auto bg-slate-950 text-white rounded-xl px-4 py-2.5 shadow-lg border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Scale className="w-4 h-4 text-violet-300 shrink-0" />
              <p className="text-xs sm:text-sm font-medium truncate">
                <span className="font-mono tabular-nums text-violet-200 mr-1.5">
                  {comparedProductsPreview.length}/4
                </span>
                {comparedProductsPreview.map((p) => p.name).join(' · ')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleNavigate('compare')}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#3B0764] bg-white hover:bg-violet-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Compare Now
              </button>
              <button
                type="button"
                onClick={() => setCompareIds([])}
                aria-label="Clear compare tray"
                className="p-1.5 text-slate-400 hover:text-white rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-20 right-4 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg border border-slate-700"
        >
          {toastMessage}
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={detailProduct}
        isCompared={
          detailProduct ? compareIds.includes(detailProduct.id) : false
        }
        isSaved={
          detailProduct
            ? profile.savedProductIds.includes(detailProduct.id)
            : false
        }
        onClose={() => setDetailProduct(null)}
        onToggleCompare={handleToggleCompare}
        onToggleSave={handleToggleSave}
      />

      {/* Quiet Editorial Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-display font-bold text-slate-950 text-sm">
              SkillBridge
            </span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>Compare Smart. Choose Better.</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => handleNavigate('explore')}
              className="hover:text-slate-950"
            >
              Smart Search
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('compare')}
              className="hover:text-slate-950"
            >
              Compare Matrix
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('ai')}
              className="hover:text-slate-950"
            >
              SkillBridge AI
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('profile')}
              className="hover:text-slate-950"
            >
              Plans & Profile
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
