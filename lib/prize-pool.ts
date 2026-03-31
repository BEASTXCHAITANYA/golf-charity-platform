import { PrizePool } from '@/types';

export function calculatePrizePool(
  activeSubscribers: number,
  portionPerSub: number,
  rollover = 0
): PrizePool & { total: number } {
  const total = activeSubscribers * portionPerSub + rollover;
  return {
    total,
    jackpot: total * 0.40,
    tier2: total * 0.35,
    tier3: total * 0.25,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
}
