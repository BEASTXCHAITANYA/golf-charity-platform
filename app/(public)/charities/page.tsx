export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Heart, Calendar, ArrowRight } from 'lucide-react';
import type { Charity } from '@/types';

export default async function CharitiesPage() {
  const supabase = await createClient();
  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .order('is_featured', { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/70 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span>⛳</span>
            <span className="bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">GolfGives</span>
          </Link>
          <Link href="/subscribe">
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-white">Subscribe</Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm mb-8 transition-colors">
          ← Back to Home
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Our Charity Partners</h1>
          <p className="text-slate-400">Every subscription helps fund these incredible organisations</p>
        </div>

        {(!charities || charities.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1">No charity partners yet</p>
            <p className="text-slate-600 text-sm">Check back soon — we&apos;re onboarding new charities.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {charities.map((charity: Charity) => (
              <Link key={charity.id} href={`/charities/${charity.id}`} className="group">
                <Card className="bg-slate-800/60 border-slate-700 group-hover:border-emerald-500/50 group-hover:bg-slate-800 transition-all h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base text-white group-hover:text-emerald-400 transition-colors leading-snug">
                        {charity.name}
                      </CardTitle>
                      {charity.is_featured && (
                        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs flex-shrink-0">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">{charity.description}</p>
                    <div className="flex items-center justify-between pt-1">
                      {charity.events && charity.events.length > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {charity.events.length} event{charity.events.length > 1 ? 's' : ''}
                        </span>
                      ) : <span />}
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Subscribe CTA */}
        <div className="mt-16 text-center py-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-white font-semibold text-lg mb-2">Support a charity with every round</p>
          <p className="text-slate-400 text-sm mb-5">Subscribe to choose your charity and start contributing today</p>
          <Link href="/subscribe">
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-white gap-2 shadow-lg shadow-emerald-500/20">
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
