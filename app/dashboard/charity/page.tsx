'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Heart, CheckCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import type { Charity } from '@/types';

export default function CharityPage() {
  const supabase = createClient();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [percentage, setPercentage] = useState(10);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [{ data: chars }, { data: { user } }] = await Promise.all([
        supabase.from('charities').select('*').order('is_featured', { ascending: false }),
        supabase.auth.getUser(),
      ]);
      setCharities(chars ?? []);
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('charity_id, charity_percentage')
          .eq('id', user.id)
          .single();
        if (profile) {
          setSelectedId(profile.charity_id);
          setPercentage(profile.charity_percentage ?? 10);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    if (!userId) return;
    if (percentage < 10) { toast.error('Minimum contribution is 10%'); return; }
    if (!selectedId) { toast.error('Please select a charity first'); return; }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ charity_id: selectedId, charity_percentage: percentage })
      .eq('id', userId);
    setSaving(false);
    if (error) toast.error('Failed to save changes');
    else toast.success('Charity preferences saved!');
  };

  const selectedCharity = charities.find(c => c.id === selectedId);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Charity Selection"
        description="Choose your supported charity and set your contribution percentage"
      />

      {/* Current selection banner */}
      {!loading && selectedCharity && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-sm text-slate-300">
            Supporting <span className="text-emerald-400 font-medium">{selectedCharity.name}</span>
            {' '}with <span className="text-emerald-400 font-medium">{percentage}%</span> of your subscription
          </span>
        </div>
      )}

      {/* Percentage control */}
      <Card className="bg-slate-800/60 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white text-base">
            <Heart className="w-4 h-4 text-rose-400" /> Contribution Amount
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Percentage (min 10%)</Label>
              <Input
                type="number"
                min={10}
                max={100}
                value={percentage}
                onChange={(e) => setPercentage(Math.min(100, Math.max(10, Number(e.target.value))))}
                className="bg-slate-700 border-slate-600 text-white w-28 focus:border-emerald-500"
              />
            </div>
            <div className="flex-1 pb-1">
              <p className="text-slate-500 text-xs mb-1.5">of subscription donated to charity</p>
              <div className="w-full bg-slate-700 rounded-full h-1.5 max-w-xs">
                <div
                  className="bg-rose-400 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
          <Button
            onClick={save}
            disabled={saving || !selectedId}
            className="bg-emerald-500 hover:bg-emerald-600 gap-2"
          >
            {saving ? 'Saving...' : <><CheckCircle className="w-4 h-4" /> Save Preferences</>}
          </Button>
          {!selectedId && !loading && (
            <p className="text-amber-500 text-xs">Select a charity below to enable saving</p>
          )}
        </CardContent>
      </Card>

      {/* Charity grid */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4">Choose a Charity</h2>
        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : charities.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No charities available"
            description="Charities will be added by the admin soon."
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {charities.map((charity) => (
              <button
                key={charity.id}
                type="button"
                onClick={() => setSelectedId(charity.id)}
                className={`text-left rounded-xl border-2 p-4 transition-all duration-150 ${
                  selectedId === charity.id
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white text-sm">{charity.name}</h3>
                    {charity.is_featured && (
                      <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">
                        Featured
                      </Badge>
                    )}
                  </div>
                  {selectedId === charity.id && (
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-slate-400 text-xs line-clamp-2 mb-2">{charity.description}</p>
                {charity.events && charity.events.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {charity.events.length} upcoming event{charity.events.length > 1 ? 's' : ''}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
