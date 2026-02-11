import { format } from 'date-fns';

export const dateFormat = (date: string) => {
  return format(new Date(date), 'MMM dd, yyyy');
};
