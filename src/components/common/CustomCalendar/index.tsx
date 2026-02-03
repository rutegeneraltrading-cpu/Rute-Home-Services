'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import moment from 'moment';
import {
  Calendar as ReactBigCalendar,
  Views,
  momentLocalizer,
  type DateLocalizer,
  type Formats,
  type View,
} from 'react-big-calendar';

import { CustomHeader, CustomEvent, CustomToolbar } from './parts';
import './CustomCalendar.css';
import type { CalendarEvent } from './types';

interface CustomCalendarProps {
  events: CalendarEvent[];
  loading?: boolean;
}

const localizer = momentLocalizer(moment);

const CustomCalendar: FC<CustomCalendarProps> = ({ events, loading }) => {
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());

  const { defaultDate, formats } = useMemo(() => {
    const formatWithFallback = (
      dateObj: Date,
      format: string,
      culture: string | undefined,
      localizerInstance?: DateLocalizer,
    ) =>
      localizerInstance
        ? localizerInstance.format(dateObj, format, culture)
        : moment(dateObj).format(format);

    const calendarFormats: Formats = {
      dayFormat: (
        dateObj: Date,
        culture: string | undefined,
        localizerInstance?: DateLocalizer,
      ) =>
        `${formatWithFallback(dateObj, 'ddd', culture, localizerInstance)}-${formatWithFallback(
          dateObj,
          'DD',
          culture,
          localizerInstance,
        )}`,
      weekdayFormat: (
        dateObj: Date,
        culture: string | undefined,
        localizerInstance?: DateLocalizer,
      ) => formatWithFallback(dateObj, 'ddd', culture, localizerInstance),
      timeGutterFormat: (
        dateObj: Date,
        culture: string | undefined,
        localizerInstance?: DateLocalizer,
      ) => formatWithFallback(dateObj, 'h A', culture, localizerInstance),
      eventTimeRangeFormat: () => '',
      agendaTimeRangeFormat: (
        { start, end }: { start: Date; end: Date },
        culture: string | undefined,
        localizerInstance?: DateLocalizer,
      ) =>
        `${formatWithFallback(start, 'h:mm A', culture, localizerInstance)} - ${formatWithFallback(
          end,
          'h:mm A',
          culture,
          localizerInstance,
        )}`,
    };

    return {
      defaultDate: date,
      formats: calendarFormats,
    };
  }, [date]);

  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  const handleNavigate = useCallback(
    (action: string) => {
      const newDate = new Date(date);
      switch (action) {
        case 'TODAY':
          setDate(new Date());
          break;
        case 'PREV':
          if (view === Views.MONTH) {
            newDate.setMonth(newDate.getMonth() - 1);
          } else if (view === Views.WEEK) {
            newDate.setDate(newDate.getDate() - 7);
          } else if (view === Views.DAY) {
            newDate.setDate(newDate.getDate() - 1);
          }
          setDate(newDate);
          break;
        case 'NEXT':
          if (view === Views.MONTH) {
            newDate.setMonth(newDate.getMonth() + 1);
          } else if (view === Views.WEEK) {
            newDate.setDate(newDate.getDate() + 7);
          } else if (view === Views.DAY) {
            newDate.setDate(newDate.getDate() + 1);
          }
          setDate(newDate);
          break;
        default:
          break;
      }
    },
    [date, view],
  );

  const scrollToTime = useMemo(() => {
    const now = new Date();
    now.setHours(now.getHours());
    now.setMinutes(0, 0, 0);
    return now;
  }, []);

  const label = useMemo(() => {
    if (view === Views.MONTH) {
      return moment(date).format('MMMM YYYY');
    } else if (view === Views.WEEK) {
      const start = moment(date).startOf('week').format('MMM DD');
      const end = moment(date).endOf('week').format('MMM DD');
      return `${start} - ${end}`;
    } else {
      return moment(date).format('MMMM DD, YYYY');
    }
  }, [date, view]);

  return (
    <div className="custom-calendar">
      <CustomToolbar
        label={label}
        onNavigate={handleNavigate}
        onView={handleViewChange}
        view={view}
      />
      <ReactBigCalendar
        popup
        selectable
        events={events}
        defaultView={Views.WEEK}
        date={date}
        scrollToTime={scrollToTime}
        dayLayoutAlgorithm="overlap"
        formats={formats}
        view={view}
        onView={handleViewChange}
        eventPropGetter={(event: CalendarEvent) => {
          return {
            className: `calendar-event ${event.status || ''}`.trim(),
            style: { marginLeft: '5px' },
          };
        }}
        components={{
          header: CustomHeader,
          event: ({ event }) => <CustomEvent event={event} />,
        }}
        localizer={localizer}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
        </div>
      )}
    </div>
  );
};

export default CustomCalendar;
