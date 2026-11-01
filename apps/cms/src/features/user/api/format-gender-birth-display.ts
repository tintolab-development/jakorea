import dayjs from 'dayjs'
import { toApiBirthDate, toDisplayGender } from '@/features/user/api/map-member-gender-birth'

function isMaskedBirthDateValue(raw: string): boolean {
  return /[*]/.test(raw)
}

function resolveBirthYear(
  birthDate: string | null | undefined,
  birthYear: number | null | undefined
): number | undefined {
  if (birthYear != null && Number.isFinite(birthYear)) return birthYear
  const raw = birthDate?.trim()
  if (!raw) return undefined
  const api = toApiBirthDate(raw)
  if (api) return Number(api.slice(0, 4))
  const match = raw.match(/^(\d{4})/)
  return match ? Number(match[1]) : undefined
}

function manAgeFromParts(year: number, month: number, day: number): number | null {
  const birth = dayjs(
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  )
  if (!birth.isValid()) return null
  const today = dayjs()
  let age = today.year() - birth.year()
  if (
    today.month() < birth.month() ||
    (today.month() === birth.month() && today.date() < birth.date())
  ) {
    age -= 1
  }
  return age >= 0 ? age : null
}

function appendManAge(formatted: string, age: number | null | undefined): string {
  if (age == null || !Number.isFinite(age)) return formatted
  return `${formatted} (만 ${age}세)`
}

/**
 * 마스킹: `2017.**.** (만 N세)` · 원문: `1990. 03. 15 (만 N세)`
 * BE 마스킹 `yyyy-**-**` / 연도만(birthYear) 모두 지원.
 */
export function formatBirthDisplayWithManAge(
  birthDate: string | null | undefined,
  options?: {
    birthYear?: number | null
    /** API age가 있으면 우선(만 나이) */
    age?: number | null
    /** 마스킹 GET 등 — 월·일을 항상 `**.**`로 */
    forceMaskedDate?: boolean
  }
): string {
  const raw = birthDate?.trim()
  const ageOverride = options?.age

  if (raw && !options?.forceMaskedDate && !isMaskedBirthDateValue(raw)) {
    const api = toApiBirthDate(raw)
    if (api) {
      const [y, m, d] = api.split('-').map(part => Number(part))
      if (y && m && d) {
        const formatted = `${y}. ${String(m).padStart(2, '0')}. ${String(d).padStart(2, '0')}`
        const age = ageOverride ?? manAgeFromParts(y, m, d)
        return appendManAge(formatted, age)
      }
    }
  }

  const year = resolveBirthYear(raw, options?.birthYear)
  if (year == null || !Number.isFinite(year)) return '-'

  const maskedFormatted = `${year}.**.**`
  const age = ageOverride ?? manAgeFromParts(year, 1, 1)
  return appendManAge(maskedFormatted, age)
}

export function formatGenderBirthDisplayLine(
  gender: string | null | undefined,
  birthDate: string | null | undefined,
  options?: {
    birthYear?: number | null
    age?: number | null
    forceMaskedDate?: boolean
  }
): string {
  const genderPart = toDisplayGender(gender)
  const birthPart = formatBirthDisplayWithManAge(birthDate, options)
  if (genderPart === '-' && birthPart === '-') return '-'
  return `${genderPart} | ${birthPart}`
}
