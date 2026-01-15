import {
  Utensils,
  CarFront,
  ShoppingBag,
  Receipt,
  Clapperboard,
  Heart,
  MoreHorizontal,
  HandCoins,
  RefreshCw,
  Briefcase,
  Gift,
  Home,
  RotateCcw,
  TrendingUp,
  Award,
} from "lucide-react";

export const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const INCOME_SOURCES = [
  "Freelance",
  "Side Job",
  "Gift",
  "Rental",
  "Refund",
  "Investment",
  "Bonus",
  "Other",
] as const;

export type IncomeSource = (typeof INCOME_SOURCES)[number];

export const SUBSCRIPTION_CATEGORIES = [
  "Netflix",
  "Spotify",
  "Gym",
  "Rent",
  "Insurance",
  "Utilities",
  "Other",
] as const;

export type SubscriptionCategory = (typeof SUBSCRIPTION_CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-orange-500/10 text-orange-600 border-orange-200",
  Transport: "bg-blue-500/10 text-blue-600 border-blue-200",
  Shopping: "bg-pink-500/10 text-pink-600 border-pink-200",
  Bills: "bg-red-500/10 text-red-600 border-red-200",
  Entertainment: "bg-purple-500/10 text-purple-600 border-purple-200",
  Health: "bg-green-500/10 text-green-600 border-green-200",
  Other: "bg-gray-500/10 text-gray-600 border-gray-200",
  Lending: "bg-amber-500/10 text-amber-600 border-amber-200",
  Recurring: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
};

export const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Food: Utensils,
  Transport: CarFront,
  Shopping: ShoppingBag,
  Bills: Receipt,
  Entertainment: Clapperboard,
  Health: Heart,
  Other: MoreHorizontal,
  Lending: HandCoins,
  Recurring: RefreshCw,
};

// For summary view - solid background colors
export const CATEGORY_SOLID_COLORS: Record<string, string> = {
  Food: "bg-orange-500",
  Transport: "bg-blue-500",
  Shopping: "bg-pink-500",
  Bills: "bg-red-500",
  Entertainment: "bg-purple-500",
  Health: "bg-green-500",
  Other: "bg-gray-500",
  Subscriptions: "bg-indigo-500",
  Lending: "bg-amber-500",
  Utilities: "bg-cyan-500",
  Housing: "bg-teal-500",
  Insurance: "bg-slate-500",
};

// Income source styling
export const INCOME_SOURCE_COLORS: Record<string, string> = {
  Freelance: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "Side Job": "bg-blue-500/10 text-blue-600 border-blue-200",
  Gift: "bg-pink-500/10 text-pink-600 border-pink-200",
  Rental: "bg-amber-500/10 text-amber-600 border-amber-200",
  Refund: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  Investment: "bg-violet-500/10 text-violet-600 border-violet-200",
  Bonus: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  Other: "bg-gray-500/10 text-gray-600 border-gray-200",
};

export const INCOME_SOURCE_ICONS: Record<string, React.ElementType> = {
  Freelance: Briefcase,
  "Side Job": Briefcase,
  Gift: Gift,
  Rental: Home,
  Refund: RotateCcw,
  Investment: TrendingUp,
  Bonus: Award,
  Other: MoreHorizontal,
};
