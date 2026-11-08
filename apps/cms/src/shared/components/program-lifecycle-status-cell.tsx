/**
 * 프로그램 진행 현황(모집 신청 현황) 전용 셀
 * 공통 StatusDropdownCell + `getProgramLifecycleStatusTag` 조합 (4탭 목록 경로는 3단계 라벨)
 * 대시보드 위젯·교육프로그램 테이블 등에서 동일 UI/로직 재사용
 */

import { useLocation } from 'react-router-dom'
import type { Program } from '@/types/domain'
import type { ProgramLifecycleStatus } from '@/types/domain'
import { StatusDropdownCell } from '@/shared/components/status-dropdown-cell'
import {
  getProgramLifecycleStatusTag,
  isProgramOverviewListPath,
} from '@/shared/lib/status-tag-specs'

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
  const { pathname } = useLocation()
  const overviewListPage = isProgramOverviewListPath(pathname)
  const status = record.lifecycleStatus

  return (
    <StatusDropdownCell<ProgramLifecycleStatus>
      status={status ?? null}
      statusOptions={LIFECYCLE_STATUS_ORDER}
      getTag={s => getProgramLifecycleStatusTag(s, { overviewListPage })}
      isItemDisabled={(cur, opt) => cur === opt}
      isGroupStart={opt => DROPDOWN_GROUP_START_KEYS.has(opt)}
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
