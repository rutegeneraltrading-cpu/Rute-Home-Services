'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Activity,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  isPositive: boolean;
  icon: React.ReactNode;
}

function StatCard({ title, value, change, isPositive, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
          {isPositive ? (
            <TrendingUp className="w-3 h-3 text-green-600" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-600" />
          )}
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {Math.abs(change)}%
          </span>
          <span>from last month</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  const stats = [
    {
      title: 'Total Revenue',
      value: '$12,345',
      change: 12.5,
      isPositive: true,
      icon: <ShoppingCart className="w-4 h-4" />,
    },
    {
      title: 'Active Users',
      value: '1,234',
      change: 5.2,
      isPositive: true,
      icon: <Users className="w-4 h-4" />,
    },
    {
      title: 'Total Orders',
      value: '456',
      change: -2.1,
      isPositive: false,
      icon: <ShoppingCart className="w-4 h-4" />,
    },
    {
      title: 'Active Services',
      value: '89',
      change: 8.3,
      isPositive: true,
      icon: <Activity className="w-4 h-4" />,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
