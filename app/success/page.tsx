import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
        <h1 className="text-3xl font-bold text-white">Payment Successful</h1>
        <p className="text-slate-400">Your subscription is now active. Welcome to GolfGives!</p>
        <Link href="/dashboard">
          <Button className="bg-emerald-500 hover:bg-emerald-400 mt-2">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
