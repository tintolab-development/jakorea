/**
 * UJAT 기관 신청 상세 — 목록 캐시 + detail GET hydrate
 */

import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveOrganizationApplicationRemote,
  fetchOrganizationApplicationDetailRemote,
  rejectOrganizationApplicationRemote,
  type OrganizationDecisionNotifyRequest,
} from '@/features/program/general/api/applications-api-client'
import { enrichUjatInstitutionDetailFromRemote } from '@/features/program/ujat/api/applications-adapters'
import { mapOrganizationApplicationDetailToUjatInstitutionRow } from '@/features/program/ujat/api/applications-adapters'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { fetchUjatTemporarySchedule } from '@/features/program/ujat/api/temporary-schedule-api'
import { rejectUjatOrganizationApplicationsIfRemote } from '@/features/program/ujat/api/temporary-rejections'
import {
  UJAT_INSTITUTION_APPROVAL_BLOCKED_MESSAGE,
  readUjatInstitutionWorkflowInput,
  resolveUjatInstitutionWorkflow,
  type UjatInstitutionWorkflowView,
} from '@/features/program/ujat/lib/ujat-institution-approval-workflow'
import { getUjatInstitutionApplicationDetail } from '@/features/program/ujat/model/ujat-institution-application'
import { getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import type { UjatInstitutionApplicationRow } from '@/features/program/ujat/ui/detail-modal/application-institution/list/types'

type CachedUjatOrganizationApplicationsPage = {
  pages?: Array<{ rows?: UjatInstitutionApplicationRow[] }>
}

export function useUjatInstitutionApplicationDetail(input: {
  institutionId: string
  programId?: string | null
}) {
  const { institutionId, programId } = input
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  const queryClient = useQueryClient()

  const detailQuery = useQuery({
    queryKey: ujatQueryKeys.organizationDetail(programId ?? '', institutionId),
    queryFn: () => fetchOrganizationApplicationDetailRemote(institutionId),
    enabled: remoteEnabled && Boolean(institutionId),
    staleTime: 30_000,
    retry: false,
  })

  const temporaryScheduleQuery = useQuery({
    queryKey: ujatQueryKeys.organizationTemporarySchedule(programId ?? '', institutionId),
    queryFn: async () => {
      try {
        return await fetchUjatTemporarySchedule(String(programId), institutionId)
      } catch (error) {
        if (getApiErrorHttpStatus(error) === 404) return null
        throw error
      }
    },
    enabled: remoteEnabled && Boolean(institutionId),
    staleTime: 30_000,
    retry: false,
  })

  const rowFromListCache = (() => {
    if (!programId) return null
    const cachedQueries = queryClient.getQueriesData<CachedUjatOrganizationApplicationsPage>({
      queryKey: ujatQueryKeys.organizationApplicationsRoot(programId),
    })
    for (const [, cached] of cachedQueries) {
      const row = cached?.pages
        ?.flatMap(page => page.rows ?? [])
        .find(item => item.id === institutionId)
      if (row) return row
    }
    return null
  })()

  const row = useMemo((): UjatInstitutionApplicationRow | null => {
    // 목록 행은 상세 GET이 완료되기 전의 placeholder로만 사용한다.
    // 상세 응답이 있으면 null을 포함해 상세 응답의 값을 canonical source로 유지한다.
    if (detailQuery.data) return mapOrganizationApplicationDetailToUjatInstitutionRow(detailQuery.data)
    return rowFromListCache
  }, [detailQuery.data, rowFromListCache])
  const detail = useMemo(() => {
    if (!row) return null
    return detailQuery.data
      ? enrichUjatInstitutionDetailFromRemote(row, detailQuery.data)
      : getUjatInstitutionApplicationDetail(row)
  }, [detailQuery.data, row])

  const workflow = useMemo((): UjatInstitutionWorkflowView => {
    return resolveUjatInstitutionWorkflow(
      readUjatInstitutionWorkflowInput(detailQuery.data, temporaryScheduleQuery.data)
    )
  }, [detailQuery.data, temporaryScheduleQuery.data])

  const workflowReady = !remoteEnabled || temporaryScheduleQuery.isFetched || temporaryScheduleQuery.isError

  const invalidate = async () => {
    if (!programId) return
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.organizationApplicationsRoot(programId),
      }),
      queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.organizationDetail(programId, institutionId),
      }),
      queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.organizationTemporarySchedule(programId, institutionId),
      }),
      queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.execution(),
      }),
      queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.programSchedules(programId),
      }),
    ])
  }

  return {
    row,
    detail,
    loading: remoteEnabled && (detailQuery.isLoading || temporaryScheduleQuery.isLoading),
    workflow,
    workflowReady,
    remoteEnabled,
    remoteDetail: detailQuery.data ?? null,
    temporarySchedule: temporaryScheduleQuery.data ?? null,
    invalidate,
    approveRemote: async (notify?: OrganizationDecisionNotifyRequest) => {
      const current = resolveUjatInstitutionWorkflow(
        readUjatInstitutionWorkflowInput(detailQuery.data, temporaryScheduleQuery.data)
      )
      if (!current.canFinalApprove) {
        throw new Error(UJAT_INSTITUTION_APPROVAL_BLOCKED_MESSAGE)
      }
      await approveOrganizationApplicationRemote(institutionId, notify)
      await invalidate()
    },
    rejectRemote: async (reason: string, notify?: OrganizationDecisionNotifyRequest) => {
      await rejectOrganizationApplicationRemote(institutionId, {
        reason,
        ...notify,
      })
      await invalidate()
    },
    tempRejectRemote: async (reason: string) => {
      const persisted = await rejectUjatOrganizationApplicationsIfRemote({
        programId,
        applicationIds: [institutionId],
        reason,
      })
      if (!persisted) {
        throw new Error('원격 API가 비활성 상태라 임시 반려를 반영하지 않았습니다.')
      }
      await invalidate()
    },
  }
}
