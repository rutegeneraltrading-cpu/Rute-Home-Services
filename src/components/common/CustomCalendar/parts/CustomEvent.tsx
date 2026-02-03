'use client';

import { memo } from 'react';
import { cn } from '@/lib/client';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CalendarEvent } from '../types';

interface CustomEventProps {
  event: CalendarEvent;
}

const CustomEvent = ({ event }: CustomEventProps) => {
  const timeRange =
    event.start && event.end
      ? `${event.start.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })} - ${event.end.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      : 'Time not set';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('calendar-event', event.status)}>
          <div className="text-xs font-medium text-slate-600">{timeRange}</div>
          <div className="text-sm font-semibold">{event.title}</div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="max-w-xs">
        <div className="space-y-1">
          <div className="text-sm font-semibold">{event.title}</div>
          <div className="text-xs opacity-80">{timeRange}</div>
          {event.status && (
            <div className="text-[11px] uppercase tracking-wide opacity-80">
              Status: {event.status}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default memo(CustomEvent);
