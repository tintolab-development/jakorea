import { useCallback, useEffect, useMemo } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchGeneralIndividualScreeningApplicationsPage,
  fetchGeneralVolunteerScreeningApplicationsPage,
  mapSecondInterviewStatusToFinalResultPayload,
  submitGeneralIndividualDocumentResult,
  submitGeneralIndividualFinalResult,
  submitGeneralVolunteerDocumentResult,
  submitGeneralVolunteerDocumentResultBulk,
  submitGeneralVolunteerFinalResult,
  submitGeneralVolunteerFinalResultBulk,
  giveUpGeneralVolunteerApplication,
  submitGeneralInterviewAssignmentEvaluation,
  updateGeneralVolunteerDocumentEvaluation,
} from '@/features/program/general/api/admin-applications-service'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import type { ScreeningSubjectKind } from '@/features/program/general/lib/screening-subject-kind'
import type {
  GeneralManagerEvaluation,
  GeneralSecondInterviewScreeningStatus,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { giveUpIndividualApplicationRemote } from '@/features/program/general/api/applications-api-client'

export type GeneralVolunteerApplicationsStage = 'doc1' | 'docPassed' | 'interview2'

type UseGeneralVolunteerApplicationsRemoteOptions = {
  programId: string
  stage: GeneralVolunteerApplicationsStage
  /** volunteer(기본) | participant — 참여자는 individual-applications */
  subjectKind?: ScreeningSubjectKind
  /** false면 remote 비활성 — mock 로더는 호출부 유지 */
  enabled?: boolean
  setList: (rows: GeneralVolunteerApplicantRow[]) => void
}

function getDocumentEvaluationErrorMessage(error: unknown): string {
  const status =
    error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { status?: number } }).response?.status
      : undefined
  switch (status) {
    case 403:
      return '이 프로그램에 접근할 권한이 없거나 본인에게 배정되지 않은 담당자 슬롯입니다.'
    case 404:
      return '봉사자 신청 정보를 찾을 수 없습니다.'
    case 409:
      return '최종 서류 결과가 확정되어 담당자 평가를 수정할 수 없습니다.'
    case 400:
    case 422:
      return '담당자 평가값이 올바르지 않습니다.'
    default:
      return '담당자 평가 저장 중 오류가 발생했습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.'
  }
}

export function useGeneralVolunteerApplicationsRemote({
  programId,
  stage,
  subjectKind = 'volunteer',
  enabled = true,
  setList,
}: UseGeneralVolunteerApplicationsRemoteOptions) {
  const queryClient = useQueryClient()
  const { showAlert } = useCmsAlert()
  const remoteEnabled = useMemo(
    () => enabled && shouldUseGeneralApplicationsRemoteApi() && Boolean(programId),
    [enabled, programId]
  )

  const queryFn = useCallback(({ pageParam }: { pageParam: number }) => {
    if (subjectKind === 'participant') {
      return fetchGeneralIndividualScreeningApplicationsPage(
        programId,
        stage === 'interview2' ? 'interview2' : 'docPassed',
        pageParam
      )
    }
    return fetchGeneralVolunteerScreeningApplicationsPage(
      programId,
      stage,
      pageParam
    )
  }, [programId, stage, subjectKind])

  const listQueryKey =
    subjectKind === 'participant'
      ? ([...generalApplicationsQueryKeys.individualList(programId), 'screening', stage] as const)
      : ([...generalApplicationsQueryKeys.volunteerList(programId), stage] as const)

  const query = useInfiniteQuery({
    queryKey: listQueryKey,
    queryFn,
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  useEffect(() => {
    if (query.data) setList(query.data.pages.flatMap(page => page.rows))
  }, [query.data, setList])

  const invalidateApplications = useCallback(async () => {
    if (subjectKind === 'participant') {
      await queryClient.invalidateQueries({
        queryKey: generalApplicationsQueryKeys.individualLists(programId),
      })
      return
    }
    await queryClient.invalidateQueries({
      queryKey: generalApplicationsQueryKeys.volunteerList(programId),
    })
  }, [programId, queryClient, subjectKind])

  const notifyRemoteFailure = useCallback(
    (error: unknown) => {
      console.debug('applications remote decision failed', error)
      showAlert({
        title: '처리 실패',
        content:
          subjectKind === 'participant'
            ? '참여자 신청 상태 변경 중 오류가 발생했습니다. 다시 시도해 주세요.'
            : '봉사자 신청 상태 변경 중 오류가 발생했습니다. 다시 시도해 주세요.',
      })
    },
    [showAlert, subjectKind]
  )

  const applyRemoteDocumentResult = useCallback(
    async (ids: string[], result: 'PASS' | 'FAIL', reason?: string) => {
      if (!remoteEnabled) return false
      try {
        const payload = {
          result,
          reason: result === 'FAIL' ? reason?.trim() || '반려' : reason,
        } as const
        if (subjectKind === 'participant') {
          for (const id of ids) {
            await submitGeneralIndividualDocumentResult(id, payload)
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
        showAlert({
          title: '평가 저장 실패',
          content: getDocumentEvaluationErrorMessage(error),
        })
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
      reason?: string
    ) => {
      if (!remoteEnabled) return false
      try {
        const payload = mapSecondInterviewStatusToFinalResultPayload(status, reason)
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
        notifyRemoteFailure(error)
        return false
      }
    },
    [invalidateApplications, notifyRemoteFailure, remoteEnabled, showAlert, subjectKind]
  )

  const applyRemoteInterviewEvaluation = useCallback(
    async (
      assignmentId: number | string | undefined,
      payload: { scoreTotal: number; comment?: string }
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
        notifyRemoteFailure(error)
        return 'error'
      }
    },
    [invalidateApplications, notifyRemoteFailure, remoteEnabled, showAlert]
  )

  const applyRemoteGiveUp = useCallback(
    async (applicationId: string, reason: string) => {
      if (!remoteEnabled) return false
      const trimmed = reason.trim()
      const giveUpReason = trimmed.length >= 2 ? trimmed : '활동 포기'
      try {
        if (subjectKind === 'participant') {
          await giveUpIndividualApplicationRemote(applicationId, { reason: giveUpReason })
        } else {
          await giveUpGeneralVolunteerApplication(applicationId, giveUpReason)
        }
        await invalidateApplications()
        return true
      } catch (error) {
        notifyRemoteFailure(error)
        return false
      }
    },
    [invalidateApplications, notifyRemoteFailure, remoteEnabled, subjectKind]
  )

  return {
    remoteEnabled,
    subjectKind,
    applicationsLoading: remoteEnabled ? query.isFetching && query.data === undefined : false,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    applyRemoteDocumentResult,
    applyRemoteManagerEvaluation,
    applyRemoteFinalResult,
    applyRemoteInterviewEvaluation,
    applyRemoteGiveUp,
    invalidateVolunteerApplications: invalidateApplications,
    invalidateApplications,
  }
}
