export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Trophy, Heart, Award } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  const navItems = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/draws', label: 'Draws', icon: Trophy },
    { href: '/admin/charities', label: 'Charities', icon: Heart },
    { href: '/admin/winners', label: 'Winners', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <span className="text-xl font-bold text-white">⛳ Admin Panel</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700 gap-2">
                <item.icon className="w-4 h-4" />{item.label}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white gap-2 text-sm">
              ← User Dashboard
            </Button>
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto text-white">{children}</main>
    </div>
  );
}
