/**
 * 프로그램 진행현황 탭 - 참여 강사 목록
 * remote OFF → 빈 목록 + API 미연동 alert; remote ON → participants + instructor-assignments 조인
 * 교육받은 교사(TT): 강사 Relation 없음 — alert/remote 호출 없음
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ParticipatingInstructorRow,
  SettlementStatusKey,
} from '@/features/program/general/model/participating-instructors'
import type { ProgressFilters } from './use-program-progress-params'
import {
  createGeneralProgramInstructorParticipant,
  fetchGeneralParticipatingInstructorsPage,
} from '@/features/program/general/api/admin-program-progress-service'
import { fetchGeneralInstructorAssignmentBoard } from '@/features/program/general/api/instructor-assignment-board-service'
import { fetchCompanySchoolAssignmentBoard } from '@/features/program/1c-1s/api/instructor-assignment-conflict-service'
import { companySchoolQueryKeys } from '@/features/program/1c-1s/api/query-keys'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  useIsCompanySchoolProgramsSurface,
  useIsTrainedTeachersProgramsSurface,
  useProgramProgressRemoteEnabledForSurface,
} from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import {
  notifyProgramApiUnavailable,
  useNotifyProgramApiUnavailableOnce,
} from '@/features/program/shared/lib/program-api-unavailable'
import { buildAssignedOrganizationNamesByMemberId } from '@/features/program/general/lib/participating-instructor-assigned-institutions'
import type { Program } from '@/types/domain'

function mergeInstructorRowsWithAssignments(
  rows: ParticipatingInstructorRow[],
  assignedByMemberId: Map<string, string[]>
): ParticipatingInstructorRow[] {
  return rows.map(row => {
    if (row.assignedOrganizationNames?.length) return row
    if (!row.memberId) return row
    const assigned = assignedByMemberId.get(row.memberId)
    if (!assigned?.length) return row
    return {
      ...row,
      assignedOrganizationNames: assigned,
      schoolName: assigned[0] ?? row.schoolName,
    }
  })
}

export interface UseProgressInstructorListOptions {
  appliedFilters: ProgressFilters
  programId?: string
  program?: Program | null
  /** false면 강사 목록·배정 보드를 조회하지 않는다 (예: 개인형 봉사자 진행 탭은 강사 목록을 쓰지 않음) */
  enabled?: boolean
}

export function useProgressInstructorList({
  appliedFilters,
  programId,
  enabled = true,
}: UseProgressInstructorListOptions) {
  const isTrainedTeachersSurface = useIsTrainedTeachersProgramsSurface()
  const isCompanySchoolSurface = useIsCompanySchoolProgramsSurface()
  const queryClient = useQueryClient()
  const surfaceRemoteEnabled = useProgramProgressRemoteEnabledForSurface(programId)
  const remoteEnabled = surfaceRemoteEnabled && enabled

  useNotifyProgramApiUnavailableOnce(
    enabled && !surfaceRemoteEnabled && !isTrainedTeachersSurface,
    'general-progress-instructors',
    '프로그램 진행 현황 · 강사'
  )

  const remoteQuery = useInfiniteQuery({
    queryKey: generalProgramProgressQueryKeys.instructors(programId ?? ''),
    queryFn: ({ pageParam }) =>
      fetchGeneralParticipatingInstructorsPage(programId!, pageParam),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const assignmentsQuery = useQuery({
    queryKey: isCompanySchoolSurface
      ? companySchoolQueryKeys.instructorAssignmentConflicts(programId ?? '')
      : generalProgramProgressQueryKeys.instructorAssignments(programId ?? ''),
    queryFn: () =>
      isCompanySchoolSurface
        ? fetchCompanySchoolAssignmentBoard(programId!)
        : fetchGeneralInstructorAssignmentBoard(programId!),
    enabled: remoteEnabled && Boolean(programId),
    staleTime: 30_000,
    retry: false,
  })

  const assignedOrganizationNamesByMemberId = useMemo(
    () => buildAssignedOrganizationNamesByMemberId(assignmentsQuery.data?.assignments ?? []),
    [assignmentsQuery.data?.assignments]
  )

  const remoteInstructorRows = useMemo(() => {
    if (!remoteQuery.data) return []
    return remoteQuery.data.pages.flatMap(page => page.rows)
  }, [remoteQuery.data])

  const instructorList = useMemo(() => {
    if (!remoteEnabled) return []
    return mergeInstructorRowsWithAssignments(
      remoteInstructorRows,
      assignedOrganizationNamesByMemberId
    )
  }, [assignedOrganizationNamesByMemberId, remoteEnabled, remoteInstructorRows])

  const [selectedInstructorRowKeys, setSelectedInstructorRowKeys] = useState<React.Key[]>([])
  const [addInstructorModalOpen, setAddInstructorModalOpen] = useState(false)
  const [instructorDeleteGuideOpen, setInstructorDeleteGuideOpen] = useState(false)

  const filteredInstructors = useMemo(() => {
    return instructorList.filter(row => {
      if (
        appliedFilters.educationGrade &&
        appliedFilters.educationGrade !== 'all' &&
        row.educationGrade !== appliedFilters.educationGrade
      )
        return false
      if (
        appliedFilters.lectureRound &&
        appliedFilters.lectureRound !== 'all' &&
        row.lectureRound !== appliedFilters.lectureRound
      )
        return false
      if (
        appliedFilters.settlementStatus &&
        appliedFilters.settlementStatus !== 'all' &&
        row.settlementStatus !== appliedFilters.settlementStatus
      )
        return false
      const keyword = (appliedFilters.teacherName || '').trim()
      if (keyword) {
        const lower = keyword.toLowerCase()
        if (
          !row.instructorName.toLowerCase().includes(lower) &&
          !row.teacherName.toLowerCase().includes(lower)
        )
          return false
      }
      return true
    })
  }, [appliedFilters, instructorList])

  const instructorNamesToDelete = useMemo(() => {
    const keysSet = new Set(selectedInstructorRowKeys.map(String))
    return instructorList.filter(row => keysSet.has(row.id)).map(row => row.instructorName)
  }, [instructorList, selectedInstructorRowKeys])

  const notifyInstructorRegisterUnavailable = useCallback(() => {
    notifyProgramApiUnavailable(
      'general-progress-instructor-register',
      '참여 강사 등록'
    )
  }, [])

  const handleAddInstructorByMemberId = useCallback(async (memberId: string): Promise<boolean> => {
    if (!remoteEnabled || !programId) {
      notifyInstructorRegisterUnavailable()
      return false
    }
    const numericMemberId = Number(memberId)
    if (!Number.isFinite(numericMemberId) || numericMemberId <= 0) {
      throw new Error('강사 회원 ID가 올바르지 않습니다.')
    }
    await createGeneralProgramInstructorParticipant(programId, numericMemberId)
    await queryClient.invalidateQueries({
      queryKey: generalProgramProgressQueryKeys.instructors(programId),
    })
    return true
  }, [notifyInstructorRegisterUnavailable, programId, queryClient, remoteEnabled])

  const handleAddInstructor = useCallback((_values: unknown) => {
    void _values
    notifyInstructorRegisterUnavailable()
  }, [notifyInstructorRegisterUnavailable])

  const handleSettlementStatusChange = useCallback(
    (_recordId: string, _status: SettlementStatusKey) => {
      notifyProgramApiUnavailable(
        'general-progress-instructor-settlement',
        '참여 강사 정산 현황 변경'
      )
    },
    []
  )

  const handleInstructorDeleteClick = useCallback(() => {
    if (selectedInstructorRowKeys.length === 0) return
    notifyProgramApiUnavailable(
      'general-progress-instructor-delete',
      '참여 강사 삭제'
    )
  }, [selectedInstructorRowKeys.length])

  const handleInstructorDeleteConfirm = useCallback(() => {
    setInstructorDeleteGuideOpen(false)
  }, [])

  useEffect(() => {
    setSelectedInstructorRowKeys(prev =>
      prev.filter(key => instructorList.some(row => row.id === String(key)))
    )
  }, [instructorList])

  return {
    instructorList,
    selectedInstructorRowKeys,
    setSelectedInstructorRowKeys,
    addInstructorModalOpen,
    setAddInstructorModalOpen,
    instructorDeleteGuideOpen,
    setInstructorDeleteGuideOpen,
    filteredInstructors,
    instructorNamesToDelete,
    handleAddInstructor,
    handleAddInstructorByMemberId,
    handleSettlementStatusChange,
    handleInstructorDeleteClick,
    handleInstructorDeleteConfirm,
    assignedOrganizationNamesByMemberId,
    /** 배정 보드(배정 목록·프로그램 일정) — 개인형 참여 강사 캘린더 일정 SSOT */
    assignmentBoard: assignmentsQuery.data,
    applicationsLoading:
      remoteEnabled &&
      ((remoteQuery.isFetching && remoteQuery.data === undefined) ||
        (assignmentsQuery.isFetching && assignmentsQuery.data === undefined)),
    isRemoteDataSource: remoteEnabled,
    hasNextPage: remoteQuery.hasNextPage ?? false,
    isFetchingNextPage: remoteQuery.isFetchingNextPage,
    fetchNextPage: remoteQuery.fetchNextPage,
  }
}
