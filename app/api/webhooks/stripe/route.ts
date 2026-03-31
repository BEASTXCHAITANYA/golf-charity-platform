import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const getCustomerUserId = async (customerId: string): Promise<string | null> => {
    const { data } = await supabase.from('profiles').select('id').eq('stripe_customer_id', customerId).single();
    return data?.id ?? null;
  };

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan as 'monthly' | 'yearly';
      if (!userId) break;

      const endDate = new Date();
      if (plan === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
      else endDate.setMonth(endDate.getMonth() + 1);

      await supabase.from('profiles').update({
        subscription_status: 'active',
        subscription_plan: plan,
        subscription_end_date: endDate.toISOString(),
      }).eq('id', userId);

      if (session.subscription) {
        await supabase.from('subscriptions').insert({
          user_id: userId,
          stripe_subscription_id: session.subscription as string,
          plan,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          status: 'active',
        });
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const userId = await getCustomerUserId(invoice.customer as string);
      if (!userId) break;

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      await supabase.from('profiles').update({
        subscription_status: 'active',
        subscription_end_date: endDate.toISOString(),
      }).eq('id', userId);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const userId = await getCustomerUserId(sub.customer as string);
      if (!userId) break;
      await supabase.from('profiles').update({ subscription_status: 'lapsed' }).eq('id', userId);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const userId = await getCustomerUserId(invoice.customer as string);
      if (!userId) break;
      await supabase.from('profiles').update({ subscription_status: 'inactive' }).eq('id', userId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
