import { type ClassValue, clsx } from 'clsx'
import { toast } from 'svelte-sonner'
import { twMerge } from 'tailwind-merge'
import { pgClient } from '$lib/shared-variables.svelte.ts'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  const pad = (num: number) => num.toString().padStart(2, '0')
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fetch_data(table: string, columns: string, callback: Function) {
  pgClient
    .from(table)
    .select(columns)
    .then(({ data, error }) => {
      if (error) {
        toast.error(error.message)
        console.error(`Error fetching ${table} data:`, error)
      } else {
        callback(data)
      }
    })
}

export function findMonday(d: Date) {
  let day = d.getDay();
  let diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}
