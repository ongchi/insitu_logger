import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  const pad = (num: number) => num.toString().padStart(2, '0')
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function localDateStringToISOString(dateString: string | null): string | null {
  if (dateString == null || dateString == '') {
    return null
  } else {
    let ret = dateToISOString(new Date(dateString));
    return ret
  }
}

export function dateToISOString(date: Date | null): string | null {
  if (date == null) return null

  let dateCopy = new Date(date);

  let pad = (n: number) => n < 10 ? '0' + n : n;
  let hours_offset = dateCopy.getTimezoneOffset() / 60;
  dateCopy.setHours(dateCopy.getHours() - hours_offset);
  let symbol = (hours_offset >= 0) ? "-" : "+";
  let time_zone = symbol + pad(Math.abs(hours_offset)) + ":00";

  return dateCopy.getUTCFullYear() +
    '-' + pad(dateCopy.getUTCMonth() + 1) +
    '-' + pad(dateCopy.getUTCDate()) +
    'T' + pad(dateCopy.getUTCHours()) +
    ':' + pad(dateCopy.getUTCMinutes()) +
    ':' + pad(dateCopy.getUTCSeconds()) +
    '.' + (dateCopy.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
    time_zone;
}

export function dateToLocalString(date: Date | null): string | null {
  if (date == null) return null

  let dateCopy = new Date(date);

  let pad = (n: number) => n < 10 ? '0' + n : n;
  let hours_offset = dateCopy.getTimezoneOffset() / 60;
  dateCopy.setHours(dateCopy.getHours() - hours_offset);

  return dateCopy.getUTCFullYear() +
    '-' + pad(dateCopy.getUTCMonth() + 1) +
    '-' + pad(dateCopy.getUTCDate()) +
    'T' + pad(dateCopy.getUTCHours()) +
    ':' + pad(dateCopy.getUTCMinutes()) +
    ':' + pad(dateCopy.getUTCSeconds()) +
    '.' + (dateCopy.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5);
}

export function findMonday(d: Date) {
  let day = d.getDay();
  let diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}
