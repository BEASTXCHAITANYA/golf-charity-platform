export type UserRole = 'user' | 'admin';
export type SubscriptionStatus = 'active' | 'inactive' | 'lapsed';
export type SubscriptionPlan = 'monthly' | 'yearly';
export type DrawType = 'random' | 'algorithmic';
export type DrawStatus = 'simulation' | 'published';
export type PaymentStatus = 'pending' | 'paid';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan | null;
  subscription_end_date: string | null;
  charity_id: string | null;
  charity_percentage: number;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Score {
  id: string;
  user_id: string;
  score: number;
  played_at: string;
  created_at: string;
}

export interface Charity {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  is_featured: boolean;
  events: CharityEvent[];
  created_at: string;
}

export interface CharityEvent {
  title: string;
  date: string;
  location: string;
}

export interface Draw {
  id: string;
  month: number;
  year: number;
  drawn_numbers: number[];
  draw_type: DrawType;
  status: DrawStatus;
  prize_pool_total: number;
  jackpot_rollover: number;
  created_at: string;
}

export interface DrawEntry {
  id: string;
  draw_id: string;
  user_id: string;
  user_numbers: number[];
  matched_numbers: number[];
  match_count: number;
  prize_won: number;
  proof_url: string | null;
  payment_status: PaymentStatus;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  plan: SubscriptionPlan;
  amount: number;
  status: string;
  created_at: string;
}

export interface PrizePool {
  jackpot: number;
  tier2: number;
  tier3: number;
}
