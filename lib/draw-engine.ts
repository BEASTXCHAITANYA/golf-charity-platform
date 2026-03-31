import { SupabaseClient } from '@supabase/supabase-js';

export function generateRandomDraw(): number[] {
  const drawn: number[] = [];
  while (drawn.length < 5) {
    const n = Math.floor(Math.random() * 45) + 1;
    if (!drawn.includes(n)) drawn.push(n);
  }
  return drawn.sort((a, b) => a - b);
}

export async function generateAlgorithmicDraw(supabase: SupabaseClient): Promise<number[]> {
  const { data } = await supabase.rpc('get_score_frequencies');
  if (!data || data.length === 0) return generateRandomDraw();
  return weightedSelection(data);
}

function weightedSelection(frequencies: { score: number; count: number }[]): number[] {
  const totalWeight = frequencies.reduce((sum, f) => sum + f.count, 0);
  const selected: number[] = [];

  while (selected.length < 5) {
    let rand = Math.random() * totalWeight;
    for (const f of frequencies) {
      rand -= f.count;
      if (rand <= 0 && !selected.includes(f.score)) {
        selected.push(f.score);
        break;
      }
    }
    // fallback to random if weighted selection loops
    if (selected.length < 5) {
      const n = Math.floor(Math.random() * 45) + 1;
      if (!selected.includes(n)) selected.push(n);
    }
  }

  return selected.slice(0, 5).sort((a, b) => a - b);
}
