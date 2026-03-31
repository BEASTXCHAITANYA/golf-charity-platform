import { SupabaseClient } from '@supabase/supabase-js';
import { calculatePrizePool } from '@/lib/prize-pool';

export interface WinnerResult {
  userId: string;
  userNumbers: number[];
  matchedNumbers: number[];
  matchCount: number;
  prizeWon: number;
}

export async function calculateDrawWinners(
  supabase: SupabaseClient,
  drawId: string,
  drawnNumbers: number[],
  prizePoolTotal: number,
  jackpotRollover: number
): Promise<{ winners: WinnerResult[]; newRollover: number }> {
  // Get all active subscribers
  const { data: activeUsers, error: usersError } = await supabase
    .from('profiles')
    .select('id')
    .eq('subscription_status', 'active');

  if (usersError || !activeUsers) return { winners: [], newRollover: jackpotRollover };

  const prizes = calculatePrizePool(0, 0, 0); // structure only
  const total = prizePoolTotal + jackpotRollover;
  const pool = {
    jackpot: total * 0.40,
    tier2: total * 0.35,
    tier3: total * 0.25,
  };

  // Bucket winners by tier
  const tier5: WinnerResult[] = [];
  const tier4: WinnerResult[] = [];
  const tier3: WinnerResult[] = [];

  for (const user of activeUsers) {
    // Get their last 5 scores
    const { data: scores } = await supabase
      .from('scores')
      .select('score')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);

    if (!scores || scores.length === 0) continue;

    const userNumbers = scores.map((s: { score: number }) => s.score);
    const matched = userNumbers.filter((n: number) => drawnNumbers.includes(n));
    // deduplicate matches
    const matchedNumbers = [...new Set(matched)];
    const matchCount = matchedNumbers.length;

    if (matchCount >= 3) {
      const result: WinnerResult = {
        userId: user.id,
        userNumbers,
        matchedNumbers,
        matchCount,
        prizeWon: 0,
      };
      if (matchCount === 5) tier5.push(result);
      else if (matchCount === 4) tier4.push(result);
      else tier3.push(result);
    }
  }

  // Assign prizes (split equally within tier)
  let newRollover = 0;

  if (tier5.length > 0) {
    const share = pool.jackpot / tier5.length;
    tier5.forEach(w => { w.prizeWon = share; });
  } else {
    // No jackpot winner → rollover jackpot
    newRollover = pool.jackpot;
  }

  if (tier4.length > 0) {
    const share = pool.tier2 / tier4.length;
    tier4.forEach(w => { w.prizeWon = share; });
  }

  if (tier3.length > 0) {
    const share = pool.tier3 / tier3.length;
    tier3.forEach(w => { w.prizeWon = share; });
  }

  const allWinners = [...tier5, ...tier4, ...tier3];
  return { winners: allWinners, newRollover };
}

export async function publishDraw(
  supabase: SupabaseClient,
  drawId: string
): Promise<{ success: boolean; error?: string; winnerCount: number; rollover: number }> {
  // Fetch draw details
  const { data: draw, error: drawError } = await supabase
    .from('draws')
    .select('*')
    .eq('id', drawId)
    .single();

  if (drawError || !draw) return { success: false, error: 'Draw not found', winnerCount: 0, rollover: 0 };
  if (draw.status === 'published') return { success: false, error: 'Draw already published', winnerCount: 0, rollover: 0 };

  const { winners, newRollover } = await calculateDrawWinners(
    supabase,
    drawId,
    draw.drawn_numbers,
    draw.prize_pool_total,
    draw.jackpot_rollover
  );

  // Upsert draw entries for winners
  for (const winner of winners) {
    await supabase.from('draw_entries').upsert({
      draw_id: drawId,
      user_id: winner.userId,
      user_numbers: winner.userNumbers,
      matched_numbers: winner.matchedNumbers,
      match_count: winner.matchCount,
      prize_won: winner.prizeWon,
      payment_status: 'pending',
    }, { onConflict: 'draw_id,user_id' });
  }

  // Update draw status and record rollover
  const { error: updateError } = await supabase
    .from('draws')
    .update({
      status: 'published',
      jackpot_rollover: newRollover,
    })
    .eq('id', drawId);

  if (updateError) return { success: false, error: updateError.message, winnerCount: 0, rollover: 0 };

  return { success: true, winnerCount: winners.length, rollover: newRollover };
}
