export const JAKOREA_EMAIL_DOMAIN = '@jakorea.org'

const JAKOREA_EMAIL_PATTERN = /^[^\s@]+@jakorea\.org$/i

export function buildJakoreaEmail(localPart: string): string {
  return `${localPart.trim().toLowerCase()}${JAKOREA_EMAIL_DOMAIN}`
}

export function isValidJakoreaEmail(email: string): boolean {
  return JAKOREA_EMAIL_PATTERN.test(email.trim())
}

export function isValidJakoreaEmailLocalPart(localPart: string): boolean {
  const trimmed = localPart.trim()
  if (!trimmed) {
    return false
  }
  return /^[a-zA-Z0-9._-]+$/.test(trimmed)
}
