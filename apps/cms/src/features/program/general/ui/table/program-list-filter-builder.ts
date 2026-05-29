import type { Dayjs } from 'dayjs'
import type { ProgramLifecycleStatus, ProgramCategory, ProgramType } from '@/types/domain'
import type { ProgramProgressPhaseFilter } from '../constants/program-list-constants'
import type { ProgramListProgramMode } from '../../model/program-list-program-mode'

interface PendingFilters {
  title: string
  lifecycleStatus: ProgramLifecycleStatus | ProgramProgressPhaseFilter | undefined
  category: string | undefined
  businessArea: string | undefined
  targetLevel: string | undefined
  type: string | undefined
  /** 모집 예정 | 모집 중 | 모집 마감 (`getRecruitmentStatus`) */
  participantRecruitment: string | undefined
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
  programMode: ProgramListProgramMode,
  overviewScheduledLayout = false
) {
  if (programMode === 'overview' && overviewScheduledLayout) {
    return {
      title: pendingFilters.title,
      category: pendingFilters.category,
      targetLevel: pendingFilters.targetLevel,
      operationPeriod:
        pendingFilters.operationStartDate && pendingFilters.operationEndDate
          ? [pendingFilters.operationStartDate, pendingFilters.operationEndDate]
          : null,
    }
  }

  if (programMode === 'overview') {
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
