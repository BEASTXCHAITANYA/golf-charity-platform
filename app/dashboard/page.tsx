import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Trophy,
  Target,
  Heart,
  TrendingUp,
  ArrowRight,
  Calendar,
  Zap,
  Award,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: scores }, { data: recentDraw }] = await Promise.all([
    supabase.from('profiles').select('*, charities(name)').eq('id', user.id).single(),
    supabase.from('scores').select('*').eq('user_id', user.id)
      .order('played_at', { ascending: false }).limit(5),
    supabase.from('draws').select('*, draw_entries!inner(user_id, user_numbers, match_count, prize_won)')
      .eq('status', 'published')
      .eq('draw_entries.user_id', user.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const parseNumbers = (arr: any): number[] => {
    if (Array.isArray(arr)) return arr.map(Number);
    return String(arr).replace(/[{}]/g, '').split(',').map(Number).filter((n) => !isNaN(n));
  };

  const drawnNumbers = parseNumbers(recentDraw?.drawn_numbers || []);
  const userNumbers = parseNumbers(recentDraw?.draw_entries?.[0]?.user_numbers || []);
  const recentMatched = drawnNumbers.filter((n: number) => userNumbers.includes(n)).length;

  const avgScore = scores && scores.length > 0
    ? Math.round(scores.reduce((s: number, r: { score: number }) => s + r.score, 0) / scores.length)
    : null;

  const isActive = profile?.subscription_status === 'active';
  const endDate = profile?.subscription_end_date
    ? new Date(profile.subscription_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {profile?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Here&apos;s your performance snapshot</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={isActive
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }>
            {isActive ? '● Active' : '○ Inactive'}
          </Badge>
        </div>
      </div>

      {/* Subscription expiry notice */}
      {isActive && endDate && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-sm">
          <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-slate-300">
            Subscription renews <span className="text-emerald-400 font-medium">{endDate}</span>
            {' · '}<span className="capitalize text-white font-medium">{profile?.subscription_plan}</span> plan
          </span>
        </div>
      )}

      {!isActive && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center gap-3 text-sm">
            <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-slate-300">Your subscription is <span className="text-amber-400 font-medium">{profile?.subscription_status}</span>. Subscribe to join the draws.</span>
          </div>
          <Link href="/subscribe" className="flex-shrink-0">
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1">
              Subscribe <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Scores Logged"
          value={`${scores?.length ?? 0}/5`}
          icon={Target}
          iconColor="text-blue-400"
          sub="most recent kept"
        />
        <StatCard
          label="Avg Score"
          value={avgScore ?? '—'}
          icon={TrendingUp}
          iconColor="text-emerald-400"
          sub={avgScore ? 'Stableford pts' : 'No scores yet'}
        />
        <StatCard
          label="Charity Share"
          value={`${profile?.charity_percentage ?? 10}%`}
          icon={Heart}
          iconColor="text-rose-400"
          sub={profile?.charities?.name ?? 'Not selected'}
        />
        <StatCard
          label="Plan"
          value={profile?.subscription_plan ? profile.subscription_plan.charAt(0).toUpperCase() + profile.subscription_plan.slice(1) : '—'}
          icon={Trophy}
          iconColor="text-amber-400"
          sub={isActive ? 'Active' : 'No plan'}
        />
      </div>

      {/* Body grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Scores */}
        <Card className="bg-slate-800/60 border-slate-700 text-white lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Recent Scores</CardTitle>
            <Link href="/dashboard/scores">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-emerald-400 gap-1 text-xs h-7">
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {scores && scores.length > 0 ? (
              <div className="space-y-2">
                {scores.map((s: { id: string; score: number; played_at: string }, i: number) => (
                  <div key={s.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400 font-mono">
                        {i + 1}
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(s.played_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <span className={`text-lg font-bold tabular-nums ${s.score >= 36 ? 'text-amber-400' : s.score >= 28 ? 'text-emerald-400' : 'text-slate-300'
                      }`}>
                      {s.score} <span className="text-xs font-normal text-slate-500">pts</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Target}
                title="No scores yet"
                description="Log your first Stableford score to enter the monthly draw."
                action={
                  <Link href="/dashboard/scores">
                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">Log a Score</Button>
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-4">
          {/* Last draw result */}
          {recentDraw && (
            <Card className="bg-slate-800/60 border-slate-700 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-400">Last Draw Result</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white font-semibold">
                  {monthNames[(recentDraw.month as number) - 1]} {recentDraw.year as number}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Matched{' '}
                  <span className="text-emerald-400 font-bold">
                    {recentMatched}
                  </span>{' '}
                  numbers
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick links */}
          <Card className="bg-slate-800/60 border-slate-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-400">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/scores">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 justify-between group" size="sm">
                  <span className="flex items-center gap-2"><Target className="w-3.5 h-3.5" /> Log a Score</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </Link>
              <Link href="/dashboard/draws">
                <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 justify-between group" size="sm">
                  <span className="flex items-center gap-2"><Trophy className="w-3.5 h-3.5" /> View Draws</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </Link>
              <Link href="/dashboard/charity">
                <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 justify-between group" size="sm">
                  <span className="flex items-center gap-2"><Heart className="w-3.5 h-3.5" /> Update Charity</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </Link>
              <Link href="/dashboard/winnings">
                <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 justify-between group" size="sm">
                  <span className="flex items-center gap-2"><Award className="w-3.5 h-3.5" /> My Winnings</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
