import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import {
  getTrainedTeachersPrograms,
  invalidateTrainedTeachersProgramsCache,
} from '@/data/mock/trained-teachers-programs'
import type { Program } from '@/types/domain'
import type { ProgramListView } from '@/features/program/general/ui/table/program-table-column-resolver'
import type { ProgramListConfig } from '@/features/program/general/ui/program-list'

export type TrainedTeachersOverviewStatusFilter = 'scheduled' | 'in_progress' | 'completed'

export interface TrainedTeachersListQueryParams extends Record<string, string | undefined> {
  programId?: string
  status?: TrainedTeachersOverviewStatusFilter
}

const overviewStatusValues = ['scheduled', 'in_progress', 'completed'] as const

function getProgramOperationDatePhase(
  program: Program
): TrainedTeachersOverviewStatusFilter | null {
  const start = dayjs(program.startDate)
  const end = dayjs(program.endDate)
  if (!start.isValid() || !end.isValid()) return null

  const today = dayjs().startOf('day')
  if (today.isBefore(start.startOf('day'))) return 'scheduled'
  if (today.isBefore(end.startOf('day'))) return 'in_progress'
  return 'completed'
}

function matchesOverviewStatus(
  program: Program,
  statusFilter: TrainedTeachersOverviewStatusFilter
): boolean {
  const operationPhase = getProgramOperationDatePhase(program)
  if (operationPhase != null) return operationPhase === statusFilter

  const lifecycleStatus = program.lifecycleStatus || ''
  if (statusFilter === 'scheduled') {
    return [
      'recruiting_students',
      'recruiting_instructors',
      'matching_completed',
      'education_before_textbook',
    ].includes(lifecycleStatus)
  }
  if (statusFilter === 'in_progress') {
    return lifecycleStatus === 'education_after_textbook' || lifecycleStatus === 'education_in_progress'
  }
  return ['education_completed', 'document_processing_completed'].includes(lifecycleStatus)
}

export function useTrainedTeachersProgramListFilters() {
  const { params, setParam } = useQueryParams<TrainedTeachersListQueryParams>()
  const [listVersion, setListVersion] = useState(0)

  const refetchPrograms = useCallback(() => {
    invalidateTrainedTeachersProgramsCache()
    setListVersion(version => version + 1)
  }, [])

  const statusFilter = useMemo<TrainedTeachersOverviewStatusFilter | null>(() => {
    const value = params.status
    if (value && (overviewStatusValues as readonly string[]).includes(value)) {
      return value as TrainedTeachersOverviewStatusFilter
    }
    return null
  }, [params.status])

  const filteredPrograms = useMemo(() => {
    void listVersion
    let programs = getTrainedTeachersPrograms()
    if (statusFilter != null) {
      programs = programs.filter(program => matchesOverviewStatus(program, statusFilter))
    }
    return programs
  }, [listVersion, statusFilter])

  const headerTitle = useMemo(() => {
    if (statusFilter === 'scheduled') return '예정 프로그램'
    if (statusFilter === 'in_progress') return '진행 중인 프로그램'
    if (statusFilter === 'completed') return '완료 프로그램'
    return '전체 프로그램'
  }, [statusFilter])

  const programListConfig = useMemo((): ProgramListConfig => {
    const listView: ProgramListView =
      statusFilter === 'scheduled'
        ? 'SCHEDULED'
        : statusFilter === 'in_progress'
          ? 'IN_PROGRESS'
          : statusFilter === 'completed'
            ? 'COMPLETED'
            : 'ALL'

    return {
      mode: 'overview',
      view: listView,
      lifecycleStatus: undefined,
      columnPreset: 'trainedTeachers',
    }
  }, [statusFilter])

  return {
    statusFilter,
    filteredPrograms,
    headerTitle,
    programListConfig,
    params,
    setParam,
    refetchPrograms,
  }
}
