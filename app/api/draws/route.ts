import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generateRandomDraw, generateAlgorithmicDraw } from '@/lib/draw-engine';
import { z } from 'zod';

const schema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2024),
  draw_type: z.enum(['random', 'algorithmic']),
  prize_pool_total: z.number().min(0),
  jackpot_rollover: z.number().min(0).default(0),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const drawn_numbers = data.draw_type === 'algorithmic'
      ? await generateAlgorithmicDraw(supabase)
      : generateRandomDraw();

    const { error } = await supabase.from('draws').insert({
      month: data.month,
      year: data.year,
      drawn_numbers,
      draw_type: data.draw_type,
      status: 'simulation',
      prize_pool_total: data.prize_pool_total,
      jackpot_rollover: data.jackpot_rollover,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ drawn_numbers });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
