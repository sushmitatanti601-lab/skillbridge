export type CategoryName =
  | 'Smartphones'
  | 'Laptops'
  | 'Fashion'
  | 'Beauty & Skincare'
  | 'Electronics'
  | 'Home Appliances';

export type SortOption =
  | 'recommended'
  | 'price-asc'
  | 'price-desc'
  | 'rating-desc'
  | 'value-desc';

export interface VerifiedOffer {
  label: string;
  partner: string;
  verifiedDate: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: CategoryName;
  price: number;
  mrp: number;
  rating: number;
  reviewCount: number;
  image: string;
  tagline: string;
  bestFor: string;
  isTrending?: boolean;
  isBestDeal?: boolean;
  specs: Record<string, string>;
  features: string[];
  pros: string[];
  cons: string[];
  valueScore: number;
  verifiedOffers: VerifiedOffer[];
}

export interface RecommendationSlot {
  role:
    | 'Best Overall'
    | 'Best Budget Option'
    | 'Best Value for Money'
    | 'Best Features'
    | 'Best Alternative';
  productId: string;
  reason: string;
}

export interface AICompareVerdictResponse {
  headline: string;
  summary: string;
  categoryWinners: {
    criterion: string;
    winnerProductId: string;
    note: string;
  }[];
  recommendations: RecommendationSlot[];
  finalVerdict: string;
}

export interface AIAdvisorRequest {
  productNeed: string;
  budget: string;
  mustHaveFeatures: string;
  primaryUseCase: string;
  freeformQuery?: string;
}

export interface AIAdvisorResponse {
  advisorSummary: string;
  parsedCriteria: {
    category: string;
    maxBudgetInr: number | null;
    priorities: string[];
  };
  recommendations: RecommendationSlot[];
}

export interface AISearchResponse {
  interpretedIntent: string;
  suggestedCategory: CategoryName | 'All';
  maxBudgetInr: number | null;
  matchedProductIds: string[];
  explanation: string;
}

export interface ComparisonHistoryEntry {
  id: string;
  title: string;
  productIds: string[];
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  preferredCategories: CategoryName[];
  maxBudgetInr: number;
  priorityFocus: 'Value for Money' | 'Lowest Price' | 'Top Specifications';
  plan: 'free' | 'plus';
  dailyAiQueriesUsed: number;
  savedProductIds: string[];
  comparisonHistory: ComparisonHistoryEntry[];
}
