import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  loading?: boolean;
  sub?: string;
}

export function StatCard({ label, value, icon: Icon, iconColor = 'text-emerald-400', loading, sub }: StatCardProps) {
  return (
    <Card className="bg-slate-800/60 border-slate-700 text-white hover:bg-slate-800 transition-colors">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-slate-400">{label}</CardTitle>
        <Icon className={cn('w-4 h-4', iconColor)} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
