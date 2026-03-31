'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { formatCurrency } from '@/lib/prize-pool';
import { toast } from 'sonner';
import { Dice5, Cpu, Send, Plus } from 'lucide-react';
import type { Draw } from '@/types';

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminDrawsPage() {
  const supabase = createClient();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    draw_type: 'random' as 'random' | 'algorithmic',
    prize_pool_total: 0,
    jackpot_rollover: 0,
  });

  const fetchDraws = async () => {
    const { data } = await supabase
      .from('draws')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    setDraws(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchDraws(); }, []);

  const runDraw = async () => {
    setSubmitting(true);
    const res = await fetch('/api/draws', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    if (!res.ok) {
      toast.error(result.error ?? 'Failed to run draw');
    } else {
      toast.success(`Draw simulated! Numbers: ${result.drawn_numbers.join(', ')}`);
      await fetchDraws();
    }
    setSubmitting(false);
  };

  const publishDraw = async (id: string) => {
    setPublishingId(id);
    const res = await fetch(`/api/draws/${id}/publish`, { method: 'POST' });
    const result = await res.json();
    if (!res.ok) {
      toast.error(result.error ?? 'Failed to publish draw');
    } else {
      toast.success(`Draw published! ${result.winnerCount} winner(s) found.${result.rollover > 0 ? ` Jackpot rolls over: ${formatCurrency(result.rollover)}` : ''}`);
      await fetchDraws();
    }
    setPublishingId(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <PageHeader title="Draw Management" description="Run and publish monthly prize draws" />

      {/* Create draw */}
      <Card className="bg-slate-800/60 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white text-base">
            <Plus className="w-4 h-4 text-emerald-400" /> Run New Draw
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Month</Label>
              <Input
                type="number" min={1} max={12}
                value={form.month}
                onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Year</Label>
              <Input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Prize Pool (£)</Label>
              <Input
                type="number" min={0}
                value={form.prize_pool_total}
                onChange={(e) => setForm({ ...form, prize_pool_total: Number(e.target.value) })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Rollover (£)</Label>
              <Input
                type="number" min={0}
                value={form.jackpot_rollover}
                onChange={(e) => setForm({ ...form, jackpot_rollover: Number(e.target.value) })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          {/* Draw type selector */}
          <div>
            <Label className="text-slate-300 text-sm block mb-2">Draw Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, draw_type: 'random' })}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  form.draw_type === 'random'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700 bg-slate-700/30 hover:border-slate-600'
                }`}
              >
                <Dice5 className={`w-5 h-5 flex-shrink-0 ${form.draw_type === 'random' ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div>
                  <p className={`text-sm font-medium ${form.draw_type === 'random' ? 'text-emerald-400' : 'text-slate-300'}`}>Random</p>
                  <p className="text-xs text-slate-500 mt-0.5">5 numbers picked at random (1–45)</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, draw_type: 'algorithmic' })}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  form.draw_type === 'algorithmic'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700 bg-slate-700/30 hover:border-slate-600'
                }`}
              >
                <Cpu className={`w-5 h-5 flex-shrink-0 ${form.draw_type === 'algorithmic' ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div>
                  <p className={`text-sm font-medium ${form.draw_type === 'algorithmic' ? 'text-emerald-400' : 'text-slate-300'}`}>Algorithmic</p>
                  <p className="text-xs text-slate-500 mt-0.5">Weighted by most frequent scores</p>
                </div>
              </button>
            </div>
          </div>

          <Button
            onClick={runDraw}
            disabled={submitting}
            className="bg-emerald-500 hover:bg-emerald-600 gap-2"
          >
            <Dice5 className="w-4 h-4" />
            {submitting ? 'Generating draw...' : 'Run Simulation'}
          </Button>
          <p className="text-xs text-slate-500">This creates a simulation. Review numbers before publishing to users.</p>
        </CardContent>
      </Card>

      {/* Draws list */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : draws.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No draws created yet. Run the first simulation above.</p>
        ) : (
          draws.map((draw) => (
            <Card key={draw.id} className="bg-slate-800/60 border-slate-700">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-white text-base">
                        {monthNames[draw.month - 1]} {draw.year}
                      </h3>
                      <Badge className={
                        draw.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }>
                        {draw.status === 'published' ? '● Published' : '○ Simulation'}
                      </Badge>
                      <Badge className="bg-slate-700 text-slate-400 border border-slate-600 capitalize text-xs">
                        {draw.draw_type}
                      </Badge>
                    </div>

                    {/* Drawn numbers */}
                    <div className="flex items-center gap-2">
                      {draw.drawn_numbers.map((n: number) => (
                        <span
                          key={n}
                          className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-sm font-bold text-white tabular-nums"
                        >
                          {n}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>Pool: <span className="text-slate-300">{formatCurrency(draw.prize_pool_total)}</span></span>
                      {draw.jackpot_rollover > 0 && (
                        <span>Rollover: <span className="text-amber-400">{formatCurrency(draw.jackpot_rollover)}</span></span>
                      )}
                    </div>
                  </div>

                  {draw.status === 'simulation' && (
                    <Button
                      size="sm"
                      onClick={() => publishDraw(draw.id)}
                      disabled={publishingId === draw.id}
                      className="bg-emerald-500 hover:bg-emerald-600 gap-2 flex-shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {publishingId === draw.id ? 'Publishing...' : 'Publish & Calculate Winners'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
