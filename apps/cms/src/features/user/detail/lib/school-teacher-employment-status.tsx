import { AppStatusBadge } from '@/shared/components'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'

/** 재직 현황 드롭다운 선택지 — 탈퇴(WITHDRAWN)는 목록에서 제외, 데이터에만 남을 수 있음 */
export const SCHOOL_TEACHER_EMPLOYMENT_STATUS_DROPDOWN_OPTIONS = [
  'ACTIVE',
  'ON_LEAVE',
  'TRANSFERRED',
] as const satisfies readonly SchoolTeacherEmploymentStatus[]

export const SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL: Record<SchoolTeacherEmploymentStatus, string> = {
  ACTIVE: '재직중',
  ON_LEAVE: '휴직',
  TRANSFERRED: '전근',
  WITHDRAWN: '탈퇴',
}

export const SCHOOL_TEACHER_EMPLOYMENT_BADGE_CELL_STYLE = {
  width: 100,
  minWidth: 100,
  maxWidth: 100,
  height: 32,
  minHeight: 32,
  maxHeight: 32,
} as const

export function parseSchoolTeacherEmploymentStatus(
  label: string | undefined
): SchoolTeacherEmploymentStatus | null {
  const t = label?.trim()
  if (!t || t === '-') return null
  if (/탈퇴/.test(t)) return 'WITHDRAWN'
  if (/휴직/.test(t)) return 'ON_LEAVE'
  if (/전근/.test(t)) return 'TRANSFERRED'
  if (/재직/.test(t)) return 'ACTIVE'
  return null
}

export function SchoolTeacherEmploymentStatusBadge({
  status,
  classNamePrefix = 'school-affiliated-teachers-section__employment-badge',
}: {
  status: SchoolTeacherEmploymentStatus
  classNamePrefix?: string
}) {
  const variant = status === 'ACTIVE' ? 'active' : 'muted'
  return (
    <AppStatusBadge
      label={SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL[status]}
      className={`${classNamePrefix} ${classNamePrefix}--${variant}`}
    />
  )
}
