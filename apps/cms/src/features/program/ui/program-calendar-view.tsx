/**
 * 프로그램 캘린더 뷰 컴포넌트
 */

import type { Program } from '@/types/domain'
import { CalendarSet } from '@/shared/ui'

interface ProgramCalendarViewProps {
  programs: Program[]
  loading?: boolean
  onProgramClick: (program: Program) => void
}

export function ProgramCalendarView({
  programs,
  loading,
  onProgramClick,
}: ProgramCalendarViewProps) {
  return <CalendarSet.Main programs={programs} loading={loading} onProgramClick={onProgramClick} />
}
