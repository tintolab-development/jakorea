import dayjs from 'dayjs'
import { useCallback, useMemo } from 'react'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import type { Program } from '@/types/domain'
import type { ProgramListView } from '@/features/program/general/ui/table/program-table-column-resolver'
import type { ProgramListConfig } from '@/features/program/general/ui/program-list'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import { useTrainedTeacherPrograms } from '@/features/program/trained-teachers/api/hooks'
import {
  readTrainedTeacherTableFilters,
  trainedTeacherListParamsFromOverviewStatus,
} from '@/features/program/trained-teachers/api/list-params'
import { resolveTrainedTeachersListFilterFields } from '@/features/program/trained-teachers/lib/list-filter-fields'

const TRAINED_TEACHERS_LIST_HEADER_NOTICE = '진행 중이거나 완료된 프로그램은 삭제할 수 없습니다.'

export type TrainedTeachersOverviewStatusFilter = 'scheduled' | 'in_progress' | 'completed'

export interface TrainedTeachersListQueryParams extends Record<string, string | undefined> {
  programId?: string
  status?: TrainedTeachersOverviewStatusFilter
  title?: string
  businessYear?: string
  targetLevel?: string
  lifecycleStatus?: string
  operationStartDate?: string
  operationEndDate?: string
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
  const remoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi()

  const statusFilter = useMemo<TrainedTeachersOverviewStatusFilter | null>(() => {
    const value = params.status
    if (value && (overviewStatusValues as readonly string[]).includes(value)) {
      return value as TrainedTeachersOverviewStatusFilter
    }
    return null
  }, [params.status])

  const tableFilters = useMemo(
    () => readTrainedTeacherTableFilters(key => params[key]),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 목록 필터 키만 의존 (programId 등 상세 파라미터 변경 시 재생성 방지)
    [
      params.businessYear,
      params.lifecycleStatus,
      params.operationEndDate,
      params.operationStartDate,
      params.targetLevel,
      params.title,
    ]
  )

  const listFilters = useMemo(
    () => trainedTeacherListParamsFromOverviewStatus(statusFilter, tableFilters),
    [statusFilter, tableFilters]
  )

  const listQuery = useTrainedTeacherPrograms(listFilters, true)

  const refetchPrograms = useCallback(() => {
    void listQuery.refetch()
  }, [listQuery])

  const filteredPrograms = useMemo(() => {
    const programs = listQuery.data?.pages.flatMap(page => page.programs) ?? []
    if (remoteEnabled) {
      // periodStatus는 서버 필터 — 클라이언트 overview 재필터 스킵
      return programs
    }
    if (statusFilter != null) {
      return programs.filter(program => matchesOverviewStatus(program, statusFilter))
    }
    return programs
  }, [listQuery.data, remoteEnabled, statusFilter])

  const listQueryFiltersKey = useMemo(() => JSON.stringify(listFilters), [listFilters])

  const totalElements = useMemo(() => {
    if (!remoteEnabled) return filteredPrograms.length
    return listQuery.data?.pages[0]?.totalElements ?? filteredPrograms.length
  }, [filteredPrograms.length, listQuery.data, remoteEnabled])

  const headerTitle = useMemo(() => {
    if (statusFilter === 'scheduled') return '진행 예정 프로그램'
    if (statusFilter === 'in_progress') return '진행 중인 프로그램'
    if (statusFilter === 'completed') return '진행 완료된 프로그램'
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
      filterFields: resolveTrainedTeachersListFilterFields(listView),
      serverSideOverviewFilters: remoteEnabled,
      calendarProgramType: 'TRAINED_TEACHER',
      // 시안 5416:108555·108765: 안내 문구는 전체 프로그램 탭(리스트·캘린더)에만
      ...(listView === 'ALL' ? { headerNotice: TRAINED_TEACHERS_LIST_HEADER_NOTICE } : {}),
    }
  }, [remoteEnabled, statusFilter])

  return {
    statusFilter,
    filteredPrograms,
    totalElements,
    headerTitle,
    programListConfig,
    params,
    setParam,
    refetchPrograms,
    listQuery,
    remoteEnabled,
    listQueryFiltersKey,
    isFetchingNextPage: listQuery.isFetchingNextPage,
    fetchNextPage: listQuery.fetchNextPage,
    hasNextPage: !listQuery.isPlaceholderData && (listQuery.hasNextPage ?? false),
  }
}
