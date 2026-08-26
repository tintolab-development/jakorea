/**
 * 실적 관리 목록 — 기획 라벨 · 필터 옵션
 * Notion: 실적 데이터 / 공통 필터
 */

export const EDUCATION_RECORD_BUSINESS_AREAS = [
  '경제금융',
  '진로취업',
  '기업가정신',
  '디지털리터러시',
] as const

export const EDUCATION_RECORD_IPS_VALUES = ['Inspire', 'Prepare', 'Succeed'] as const

export const EDUCATION_RECORD_EDUCATION_TYPE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '온라인', value: 'online' },
  { label: '오프라인', value: 'offline' },
  { label: '온/오프라인', value: 'hybrid' },
]

const TARGET_LEVEL_DISPLAY: Record<string, string> = {
  elementary: '초등학생',
  middle: '중학생',
  high: '고등학생',
  university: '대학생',
  adult: '성인',
  초: '초등학생',
  중: '중학생',
  고: '고등학생',
  초등학생: '초등학생',
  중학생: '중학생',
  고등학생: '고등학생',
  대학생: '대학생',
  성인: '성인',
}

const INSTITUTION_TYPE_DISPLAY: Record<string, string> = {
  inside_school: '기관 안',
  outside_school: '기관 밖',
  other: '기타',
  '학교 안': '기관 안',
  '학교 밖': '기관 밖',
  '기관 안': '기관 안',
  '기관 밖': '기관 밖',
  기타: '기타',
}

const EDUCATION_TYPE_DISPLAY: Record<string, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '온/오프라인',
  온라인: '온라인',
  오프라인: '오프라인',
  혼합: '온/오프라인',
  '온+오프라인': '온/오프라인',
  '온/오프라인': '온/오프라인',
}

export function formatEducationRecordTargetLevel(value?: string): string {
  if (!value) return '-'
  const trimmed = value.trim()
  return TARGET_LEVEL_DISPLAY[trimmed] ?? trimmed
}

export function formatEducationRecordInstitutionType(value?: string): string {
  if (!value) return '-'
  const trimmed = value.trim()
  return INSTITUTION_TYPE_DISPLAY[trimmed] ?? trimmed
}

export function formatEducationRecordEducationType(value?: string): string {
  if (!value) return '-'
  const trimmed = value.trim()
  return EDUCATION_TYPE_DISPLAY[trimmed] ?? trimmed
}

export function normalizeEducationRecordBusinessArea(value?: string): string {
  return (value ?? '').replace(/\s+/g, '').trim()
}
