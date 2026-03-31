'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function MarkPaidButton({ entryId }: { entryId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const markPaid = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('draw_entries')
      .update({ payment_status: 'paid' })
      .eq('id', entryId);
    setLoading(false);
    if (error) toast.error('Failed to update payment status');
    else { toast.success('Payment marked as paid'); router.refresh(); }
  };

  return (
    <Button size="sm" onClick={markPaid} disabled={loading}
      className="bg-emerald-500 hover:bg-emerald-600 text-xs h-7">
      {loading ? 'Saving...' : 'Mark Paid'}
    </Button>
  );
}
