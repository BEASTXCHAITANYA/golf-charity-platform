'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SubscribePage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setLoading(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const { url, error } = await res.json();
      if (error) { toast.error(error); return; }
      if (url) window.location.href = url;
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const features = [
    'Monthly prize draws',
    'Stableford score tracking',
    'Charity contributions (min 10%)',
    'Draw history & winnings tracker',
    'Jackpot rollover system',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/70 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span>⛳</span>
            <span className="bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">GolfGives</span>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">Login</Button>
          </Link>
        </div>
      </nav>

      <div className="flex items-center justify-center px-4 py-16 min-h-[calc(100vh-3.5rem)]">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-3">Choose Your Plan</h1>
            <p className="text-slate-400">Join the community, track your game, and support great causes</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {([
              { plan: 'monthly' as const, name: 'Monthly', price: '£15', period: '/month', badge: null,                highlight: false },
              { plan: 'yearly'  as const, name: 'Yearly',  price: '£150', period: '/year', badge: '2 months free', highlight: true  },
            ]).map(({ plan, name, price, period, badge, highlight }) => (
              <Card key={plan} className={`border-2 text-white ${highlight ? 'border-emerald-500/70 bg-emerald-950/20' : 'border-slate-700 bg-slate-800/60'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{name}</CardTitle>
                    {badge && (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
                        {badge}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-black">{price}</span>
                    <span className="text-slate-400 text-sm">{period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5 mb-6">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading !== null}
                    className={`w-full gap-2 ${highlight ? 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                  >
                    {loading === plan
                      ? 'Redirecting to checkout…'
                      : <><span>Subscribe {name}</span><ArrowRight className="w-4 h-4" /></>
                    }
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-slate-600 text-xs mt-8">
            Cancel anytime · Secure payments via Stripe · No hidden fees
          </p>
        </div>
      </div>
    </div>
  );
}
