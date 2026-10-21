/**
 * 참여 기관 상세 > 학생 명단 — remote roster GET/PUT
 */

import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import {
  generalApplicationsQueryKeys,
  generalProgramProgressQueryKeys,
} from '@/features/program/general/api/general-applications-query-keys'
import {
  commitOrganizationStudentRosterRemote,
  fetchOrganizationStudentRosterRemote,
} from '@/features/program/general/api/student-roster-api-client'
import {
  mapStudentRosterResponseToRows,
  mapStudentRowsToRosterCommitRequest,
} from '@/features/program/general/api/adapters/student-roster-adapters'
import type { OrganizationStudentRosterCommitInput } from '@/features/program/general/api/student-roster-commit-types'
import {
  isStudentRosterMemberIdConflictError,
  isStudentRosterRevisionConflictError,
  parseStudentRosterRevisionNo,
} from '@/features/program/general/lib/student-roster-revision'
import { shouldUseOrganizationApplicationRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import {
  notifyProgramApiUnavailable,
  useNotifyProgramApiUnavailableOnce,
} from '@/features/program/shared/lib/program-api-unavailable'
import { handleError } from '@/shared/utils/error-handler'

export function useOrganizationStudentRosterRemote(input: {
  organizationApplicationId?: string | number | null
  educationGrade?: string | null
  enabled?: boolean
  /** 명단 저장 후 함께 무효화할 유형별 기관 신청 상세 키 (예: 교육받은 교사 상세) */
  dependentQueryKeys?: readonly QueryKey[]
  /** 교육받은 교사 화면 — 일반/1사1교 신청 remote 플래그 대신 TT remote 플래그로 활성 */
  trainedTeachersSurface?: boolean
}) {
  const queryClient = useQueryClient()
  const applicationId =
    input.organizationApplicationId != null && String(input.organizationApplicationId).trim() !== ''
      ? String(input.organizationApplicationId)
      : ''
  const remoteCapability =
    shouldUseOrganizationApplicationRemoteApi() ||
    (input.trainedTeachersSurface === true && shouldUseTrainedTeacherProgramsRemoteApi())
  const enabled = Boolean(input.enabled !== false && remoteCapability && applicationId)

  useNotifyProgramApiUnavailableOnce(
    Boolean(input.enabled !== false && (!remoteCapability || !applicationId)),
    'general-student-roster',
    '참여 기관 · 학생 명단'
  )

  const query = useQuery({
    queryKey: generalProgramProgressQueryKeys.studentRoster(applicationId || '__none__'),
    enabled,
    queryFn: () => fetchOrganizationStudentRosterRemote(applicationId),
  })

  const students = useMemo(
    () => (enabled ? mapStudentRosterResponseToRows(query.data) : []),
    [enabled, query.data]
  )

  const revisionNo = useMemo(
    () => (enabled ? parseStudentRosterRevisionNo(query.data?.revisionNo) : null),
    [enabled, query.data?.revisionNo]
  )

  const commitMutation = useMutation({
    mutationFn: async (commitInput: OrganizationStudentRosterCommitInput) => {
      if (!enabled) {
        notifyProgramApiUnavailable('general-student-roster-commit', '참여 기관 · 학생 명단 저장')
        throw new Error('student roster remote unavailable')
      }
      const body = mapStudentRowsToRosterCommitRequest({
        rows: commitInput.rows,
        educationGrade: input.educationGrade,
        expectedRevisionNo: commitInput.expectedRevisionNo,
      })
      return commitOrganizationStudentRosterRemote(applicationId, body)
    },
    onSuccess: async data => {
      queryClient.setQueryData(generalProgramProgressQueryKeys.studentRoster(applicationId), data)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.organizationDetail(applicationId),
        }),
        queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.studentRoster(applicationId),
        }),
        ...(input.dependentQueryKeys ?? []).map(queryKey =>
          queryClient.invalidateQueries({ queryKey, exact: true })
        ),
      ])
    },
    onError: error => {
      if (isStudentRosterRevisionConflictError(error) || isStudentRosterMemberIdConflictError(error)) {
        return
      }
      handleError(error, { context: 'useOrganizationStudentRosterRemote.commit' })
    },
  })

  const commitRows = useCallback(
    async (commitInput: OrganizationStudentRosterCommitInput) => {
      await commitMutation.mutateAsync(commitInput)
    },
    [commitMutation]
  )

  return {
    remoteEnabled: enabled,
    students,
    revisionNo,
    totalCount: query.data?.totalCount ?? students.length,
    isLoading: enabled && query.isLoading,
    isFetching: enabled && query.isFetching,
    isError: enabled && query.isError,
    refetch: query.refetch,
    commitRows,
    isCommitting: commitMutation.isPending,
  }
}
