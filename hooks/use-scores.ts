'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Score } from '@/types';

export function useScores(userId?: string) {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchScores = useCallback(async (uid?: string) => {
    const id = uid ?? userId;
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', id)
        .order('played_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);
      if (fetchErr) throw fetchErr;
      setScores(data ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load scores');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchScores(userId);
  }, [userId, fetchScores]);

  const refresh = () => fetchScores(userId);

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length)
    : null;

  const topScore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : null;

  return { scores, loading, error, refresh, avgScore, topScore };
}
