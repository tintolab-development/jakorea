/**
 * 프로그램 진행 현황(모집 신청 현황) 전용 셀
 * 공통 StatusDropdownCell + ProgramLifecycleStatusBadge + lifecycle 규칙 조합
 * 대시보드 위젯·교육프로그램 테이블 등에서 동일 UI/로직 재사용
 */

import type { Program } from '@/types/domain'
import type { ProgramLifecycleStatus } from '@/types/domain'
import { ProgramLifecycleStatusBadge } from '@/shared/components/program-lifecycle-status-badge'
import { StatusDropdownCell } from '@/shared/components/status-dropdown-cell'

/** 드롭다운 표시 순서: 예정(4) → 모집 중(4) → 완료(4) */
const LIFECYCLE_STATUS_ORDER: ProgramLifecycleStatus[] = [
  'planned',
  'instructor_recruitment_planned',
  'volunteer_recruitment_planned',
  'participant_instructor_recruitment_planned',
  'recruiting_students',
  'recruiting_instructors',
  'recruiting_volunteers',
  'participant_instructor_recruiting',
  'matching_completed',
  'education_in_progress',
  'education_before_textbook',
  'education_after_textbook',
  'education_completed',
  'document_processing_completed',
  'participant_instructor_recruitment_completed',
]

/** 그룹 구분: 해당 항목 위에 여백 */
const DROPDOWN_GROUP_START_KEYS: Set<ProgramLifecycleStatus> = new Set([
  'recruiting_students',
  'matching_completed',
])

export interface ProgramLifecycleStatusCellProps {
  record: Program
  onStatusChange?: (record: Program, newStatus: ProgramLifecycleStatus) => Promise<void>
  isUpdating?: boolean
  openDropdownId: string | null
  onOpenDropdownChange: (id: string | null) => void
}

export function ProgramLifecycleStatusCell({
  record,
  onStatusChange,
  isUpdating = false,
  openDropdownId,
  onOpenDropdownChange,
}: ProgramLifecycleStatusCellProps) {
  const status = record.lifecycleStatus

  return (
    <StatusDropdownCell<ProgramLifecycleStatus>
      status={status ?? null}
      statusOptions={LIFECYCLE_STATUS_ORDER}
      renderBadge={s => <ProgramLifecycleStatusBadge status={s} />}
      isItemDisabled={(cur, opt) => cur === opt}
      getItemClassName={opt =>
        DROPDOWN_GROUP_START_KEYS.has(opt) ? 'status-dropdown-cell__dropdown-group-start' : undefined
      }
      onChange={
        onStatusChange ? newStatus => onStatusChange(record, newStatus) : undefined
      }
      isUpdating={isUpdating}
      isOpen={openDropdownId === record.id}
      onOpenChange={open => onOpenDropdownChange(open ? record.id : null)}
      emptyPlaceholder="-"
    />
  )
}
