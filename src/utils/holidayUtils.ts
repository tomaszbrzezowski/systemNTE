import { isWeekend } from './dateUtils';

// List of fixed Polish holidays (month is 0-based)
const FIXED_HOLIDAYS = [
  { day: 1, month: 0 },   // Nowy Rok
  { day: 6, month: 0 },   // Trzech Króli
  { day: 1, month: 4 },   // Święto Pracy
  { day: 3, month: 4 },   // Święto Konstytucji
  { day: 15, month: 7 },  // Wniebowzięcie NMP
  { day: 1, month: 10 },  // Wszystkich Świętych
  { day: 11, month: 10 }, // Święto Niepodległości
  { day: 25, month: 11 }, // Boże Narodzenie
  { day: 26, month: 11 }  // Drugi dzień Bożego Narodzenia
];

// Calculate Easter Sunday for a given year
const getEasterDate = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month, day);
};

// Get movable holidays based on Easter
const getMovableHolidays = (year: number): Date[] => {
  const easter = getEasterDate(year);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);
  
  const pentecost = new Date(easter);
  pentecost.setDate(easter.getDate() + 49);
  
  return [easter, easterMonday, corpusChristi, pentecost];
};

export const isHoliday = (date: Date): boolean => {
  // Check weekends first
  if (isWeekend(date)) return true;
  
  // Check fixed holidays
  const isFixedHoliday = FIXED_HOLIDAYS.some(
    holiday => holiday.day === date.getDate() && holiday.month === date.getMonth()
  );
  if (isFixedHoliday) return true;
  
  // Check movable holidays
  const movableHolidays = getMovableHolidays(date.getFullYear());
  return movableHolidays.some(holiday => 
    holiday.getDate() === date.getDate() && 
    holiday.getMonth() === date.getMonth()
  );
};

export const getHolidayName = (date: Date): string | null => {
  // Fixed holidays
  const fixedHolidayNames: { [key: string]: string } = {
    '1-0': 'Nowy Rok',
    '6-0': 'Trzech Króli',
    '1-4': 'Święto Pracy',
    '3-4': 'Święto Konstytucji',
    '15-7': 'Wniebowzięcie NMP',
    '1-10': 'Wszystkich Świętych',
    '11-10': 'Święto Niepodległości',
    '25-11': 'Boże Narodzenie',
    '26-11': 'Drugi dzień Bożego Narodzenia'
  };

  const dateKey = `${date.getDate()}-${date.getMonth()}`;
  if (fixedHolidayNames[dateKey]) {
    return fixedHolidayNames[dateKey];
  }

  // Movable holidays
  const movableHolidays = getMovableHolidays(date.getFullYear());
  const holidayMap = new Map([
    [movableHolidays[0].getTime(), 'Wielkanoc'],
    [movableHolidays[1].getTime(), 'Poniedziałek Wielkanocny'],
    [movableHolidays[2].getTime(), 'Boże Ciało'],
    [movableHolidays[3].getTime(), 'Zielone Świątki']
  ]);

  return holidayMap.get(date.getTime()) || null;
};