/**
 * 프로그램 캘린더 뷰 컴포넌트
 */

import type { Program } from '@/types/domain'
import { CalendarSet } from '@/shared/ui'

interface ProgramCalendarViewProps {
  items: Program[]
  loading?: boolean
  onItemClick: (item: Program) => void
}

export function ProgramCalendarView({ items, loading, onItemClick }: ProgramCalendarViewProps) {
  return <CalendarSet.Main items={items} loading={loading} onItemClick={onItemClick} />
}
