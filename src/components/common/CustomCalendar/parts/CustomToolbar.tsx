'use client';

import { memo } from 'react';
import { Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { cn } from '@/lib/client';
import type { CalendarEvent } from '../types';

interface CustomToolbarProps {
  label: string;
  onNavigate: (action: string) => void;
  onView: (newView: View) => void;
  view: View;
}

const CustomToolbar = ({
  label,
  onNavigate,
  onView,
  view,
}: CustomToolbarProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-6 bg-white py-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onNavigate('TODAY')}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => onNavigate('PREV')}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => onNavigate('NEXT')}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform"
          >
            Next
          </button>
        </div>
        <div className="text-sm font-semibold text-slate-900 min-w-50">
          {label}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {[Views.DAY, Views.WEEK, Views.MONTH].map((viewOption) => (
            <button
              key={viewOption}
              type="button"
              onClick={() => onView(viewOption)}
              className={cn(
                'rounded-md px-3 py-1 text-sm font-semibold capitalize text-slate-600 transition-all',
                view === viewOption && 'bg-slate-900 text-white shadow-sm',
              )}
            >
              {viewOption}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(CustomToolbar);
