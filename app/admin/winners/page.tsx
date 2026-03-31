export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/prize-pool';
import { Trophy } from 'lucide-react';
import MarkPaidButton from './MarkPaidButton';

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const tierLabel: Record<number, string> = { 5: '🏆 Jackpot', 4: '🥈 Tier 2', 3: '🥉 Tier 3' };

export default async function AdminWinnersPage() {
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from('draw_entries')
    .select('*, profiles(full_name), draws(month, year)')
    .gt('prize_won', 0)
    .order('created_at', { ascending: false });

  const pending = (entries ?? []).filter((e: any) => e.payment_status === 'pending').length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Winner Verification"
        description={pending > 0 ? `${pending} payout${pending > 1 ? 's' : ''} awaiting action` : 'All payouts are up to date'}
      />

      {(!entries || entries.length === 0) ? (
        <EmptyState
          icon={Trophy}
          title="No winners yet"
          description="Winners will appear here once a draw is published and entries are matched."
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry: any) => (
            <Card key={entry.id} className="bg-slate-800/60 border-slate-700">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-white">{entry.profiles?.full_name}</p>
                    <p className="text-slate-400 text-sm">
                      {monthNames[(entry.draws?.month ?? 1) - 1]} {entry.draws?.year}
                      {' · '}
                      <span className="text-slate-300">{tierLabel[entry.match_count] ?? `${entry.match_count} matched`}</span>
                    </p>
                    <p className="text-amber-400 font-bold text-lg">{formatCurrency(Number(entry.prize_won))}</p>
                    {entry.proof_url ? (
                      <a href={entry.proof_url} target="_blank" rel="noopener noreferrer"
                        className="text-emerald-400 text-xs hover:underline inline-flex items-center gap-1">
                        View Proof ↗
                      </a>
                    ) : (
                      <p className="text-slate-600 text-xs">No proof uploaded yet</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Badge className={
                      entry.payment_status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }>
                      {entry.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                    </Badge>
                    {entry.payment_status === 'pending' && (
                      <MarkPaidButton entryId={entry.id} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
