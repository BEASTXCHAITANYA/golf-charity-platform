export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

export default async function CharityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: charity } = await supabase.from('charities').select('*').eq('id', id).single();
  if (!charity) notFound();

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

      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/charities"
          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm mb-8 transition-colors">
          ← All Charities
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-4xl font-bold text-white">{charity.name}</h1>
          {charity.is_featured && (
            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
              Featured
            </Badge>
          )}
        </div>
        <p className="text-slate-300 text-lg leading-relaxed mb-10">{charity.description}</p>

        {/* Events */}
        {charity.events && charity.events.length > 0 && (
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-white mb-4">Upcoming Events</h2>
            <div className="space-y-3">
              {charity.events.map((event: any, i: number) => (
                <Card key={i} className="bg-slate-800/60 border-slate-700">
                  <CardContent className="pt-4 pb-4">
                    <p className="font-semibold text-white">{event.title}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />{event.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />{event.location}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Subscribe CTA */}
        <div className="py-8 px-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center">
          <p className="text-white font-semibold mb-1">Support {charity.name}</p>
          <p className="text-slate-400 text-sm mb-4">Choose this charity when you subscribe and a portion of every payment goes directly to them.</p>
          <Link href="/subscribe">
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-white gap-2">
              Subscribe & Support <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
