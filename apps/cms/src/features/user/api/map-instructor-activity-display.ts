import { SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL } from '@/shared/constants/editable-status-badge-tones'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'

/** BE가 원문 대신 내려주는 마스킹 플레이스홀더 */
const MASKED_PLACEHOLDERS = new Set(['마스킹', '****', '***', '-', '—'])

export function isInstructorMaskedPlaceholder(value: string | undefined | null): boolean {
  const trimmed = value?.trim()
  if (!trimmed) return true
  return MASKED_PLACEHOLDERS.has(trimmed)
}

/**
 * 강사 프로필 공개 텍스트(경력·소개·학력 등) — BE `"마스킹"` placeholder는 미입력으로 취급.
 * 마스킹 정책상 PII가 아니므로 GET 기본 응답에 원문이 와야 하나, BE 오적용 시 화면에 `"마스킹"` 노출 방지.
 */
export function resolveInstructorPublicTextField(
  value: string | undefined | null
): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed || isInstructorMaskedPlaceholder(trimmed)) return undefined
  return trimmed
}

/** API activity / instructorType 코드 → 화면 라벨 */
const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  GENERAL: '일반 강사',
  SCHOOL_TEACHER: '교사 회원',
  UJAT: 'UJAT',
  GEMINI: '제미나이 강사단',
  JA: 'JA 강사단',
  SPECIAL: '특강 강사',
  SPECIAL_LECTURE: '특강 강사',
}

export function toInstructorActivityTypeLabel(raw: string | undefined | null): string | undefined {
  const trimmed = raw?.trim()
  if (!trimmed || isInstructorMaskedPlaceholder(trimmed)) return undefined
  if (/[가-힣]/.test(trimmed)) return trimmed
  return ACTIVITY_TYPE_LABELS[trimmed.toUpperCase()] ?? trimmed
}

export function looksLikeInstructorActivityEnumCode(value: string | undefined | null): boolean {
  const trimmed = value?.trim()
  if (!trimmed) return false
  const parts = trimmed.split(/\s*,\s*/).map(part => part.trim()).filter(Boolean)
  if (parts.length === 0) return false
  return parts.every(part => {
    if (/[가-힣]/.test(part)) return false
    const upper = part.toUpperCase()
    return upper in ACTIVITY_TYPE_LABELS || /^[A-Z][A-Z0-9_]*$/.test(upper)
  })
}

export function mapInstructorActivityTypesToLabels(
  activityTypes: Array<string | undefined | null> | undefined,
  primaryActivityType?: string | null
): string[] {
  const labels: string[] = []
  const seen = new Set<string>()
  const add = (raw: string | undefined | null) => {
    const label = toInstructorActivityTypeLabel(raw)
    if (!label || seen.has(label)) return
    seen.add(label)
    labels.push(label)
  }
  for (const type of activityTypes ?? []) add(type)
  add(primaryActivityType)
  return labels
}

export function toEmploymentStatusDisplayLabel(
  raw: string | undefined | null
): string | undefined {
  const trimmed = raw?.trim()
  if (!trimmed || isInstructorMaskedPlaceholder(trimmed)) return undefined
  const upper = trimmed.toUpperCase()
  if (upper in SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL) {
    return SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL[upper as SchoolTeacherEmploymentStatus]
  }
  if (/재직|휴직|전근|탈퇴/.test(trimmed)) return trimmed
  return trimmed
}

/** `careerText`가 숫자만이면 `N년`으로 표시 */
export function formatInstructorCareerDisplay(raw: string | undefined | null): string | undefined {
  const trimmed = resolveInstructorPublicTextField(raw)
  if (!trimmed) return undefined
  if (/^\d+$/.test(trimmed)) return `${trimmed}년`
  return trimmed
}

const EDU_SCHOOL_TYPE_LABELS: Record<string, string> = {
  high: '고등학교',
  college23: '대학교 2, 3년제',
  college4: '대학교 4년제',
  graduate: '대학원',
}

const EDU_STATUS_LABELS: Record<string, string> = {
  enrolled: '재학',
  graduated: '졸업',
  completed: '수료',
}

/** `educationLevel` 요약(`college4 / graduated` 등) → 화면 표시용 */
export function formatInstructorEducationLevelDisplay(
  raw: string | undefined | null
): string | undefined {
  const trimmed = resolveInstructorPublicTextField(raw)
  if (!trimmed || trimmed === '-') return undefined

  const [schoolType, status] = trimmed.split(/\s*\/\s*/).map(part => part.trim())
  const schoolLabel = schoolType ? (EDU_SCHOOL_TYPE_LABELS[schoolType] ?? schoolType) : undefined
  const statusLabel = status ? (EDU_STATUS_LABELS[status] ?? status) : undefined

  if (schoolLabel && statusLabel) return `${schoolLabel} / ${statusLabel}`
  return schoolLabel ?? trimmed
}

/** 승인·프로필 status 코드 — 강사비 등급에 잘못 섞인 값 제외 */
const INSTRUCTOR_STATUS_CODES = new Set([
  'APPROVED',
  'PENDING',
  'REJECTED',
  'ACTIVE',
  'INACTIVE',
  'REVOKED',
  'REQUESTED',
  'COMPLETED',
  'CANCELLED',
  'WITHDRAWN',
])

const FEE_GRADE_LEVEL_LABELS: Record<string, string> = {
  '1': '1급 강사비',
  '2': '2급 강사비',
  '3': '3급 강사비',
  '1급': '1급 강사비',
  '2급': '2급 강사비',
  '3급': '3급 강사비',
}

/**
 * 강사비 등급 표시용.
 * `instructorProfile.defaultFeeGrade`만 사용한다.
 * BE가 `defaultFeeGrade`·`feeGrade`·`status`에 승인 코드(`APPROVED` 등)를 넣는 경우를 걸러낸다.
 */
export function toInstructorFeeGradeDisplayLabel(
  raw: string | undefined | null
): string | undefined {
  const trimmed = raw?.trim()
  if (!trimmed || isInstructorMaskedPlaceholder(trimmed)) return undefined
  const upper = trimmed.toUpperCase()
  if (INSTRUCTOR_STATUS_CODES.has(upper)) return undefined
  if (/승인|반려|대기/.test(trimmed)) return undefined

  const levelKey = trimmed.replace(/\s*강사비\s*$/u, '').trim()
  if (levelKey in FEE_GRADE_LEVEL_LABELS) return FEE_GRADE_LEVEL_LABELS[levelKey]
  if (/^\d급\s*강사비$/.test(trimmed)) return trimmed

  return trimmed
}
