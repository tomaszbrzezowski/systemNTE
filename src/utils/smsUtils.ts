const POLISH_CHARS = {
  'Ę': 'E', 'Ó': 'O', 'Ą': 'A', 'Ś': 'S', 'Ł': 'L', 
  'Ż': 'Z', 'Ź': 'Z', 'Ć': 'C', 'Ń': 'N',
  'ę': 'e', 'ó': 'o', 'ą': 'a', 'ś': 's', 'ł': 'l', 
  'ż': 'z', 'ź': 'z', 'ć': 'c', 'ń': 'n'
};

export const removeDiacritics = (str: string): string => {
  return str.replace(/[ĘÓĄŚŁŻŹĆŃęóąśłżźćń]/g, char => POLISH_CHARS[char as keyof typeof POLISH_CHARS] || char);
};

export const formatSmsMessage = (sms: {
  name: string;
  eventDate: string;
  title: string;
  eventCity: string;
  tickets: string;
}): string => {
  const template = 'Dzien dobry! Przypominamy o wyjsciu na spektakl pt. %TITLE, dnia %EVENT_DATE, %EVENT_CITY. Biuro Organizacji NTE';
  
  const formattedDate = new Date(sms.eventDate).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });

  const message = template
    .replace('%NAME', sms.name)
    .replace('%EVENT_DATE', formattedDate)
    .replace('%TITLE', sms.title)
    .replace('%EVENT_CITY', sms.eventCity)
    .replace('%TICKETS', sms.tickets);

  return removeDiacritics(message);
};