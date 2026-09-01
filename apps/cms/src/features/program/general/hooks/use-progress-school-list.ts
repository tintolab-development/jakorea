/**
 * 프로그램 진행현황 탭 - 참여 학교 목록 상태 관리 훅
 * schoolList state, 선택/삭제/상세 모달, 교재현황 변경, 필터링, 담당 강사진 표시
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getParticipatingSchoolsForProgram,
  MOCK_PARTICIPATING_SCHOOLS,
  type ParticipatingSchoolRow,
  type ParticipatingSchoolApprovalStatusKey,
  type TextbookStatusKey,
} from '@/data/mock/participating-schools'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import { formatAssignedInstructorSummary } from '../lib/institution-assigned-instructor-count'
import { getInstructorRowsForSchool } from '../lib/school-detail-mock'
import type {
  SchoolDetailForModal,
  InstructorListFormInstructor,
} from '../model/school-detail-types'
import type { ProgressFilters } from './use-program-progress-params'
import { fetchGeneralParticipatingInstitutions } from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  useIsTrainedTeachersProgramsSurface,
  useProgramProgressRemoteEnabledForSurface,
} from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { useTrainedTeacherParticipatingInstitutions } from '@/features/program/trained-teachers/api/education-journals-hooks'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'

export interface UseProgressSchoolListOptions {
  appliedFilters: ProgressFilters
  instructorList: ParticipatingInstructorRow[]
  programId?: string
}

export function useProgressSchoolList({
  appliedFilters,
  instructorList,
  programId,
}: UseProgressSchoolListOptions) {
  const isTrainedTeachersSurface = useIsTrainedTeachersProgramsSurface()
  const remoteEnabled = useProgramProgressRemoteEnabledForSurface(programId)
  const ttRemoteEnabled =
    isTrainedTeachersSurface &&
    shouldUseTrainedTeacherProgramsRemoteApi() &&
    Boolean(programId)

  const remoteQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.institutions(programId ?? ''),
    queryFn: () => fetchGeneralParticipatingInstitutions(programId!),
    enabled: remoteEnabled && !isTrainedTeachersSurface,
    staleTime: 30_000,
    retry: false,
  })

  const ttParticipatingQuery = useTrainedTeacherParticipatingInstitutions(
    programId,
    ttRemoteEnabled
  )

  const [schoolList, setSchoolList] = useState<ParticipatingSchoolRow[]>(() => {
    // remote ON이면 mock으로 채우지 않음 (잘못된 목록 플래시 방지)
    if (ttRemoteEnabled || remoteEnabled) return []
    return programId
      ? getParticipatingSchoolsForProgram(programId)
      : [...MOCK_PARTICIPATING_SCHOOLS]
  })

  useEffect(() => {
    if (ttRemoteEnabled) {
      if (ttParticipatingQuery.data) setSchoolList(ttParticipatingQuery.data)
      return
    }
    if (remoteEnabled) {
      if (remoteQuery.data) setSchoolList(remoteQuery.data)
      return
    }
    setSchoolList(
      programId ? getParticipatingSchoolsForProgram(programId) : [...MOCK_PARTICIPATING_SCHOOLS]
    )
  }, [
    programId,
    remoteEnabled,
    remoteQuery.data,
    ttRemoteEnabled,
    ttParticipatingQuery.data,
  ])

  const [selectedSchoolRowKeys, setSelectedSchoolRowKeys] = useState<React.Key[]>([])
  const [selectedSchoolForDetail, setSelectedSchoolForDetail] =
    useState<ParticipatingSchoolRow | null>(null)
  const [schoolDetailModalOpen, setSchoolDetailModalOpen] = useState(false)
  const [schoolDeleteGuideOpen, setSchoolDeleteGuideOpen] = useState(false)
  const [savedBasicPatches, setSavedBasicPatches] = useState<
    Record<string, Partial<SchoolDetailForModal>>
  >({})
  const [savedInstructorPatches, setSavedInstructorPatches] = useState<
    Record<string, InstructorListFormInstructor[]>
  >({})

  const filteredSchools = useMemo(() => {
    return schoolList.filter(row => {
      const schoolNameKeyword = (appliedFilters.schoolName || '').trim()
      if (schoolNameKeyword) {
        const lower = schoolNameKeyword.toLowerCase()
        if (!row.schoolName.toLowerCase().includes(lower)) return false
      }
      const institutionSido = (appliedFilters.institutionSido || '').trim()
      const institutionSigungu = (appliedFilters.institutionSigungu || '').trim()
      if (institutionSido && !row.region.includes(institutionSido)) return false
      if (institutionSigungu && !row.region.includes(institutionSigungu)) return false
      if (
        !institutionSido &&
        !institutionSigungu &&
        appliedFilters.region &&
        appliedFilters.region !== 'all' &&
        !row.region.includes(appliedFilters.region)
      )
        return false
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
        appliedFilters.textbookStatus &&
        appliedFilters.textbookStatus !== 'all' &&
        row.textbookStatus !== appliedFilters.textbookStatus
      )
        return false
      const keyword = (appliedFilters.teacherName || '').trim()
      if (keyword) {
        const lower = keyword.toLowerCase()
        if (
          !row.teacherName.toLowerCase().includes(lower) &&
          !row.instructors.toLowerCase().includes(lower)
        )
          return false
      }
      return true
    })
  }, [schoolList, appliedFilters])

  const schoolNamesToDelete = useMemo(() => {
    const keysSet = new Set(selectedSchoolRowKeys.map(String))
    return schoolList.filter(row => keysSet.has(row.id)).map(row => row.schoolName)
  }, [selectedSchoolRowKeys, schoolList])

  const handleTextbookStatusChange = useCallback(
    (recordId: string, status: TextbookStatusKey) => {
      setSchoolList(prev =>
        prev.map(row => (row.id === recordId ? { ...row, textbookStatus: status } : row))
      )
    },
    []
  )

  const handleSchoolDeleteClick = useCallback(() => {
    if (selectedSchoolRowKeys.length === 0) {
      return
    }
    setSchoolDeleteGuideOpen(true)
  }, [selectedSchoolRowKeys])

  const handleSchoolDeleteConfirm = useCallback(() => {
    const keysToDelete = new Set(selectedSchoolRowKeys.map(String))
    setSchoolList(prev => prev.filter(row => !keysToDelete.has(row.id)))
    setSelectedSchoolRowKeys([])
    setSchoolDeleteGuideOpen(false)
    }, [selectedSchoolRowKeys])

  /** 선택 삭제 확인 시: 선택된 참여 기관을 리스트에서 제거 */
  const handleBulkDeleteConfirm = useCallback(() => {
    const keysSet = new Set(selectedSchoolRowKeys.map(String))
    setSchoolList(prev => prev.filter(row => !keysSet.has(row.id)))
    setSelectedSchoolRowKeys([])
    }, [selectedSchoolRowKeys])

  /** 선택 승인 확인 시: 선택된 참여 기관 approvalStatus → approved */
  const handleBulkApproveConfirm = useCallback(() => {
    const keysSet = new Set(selectedSchoolRowKeys.map(String))
    setSchoolList(prev =>
      prev.map(row =>
        keysSet.has(row.id) ? { ...row, approvalStatus: 'approved' as ParticipatingSchoolApprovalStatusKey } : row
      )
    )
    setSelectedSchoolRowKeys([])
    }, [selectedSchoolRowKeys])

  /** 학교 상세에서 승인 취소 확인 시: 해당 기관 approvalStatus → cancelled */
  const handleSchoolApprovalCancel = useCallback((schoolId: string) => {
    setSchoolList(prev =>
      prev.map(row =>
        row.id === schoolId
          ? { ...row, approvalStatus: 'cancelled' as ParticipatingSchoolApprovalStatusKey }
          : row
      )
    )
    }, [])

  /** 학교별 배정 강사 요약 (대표강사명 외 N명, 저장 패치 우선) */
  const getInstructorDisplayForSchool = useCallback(
    (schoolId: string, schoolName: string): string => {
      const saved = savedInstructorPatches[schoolId]
      const rows =
        saved !== undefined
          ? saved.map(i => ({ role: i.role, instructorName: i.instructorName }))
          : getInstructorRowsForSchool(schoolName, instructorList).map(i => ({
              role: i.role,
              instructorName: i.instructorName,
            }))
      return formatAssignedInstructorSummary(rows)
    },
    [instructorList, savedInstructorPatches]
  )

  return {
    schoolList,
    setSchoolList,
    selectedSchoolRowKeys,
    setSelectedSchoolRowKeys,
    selectedSchoolForDetail,
    setSelectedSchoolForDetail,
    schoolDetailModalOpen,
    setSchoolDetailModalOpen,
    schoolDeleteGuideOpen,
    setSchoolDeleteGuideOpen,
    savedBasicPatches,
    setSavedBasicPatches,
    savedInstructorPatches,
    setSavedInstructorPatches,
    filteredSchools,
    schoolNamesToDelete,
    handleTextbookStatusChange,
    handleSchoolDeleteClick,
    handleSchoolDeleteConfirm,
    handleBulkDeleteConfirm,
    handleBulkApproveConfirm,
    handleSchoolApprovalCancel,
    getInstructorDisplayForSchool,
    getInstructorRowsForSchool,
    applicationsLoading: ttRemoteEnabled
      ? ttParticipatingQuery.isFetching && ttParticipatingQuery.data === undefined
      : remoteEnabled
        ? remoteQuery.isFetching && remoteQuery.data === undefined
        : false,
    isRemoteDataSource: ttRemoteEnabled || remoteEnabled,
  }
}
