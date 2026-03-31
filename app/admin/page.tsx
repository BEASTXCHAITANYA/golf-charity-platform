export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Trophy, Heart, DollarSign, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { count: totalUsers },
    { count: activeSubscribers },
    { count: totalCharities },
    { count: pendingPayouts },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    supabase.from('charities').select('*', { count: 'exact', head: true }),
    supabase.from('draw_entries').select('*', { count: 'exact', head: true }).eq('payment_status', 'pending').gt('prize_won', 0),
  ]);

  const quickLinks = [
    { href: '/admin/users',     label: 'Manage Users',     sub: 'View and filter all members' },
    { href: '/admin/draws',     label: 'Run Draw',         sub: 'Create or publish a monthly draw' },
    { href: '/admin/charities', label: 'Charities',        sub: 'Add, edit or feature charities' },
    { href: '/admin/winners',   label: 'Verify Winners',   sub: 'Review proofs and mark payouts' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <PageHeader title="Admin Overview" description="Platform health at a glance" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"        value={totalUsers ?? 0}        icon={Users}       iconColor="text-blue-400"    sub="registered accounts" />
        <StatCard label="Active Subscribers" value={activeSubscribers ?? 0} icon={Trophy}      iconColor="text-emerald-400" sub="paying members" />
        <StatCard label="Charities"          value={totalCharities ?? 0}    icon={Heart}       iconColor="text-rose-400"    sub="partner organisations" />
        <StatCard label="Pending Payouts"    value={pendingPayouts ?? 0}    icon={DollarSign}  iconColor="text-amber-400"   sub="awaiting payment" />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map(({ href, label, sub }) => (
            <Link key={href} href={href}>
              <Card className="bg-slate-800/60 border-slate-700 hover:border-slate-500 hover:bg-slate-800 transition-all cursor-pointer group h-full">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">{label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors mt-0.5 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
