/**
 * 프로그램 공통정보 ENUM — GET/RHF/Select 대소문자 정규화.
 * 상세 폼 옵션(PascalCase)과 서버·등록 overlay(lowercase)를 맞춘다.
 * 빈 값·미지원 값을 JA 등으로 치환하지 않는다.
 */

export const COURSE_DELIVERED_BY_FORM_VALUES = ['JA', 'Jointly', 'Partner'] as const
export type CourseDeliveredByFormValue = (typeof COURSE_DELIVERED_BY_FORM_VALUES)[number]

const COURSE_DELIVERED_BY_SET = new Set<string>(COURSE_DELIVERED_BY_FORM_VALUES)

/** API/RHF optional — 확장값(TEACHER 등)은 폼 enum 밖 → undefined */
export function normalizeCourseDeliveredByFormValue(
  raw: unknown
): CourseDeliveredByFormValue | undefined {
  if (raw == null || raw === '') return undefined
  const trimmed = String(raw).trim()
  if (!trimmed) return undefined
  if (COURSE_DELIVERED_BY_SET.has(trimmed)) {
    return trimmed as CourseDeliveredByFormValue
  }
  const lower = trimmed.toLowerCase()
  if (lower === 'ja') return 'JA'
  if (lower === 'jointly' || lower === 'joint') return 'Jointly'
  if (lower === 'partner') return 'Partner'
  return undefined
}

/**
 * IP Owned 상세 Select 시드.
 * `JA`/`Partner`/`Joint` 옵션과 `Jointly`(등록·1사1교) 별칭을 유지하고, 미지원 원문은 보존한다.
 */
export function normalizeIpOwnedSelectValue(raw: unknown): string | undefined {
  if (raw == null || raw === '') return undefined
  const trimmed = String(raw).trim()
  if (!trimmed) return undefined
  if (trimmed === 'JA' || trimmed === 'Partner' || trimmed === 'Joint' || trimmed === 'Jointly') {
    return trimmed
  }
  const lower = trimmed.toLowerCase()
  if (lower === 'ja') return 'JA'
  if (lower === 'partner') return 'Partner'
  if (lower === 'joint') return 'Joint'
  if (lower === 'jointly') return 'Jointly'
  return trimmed
}
