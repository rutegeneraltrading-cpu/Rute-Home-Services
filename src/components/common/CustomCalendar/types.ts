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
  onEdit?: (eventId: string) => void;
  onView?: (eventId: string) => void;
  workerName?: string;
  workerEmail?: string;
  assignmentStatus?: CalendarStatus;
}
