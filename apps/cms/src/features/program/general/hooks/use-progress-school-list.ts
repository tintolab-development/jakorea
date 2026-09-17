/**
 * 프로그램 진행현황 탭 - 참여 학교 목록 상태 관리 훅
 * schoolList state, 선택/삭제/상세 모달, 교재현황 변경, 필터링, 담당 강사진 표시
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolApprovalStatusKey,
  TextbookStatusKey,
} from '@/features/program/general/model/participating-schools'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import { formatAssignedInstructorSummary } from '../lib/institution-assigned-instructor-count'
import { getInstructorRowsForSchool } from '../lib/school-detail'
import type {
  SchoolDetailForModal,
  InstructorListFormInstructor,
} from '../model/school-detail-types'
import type { ProgressFilters } from './use-program-progress-params'
import { fetchGeneralParticipatingInstitutionsPage } from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  useIsCompanySchoolProgramsSurface,
  useIsTrainedTeachersProgramsSurface,
  useProgramProgressRemoteEnabledForSurface,
} from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { useTrainedTeacherParticipatingInstitutions } from '@/features/program/trained-teachers/api/education-journals-hooks'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import {
  notifyProgramApiUnavailable,
  useNotifyProgramApiUnavailableOnce,
} from '@/features/program/shared/lib/program-api-unavailable'
import type { Program } from '@/types/domain'

// TODO(temp-mock): 열여라 참깨 — 참여 기관·강사 배정 현황 검증 후 삭제
export const TEMP_TEXTBOOK_STATUS_SCHOOL_PREFIX = 'temp-textbook-status-'

function buildTemporaryProgressSchools(programId: string): ParticipatingSchoolRow[] {
  const cases: Array<{
    status: TextbookStatusKey
    schoolName: string
    region: string
    grade: string
    teacherName: string
    instructors: string
  }> = [
    {
      status: 'preparing',
      schoolName: '서울해봄초등학교',
      region: '서울특별시 강서구',
      grade: '초등학교 4학년',
      teacherName: '김하늘',
      instructors: '임시 강사 1 외 1명',
    },
    {
      status: 'shipping',
      schoolName: '서울푸른초등학교',
      region: '서울특별시 마포구',
      grade: '초등학교 5학년',
      teacherName: '박서준',
      instructors: '임시 강사 2 외 1명',
    },
    {
      status: 'delivered',
      schoolName: '서울나래초등학교',
      region: '서울특별시 영등포구',
      grade: '초등학교 6학년',
      teacherName: '이지우',
      instructors: '임시 강사 3 외 1명',
    },
    {
      status: 'not_applicable',
      schoolName: '서울미래중학교',
      region: '서울특별시 서대문구',
      grade: '중학교 1학년',
      teacherName: '최민서',
      instructors: '임시 강사 4 외 1명',
    },
  ]

  return cases.map((item, index) => ({
    id: `${TEMP_TEXTBOOK_STATUS_SCHOOL_PREFIX}${item.status}`,
    organizationId: 994_001 + index,
    teacherMemberId: 993_001 + index,
    no: index + 1,
    schoolName: item.schoolName,
    region: item.region,
    educationGrade: item.grade,
    classCount: index + 1,
    studentCount: 24 + index,
    lectureRound: '4회차',
    textbookStatus: item.status,
    approvalStatus: 'approved',
    teacherName: item.teacherName,
    instructors: item.instructors,
    sessions: [1, 2, 3, 4].map(round => ({
      round,
      date: `2026.10.${String(12 + index * 4 + round).padStart(2, '0')}`,
      dayOfWeek: ['월', '화', '수', '목'][index],
      duration: '2시간',
      format: '대면 교육',
      classNum: `${round}교시`,
      timeRange: `${String(8 + round).padStart(2, '0')}:00 ~ ${String(9 + round).padStart(2, '0')}:50`,
      status: round === 1 ? 'completed' : 'pending',
      requestedScheduleId: 992_000 + index * 10 + round,
      resolvedScheduleId: 991_000 + index * 10 + round,
      scheduleUnresolved: false,
    })),
    programId,
    organizationApplicationId: String(990_001 + index),
    participantStatus: 'APPROVED',
    activityWithdrawn: false,
    availableActions: ['GIVE_UP'],
  }))
}

export interface UseProgressSchoolListOptions {
  appliedFilters: ProgressFilters
  instructorList: ParticipatingInstructorRow[]
  programId?: string
  program?: Program | null
}

export function useProgressSchoolList({
  appliedFilters,
  instructorList,
  programId,
  program: _program,
}: UseProgressSchoolListOptions) {
  const isTrainedTeachersSurface = useIsTrainedTeachersProgramsSurface()
  const isCompanySchoolSurface = useIsCompanySchoolProgramsSurface()
  const remoteEnabled = useProgramProgressRemoteEnabledForSurface(programId)
  const ttRemoteEnabled =
    isTrainedTeachersSurface &&
    shouldUseTrainedTeacherProgramsRemoteApi() &&
    Boolean(programId)

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled && !ttRemoteEnabled,
    'general-progress-schools',
    '프로그램 진행 현황 · 참여 기관'
  )

  const remoteQuery = useInfiniteQuery({
    queryKey: generalProgramProgressQueryKeys.institutions(programId ?? ''),
    queryFn: ({ pageParam }) =>
      fetchGeneralParticipatingInstitutionsPage(programId!, pageParam),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled && !isTrainedTeachersSurface,
    staleTime: 30_000,
    retry: false,
  })

  const ttParticipatingQuery = useTrainedTeacherParticipatingInstitutions(
    programId,
    ttRemoteEnabled
  )
  const temporaryProgressSchools = useMemo(
    () =>
      programId && !isTrainedTeachersSurface && !isCompanySchoolSurface
        ? buildTemporaryProgressSchools(programId)
        : [],
    [isCompanySchoolSurface, isTrainedTeachersSurface, programId]
  )
  const [schoolList, setSchoolList] = useState<ParticipatingSchoolRow[]>([])

  useEffect(() => {
    if (ttRemoteEnabled) {
      if (ttParticipatingQuery.data) setSchoolList(ttParticipatingQuery.data)
      return
    }
    if (remoteEnabled) {
      if (remoteQuery.data) {
        const remoteRows = remoteQuery.data.pages.flatMap(page => page.rows)
        setSchoolList([...temporaryProgressSchools, ...remoteRows])
      } else {
        setSchoolList(temporaryProgressSchools)
      }
      return
    }
    setSchoolList(temporaryProgressSchools)
  }, [
    remoteEnabled,
    remoteQuery.data,
    ttRemoteEnabled,
    ttParticipatingQuery.data,
    temporaryProgressSchools,
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
    (_recordId: string, _status: TextbookStatusKey) => {
      notifyProgramApiUnavailable(
        'general-participating-institution-textbook-delivery-status',
        '참여 기관 · 교재 배송 현황 변경'
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
    hasNextPage:
      remoteEnabled && !isTrainedTeachersSurface
        ? (remoteQuery.hasNextPage ?? false)
        : false,
    isFetchingNextPage: remoteQuery.isFetchingNextPage,
    fetchNextPage: remoteQuery.fetchNextPage,
  }
}
