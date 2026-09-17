/**
 * 프로그램 진행현황 탭 - 참여 강사 목록
 * remote OFF → 빈 목록 + API 미연동 alert; remote ON → API
 * 교육받은 교사(TT): 강사 Relation·진행 LNB 제품 비범위 — alert/remote 호출 없음
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import type {
  ParticipatingInstructorRow,
  SettlementStatusKey,
} from '@/features/program/general/model/participating-instructors'
import { buildParticipatingInstructorRowFromMember } from '../lib/participating-instructor-member-candidates'
import {
  buildInstructorRowFromForm,
  type AddInstructorFormValues,
} from '../ui/add-instructor-modal'
import type { ProgressFilters } from './use-program-progress-params'
import { fetchGeneralParticipatingInstructorsPage } from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  useIsTrainedTeachersProgramsSurface,
  useProgramProgressRemoteEnabledForSurface,
} from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import type { Program } from '@/types/domain'

export interface UseProgressInstructorListOptions {
  appliedFilters: ProgressFilters
  programId?: string
  program?: Program | null
}

export function useProgressInstructorList({
  appliedFilters,
  programId,
}: UseProgressInstructorListOptions) {
  const isTrainedTeachersSurface = useIsTrainedTeachersProgramsSurface()
  const remoteEnabled = useProgramProgressRemoteEnabledForSurface(programId)

  useNotifyProgramApiUnavailableOnce(
    // TT는 강사 progress API 자체가 제품 비범위 — 참여 기관 섹션이 이 훅을 공유해도 alert 금지
    !remoteEnabled && !isTrainedTeachersSurface,
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

  const [instructorList, setInstructorList] = useState<ParticipatingInstructorRow[]>(() => [])

  useEffect(() => {
    if (remoteEnabled) {
      if (remoteQuery.data) {
        setInstructorList(remoteQuery.data.pages.flatMap(page => page.rows))
      }
      return
    }
    setInstructorList([])
  }, [remoteEnabled, remoteQuery.data, programId])

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
  }, [instructorList, appliedFilters])

  const instructorNamesToDelete = useMemo(() => {
    const keysSet = new Set(selectedInstructorRowKeys.map(String))
    return instructorList.filter(row => keysSet.has(row.id)).map(row => row.instructorName)
  }, [selectedInstructorRowKeys, instructorList])

  const handleAddInstructor = useCallback(
    (values: AddInstructorFormValues) => {
      const nextNo =
        instructorList.length > 0 ? Math.max(...instructorList.map(r => r.no)) + 1 : 1
      const nextId = `instructor-new-${Date.now()}`
      const newRow = buildInstructorRowFromForm(values, nextNo, nextId)
      setInstructorList(prev => [newRow, ...prev])
    },
    [instructorList]
  )

  const handleAddInstructorByMemberId = useCallback(
    async (memberId: string): Promise<boolean> => {
      const nextNo =
        instructorList.length > 0 ? Math.max(...instructorList.map(r => r.no)) + 1 : 1
      const nextId = `instructor-added-${memberId}-${Date.now()}`
      const newRow = await buildParticipatingInstructorRowFromMember(memberId, nextNo, nextId)
      if (!newRow) return false
      setInstructorList(prev => [newRow, ...prev])
      return true
    },
    [instructorList]
  )

  const handleSettlementStatusChange = useCallback(
    (recordId: string, status: SettlementStatusKey) => {
      setInstructorList(prev =>
        prev.map(row => (row.id === recordId ? { ...row, settlementStatus: status } : row))
      )
    },
    []
  )

  const handleInstructorDeleteClick = useCallback(() => {
    if (selectedInstructorRowKeys.length === 0) {
      return
    }
    setInstructorDeleteGuideOpen(true)
  }, [selectedInstructorRowKeys])

  const handleInstructorDeleteConfirm = useCallback(() => {
    const keysToDelete = new Set(selectedInstructorRowKeys.map(String))
    setInstructorList(prev => prev.filter(row => !keysToDelete.has(row.id)))
    setSelectedInstructorRowKeys([])
    setInstructorDeleteGuideOpen(false)
  }, [selectedInstructorRowKeys])

  return {
    instructorList,
    setInstructorList,
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
    applicationsLoading: remoteEnabled
      ? remoteQuery.isFetching && remoteQuery.data === undefined
      : false,
    isRemoteDataSource: remoteEnabled,
    hasNextPage: remoteQuery.hasNextPage ?? false,
    isFetchingNextPage: remoteQuery.isFetchingNextPage,
    fetchNextPage: remoteQuery.fetchNextPage,
  }
}
