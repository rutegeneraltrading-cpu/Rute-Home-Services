'use client';

import { memo } from 'react';
import { Edit2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/client';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CalendarEvent } from '../types';

interface CustomEventProps {
  event: CalendarEvent & {
    workers?: { name: string; email?: string; status: string }[];
  };
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-200 hover:bg-yellow-200';
    case 'confirmed':
      return 'bg-blue-300 hover:bg-blue-200';
    case 'assigned':
      return 'bg-indigo-300 hover:bg-indigo-200';
    case 'in_progress':
      return 'bg-purple-300 hover:bg-purple-200';
    case 'completed':
      return 'bg-green-300 hover:bg-green-200';
    case 'cancelled':
      return 'bg-red-300 hover:bg-red-200';
    default:
      return 'bg-slate-300 hover:bg-slate-200';
  }
};

const CustomEvent = ({ event }: CustomEventProps) => {
  const timeRange =
    event.start && event.end
      ? `${event.start.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })} - ${event.end.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })}`
      : 'Time not set';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'calendar-event p-2 rounded-md cursor-pointer transition-colors h-full',
            getStatusColor(event.status),
          )}
        >
          <div className="text-xs font-medium text-slate-700">{timeRange}</div>
          <div className="text-sm font-semibold truncate">{event.title}</div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="max-w-xs">
        <div className="space-y-3">
          <div>
            <div className="text-sm font-semibold">{event.title}</div>
            <div className="text-xs opacity-80">{timeRange}</div>
            {event.status && (
              <div className="text-[11px] uppercase tracking-wide opacity-80">
                Status: {event.status}
              </div>
            )}
          </div>

          {event.workers && event.workers.length > 0 && (
            <div className="border-t border-slate-600 pt-2 space-y-1">
              <div className="text-xs font-semibold">Assigned Workers</div>
              <ol className="text-xs list-decimal list-inside">
                {event.workers.map((w, idx) => (
                  <li key={w.name + idx} className="mb-1 flex flex-col">
                    <div className="font-medium flex justify-between">
                      <span>{w.name}</span>{' '}
                      <span
                        className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          w.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : w.status === 'accepted'
                              ? 'bg-blue-100 text-blue-700'
                              : w.status === 'declined'
                                ? 'bg-red-100 text-red-700'
                                : w.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : w.status === 'cancelled'
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>
                    {w.email && (
                      <span className="ml-1 text-gray-300">{w.email}</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {event.onEdit && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 bg-black"
                onClick={(e) => {
                  e.stopPropagation();
                  event.onEdit?.(event.id);
                }}
                title="Update Booking"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
            {event.onView && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 bg-black"
                onClick={(e) => {
                  e.stopPropagation();
                  event.onView?.(event.id);
                }}
                title="View Details"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default memo(CustomEvent);
