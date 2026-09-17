/**
 * 일반 프로그램 상세 표시 — null/빈 문자열만 "-", false·enum·0은 의미 있는 라벨로.
 * 빈 배열([])은 결측이 아님 — pickDisplayValue에서 skip하지 않고 호출부에서 「없음」 UI로 처리.
 */
import { formatNumberDisplay } from '@/shared/utils'

export function isBlankDisplayValue(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  // [] is intentional empty (handoff: do not treat as missing)
  if (Array.isArray(value)) return false
  return false
}

/** 첫 non-null / non-empty 후보 */
export function pickDisplayValue<T>(...candidates: Array<T | null | undefined>): T | undefined {
  for (const candidate of candidates) {
    if (isBlankDisplayValue(candidate)) continue
    return candidate as T
  }
  return undefined
}

export function pickDisplayString(...candidates: Array<string | null | undefined>): string {
  return pickDisplayValue(...candidates) ?? '-'
}

export function labelBool(
  value: boolean | null | undefined,
  yes: string,
  no: string
): string {
  if (value == null) return '-'
  return value ? yes : no
}

export function labelEnum(
  value: string | null | undefined,
  map: Record<string, string>
): string {
  if (value == null || value === '') return '-'
  return map[value] ?? value
}

export function formatCountLabel(value: number | null | undefined, suffix: string): string {
  if (value == null || Number.isNaN(value)) return '-'
  return `${formatNumberDisplay(value)}${suffix}`
}

/** 기관·학교 상세 td — `N개 학급` / `총 N명` (천단위 콤마) */
export function formatClassCountLabel(classCount: number | null | undefined): string {
  if (classCount == null || Number.isNaN(classCount)) return '-'
  return `${formatNumberDisplay(classCount)}개 학급`
}

export function formatTotalStudentCountLabel(studentCount: number | null | undefined): string {
  if (studentCount == null || Number.isNaN(studentCount)) return '-'
  return `총 ${formatNumberDisplay(studentCount)}명`
}

/** DetailInfoForm 세그먼트용 — 학급수·인원 한 쌍 */
export function formatClassStudentCountSegments(
  classCount: number | null | undefined,
  studentCount: number | null | undefined
): [string, string] {
  return [formatClassCountLabel(classCount), formatTotalStudentCountLabel(studentCount)]
}
