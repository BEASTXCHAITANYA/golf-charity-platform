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
  full_name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Must contain an uppercase letter' })
    .regex(/[0-9]/, { message: 'Must contain a number' }),
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
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
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.full_name } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/subscribe');
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
          <CardTitle className="text-2xl">Join GolfGives</CardTitle>
          <CardDescription className="text-slate-400">Create your account and start making an impact</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-slate-300 text-sm">Full Name</Label>
              <Input id="full_name" {...register('full_name')}
                className="bg-slate-700 border-slate-600 text-white focus:border-emerald-500"
                placeholder="John Smith" />
              {errors.full_name && <p className="text-rose-400 text-xs">{errors.full_name.message}</p>}
            </div>
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
              <p className="text-slate-600 text-xs">Min 8 chars · one uppercase · one number</p>
            </div>
            {error && (
              <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <p className="text-rose-400 text-sm">{error}</p>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 mt-1">
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>
          <p className="text-center text-slate-500 mt-5 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
