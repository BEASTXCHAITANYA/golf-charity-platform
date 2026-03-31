import { SupabaseClient } from '@supabase/supabase-js';
import type { Score } from '@/types';

export async function getUserScores(
  supabase: SupabaseClient,
  userId: string
): Promise<Score[]> {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addScore(
  supabase: SupabaseClient,
  userId: string,
  score: number,
  playedAt: string
): Promise<Score> {
  // Validate range
  if (score < 1 || score > 45) throw new Error('Score must be between 1 and 45');

  const { data, error } = await supabase
    .from('scores')
    .insert({ user_id: userId, score, played_at: playedAt })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteScore(
  supabase: SupabaseClient,
  scoreId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('scores')
    .delete()
    .eq('id', scoreId)
    .eq('user_id', userId); // ensure user owns the score

  if (error) throw new Error(error.message);
}
