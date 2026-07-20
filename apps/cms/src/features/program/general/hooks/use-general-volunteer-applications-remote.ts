import { useCallback, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchGeneralVolunteerDoc1Applications,
  fetchGeneralVolunteerDocPassedApplications,
  fetchGeneralVolunteerInterview2Applications,
  mapSecondInterviewStatusToFinalResultPayload,
  submitGeneralVolunteerDocumentResult,
  submitGeneralVolunteerFinalResult,
} from '@/features/program/general/api/admin-applications-service'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import type { GeneralSecondInterviewScreeningStatus } from '@/features/program/general/lib/volunteer-screening-constants'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'

export type GeneralVolunteerApplicationsStage = 'doc1' | 'docPassed' | 'interview2'

type UseGeneralVolunteerApplicationsRemoteOptions = {
  programId: string
  stage: GeneralVolunteerApplicationsStage
  /** false면 remote 비활성(참여자 subject 등) — mock 로더는 호출부 유지 */
  enabled?: boolean
  setList: (rows: GeneralVolunteerApplicantRow[]) => void
}

export function useGeneralVolunteerApplicationsRemote({
  programId,
  stage,
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
    if (stage === 'docPassed') return fetchGeneralVolunteerDocPassedApplications(programId)
    if (stage === 'interview2') return fetchGeneralVolunteerInterview2Applications(programId)
    return fetchGeneralVolunteerDoc1Applications(programId)
  }, [programId, stage])

  const query = useQuery({
    queryKey: [...generalApplicationsQueryKeys.volunteerList(programId), stage] as const,
    queryFn,
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  useEffect(() => {
    if (query.data) setList(query.data)
  }, [query.data, setList])

  const invalidateVolunteerApplications = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: generalApplicationsQueryKeys.volunteerList(programId),
    })
  }, [programId, queryClient])

  const notifyRemoteFailure = useCallback(
    (error: unknown) => {
      console.debug('volunteer applications remote decision failed', error)
      showAlert({
        title: '처리 실패',
        content: '봉사자 신청 상태 변경 중 오류가 발생했습니다. 다시 시도해 주세요.',
      })
    },
    [showAlert]
  )

  const applyRemoteDocumentResult = useCallback(
    async (ids: string[], result: 'PASS' | 'FAIL', reason?: string) => {
      if (!remoteEnabled) return false
      try {
        for (const id of ids) {
          await submitGeneralVolunteerDocumentResult(id, {
            result,
            reason: result === 'FAIL' ? reason?.trim() || '반려' : reason,
          })
        }
        await invalidateVolunteerApplications()
        return true
      } catch (error) {
        notifyRemoteFailure(error)
        return true
      }
    },
    [invalidateVolunteerApplications, notifyRemoteFailure, remoteEnabled]
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
          await submitGeneralVolunteerFinalResult(id, payload)
        }
        await invalidateVolunteerApplications()
        return true
      } catch (error) {
        notifyRemoteFailure(error)
        return true
      }
    },
    [invalidateVolunteerApplications, notifyRemoteFailure, remoteEnabled]
  )

  return {
    remoteEnabled,
    applicationsLoading: remoteEnabled ? query.isFetching : false,
    applyRemoteDocumentResult,
    applyRemoteFinalResult,
    invalidateVolunteerApplications,
  }
}
