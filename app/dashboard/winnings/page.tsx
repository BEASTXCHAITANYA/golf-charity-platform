export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/prize-pool';
import { Trophy } from 'lucide-react';

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const parseNumbers = (arr: any): number[] => {
  if (Array.isArray(arr)) return arr.map(Number);
  return String(arr).replace(/[{}]/g, '').split(',').map(Number).filter((n) => !isNaN(n));
};

export default async function WinningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch the latest published draw
  const { data: latestDraw } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'published')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch all entries for that draw
  const { data: allEntries } = latestDraw ? await supabase
    .from('draw_entries')
    .select('user_id, user_numbers, prize_won, payment_status')
    .eq('draw_id', latestDraw.id) : { data: [] };

  const entries = allEntries ?? [];
  const drawnNumbers = latestDraw ? parseNumbers(latestDraw.drawn_numbers) : [];

  // Calculate match count for every entry, ignoring entries with empty user_numbers
  const withMatches = entries
    .map((e: any) => {
      const userNums = parseNumbers(e.user_numbers);
      const matchCount = userNums.length > 0
        ? drawnNumbers.filter((n: number) => userNums.includes(n)).length
        : 0;
      return { ...e, matchCount };
    });

  const maxMatch = withMatches.length > 0 ? Math.max(...withMatches.map((e: any) => e.matchCount)) : 0;
  const winners = maxMatch > 0 ? withMatches.filter((e: any) => e.matchCount === maxMatch) : [];

  const pool = entries.length * 15;
  const jackpot = pool * 0.4;
  const prizePerWinner = winners.length > 0 ? jackpot / winners.length : 0;

  const currentUserEntry = withMatches.find((e: any) => e.user_id === user.id);
  const isWinner = winners.some((e: any) => e.user_id === user.id);

  // Fetch user's personal winnings history
  const { data: history } = await supabase
    .from('draw_entries')
    .select('*, draws(month, year, drawn_numbers)')
    .eq('user_id', user.id)
    .gt('prize_won', 0)
    .order('created_at', { ascending: false });

  const historyList = history ?? [];
  const totalWon  = historyList.reduce((s: number, e: any) => s + Number(e.prize_won), 0);
  const totalPaid = historyList.filter((e: any) => e.payment_status === 'paid').reduce((s: number, e: any) => s + Number(e.prize_won), 0);
  const pending   = totalWon - totalPaid;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <PageHeader title="My Winnings" description="Your prize history and payout status" />

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Won',  value: formatCurrency(totalWon),  color: 'text-amber-400' },
          { label: 'Paid Out',   value: formatCurrency(totalPaid), color: 'text-emerald-400' },
          { label: 'Pending',    value: formatCurrency(pending),   color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="bg-slate-800/60 border-slate-700">
            <CardContent className="pt-4 pb-4">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Latest draw results */}
      {latestDraw && (
        <Card className="bg-slate-800/60 border-slate-700">
          <CardContent className="pt-5 pb-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold">
                {monthNames[latestDraw.month - 1]} {latestDraw.year} Draw
              </p>
              <Badge className="bg-slate-700 text-slate-400 border border-slate-600 text-xs capitalize">
                Latest
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Pool',      value: formatCurrency(pool) },
                { label: 'Jackpot (40%)',   value: formatCurrency(jackpot) },
                { label: 'Winners',         value: String(winners.length) },
                { label: 'Prize / Winner',  value: formatCurrency(prizePerWinner) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-700/40 rounded-lg p-3">
                  <p className="text-slate-500 text-xs mb-1">{label}</p>
                  <p className="text-white font-bold">{value}</p>
                </div>
              ))}
            </div>

            {/* Current user result */}
            {currentUserEntry && (
              <div className={`rounded-lg px-4 py-3 border text-sm ${
                isWinner
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-slate-700/30 border-slate-600/30'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">
                    Your match: <span className="text-white font-bold">{currentUserEntry.matchCount}</span> / {drawnNumbers.length}
                  </span>
                  {isWinner ? (
                    <span className="text-emerald-400 font-semibold">
                      You win {formatCurrency(prizePerWinner)} 🏆
                    </span>
                  ) : (
                    <span className="text-slate-500 text-xs">Not a winner this draw</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* History */}
      {historyList.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No winnings yet"
          description="Match the most drawn numbers in a monthly draw to win prizes!"
        />
      ) : (
        <div className="space-y-3">
          {historyList.map((entry: any) => {
            const drawn = entry.draws?.drawn_numbers ? parseNumbers(entry.draws.drawn_numbers) : [];
            const userNums = parseNumbers(entry.user_numbers);
            const matchCount = drawn.filter((n: number) => userNums.includes(n)).length;

            return (
              <Card key={entry.id} className="bg-slate-800/60 border-slate-700">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">
                          {monthNames[(entry.draws?.month ?? 1) - 1]} {entry.draws?.year}
                        </span>
                        <Badge className="bg-slate-700 text-slate-300 border border-slate-600 text-xs">
                          {matchCount} matched
                        </Badge>
                      </div>

                      {drawn.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {drawn.map((n: number) => (
                            <span key={n} className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                              userNums.includes(n)
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-700 text-slate-500'
                            }`}>{n}</span>
                          ))}
                        </div>
                      )}

                      {entry.proof_url ? (
                        <a href={entry.proof_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline">
                          Proof submitted ✓
                        </a>
                      ) : (
                        <p className="text-xs text-amber-500">Proof required for payout</p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0 space-y-1.5">
                      <p className="text-lg font-bold text-amber-400">{formatCurrency(Number(entry.prize_won))}</p>
                      <Badge className={
                        entry.payment_status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }>
                        {entry.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
