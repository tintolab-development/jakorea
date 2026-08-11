import { getLabel } from '../shared/option-helpers.js'
import type { DomainSelectOption } from '../shared/types.js'

/** 교사 재직 현황 — CMS `SchoolTeacherEmploymentStatus`와 동일 */
export const SCHOOL_TEACHER_EMPLOYMENT_STATUS = {
  active: 'ACTIVE',
  onLeave: 'ON_LEAVE',
  withdrawn: 'WITHDRAWN',
  transferred: 'TRANSFERRED',
} as const

export type SchoolTeacherEmploymentStatus =
  (typeof SCHOOL_TEACHER_EMPLOYMENT_STATUS)[keyof typeof SCHOOL_TEACHER_EMPLOYMENT_STATUS]

export const SCHOOL_TEACHER_EMPLOYMENT_STATUS_LABEL: Record<
  SchoolTeacherEmploymentStatus,
  string
> = {
  ACTIVE: '재직중',
  ON_LEAVE: '휴직',
  TRANSFERRED: '전근',
  WITHDRAWN: '탈퇴',
}

/** 등록 폼 드롭다운 — 탈퇴(WITHDRAWN) 제외 */
export const SCHOOL_TEACHER_EMPLOYMENT_STATUS_FORM_OPTIONS: DomainSelectOption<
  Exclude<SchoolTeacherEmploymentStatus, 'WITHDRAWN'>
>[] = [
  {
    value: SCHOOL_TEACHER_EMPLOYMENT_STATUS.active,
    label: SCHOOL_TEACHER_EMPLOYMENT_STATUS_LABEL.ACTIVE,
  },
  {
    value: SCHOOL_TEACHER_EMPLOYMENT_STATUS.onLeave,
    label: SCHOOL_TEACHER_EMPLOYMENT_STATUS_LABEL.ON_LEAVE,
  },
  {
    value: SCHOOL_TEACHER_EMPLOYMENT_STATUS.transferred,
    label: SCHOOL_TEACHER_EMPLOYMENT_STATUS_LABEL.TRANSFERRED,
  },
]

export function getSchoolTeacherEmploymentStatusLabel(
  value: SchoolTeacherEmploymentStatus,
): string {
  return getLabel(
    [
      ...SCHOOL_TEACHER_EMPLOYMENT_STATUS_FORM_OPTIONS,
      {
        value: SCHOOL_TEACHER_EMPLOYMENT_STATUS.withdrawn,
        label: SCHOOL_TEACHER_EMPLOYMENT_STATUS_LABEL.WITHDRAWN,
      },
    ],
    value,
  )
}
