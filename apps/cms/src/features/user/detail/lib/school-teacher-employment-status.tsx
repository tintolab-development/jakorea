import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { EditableStatusBadge, StatusDropdownCell } from '@/shared/components'
import { STATUS_DROPDOWN_CELL_INLINE_TAG100_CLASSNAME } from '@/shared/components/status-dropdown-cell'
import {
  getEmploymentBadgeTone,
  SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL,
} from '@/shared/constants/editable-status-badge-tones'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'

export {
  SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL,
} from '@/shared/constants/editable-status-badge-tones'

/** 재직 현황 드롭다운 선택지 — 탈퇴(WITHDRAWN)는 목록에서 제외, 데이터에만 남을 수 있음 */
export const SCHOOL_TEACHER_EMPLOYMENT_STATUS_DROPDOWN_OPTIONS = [
  'ACTIVE',
  'ON_LEAVE',
  'TRANSFERRED',
] as const satisfies readonly SchoolTeacherEmploymentStatus[]

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
}: {
  status: SchoolTeacherEmploymentStatus
}) {
  return (
    <EditableStatusBadge
      label={SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL[status]}
      tone={getEmploymentBadgeTone(status)}
    />
  )
}

/** 재직 현황 태그 드롭다운 — 교사 상세·강사(겸직) 소속 셀 공통 */
export function SchoolTeacherEmploymentStatusDropdown({
  userId,
  employmentStatusLabel,
  emptyFallback = <span>-</span>,
  onChange,
}: {
  userId: string
  employmentStatusLabel?: string
  /** 파싱 실패 시. `null`이면 아무것도 렌더하지 않음(강사 소속 인라인용) */
  emptyFallback?: ReactNode | null
  /** remote 저장. 없으면 화면 상태만 변경(mock) */
  onChange?: (status: SchoolTeacherEmploymentStatus) => void | Promise<void>
}) {
  const [employmentStatus, setEmploymentStatus] = useState<SchoolTeacherEmploymentStatus | null>(() =>
    parseSchoolTeacherEmploymentStatus(employmentStatusLabel)
  )
  const [employmentDropdownOpen, setEmploymentDropdownOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    setEmploymentStatus(parseSchoolTeacherEmploymentStatus(employmentStatusLabel))
  }, [userId, employmentStatusLabel])

  const handleEmploymentStatusChange = useCallback(
    async (next: SchoolTeacherEmploymentStatus) => {
      if (next === employmentStatus) return
      setEmploymentDropdownOpen(false)
      if (!onChange) {
        setEmploymentStatus(next)
        return
      }
      setIsUpdating(true)
      try {
        await onChange(next)
      } finally {
        setIsUpdating(false)
      }
    },
    [employmentStatus, onChange]
  )

  if (employmentStatus == null) {
    return emptyFallback
  }

  return (
    <span
      className={`user-basic-info-section__teacher-employment-dropdown ${STATUS_DROPDOWN_CELL_INLINE_TAG100_CLASSNAME}`}
    >
      <StatusDropdownCell<SchoolTeacherEmploymentStatus>
        status={employmentStatus}
        statusOptions={SCHOOL_TEACHER_EMPLOYMENT_STATUS_DROPDOWN_OPTIONS}
        renderBadge={status => <SchoolTeacherEmploymentStatusBadge status={status} />}
        isItemDisabled={(cur, opt) => cur === opt}
        onChange={handleEmploymentStatusChange}
        isUpdating={isUpdating}
        isOpen={employmentDropdownOpen}
        onOpenChange={setEmploymentDropdownOpen}
        tagLayout="tag100"
        style={SCHOOL_TEACHER_EMPLOYMENT_BADGE_CELL_STYLE}
      />
    </span>
  )
}
