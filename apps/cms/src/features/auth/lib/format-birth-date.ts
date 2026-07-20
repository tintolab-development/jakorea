import {
  isValidCalendarDate,
  sanitizeDateTextInput,
} from '@/shared/ui/date-text-input'

const BIRTH_DATE_PATTERN = /^\d{4}\.\d{2}\.\d{2}$/

export function formatBirthDateInput(raw: string): string {
  return sanitizeDateTextInput(raw.replace(/\D/g, '').slice(0, 8))
}

export function isValidBirthDate(value: string): boolean {
  return BIRTH_DATE_PATTERN.test(value) && isValidCalendarDate(value)
}
