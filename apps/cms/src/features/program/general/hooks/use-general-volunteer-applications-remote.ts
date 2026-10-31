import { useCallback, useEffect, useMemo, type Dispatch, type SetStateAction } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchGeneralIndividualScreeningApplicationsPage,
  fetchGeneralVolunteerScreeningApplicationsPage,
  mapSecondInterviewStatusToFinalResultPayload,
  submitGeneralIndividualDocumentResult,
  submitGeneralIndividualDocumentResultBulk,
  submitGeneralIndividualFinalResult,
  submitGeneralVolunteerDocumentResult,
  submitGeneralVolunteerDocumentResultBulk,
  submitGeneralVolunteerFinalResult,
  submitGeneralVolunteerFinalResultBulk,
  giveUpGeneralVolunteerApplication,
  submitGeneralInterviewAssignmentEvaluation,
  updateGeneralVolunteerDocumentEvaluation,
  cancelGeneralVolunteerApplicationApproval,
  cancelGeneralVolunteerApplicationRejection,
  cancelGeneralIndividualApplicationRejection,
} from '@/features/program/general/api/admin-applications-service'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { toScreeningResultNotifyFields } from '@/features/program/general/api/screening-notify-fields'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import type { ScreeningSubjectKind } from '@/features/program/general/lib/screening-subject-kind'
import type {
  GeneralManagerEvaluation,
  GeneralSecondInterviewScreeningStatus,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { formatApplicationEligibilityConflictMessage } from '@/features/program/shared/lib/application-eligibility-conflict'
import { formatApplicationDecisionCancelConflictMessage } from '@/features/program/shared/lib/application-decision-cancel-conflict'
import { formatApplicationStatusConflictMessage } from '@/features/program/shared/lib/application-status-conflict'
import {
  extractApiErrorMessage,
  getApiErrorHttpStatus,
} from '@/shared/lib/extract-api-error-message'
import {
  giveUpIndividualApplicationRemote,
  type ApplicationsListQuery,
  type InterviewAssignmentEvaluationPayload,
  type InstructorApplicationNotificationRequest,
} from '@/features/program/general/api/applications-api-client'
import { validateApplicationGiveUpReason } from '@/features/program/shared/lib/application-give-up'
import { mergeGeneralVolunteerApplicantListRows } from '@/features/program/general/lib/general-volunteer-applications-list-merge'
import { getNotificationScheduleError } from '@/shared/lib/notification-schedule'
import {
  DOCUMENT_EVALUATION_ERROR_ALERT_TITLE,
  readDocumentEvaluationErrorMessage,
  shouldShowDocumentEvaluationErrorAlert,
} from '@/features/program/shared/lib/document-evaluation-error'

export type GeneralVolunteerApplicationsStage = 'doc1' | 'docPassed' | 'interview2'

type UseGeneralVolunteerApplicationsRemoteOptions = {
  programId: string
  stage: GeneralVolunteerApplicationsStage
  /** volunteer(기본) | participant — 참여자는 individual-applications */
  subjectKind?: ScreeningSubjectKind
  /** false면 remote 비활성 — mock 로더는 호출부 유지 */
  enabled?: boolean
  /** 서버 필터 (volunteer 전용). 지정 시 query key에 포함 */
  listQuery?: ApplicationsListQuery
  setList: Dispatch<SetStateAction<GeneralVolunteerApplicantRow[]>>
}

export function useGeneralVolunteerApplicationsRemote({
  programId,
  stage,
  subjectKind = 'volunteer',
  enabled = true,
  listQuery,
  setList,
}: UseGeneralVolunteerApplicationsRemoteOptions) {
  const queryClient = useQueryClient()
  const { showAlert } = useCmsAlert()
  const remoteEnabled = useMemo(
    () => enabled && shouldUseGeneralApplicationsRemoteApi() && Boolean(programId),
    [enabled, programId]
  )

  const queryFn = useCallback(
    ({ pageParam }: { pageParam: number }) => {
      if (subjectKind === 'participant') {
        return fetchGeneralIndividualScreeningApplicationsPage(
          programId,
          stage === 'interview2' ? 'interview2' : 'docPassed',
          pageParam
        )
      }
      return fetchGeneralVolunteerScreeningApplicationsPage(programId, stage, pageParam, listQuery)
    },
    [listQuery, programId, stage, subjectKind]
  )

  const listQueryKey =
    subjectKind === 'participant'
      ? ([...generalApplicationsQueryKeys.individualList(programId), 'screening', stage] as const)
      : listQuery
        ? ([...generalApplicationsQueryKeys.volunteerList(programId), stage, listQuery] as const)
        : ([...generalApplicationsQueryKeys.volunteerList(programId), stage] as const)

  const query = useInfiniteQuery({
    queryKey: listQueryKey,
    queryFn,
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    placeholderData: listQuery
      ? (previousData, previousQuery) =>
          previousQuery?.queryKey.includes(programId) ? previousData : undefined
      : undefined,
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  useEffect(() => {
    if (!query.data) return
    const fetched = query.data.pages.flatMap(page => page.rows)
    setList(previous => mergeGeneralVolunteerApplicantListRows(previous, fetched))
  }, [query.data, setList])

  const listTotalElements = query.data?.pages[0]?.totalElements

  const invalidateApplications = useCallback(async () => {
    if (subjectKind === 'participant') {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.individualLists(programId),
        }),
        queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.individualDetails(),
        }),
      ])
      return
    }
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: generalApplicationsQueryKeys.volunteerList(programId),
      }),
      queryClient.invalidateQueries({
        queryKey: generalApplicationsQueryKeys.volunteerDetails(),
      }),
    ])
  }, [programId, queryClient, subjectKind])

  const notifyRemoteFailure = useCallback(
    (error: unknown) => {
      console.debug('applications remote decision failed', error)
      const data = (error as { response?: { data?: unknown } } | null)?.response?.data
      const scheduleError = getNotificationScheduleError(error)
      showAlert({
        title: '처리 실패',
        content:
          scheduleError?.message ??
          formatApplicationEligibilityConflictMessage(error) ??
          formatApplicationDecisionCancelConflictMessage(error) ??
          formatApplicationStatusConflictMessage(error) ??
          extractApiErrorMessage(data, {
            httpStatus: getApiErrorHttpStatus(error),
            fallback:
              subjectKind === 'participant'
                ? '참여자 신청 상태 변경 중 오류가 발생했습니다. 다시 시도해 주세요.'
                : '봉사자 신청 상태 변경 중 오류가 발생했습니다. 다시 시도해 주세요.',
          }),
      })
    },
    [showAlert, subjectKind]
  )

  const applyRemoteDocumentResult = useCallback(
    async (
      ids: string[],
      result: 'PASS' | 'FAIL',
      reason?: string,
      notifyTiming?: string,
      scheduledAt?: string
    ) => {
      if (!remoteEnabled) return false
      try {
        const payload = {
          result,
          reason: result === 'FAIL' ? reason?.trim() || '반려' : reason,
          ...toScreeningResultNotifyFields({
            notifyTiming: notifyTiming?.trim().toUpperCase(),
            scheduledAt,
          }),
        }
        if (subjectKind === 'participant') {
          if (ids.length > 1) {
            const bulk = await submitGeneralIndividualDocumentResultBulk(ids, payload)
            if ((bulk.failureCount ?? 0) > 0) {
              showAlert({
                title: '서류 결과 일부 실패',
                content: `요청 ${bulk.requestedCount ?? ids.length}건 중 성공 ${bulk.successCount ?? 0}건, 실패 ${bulk.failureCount ?? 0}건입니다.`,
              })
            }
          } else {
            await submitGeneralIndividualDocumentResult(ids[0], payload)
          }
        } else if (ids.length > 1) {
          const bulk = await submitGeneralVolunteerDocumentResultBulk(ids, payload)
          if ((bulk.failureCount ?? 0) > 0) {
            showAlert({
              title: '서류 결과 일부 실패',
              content: `요청 ${bulk.requestedCount ?? ids.length}건 중 성공 ${bulk.successCount ?? 0}건, 실패 ${bulk.failureCount ?? 0}건입니다.`,
            })
          }
        } else {
          for (const id of ids) {
            await submitGeneralVolunteerDocumentResult(id, payload)
          }
        }
        await invalidateApplications()
        return true
      } catch (error) {
        await invalidateApplications()
        notifyRemoteFailure(error)
        return false
      }
    },
    [invalidateApplications, notifyRemoteFailure, remoteEnabled, showAlert, subjectKind]
  )

  const applyRemoteManagerEvaluation = useCallback(
    async (applicationId: string, managerSlot: 'A' | 'B', evaluation: GeneralManagerEvaluation) => {
      if (!remoteEnabled || subjectKind !== 'volunteer') return false
      try {
        await updateGeneralVolunteerDocumentEvaluation(applicationId, managerSlot, evaluation)
        await invalidateApplications()
        return true
      } catch (error) {
        await invalidateApplications()
        if (shouldShowDocumentEvaluationErrorAlert(error)) {
          showAlert({
            title: DOCUMENT_EVALUATION_ERROR_ALERT_TITLE,
            content: readDocumentEvaluationErrorMessage(error),
          })
        }
        return false
      }
    },
    [invalidateApplications, remoteEnabled, showAlert, subjectKind]
  )

  const applyRemoteFinalResult = useCallback(
    async (
      ids: string[],
      status: Extract<
        GeneralSecondInterviewScreeningStatus,
        'pass' | 'fail' | 'reserve1' | 'reserve2' | 'reserve3' | 'reserve4'
      >,
      reason?: string,
      notify?: { notifyTiming?: string; scheduledAt?: string }
    ) => {
      if (!remoteEnabled) return false
      try {
        const payload = mapSecondInterviewStatusToFinalResultPayload(
          status,
          reason,
          toScreeningResultNotifyFields(notify)
        )
        if (subjectKind === 'participant') {
          for (const id of ids) {
            await submitGeneralIndividualFinalResult(id, payload)
          }
        } else if (ids.length > 1) {
          const bulk = await submitGeneralVolunteerFinalResultBulk(ids, payload)
          if ((bulk.failureCount ?? 0) > 0) {
            showAlert({
              title: '면접 결과 일부 실패',
              content: `요청 ${bulk.requestedCount ?? ids.length}건 중 성공 ${bulk.successCount ?? 0}건, 실패 ${bulk.failureCount ?? 0}건입니다.`,
            })
          }
        } else {
          for (const id of ids) {
            await submitGeneralVolunteerFinalResult(id, payload)
          }
        }
        await invalidateApplications()
        return true
      } catch (error) {
        await invalidateApplications()
        notifyRemoteFailure(error)
        return false
      }
    },
    [invalidateApplications, notifyRemoteFailure, remoteEnabled, showAlert, subjectKind]
  )

  const applyRemoteInterviewEvaluation = useCallback(
    async (
      assignmentId: number | string | undefined,
      payload: InterviewAssignmentEvaluationPayload
    ): Promise<'ok' | 'missing_assignment' | 'error' | 'skipped'> => {
      if (!remoteEnabled) return 'skipped'
      if (assignmentId == null || assignmentId === '') {
        showAlert({
          title: '면접 평가 실패',
          content:
            '면접 배정 ID가 없어 평가를 저장할 수 없습니다. 목록에 interviewAssignmentId가 포함되어야 합니다.',
        })
        return 'missing_assignment'
      }
      try {
        await submitGeneralInterviewAssignmentEvaluation(assignmentId, payload)
        await invalidateApplications()
        return 'ok'
      } catch (error) {
        console.debug('interview evaluation failed', error)
        showAlert({
          title: '면접 평가 실패',
          content: extractApiErrorMessage(
            (error as { response?: { data?: unknown } } | null)?.response?.data,
            {
              httpStatus: getApiErrorHttpStatus(error),
              fallback: '면접 평가 저장 중 오류가 발생했습니다. 다시 시도해 주세요.',
            }
          ),
        })
        return 'error'
      }
    },
    [invalidateApplications, remoteEnabled, showAlert]
  )

  const applyRemoteDocumentCancelApproval = useCallback(
    async (
      applicationId: string,
      reason: string,
      notification?: InstructorApplicationNotificationRequest
    ) => {
      if (!remoteEnabled || subjectKind !== 'volunteer') return false
      try {
        await cancelGeneralVolunteerApplicationApproval(applicationId, reason, notification)
        await queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.volunteerDetail(applicationId),
        })
        await invalidateApplications()
        return true
      } catch (error) {
        notifyRemoteFailure(error)
        return false
      }
    },
    [invalidateApplications, notifyRemoteFailure, queryClient, remoteEnabled, subjectKind]
  )

  const applyRemoteDocumentCancelRejection = useCallback(
    async (
      applicationId: string,
      reason: string,
      notification?: InstructorApplicationNotificationRequest
    ) => {
      if (!remoteEnabled) return false
      try {
        if (subjectKind === 'participant') {
          await cancelGeneralIndividualApplicationRejection(applicationId, reason, notification)
          await queryClient.invalidateQueries({
            queryKey: generalApplicationsQueryKeys.individualDetail(applicationId),
          })
        } else {
          await cancelGeneralVolunteerApplicationRejection(applicationId, reason, notification)
          await queryClient.invalidateQueries({
            queryKey: generalApplicationsQueryKeys.volunteerDetail(applicationId),
          })
        }
        await invalidateApplications()
        return true
      } catch (error) {
        notifyRemoteFailure(error)
        return false
      }
    },
    [invalidateApplications, notifyRemoteFailure, queryClient, remoteEnabled, subjectKind]
  )

  const applyRemoteGiveUp = useCallback(
    async (
      applicationId: string,
      payload: import('@/shared/api/generated/dashboard/schemas/applicationGiveUpRequest').ApplicationGiveUpRequest
    ) => {
      if (!remoteEnabled) return false
      const trimmed = payload.reason.trim()
      const validation = validateApplicationGiveUpReason(trimmed)
      if (validation) {
        showAlert({ title: '활동 포기', content: validation })
        return false
      }
      try {
        const request = {
          reason: trimmed,
          ...(payload.stopScheduleId != null ? { stopScheduleId: payload.stopScheduleId } : {}),
          ...(payload.faultParty != null ? { faultParty: payload.faultParty } : {}),
        }
        if (subjectKind === 'participant') {
          await giveUpIndividualApplicationRemote(applicationId, request)
        } else {
          await giveUpGeneralVolunteerApplication(applicationId, request)
        }
        await invalidateApplications()
        return true
      } catch (error) {
        notifyRemoteFailure(error)
        return false
      }
    },
    [invalidateApplications, notifyRemoteFailure, remoteEnabled, showAlert, subjectKind]
  )

  const refetchVolunteerList = useCallback(async () => {
    if (!remoteEnabled) return
    await query.refetch()
  }, [query, remoteEnabled])

  return {
    remoteEnabled,
    subjectKind,
    listTotalElements,
    refetchVolunteerList,
    applicationsLoading: remoteEnabled ? query.isFetching && query.data === undefined : false,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    applyRemoteDocumentResult,
    applyRemoteManagerEvaluation,
    applyRemoteFinalResult,
    applyRemoteInterviewEvaluation,
    applyRemoteGiveUp,
    applyRemoteDocumentCancelApproval,
    applyRemoteDocumentCancelRejection,
    invalidateVolunteerApplications: invalidateApplications,
    invalidateApplications,
  }
}
