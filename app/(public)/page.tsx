'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Heart, Target, ArrowRight, CheckCircle, Star } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">

      {/* Sticky nav */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/70 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span>⛳</span>
            <span className="bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">GolfGives</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/charities" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors">
              Charities
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">Login</Button>
            </Link>
            <Link href="/subscribe">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={fadeUp}>
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1">
              ⛳ Golf · Prizes · Charity
            </Badge>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight">
            Play Golf.{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Win Prizes.
            </span>
            <br />Change Lives.
          </motion.h1>
          <motion.p variants={fadeUp} className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Track your Stableford scores, enter monthly prize draws, and fund the charities you care about — all in one platform.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href="/subscribe">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 gap-2 shadow-xl shadow-emerald-500/20">
                Start Today — from £15/mo <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/charities">
              <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 px-8">
                Browse Charities
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
          <p className="text-slate-400 max-w-lg mx-auto">Three simple steps to start making a difference with every round you play.</p>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Target className="w-8 h-8 text-blue-400" />,
              step: '01',
              title: 'Track Your Scores',
              desc: 'Log your Stableford scores after each round. Your 5 most recent scores become your monthly draw entry numbers.',
              border: 'border-blue-500/20',
              bg: 'from-blue-500/10 to-transparent',
            },
            {
              icon: <Trophy className="w-8 h-8 text-amber-400" />,
              step: '02',
              title: 'Enter Monthly Draws',
              desc: 'Each month, 5 numbers are drawn. Match 3, 4, or all 5 to win prizes — including a jackpot that rolls over if unclaimed!',
              border: 'border-amber-500/20',
              bg: 'from-amber-500/10 to-transparent',
            },
            {
              icon: <Heart className="w-8 h-8 text-rose-400" />,
              step: '03',
              title: 'Fund Your Charity',
              desc: 'Choose a charity partner and decide how much of your subscription supports them. Minimum 10%, no maximum.',
              border: 'border-rose-500/20',
              bg: 'from-rose-500/10 to-transparent',
            },
          ].map((item) => (
            <motion.div key={item.step} variants={fadeUp}>
              <Card className={`bg-gradient-to-b ${item.bg} border ${item.border} h-full hover:scale-[1.01] transition-transform duration-200`}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    {item.icon}
                    <span className="text-4xl font-black text-slate-800">{item.step}</span>
                  </div>
                  <CardTitle className="text-white text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Prize breakdown */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-slate-700/60 bg-slate-800/30 overflow-hidden"
        >
          <div className="px-8 py-5 border-b border-slate-700/40">
            <h3 className="text-lg font-bold text-white">Monthly Prize Structure</h3>
            <p className="text-slate-500 text-sm mt-0.5">Every month&apos;s pool split across three tiers</p>
          </div>
          <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/40">
            {[
              { match: '5 Matches', tier: 'Jackpot', pct: '40%', color: 'text-amber-400',   note: 'Rolls over if unclaimed' },
              { match: '4 Matches', tier: 'Tier 2',  pct: '35%', color: 'text-emerald-400', note: 'Split among all winners' },
              { match: '3 Matches', tier: 'Tier 3',  pct: '25%', color: 'text-blue-400',    note: 'Split among all winners' },
            ].map((p) => (
              <div key={p.tier} className="px-6 py-5 text-center">
                <p className={`text-3xl font-black ${p.color}`}>{p.pct}</p>
                <p className="text-white font-semibold mt-1">{p.tier}</p>
                <p className="text-slate-500 text-xs mt-0.5">{p.match}</p>
                <p className="text-slate-600 text-xs mt-2 italic">{p.note}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Pricing */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-3">Simple, Transparent Pricing</h2>
        <p className="text-slate-400 mb-12">Cancel anytime. No hidden fees.</p>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            { name: 'Monthly', price: '£15', period: '/mo', highlight: false, badge: null },
            { name: 'Yearly',  price: '£150', period: '/yr', highlight: true,  badge: '2 months free' },
          ].map(({ name, price, period, highlight, badge }) => (
            <Card key={name} className={`border-2 text-left ${highlight ? 'border-emerald-500/60 bg-emerald-950/20' : 'border-slate-700 bg-slate-800/40'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-white">{name}</CardTitle>
                  {badge && <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">{badge}</Badge>}
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-black text-white">{price}</span>
                  <span className="text-slate-400 text-sm">{period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5 mb-6">
                  {['Monthly prize draws', 'Score tracking (up to 5)', 'Charity contributions', 'Jackpot rollover system'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/subscribe">
                  <Button className={`w-full gap-2 ${highlight ? 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>
                    Subscribe Now <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="max-w-2xl mx-auto px-6 py-12 text-center">
        <div className="flex justify-center gap-1 mb-4">
          {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
        </div>
        <blockquote className="text-lg text-slate-300 italic mb-3">
          &quot;I love that my golf hobby now directly funds causes I care about. The monthly draws make it exciting too!&quot;
        </blockquote>
        <p className="text-slate-600 text-sm">— Early platform member</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-slate-500 text-sm">© 2026 GolfGives — Built for Digital Heroes</span>
          <div className="flex gap-6 text-sm">
            <Link href="/charities" className="text-slate-400 hover:text-emerald-400 transition-colors">Charities</Link>
            <Link href="/login"     className="text-slate-400 hover:text-emerald-400 transition-colors">Login</Link>
            <Link href="/subscribe" className="text-slate-400 hover:text-emerald-400 transition-colors">Subscribe</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
