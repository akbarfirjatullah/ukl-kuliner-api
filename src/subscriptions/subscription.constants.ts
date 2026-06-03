import { SubscriptionPlan } from '@prisma/client';

export interface SubscriptionPlanConfig {
  id: SubscriptionPlan;
  name: string;
  price: number;
  periodDays: number;
  periodLabel: string;
  features: string[];
  popular?: boolean;
}

export const SUBSCRIPTION_PLAN_CONFIG: Record<SubscriptionPlan, SubscriptionPlanConfig> = {
  [SubscriptionPlan.FREE]: {
    id: SubscriptionPlan.FREE,
    name: 'Gratis',
    price: 0,
    periodDays: 0,
    periodLabel: 'Selamanya',
    features: [
      'Akses resep publik',
      'Simpan favorit',
      'Beri ulasan dan rating',
      'Akses komunitas'
    ]
  },
  [SubscriptionPlan.BASIC]: {
    id: SubscriptionPlan.BASIC,
    name: 'Basic',
    price: 29000,
    periodDays: 30,
    periodLabel: 'per bulan',
    popular: true,
    features: [
      'Semua fitur Gratis',
      'Favorit tanpa batas',
      'Filter dan pencarian lanjutan',
      'Akses resep premium',
      'Tanpa iklan'
    ]
  },
  [SubscriptionPlan.PRO]: {
    id: SubscriptionPlan.PRO,
    name: 'Pro',
    price: 59000,
    periodDays: 30,
    periodLabel: 'per bulan',
    features: [
      'Semua fitur Basic',
      'Unggah resep sendiri',
      'Analitik resep',
      'Badge Chef Pro',
      'Prioritas dukungan'
    ]
  }
};

export const SUBSCRIPTION_PLAN_LIST = Object.values(SUBSCRIPTION_PLAN_CONFIG);

export function getSubscriptionPlanConfig(plan: SubscriptionPlan) {
  return SUBSCRIPTION_PLAN_CONFIG[plan];
}
