'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Users, ChevronUp, ChevronDown } from 'lucide-react';

type SortKey = 'full_name' | 'subscription_status' | 'subscription_plan' | 'charity_percentage';
type SortDir = 'asc' | 'desc';

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('full_name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*, charities(name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setUsers(data ?? []); setLoading(false); });
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let list = [...users];
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(u =>
        u.full_name?.toLowerCase().includes(q) ||
        u.stripe_customer_id?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter(u => u.subscription_status === statusFilter);
    }
    list.sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [users, query, statusFilter, sortKey, sortDir]);

  const statusCounts = useMemo(() => ({
    all: users.length,
    active: users.filter(u => u.subscription_status === 'active').length,
    inactive: users.filter(u => u.subscription_status === 'inactive').length,
    lapsed: users.filter(u => u.subscription_status === 'lapsed').length,
  }), [users]);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-emerald-400" /> : <ChevronDown className="w-3 h-3 text-emerald-400" />;
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="Users"
        description={`${users.length} total members`}
      />

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name..."
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive', 'lapsed'] as const).map((status) => (
            <Button
              key={status}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={`capitalize text-xs ${
                statusFilter === status
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
              }`}
            >
              {status} ({statusCounts[status]})
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm">No users match your filters</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 border-b border-slate-700">
                  <th className="text-left py-3 px-4">
                    <button onClick={() => toggleSort('full_name')} className="flex items-center gap-1 text-slate-400 hover:text-white font-medium text-xs uppercase tracking-wide">
                      Name <SortIcon col="full_name" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4">
                    <button onClick={() => toggleSort('subscription_status')} className="flex items-center gap-1 text-slate-400 hover:text-white font-medium text-xs uppercase tracking-wide">
                      Status <SortIcon col="subscription_status" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4">
                    <button onClick={() => toggleSort('subscription_plan')} className="flex items-center gap-1 text-slate-400 hover:text-white font-medium text-xs uppercase tracking-wide">
                      Plan <SortIcon col="subscription_plan" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wide">Role</th>
                  <th className="text-left py-3 px-4">
                    <button onClick={() => toggleSort('charity_percentage')} className="flex items-center gap-1 text-slate-400 hover:text-white font-medium text-xs uppercase tracking-wide">
                      Charity % <SortIcon col="charity_percentage" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wide">Charity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map((user) => (
                  <tr key={user.id} className="bg-slate-800/30 hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-white">{user.full_name}</td>
                    <td className="py-3 px-4">
                      <Badge className={
                        user.subscription_status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : user.subscription_status === 'lapsed'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }>
                        {user.subscription_status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-300 capitalize">{user.subscription_plan ?? <span className="text-slate-600">—</span>}</td>
                    <td className="py-3 px-4">
                      <Badge className={user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-700 text-slate-400 border border-slate-600'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-300 tabular-nums">{user.charity_percentage}%</td>
                    <td className="py-3 px-4 text-slate-400 text-sm">{user.charities?.name ?? <span className="text-slate-600">Not selected</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/50">
            <p className="text-xs text-slate-500">Showing {filtered.length} of {users.length} users</p>
          </div>
        </div>
      )}
    </div>
  );
}
