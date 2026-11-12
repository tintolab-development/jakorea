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
 * BE 마스킹 생년월일 API 형식(`yyyy-**-**`)을 정책 §4-1 표기(`yyyy.**.**`)로 바꾼다.
 * 그 밖의 값(원문·이미 정책 표기·빈 값)은 그대로 둔다 — 날짜를 지어내지 않는다.
 */
export function toPolicyMaskedBirthDisplay(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ''
  return /^\d{4}-\*\*-\*\*$/.test(trimmed) ? `${trimmed.slice(0, 4)}.**.**` : trimmed
}

/** 생년월일·나이 표시. 마스킹 값은 정책 표기로 바꾸고 나이(0 포함 없음)는 있을 때만 붙인다. */
export function formatBirthWithOptionalAge(birthDate?: string | null, age?: number | null): string {
  const raw = birthDate?.trim() ?? ''
  const masked = toPolicyMaskedBirthDisplay(raw)
  const formatted = masked !== raw ? masked : raw ? raw.split('.').join('. ') : ''
  const hasAge = age != null && !(masked !== raw && age === 0)
  if (formatted && hasAge) return `${formatted} (만 ${age}세)`
  if (formatted) return formatted
  if (hasAge) return `만 ${age}세`
  return '-'
}

/**
 * 마스킹: `2017.**.**`(서버 age가 있을 때만 `(만 N세)`) · 원문: `1990. 03. 15 (만 N세)`
 * BE 마스킹 `yyyy-**-**` / 연도만(birthYear) 모두 지원. 마스킹 표시에서는 FE가 나이를 계산하지 않는다.
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
      // 달력에 없는 날짜(예: 2000-13-45)는 dayjs가 넘겨 계산하므로 원문 날짜·나이로 쓰지 않는다.
      if (y && m && d && dayjs(api).format('YYYY-MM-DD') === api) {
        const formatted = `${y}. ${String(m).padStart(2, '0')}. ${String(d).padStart(2, '0')}`
        const age = ageOverride ?? manAgeFromParts(y, m, d)
        return appendManAge(formatted, age)
      }
    }
  }

  const year = resolveBirthYear(raw, options?.birthYear)
  if (year == null || !Number.isFinite(year)) return '-'

  const maskedFormatted = `${year}.**.**`
  // 월·일을 모르면 만 나이를 계산하지 않는다(1월 1일 가정 금지). 서버가 준 age만 붙이며,
  // 마스킹 생년월일의 age 0은 formatBirthWithOptionalAge와 같이 표시하지 않는다.
  const age = ageOverride != null && ageOverride > 0 ? ageOverride : null
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

/**
 * 서버가 준 만 나이(age·teacherAge 등, 2026-11-12 BE 추가)를 좁게 읽는다. 생성 타입에 아직 없을 수 있다.
 * 숫자가 아니면 undefined — FE가 마스킹 생년월일로 나이를 계산하지 않는다.
 */
export function readServerManAge(dto: unknown, key = 'age'): number | undefined {
  const value = (dto as Record<string, unknown> | null | undefined)?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
