'use client';

import { memo } from 'react';
import type { HeaderProps } from 'react-big-calendar';

const CustomHeader = ({ date }: HeaderProps) => {
  const day = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(
    date,
  );
  const dayNumber = new Intl.DateTimeFormat('en-US', { day: '2-digit' }).format(
    date,
  );

  return (
    <div className="flex flex-col items-center">
      <span className="text-xs uppercase tracking-wide text-slate-500">
        {day}
      </span>
      <span className="text-lg font-semibold text-slate-900">{dayNumber}</span>
    </div>
  );
};

export default memo(CustomHeader);
