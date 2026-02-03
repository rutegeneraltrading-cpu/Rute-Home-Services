export type CalendarStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | string;

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status?: CalendarStatus;
}
