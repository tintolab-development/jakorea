import type { Dayjs } from 'dayjs'
import type { ProgramLifecycleStatus, ProgramCategory, ProgramType } from '@/types/domain'

interface PendingFilters {
  title: string
  lifecycleStatus: ProgramLifecycleStatus | undefined
  category: string | undefined
  businessArea: string | undefined
  targetLevel: string | undefined
  type: string | undefined
  operationStartDate: Dayjs | null
  operationEndDate: Dayjs | null
}

interface PendingUserFilters {
  search?: string
  dateRange?: [Dayjs | null, Dayjs | null] | null
  target?: ProgramCategory | 'all'
  type?: ProgramType | 'all'
  status?: ProgramLifecycleStatus | 'all'
}

/**
 * 관리자용 필터 객체 생성 헬퍼
 */
export function buildProgramListFilters(
  pendingFilters: PendingFilters,
  readOnlyLifecycleStatus: boolean,
  economyScheduledLayout = false
) {
  if (readOnlyLifecycleStatus && economyScheduledLayout) {
    return {
      title: pendingFilters.title,
      operationPeriod:
        pendingFilters.operationStartDate && pendingFilters.operationEndDate
          ? [pendingFilters.operationStartDate, pendingFilters.operationEndDate]
          : null,
      category: pendingFilters.category,
      targetLevel: pendingFilters.targetLevel,
    }
  }

  if (readOnlyLifecycleStatus) {
    return {
      title: pendingFilters.title,
      lifecycleStatus: pendingFilters.lifecycleStatus,
      category: pendingFilters.category,
      targetLevel: pendingFilters.targetLevel,
    }
  }

  return {
    lifecycleStatus: pendingFilters.lifecycleStatus,
    category: pendingFilters.category,
    businessArea: pendingFilters.businessArea,
    targetLevel: pendingFilters.targetLevel,
    type: pendingFilters.type,
    operationPeriod:
      pendingFilters.operationStartDate && pendingFilters.operationEndDate
        ? [pendingFilters.operationStartDate, pendingFilters.operationEndDate]
        : null,
  }
}

/**
 * 참가자용 필터 객체 생성 헬퍼
 */
export function buildParticipantFilters(
  pendingUserFilters: PendingUserFilters,
  periodRange: [Dayjs | null, Dayjs | null] | null
) {
  return {
    search: pendingUserFilters.search || '',
    dateRange: pendingUserFilters.dateRange || periodRange,
    target: pendingUserFilters.target || 'all',
    type: pendingUserFilters.type || 'all',
    status: pendingUserFilters.status || 'all',
  }
}
