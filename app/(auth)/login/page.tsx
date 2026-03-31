'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const schema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col items-center justify-center px-4">
      {/* Back link */}
      <Link href="/" className="text-emerald-400 hover:text-emerald-300 text-sm mb-6 transition-colors">
        ← Back to home
      </Link>

      <Card className="w-full max-w-md bg-slate-800/80 border-slate-700 text-white">
        <CardHeader className="text-center pb-4">
          <Link href="/" className="text-2xl mb-1 block">⛳</Link>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription className="text-slate-400">Sign in to your GolfGives account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300 text-sm">Email</Label>
              <Input id="email" type="email" {...register('email')}
                className="bg-slate-700 border-slate-600 text-white focus:border-emerald-500"
                placeholder="you@example.com" />
              {errors.email && <p className="text-rose-400 text-xs">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300 text-sm">Password</Label>
              <Input id="password" type="password" {...register('password')}
                className="bg-slate-700 border-slate-600 text-white focus:border-emerald-500"
                placeholder="••••••••" />
              {errors.password && <p className="text-rose-400 text-xs">{errors.password.message}</p>}
            </div>
            {error && (
              <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <p className="text-rose-400 text-sm">{error}</p>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 mt-1">
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
          <p className="text-center text-slate-500 mt-5 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 transition-colors">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
