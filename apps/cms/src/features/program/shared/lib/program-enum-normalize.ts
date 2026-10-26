/**
 * 프로그램 공통정보 ENUM — GET/RHF/Select 대소문자 정규화.
 * 상세 폼 옵션(PascalCase)과 서버·등록 overlay(lowercase)를 맞춘다.
 * 빈 값·미지원 값을 JA 등으로 치환하지 않는다.
 */

import { TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS } from '@/features/template/lib/template-form-select-options'

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
/**
 * 교육 과정 RHF 시드 — API 코드(`digital_computer`)·과거 라벨 저장값을 등록 폼 option value 로 맞춘다.
 */
export function normalizeEducationProcessFormValue(raw: unknown): string | undefined {
  if (raw == null || raw === '') return undefined
  const trimmed = String(raw).trim()
  if (!trimmed) return undefined
  const byValue = TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS.find(o => o.value === trimmed)
  if (byValue) return byValue.value
  const byLabel = TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS.find(o => o.label === trimmed)
  return byLabel?.value ?? trimmed
}

/** 상세 view — API 응답만으로 라벨 표시 (overlay 미사용). */
export function educationProcessDisplayLabel(raw: unknown): string {
  if (raw == null || raw === '') return '-'
  const trimmed = String(raw).trim()
  if (!trimmed) return '-'
  const byValue = TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS.find(o => o.value === trimmed)
  if (byValue) return byValue.label
  const byLabel = TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS.find(o => o.label === trimmed)
  if (byLabel) return byLabel.label
  return trimmed
}

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
