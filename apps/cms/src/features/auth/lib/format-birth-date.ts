const BIRTH_DATE_PATTERN = /^\d{4}\.\d{2}\.\d{2}$/

export function formatBirthDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)

  if (digits.length <= 4) {
    return digits
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 4)}.${digits.slice(4)}`
  }
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`
}

export function isValidBirthDate(value: string): boolean {
  return BIRTH_DATE_PATTERN.test(value)
}
