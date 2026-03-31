export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/prize-pool';
import { Trophy } from 'lucide-react';

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const tierLabel: Record<number, string> = { 5: '🏆 Jackpot', 4: '🥈 Tier 2', 3: '🥉 Tier 3' };

function NumberBall({ n, matched }: { n: number; matched: boolean }) {
  return (
    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm tabular-nums ${
      matched
        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/20'
        : 'bg-slate-700 text-slate-300 border border-slate-600'
    }`}>
      {n}
    </span>
  );
}

const parseNumbers = (arr: number[] | string): number[] => {
  if (Array.isArray(arr)) return arr.map(Number);
  return String(arr).replace(/[{}]/g, '').split(',').map(Number);
};

export default async function DrawsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: draws } = await supabase
    .from('draws')
    .select(`*, draw_entries (*)`)
    .eq('status', 'published')
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  const drawList = (draws ?? []) as any[];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Monthly Draws"
        description="Your scores are matched against each month's drawn numbers"
      />

      {drawList.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No draws published yet"
          description="Check back soon — draws are published each month by the admin."
        />
      ) : (
        <div className="space-y-4">
          {drawList.map((draw: any) => {
            const entry = (draw.draw_entries ?? []).find((e: any) => e.user_id === user?.id);
            const drawnNumbers = parseNumbers(draw.drawn_numbers);
            const userNumbers = entry ? parseNumbers(entry.user_numbers) : [];
            const matchedCount = drawnNumbers.filter((n: number) => userNumbers.includes(n)).length;
            const hasWin = entry && Number(entry.prize_won) > 0;

            return (
              <Card key={entry.id} className="bg-slate-800/60 border-slate-700 overflow-hidden">
                <CardHeader className="pb-3 border-b border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-white">
                        {monthNames[draw.month - 1]} {draw.year}
                      </CardTitle>
                      <Badge className="bg-slate-700 text-slate-400 border border-slate-600 capitalize text-xs">
                        {draw.draw_type}
                      </Badge>
                    </div>
                    {matchedCount >= 3 && (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
                        {tierLabel[matchedCount] ?? `${matchedCount} matched`}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Number balls */}
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Drawn Numbers</p>
                    <div className="flex flex-wrap gap-2">
                      {drawnNumbers.sort((a: number, b: number) => a - b).map((n: number) => (
                        <NumberBall key={n} n={n} matched={userNumbers.includes(n)} />
                      ))}
                    </div>
                  </div>

                  {/* User entry */}
                  <div className="bg-slate-700/40 rounded-lg p-3 space-y-1.5">
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-slate-500 text-xs mr-1">Your numbers:</span>
                      {userNumbers.map((n: number) => (
                        <span key={n} className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                          drawnNumbers.includes(n)
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}>{n}</span>
                      ))}
                    </div>
                    <p className="text-sm text-slate-400">
                      Matched: <span className="text-white font-semibold">{matchedCount}</span>
                    </p>
                    {hasWin && (
                      <p className="text-sm font-bold text-amber-400">
                        Won: {formatCurrency(Number(entry.prize_won))}
                        <span className={`ml-2 text-xs font-normal ${
                          entry.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-500'
                        }`}>
                          ({entry.payment_status})
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Prize pool info */}
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 border-t border-slate-700/40 pt-3">
                    <span>Pool: <span className="text-slate-300">{formatCurrency(draw.prize_pool_total)}</span></span>
                    <span>Jackpot (40%): <span className="text-slate-300">{formatCurrency(draw.prize_pool_total * 0.4)}</span></span>
                    {draw.jackpot_rollover > 0 && (
                      <span>+ Rollover: <span className="text-amber-400">{formatCurrency(draw.jackpot_rollover)}</span></span>
                    )}
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
