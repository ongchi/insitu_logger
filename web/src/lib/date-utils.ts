export function formatDate(date: Date): string {
  const pad = (num: number) => num.toString().padStart(2, '0')
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function localDateStringToISOString(dateString: string | null): string | null {
  if (dateString == null || dateString == '') {
    return null
  }
  return dateToISOString(new Date(dateString))
}

function formatLocalDate(date: Date): string {
  let pad = (n: number) => n < 10 ? '0' + n : n;
  let hours_offset = date.getTimezoneOffset() / 60;
  date.setHours(date.getHours() - hours_offset);

  return date.getUTCFullYear() +
    '-' + pad(date.getUTCMonth() + 1) +
    '-' + pad(date.getUTCDate()) +
    'T' + pad(date.getUTCHours()) +
    ':' + pad(date.getUTCMinutes()) +
    ':' + pad(date.getUTCSeconds()) +
    '.' + (date.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5);
}

export function dateToISOString(date: Date | null): string | null {
  if (date == null) return null

  let dateCopy = new Date(date);
  let hours_offset = dateCopy.getTimezoneOffset() / 60;
  let symbol = (hours_offset >= 0) ? "-" : "+";
  let pad = (n: number) => n < 10 ? '0' + n : n;
  let time_zone = symbol + pad(Math.abs(hours_offset)) + ":00";

  return formatLocalDate(dateCopy) + time_zone;
}

export function dateToLocalString(date: Date | null): string | null {
  if (date == null) return null
  return formatLocalDate(new Date(date));
}

export function findMonday(d: Date) {
  let day = d.getDay();
  let diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}
