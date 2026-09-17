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
  useIsCompanySchoolProgramsSurface,
  useIsTrainedTeachersProgramsSurface,
  useProgramProgressRemoteEnabledForSurface,
} from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import type { Program } from '@/types/domain'
import {
  INSTRUCTOR_SETTLEMENT_STATUS_ORDER,
  type InstructorSettlementUiStatus,
} from '@/shared/constants/instructor-settlement-status'

// TODO(temp-mock): 열여라 참깨 — 참여 강사·배정 현황 검증 후 삭제
export const TEMP_PROGRESS_INSTRUCTOR_PREFIX = 'temp-progress-instructor-'

const TEMP_PROGRESS_SCHOOL_NAMES = [
  '서울해봄초등학교',
  '서울푸른초등학교',
  '서울나래초등학교',
  '서울미래중학교',
] as const

function buildTemporaryProgressInstructors(programId: string): ParticipatingInstructorRow[] {
  return INSTRUCTOR_SETTLEMENT_STATUS_ORDER.map(
    (settlementStatus: InstructorSettlementUiStatus, index) => {
      const sequence = index + 1
      const schoolName = TEMP_PROGRESS_SCHOOL_NAMES[index % TEMP_PROGRESS_SCHOOL_NAMES.length]
      return {
        id: `${TEMP_PROGRESS_INSTRUCTOR_PREFIX}${settlementStatus}`,
        no: sequence,
        instructorName: `임시 강사 ${sequence}`,
        schoolName,
        educationGrade: `${4 + (index % 3)}학년`,
        classCount: 1 + (index % 3),
        studentCount: 20 + sequence,
        lectureRound: '4회차',
        settlementStatus,
        teacherName: `담당 교사 ${sequence}`,
        memberId: String(995_000 + sequence),
        contact: `010-7000-${String(1000 + sequence)}`,
        email: `temp-instructor-${sequence}@jakorea.example`,
        address: `서울특별시 ${['강서구', '마포구', '영등포구', '서대문구'][index % 4]} 테스트로 ${sequence}`,
        nameHanja: `臨時講師${sequence}`,
        nameEnglish: `Temporary Instructor ${sequence}`,
        birthDate: `198${index % 8}-0${(index % 8) + 1}-15`,
        age: 38 + index,
        gender: index % 2 === 0 ? '여성' : '남성',
        militaryStatus: index % 2 === 0 ? '해당 없음' : '군필',
        bankName: ['국민은행', '신한은행', '우리은행', '하나은행'][index % 4],
        accountNumber: `110-${String(200 + sequence)}-123456`,
        accountHolder: `임시 강사 ${sequence}`,
        profileImageUrl:
          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120"%3E%3Crect width="120" height="120" fill="%23e8f5f2"/%3E%3Ccircle cx="60" cy="45" r="22" fill="%23589f91"/%3E%3Cpath d="M20 112c4-27 19-40 40-40s36 13 40 40" fill="%23589f91"/%3E%3C/svg%3E',
        oneLineIntro: `청소년 경제교육 경력 ${sequence + 2}년 강사입니다.`,
        educationLevel: '대학교 졸업',
        educationSchoolName: `테스트대학교 ${sequence}`,
        lectureExperienceYears: sequence + 2,
        careerDetails: [
          {
            companyName: 'JA Korea 경제교육',
            role: '교육 강사',
            startDate: '2023-03-01',
            endDate: '2026-09-30',
            isCurrent: true,
          },
        ],
        qualifications: [{ name: '청소년 경제교육 지도사', year: '2024' }],
        awards: [{ name: '우수 강사상', year: '2025' }],
        educations: [
          {
            schoolType: '대학교',
            status: '졸업',
            schoolName: `테스트대학교 ${sequence}`,
            major: '교육학과',
            enrollmentYear: '2010',
            graduationYear: '2014',
          },
        ],
        freeWriting1: '청소년의 경제적 자립을 돕기 위해 지원했습니다.',
        freeWriting2: '생활 속 경제교육은 올바른 의사결정의 기반입니다.',
        freeWriting3: '질문과 활동 중심으로 학생들과 소통합니다.',
        freeWriting4: '안전 매뉴얼에 따라 침착하게 대응합니다.',
        initialApproval: true,
        region: `서울특별시 ${['강서구', '마포구', '영등포구', '서대문구'][index % 4]}`,
        jaEvaluationGrade: ['S', 'A', 'B', 'C'][index % 4],
        lectureReportSubmitted: index % 2 === 0,
        registeredByAdmin: true,
        lectureFeeCategory: '일반 프로그램 강사비',
        lectureFeeAmount: String(300_000 + index * 20_000),
        lectureFeeBasisType: 'program',
        lectureFeeMeasure: '출강 1회당',
        lectureFeeBasisDisplay: `일반 프로그램 | 출강 1회당 | ${(
          300_000 +
          index * 20_000
        ).toLocaleString()}원`,
        businessIncomeEarnerStatus: '사업소득자',
        adminComment: `${settlementStatus} 상태 확인용 임시 강사`,
        scheduleChangeCancelCount: index % 3,
        affiliation: `JA Korea 임시 강사 그룹 ${sequence}`,
        instructorMemberProfile: 'instructor_only',
        affiliationEmploymentStatus: 'ACTIVE',
        instructorFeeGradeLabel: `${(index % 3) + 1}급`,
        unavailableEducationDateKeys: [`2026-10-${String(20 + (index % 8)).padStart(2, '0')}`],
        activityWithdrawn: false,
        activityWithdrawReason: 'institution',
        activityWithdrawStopScheduleId: `temp-stop-${sequence}`,
        activityWithdrawStopScheduleLabel: '2026. 11. 30(월) | 4회차',
        performanceIncludedScheduleIds: [
          `temp-schedule-${programId}-${sequence}-1`,
          `temp-schedule-${programId}-${sequence}-2`,
        ],
      }
    }
  )
}

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
  const isCompanySchoolSurface = useIsCompanySchoolProgramsSurface()
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
  const temporaryProgressInstructors = useMemo(
    () =>
      programId && !isTrainedTeachersSurface && !isCompanySchoolSurface
        ? buildTemporaryProgressInstructors(programId)
        : [],
    [isCompanySchoolSurface, isTrainedTeachersSurface, programId]
  )

  const [instructorList, setInstructorList] = useState<ParticipatingInstructorRow[]>(() => [])

  useEffect(() => {
    if (remoteEnabled) {
      if (remoteQuery.data) {
        const remoteRows = remoteQuery.data.pages.flatMap(page => page.rows)
        setInstructorList([...temporaryProgressInstructors, ...remoteRows])
      } else {
        setInstructorList(temporaryProgressInstructors)
      }
      return
    }
    setInstructorList(temporaryProgressInstructors)
  }, [remoteEnabled, remoteQuery.data, programId, temporaryProgressInstructors])

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
