/**
 * 프로그램 진행현황 탭 - 참여 학교 목록 상태 관리 훅
 * schoolList state, 선택/삭제/상세 모달, 교재현황 변경, 필터링, 담당 강사진 표시
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
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
import {
  fetchGeneralParticipatingInstitutionsPage,
  updateGeneralParticipatingInstitutionTextbookDelivery,
} from '@/features/program/general/api/admin-program-progress-service'
import {
  mapTextbookDeliveryStatusToBadge,
  mapTextbookStatusKeyToDeliveryStatus,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  useIsCompanySchoolProgramsSurface,
  useIsTrainedTeachersProgramsSurface,
  useProgramProgressRemoteEnabledForSurface,
} from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { useTrainedTeacherParticipatingInstitutions } from '@/features/program/trained-teachers/api/education-journals-hooks'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import {
  removeTrainedTeacherOrganizationApplicationFromProgress,
  updateTrainedTeacherOrganizationApplicationTextbookDelivery,
} from '@/features/program/trained-teachers/api/organization-applications-service'
import { trainedTeacherQueryKeys } from '@/features/program/trained-teachers/api/query-keys'
import {
  notifyProgramApiUnavailable,
  useNotifyProgramApiUnavailableOnce,
} from '@/features/program/shared/lib/program-api-unavailable'
import type { Program } from '@/types/domain'
import {
  extractApiErrorCode,
  extractApiErrorMessage,
  getApiErrorCode,
  getApiErrorHttpStatus,
  readApiErrorAlertMessage,
} from '@/shared/lib/extract-api-error-message'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import axios from 'axios'

export interface UseProgressSchoolListOptions {
  appliedFilters: ProgressFilters
  instructorList: ParticipatingInstructorRow[]
  programId?: string
  program?: Program | null
  /** false면 기관 목록 API를 호출하지 않는다 (개인 프로그램 캘린더 mock 유입 방지) */
  enabled?: boolean
}

export function useProgressSchoolList({
  appliedFilters,
  instructorList,
  programId,
  program: _program,
  enabled = true,
}: UseProgressSchoolListOptions) {
  const queryClient = useQueryClient()
  const { showAlert } = useCmsAlert()
  const isTrainedTeachersSurface = useIsTrainedTeachersProgramsSurface()
  void useIsCompanySchoolProgramsSurface()
  const remoteEnabled = enabled && useProgramProgressRemoteEnabledForSurface(programId)
  const ttRemoteEnabled =
    enabled &&
    isTrainedTeachersSurface &&
    shouldUseTrainedTeacherProgramsRemoteApi() &&
    Boolean(programId)

  useNotifyProgramApiUnavailableOnce(
    enabled && !remoteEnabled && !ttRemoteEnabled,
    'general-progress-schools',
    '프로그램 진행 현황 · 참여 기관'
  )

  const remoteQuery = useInfiniteQuery({
    queryKey: generalProgramProgressQueryKeys.institutions(programId ?? ''),
    queryFn: ({ pageParam }) => fetchGeneralParticipatingInstitutionsPage(programId!, pageParam),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: enabled && remoteEnabled && !isTrainedTeachersSurface,
    staleTime: 30_000,
    retry: false,
  })

  const ttListFilters = useMemo(
    () => ({
      schoolName: appliedFilters.schoolName,
      teacherName: appliedFilters.teacherName,
    }),
    [appliedFilters.schoolName, appliedFilters.teacherName]
  )

  const ttParticipatingQuery = useTrainedTeacherParticipatingInstitutions(
    programId,
    ttRemoteEnabled,
    ttListFilters
  )
  const [schoolList, setSchoolList] = useState<ParticipatingSchoolRow[]>([])

  useEffect(() => {
    if (ttRemoteEnabled) {
      if (ttParticipatingQuery.data) setSchoolList(ttParticipatingQuery.data)
      return
    }
    if (remoteEnabled) {
      if (remoteQuery.data) {
        setSchoolList(remoteQuery.data.pages.flatMap(page => page.rows))
      }
      return
    }
    setSchoolList([])
  }, [remoteEnabled, remoteQuery.data, ttRemoteEnabled, ttParticipatingQuery.data])

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
      const record = schoolList.find(row => row.id === recordId)
      const applicationId = record?.organizationApplicationId ?? recordId
      const deliveryStatus = mapTextbookStatusKeyToDeliveryStatus(status)

      const applyResolvedStatus = (serverStatus?: string | null) => {
        if (!serverStatus) return
        const resolvedStatus = mapTextbookDeliveryStatusToBadge(serverStatus)
        setSchoolList(prev =>
          prev.map(row =>
            row.id === recordId ? { ...row, textbookStatus: resolvedStatus } : row
          )
        )
      }

      const alertTextbookDeliveryFailure = (error: unknown) => {
        const isConcurrentStateChange =
          getApiErrorHttpStatus(error) === 409 &&
          getApiErrorCode(error) === 'TEXTBOOK_DELIVERY_CONCURRENT_STATE_CHANGE'
        if (isConcurrentStateChange) {
          showAlert({
            title: '교재 배송 변경 실패',
            content:
              '교재 배송 상태가 다른 요청으로 변경되었습니다. 새로고침 후 다시 시도해 주세요.',
          })
          return
        }
        showAlert({
          title: '교재 배송 변경 실패',
          content: isTrainedTeachersSurface
            ? readApiErrorAlertMessage(
                error,
                '교재 배송 현황을 변경하지 못했습니다. 다시 시도해 주세요.'
              )
            : getGeneralProgramApiErrorMessage(
                error,
                '교재 배송 현황을 변경하지 못했습니다. 다시 시도해 주세요.'
              ),
        })
      }

      if (isTrainedTeachersSurface) {
        if (!ttRemoteEnabled || !programId) {
          notifyProgramApiUnavailable(
            'trained-teacher-organization-application-textbook-delivery-status',
            '교육받은 교사 · 교재 배송 현황 변경'
          )
          return
        }
        void (async () => {
          const participantCacheKey = trainedTeacherQueryKeys.organizationParticipantId(
            programId,
            applicationId
          )
          const cachedParticipantId = queryClient.getQueryData<string>(participantCacheKey)
          const invalidateTtTextbookDeliveryQueries = async () => {
            await queryClient.invalidateQueries({
              queryKey: trainedTeacherQueryKeys.participatingInstitutionsProgram(programId),
            })
            await queryClient.invalidateQueries({
              queryKey: trainedTeacherQueryKeys.organizationApplicationsProgram(programId),
            })
            await queryClient.invalidateQueries({
              queryKey: trainedTeacherQueryKeys.organizationApplication(programId, applicationId),
            })
            await queryClient.invalidateQueries({
              queryKey: generalProgramProgressQueryKeys.participants(programId, 'ORGANIZATION'),
            })
          }
          try {
            const response = await updateTrainedTeacherOrganizationApplicationTextbookDelivery(
              programId,
              applicationId,
              deliveryStatus,
              cachedParticipantId
            )
            if (response.participantId != null) {
              queryClient.setQueryData(participantCacheKey, String(response.participantId))
            }
            applyResolvedStatus(response.textbookDeliveryStatus)
            await invalidateTtTextbookDeliveryQueries()
          } catch (error) {
            queryClient.removeQueries({ queryKey: participantCacheKey })
            await invalidateTtTextbookDeliveryQueries()
            alertTextbookDeliveryFailure(error)
          }
        })()
        return
      }

      if (!remoteEnabled || !programId) {
        notifyProgramApiUnavailable(
          'general-participating-institution-textbook-delivery-status',
          '참여 기관 · 교재 배송 현황 변경'
        )
        return
      }
      void (async () => {
        try {
          const response = await updateGeneralParticipatingInstitutionTextbookDelivery(
            programId,
            recordId,
            deliveryStatus
          )
          applyResolvedStatus(response.textbookDeliveryStatus)
          await queryClient.invalidateQueries({
            queryKey: generalProgramProgressQueryKeys.institutions(programId),
          })
          if (record?.organizationApplicationId) {
            await queryClient.invalidateQueries({
              queryKey: generalApplicationsQueryKeys.organizationDetail(
                record.organizationApplicationId
              ),
            })
          }
        } catch (error) {
          const isConcurrentStateChange =
            getApiErrorHttpStatus(error) === 409 &&
            getApiErrorCode(error) === 'TEXTBOOK_DELIVERY_CONCURRENT_STATE_CHANGE'
          if (isConcurrentStateChange) {
            await queryClient.invalidateQueries({
              queryKey: generalProgramProgressQueryKeys.institutions(programId),
            })
            if (record?.organizationApplicationId) {
              await queryClient.invalidateQueries({
                queryKey: generalApplicationsQueryKeys.organizationDetail(
                  record.organizationApplicationId
                ),
              })
            }
          }
          alertTextbookDeliveryFailure(error)
        }
      })()
    },
    [
      isTrainedTeachersSurface,
      programId,
      queryClient,
      remoteEnabled,
      schoolList,
      showAlert,
      ttRemoteEnabled,
    ]
  )

  const handleSchoolDeleteClick = useCallback(() => {
    if (selectedSchoolRowKeys.length === 0) {
      return
    }
    setSchoolDeleteGuideOpen(true)
  }, [selectedSchoolRowKeys])

  const handleSchoolDeleteConfirm = useCallback(async () => {
    const keysToDelete = selectedSchoolRowKeys.map(String)
    if (keysToDelete.length === 0) return

    if (isTrainedTeachersSurface) {
      if (!ttRemoteEnabled || !programId) {
        setSchoolDeleteGuideOpen(false)
        notifyProgramApiUnavailable(
          'trained-teacher-remove-from-progress',
          '교육받은 교사 · 진행 현황 학교 제외'
        )
        return
      }

      const failures: string[] = []
      for (const applicationId of keysToDelete) {
        const schoolName =
          schoolList.find(row => row.id === applicationId)?.schoolName?.trim() || applicationId
        try {
          await removeTrainedTeacherOrganizationApplicationFromProgress(programId, applicationId, {
            reason: `${schoolName} 진행 현황 제외`,
          })
        } catch (error) {
          const responseData = axios.isAxiosError(error) ? error.response?.data : undefined
          const httpStatus = axios.isAxiosError(error) ? error.response?.status : undefined
          const code = extractApiErrorCode(responseData)
          const details =
            responseData &&
            typeof responseData === 'object' &&
            'error' in responseData &&
            responseData.error &&
            typeof responseData.error === 'object' &&
            'details' in responseData.error
              ? (responseData.error as { details?: Record<string, unknown> }).details
              : undefined
          if (code === 'TRAINED_TEACHER_PROGRESS_EVIDENCE_EXISTS') {
            const journalCount = details?.journalCount
            const completionCount = details?.educationCompletionCount
            failures.push(
              `${schoolName}: 교육일지(${journalCount ?? '-'}) 또는 완료 증빙(${completionCount ?? '-'})이 있어 제외할 수 없습니다.`
            )
          } else {
            failures.push(
              `${schoolName}: ${extractApiErrorMessage(responseData, {
                httpStatus,
                fallback: '진행 현황에서 제외하지 못했습니다.',
              })}`
            )
          }
        }
      }

      await queryClient.invalidateQueries({
        queryKey: trainedTeacherQueryKeys.participatingInstitutions(programId),
      })
      await queryClient.invalidateQueries({
        queryKey: trainedTeacherQueryKeys.organizationApplicationsRoot(),
      })
      await queryClient.invalidateQueries({
        queryKey: trainedTeacherQueryKeys.performanceSummary(programId),
      })

      setSelectedSchoolRowKeys([])
      setSchoolDeleteGuideOpen(false)

      if (failures.length > 0) {
        void showAlert({
          title: '학교 삭제 안내',
          content: failures.join('\n'),
        })
      }
      return
    }

    const keysSet = new Set(keysToDelete)
    setSchoolList(prev => prev.filter(row => !keysSet.has(row.id)))
    setSelectedSchoolRowKeys([])
    setSchoolDeleteGuideOpen(false)
  }, [
    isTrainedTeachersSurface,
    programId,
    queryClient,
    schoolList,
    selectedSchoolRowKeys,
    showAlert,
    ttRemoteEnabled,
  ])

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
        keysSet.has(row.id)
          ? { ...row, approvalStatus: 'approved' as ParticipatingSchoolApprovalStatusKey }
          : row
      )
    )
    setSelectedSchoolRowKeys([])
  }, [selectedSchoolRowKeys])

  /** 잔여 모달 승인 취소. 진행 현황 SSOT는 활동 포기. 로컬 성공 위장 금지. */
  const handleSchoolApprovalCancel = useCallback((_schoolId: string) => {
    void _schoolId
    notifyProgramApiUnavailable(
      'general-participating-institution-cancel-approval',
      '일반 프로그램 · 참여 기관 진행 현황 승인 취소'
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
      remoteEnabled && !isTrainedTeachersSurface ? (remoteQuery.hasNextPage ?? false) : false,
    isFetchingNextPage: remoteQuery.isFetchingNextPage,
    fetchNextPage: remoteQuery.fetchNextPage,
  }
}
