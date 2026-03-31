'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Trash2, Target, Calendar, Plus, Info } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { Score } from '@/types';

const schema = z.object({
  score: z.coerce.number({ message: 'Enter a number' }).min(1, 'Min 1').max(45, 'Max 45 (Stableford)'),
  played_at: z.string().min(1, 'Date is required').refine(
    (d) => new Date(d) <= new Date(),
    'Date cannot be in the future'
  ),
});

type FormData = z.infer<typeof schema>;
type FormInput = z.input<typeof schema>;

function ScoreRing({ score }: { score: number }) {
  const color = score >= 36 ? 'text-amber-400' : score >= 28 ? 'text-emerald-400' : score >= 20 ? 'text-blue-400' : 'text-slate-400';
  return (
    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold tabular-nums ${
      score >= 36 ? 'border-amber-400/40 bg-amber-400/5' :
      score >= 28 ? 'border-emerald-400/40 bg-emerald-400/5' :
      'border-slate-600 bg-slate-700/40'
    } ${color}`}>
      {score}
    </div>
  );
}

export default function ScoresPage() {
  const supabase = createClient();
  const [scores, setScores] = useState<Score[]>([]);
  const [loadingScores, setLoadingScores] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: { played_at: new Date().toISOString().split('T')[0] },
  });

  const fetchScores = async (uid: string) => {
    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', uid)
      .order('played_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);
    setScores(data ?? []);
    setLoadingScores(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); fetchScores(user.id); }
    });
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!userId) return;
    setSubmitting(true);
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: data.score, played_at: data.played_at, user_id: userId }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? 'Failed to save score');
    } else {
      toast.success(`Score of ${data.score} pts logged!`);
      reset({ played_at: new Date().toISOString().split('T')[0] });
      await fetchScores(userId);
    }
    setSubmitting(false);
  };

  const deleteScore = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('scores').delete().eq('id', id);
    if (error) toast.error('Failed to delete score');
    else { toast.success('Score removed'); await fetchScores(userId!); }
    setDeletingId(null);
  };

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length)
    : null;

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Score Tracker"
        description="Your 5 most recent Stableford scores are used as your draw numbers"
      />

      {/* Info banner */}
      <div className="flex gap-3 px-4 py-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-sm text-slate-300">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <span>Scores range 1–45. Only your <strong className="text-white">5 most recent</strong> are kept — older ones are automatically removed when you add a new one.</span>
      </div>

      {/* Add score form */}
      <Card className="bg-slate-800/60 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white text-base">
            <Plus className="w-4 h-4 text-emerald-400" /> Log New Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Stableford Score</Label>
                <Input
                  type="number"
                  min={1}
                  max={45}
                  {...register('score')}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                  placeholder="e.g. 32"
                />
                {errors.score && <p className="text-rose-400 text-xs">{errors.score.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Date Played</Label>
                <Input
                  type="date"
                  {...register('played_at')}
                  className="bg-slate-700 border-slate-600 text-white focus:border-emerald-500"
                />
                {errors.played_at && <p className="text-rose-400 text-xs">{errors.played_at.message}</p>}
              </div>
            </div>
            <Button
              type="submit"
              disabled={submitting || scores.length >= 5}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : scores.length >= 5 ? 'Delete a score first to add new' : 'Add Score'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Score list */}
      <Card className="bg-slate-800/60 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base text-white">
            Your Scores
            <span className="text-slate-500 font-normal ml-2 text-sm">({scores.length}/5)</span>
          </CardTitle>
          {avgScore && (
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
              avg {avgScore} pts
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {loadingScores ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : scores.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No scores logged"
              description="Add your first Stableford score to start participating in monthly draws."
            />
          ) : (
            <AnimatePresence initial={false}>
              <div className="space-y-2">
                {scores.map((s, i) => (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/30 group"
                  >
                    <ScoreRing score={s.score} />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(s.played_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">Draw number #{i + 1}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteScore(s.id)}
                      disabled={deletingId === s.id}
                      className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8 p-0 transition-opacity"
                    >
                      {deletingId === s.id
                        ? <span className="w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </Button>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
