export const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

export const getFirstDayOfMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

export const getDayName = (date: Date, dayNumber: number): string => {
  const newDate = new Date(date.getFullYear(), date.getMonth(), dayNumber);
  const days = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
  return days[newDate.getDay()];
};

export const formatDate = (date: Date): string => {
  // Create new date object with time set to midnight UTC
  const localDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = localDate.getDate();
  const month = localDate.getMonth() + 1;
  const year = localDate.getFullYear();

  return `${day} ${month < 10 ? '0' + month : month} ${year}`;
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

export const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  // Ensure both dates are in UTC
  const start = new Date(Date.UTC(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  ));
  const end = new Date(Date.UTC(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  ));

  // Get min and max dates
  const minDate = new Date(Math.min(start.getTime(), end.getTime()));
  const maxDate = new Date(Math.max(start.getTime(), end.getTime()));
  
  // Clone minDate to avoid modifying it
  const current = new Date(minDate);

  while (current <= maxDate) {
    dates.push(new Date(Date.UTC(
      current.getUTCFullYear(),
      current.getUTCMonth(),
      current.getUTCDate()
    )));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return isSameDay(date, today);
};

export const getDaysDifference = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
};

export const isWithinDays = (date: Date, days: number): boolean => {
  const today = new Date();
  const difference = getDaysDifference(date, today);
  return difference <= days && date >= today;
};

export const shouldBlinkStatus = (date: Date, status: string): boolean => {
  // Only blink for 'wydany' status within 30 days
  if (status !== 'wydany') { 
    return false;
  }
  
  const today = new Date();
  const daysDifference = getDaysDifference(today, date);
  
  // Only blink for upcoming dates within next 30 days
  if (date < today || daysDifference > 30) {
    return false;
  }

  return true;
};