import { cn } from '@/lib/utils';

interface LoadingProps {
  fullScreen?: boolean;
  message?: string;
  className?: string;
}

export function Loading({
  fullScreen = true,
  message = 'RUTE',
  className,
}: LoadingProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        fullScreen
          ? 'fixed inset-0 backdrop-blur-sm z-50'
          : 'w-full h-full min-h-50',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-2xl font-bold text-foreground">{message}</span>
          <div className="flex gap-1">
            <span
              className="text-2xl font-bold text-green-600 animate-bounce-dot"
              style={{ animationDelay: '0ms' }}
            >
              .
            </span>
            <span
              className="text-2xl font-bold text-green-600 animate-bounce-dot"
              style={{ animationDelay: '200ms' }}
            >
              .
            </span>
            <span
              className="text-2xl font-bold text-green-600 animate-bounce-dot"
              style={{ animationDelay: '400ms' }}
            >
              .
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
