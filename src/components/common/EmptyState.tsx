import { Card, CardContent } from '@/components/ui/card';
import { ReactNode } from 'react';

interface EmptyStateProps {
  message: string;
  action?: ReactNode;
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">{message}</p>
          {action}
        </div>
      </CardContent>
    </Card>
  );
}
