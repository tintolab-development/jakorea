import { useCallback, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchGeneralIndividualDocPassedAsVolunteerRows,
  fetchGeneralIndividualInterview2AsVolunteerRows,
  fetchGeneralVolunteerDoc1Applications,
  fetchGeneralVolunteerDocPassedApplications,
  fetchGeneralVolunteerInterview2Applications,
  mapSecondInterviewStatusToFinalResultPayload,
  submitGeneralIndividualDocumentResult,
  submitGeneralIndividualFinalResult,
  submitGeneralVolunteerDocumentResult,
  submitGeneralVolunteerFinalResult,
} from '@/features/program/general/api/admin-applications-service'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import type { ScreeningSubjectKind } from '@/features/program/general/lib/screening-subject-kind'
import type { GeneralSecondInterviewScreeningStatus } from '@/features/program/general/lib/volunteer-screening-constants'
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

  const queryFn = useCallback(() => {
    if (subjectKind === 'participant') {
      if (stage === 'interview2') return fetchGeneralIndividualInterview2AsVolunteerRows(programId)
      return fetchGeneralIndividualDocPassedAsVolunteerRows(programId)
    }
    if (stage === 'docPassed') return fetchGeneralVolunteerDocPassedApplications(programId)
    if (stage === 'interview2') return fetchGeneralVolunteerInterview2Applications(programId)
    return fetchGeneralVolunteerDoc1Applications(programId)
  }, [programId, stage, subjectKind])

  const listQueryKey =
    subjectKind === 'participant'
      ? ([...generalApplicationsQueryKeys.individualList(programId), 'screening', stage] as const)
      : ([...generalApplicationsQueryKeys.volunteerList(programId), stage] as const)

  const query = useQuery({
    queryKey: listQueryKey,
    queryFn,
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  useEffect(() => {
    if (query.data) setList(query.data)
  }, [query.data, setList])

  const invalidateApplications = useCallback(async () => {
    if (subjectKind === 'participant') {
      await queryClient.invalidateQueries({
        queryKey: generalApplicationsQueryKeys.individualList(programId),
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
        for (const id of ids) {
          if (subjectKind === 'participant') {
            await submitGeneralIndividualDocumentResult(id, payload)
          } else {
            await submitGeneralVolunteerDocumentResult(id, payload)
          }
        }
        await invalidateApplications()
        return true
      } catch (error) {
        notifyRemoteFailure(error)
        return true
      }
    },
    [invalidateApplications, notifyRemoteFailure, remoteEnabled, subjectKind]
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
        for (const id of ids) {
          if (subjectKind === 'participant') {
            await submitGeneralIndividualFinalResult(id, payload)
          } else {
            await submitGeneralVolunteerFinalResult(id, payload)
          }
        }
        await invalidateApplications()
        return true
      } catch (error) {
        notifyRemoteFailure(error)
        return true
      }
    },
    [invalidateApplications, notifyRemoteFailure, remoteEnabled, subjectKind]
  )

  const applyRemoteGiveUp = useCallback(
    async (applicationId: string) => {
      if (!remoteEnabled || subjectKind !== 'participant') return false
      try {
        await giveUpIndividualApplicationRemote(applicationId)
        await invalidateApplications()
        return true
      } catch (error) {
        notifyRemoteFailure(error)
        return true
      }
    },
    [invalidateApplications, notifyRemoteFailure, remoteEnabled, subjectKind]
  )

  return {
    remoteEnabled,
    subjectKind,
    applicationsLoading: remoteEnabled ? query.isFetching && query.data === undefined : false,
    applyRemoteDocumentResult,
    applyRemoteFinalResult,
    applyRemoteGiveUp,
    invalidateVolunteerApplications: invalidateApplications,
    invalidateApplications,
  }
}
