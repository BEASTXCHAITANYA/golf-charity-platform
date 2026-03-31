'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { Trash2, Plus, Star } from 'lucide-react';
import { toast } from 'sonner';
import type { Charity } from '@/types';

export default function AdminCharitiesPage() {
  const supabase = createClient();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [form, setForm] = useState({ name: '', description: '', is_featured: false });
  const [submitting, setSubmitting] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCharities = async () => {
    const { data } = await supabase.from('charities').select('*').order('created_at', { ascending: false });
    setCharities(data ?? []);
    setLoadingList(false);
  };

  useEffect(() => { fetchCharities(); }, []);

  const addCharity = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.description.trim()) { toast.error('Description is required'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('charities').insert(form);
    if (error) toast.error('Failed to add charity');
    else {
      toast.success(`"${form.name}" added`);
      setForm({ name: '', description: '', is_featured: false });
      await fetchCharities();
    }
    setSubmitting(false);
  };

  const deleteCharity = async (id: string, name: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('charities').delete().eq('id', id);
    if (error) toast.error('Failed to delete charity');
    else { toast.success(`"${name}" removed`); await fetchCharities(); }
    setDeletingId(null);
  };

  const toggleFeatured = async (id: string, current: boolean, name: string) => {
    const { error } = await supabase.from('charities').update({ is_featured: !current }).eq('id', id);
    if (error) toast.error('Failed to update');
    else {
      toast.success(current ? `"${name}" unfeatured` : `"${name}" featured`);
      await fetchCharities();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader title="Charity Management" description={`${charities.length} partner organisation${charities.length !== 1 ? 's' : ''}`} />

      {/* Add form */}
      <Card className="bg-slate-800/60 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white text-base">
            <Plus className="w-4 h-4 text-emerald-400" /> Add New Charity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Cancer Research UK"
                className="bg-slate-700 border-slate-600 text-white focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-slate-300 text-sm">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the charity's mission..."
                className="bg-slate-700 border-slate-600 text-white focus:border-emerald-500"
                rows={2}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                className="w-4 h-4 accent-emerald-500"
              />
              <span className="text-slate-300 text-sm">Mark as featured</span>
            </label>
            <Button onClick={addCharity} disabled={submitting} className="bg-emerald-500 hover:bg-emerald-600 gap-2">
              <Plus className="w-4 h-4" />
              {submitting ? 'Adding...' : 'Add Charity'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loadingList ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {charities.map((c) => (
            <Card key={c.id} className="bg-slate-800/60 border-slate-700">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white">{c.name}</p>
                      {c.is_featured && (
                        <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-2">{c.description}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleFeatured(c.id, c.is_featured, c.name)}
                      className={`h-8 w-8 p-0 ${c.is_featured ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-amber-400'}`}
                      title={c.is_featured ? 'Unfeature' : 'Feature'}
                    >
                      <Star className={`w-4 h-4 ${c.is_featured ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCharity(c.id, c.name)}
                      disabled={deletingId === c.id}
                      className="h-8 w-8 p-0 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      {deletingId === c.id
                        ? <span className="w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                      }
                    </Button>
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
