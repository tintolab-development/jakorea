/**
 * 참여 기관 상세 > 학생 명단 — remote roster GET/PUT
 */

import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  commitOrganizationStudentRosterRemote,
  fetchOrganizationStudentRosterRemote,
} from '@/features/program/general/api/student-roster-api-client'
import {
  mapStudentRosterResponseToRows,
  mapStudentRowsToRosterCommitRequest,
} from '@/features/program/general/api/adapters/student-roster-adapters'
import type { SchoolDetailStudentRow } from '@/features/program/general/model/school-detail-types'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { isTempMockOrgSchoolRowId } from '@/features/program/general/lib/temp-mock-org-program'
import {
  notifyProgramApiUnavailable,
  useNotifyProgramApiUnavailableOnce,
} from '@/features/program/shared/lib/program-api-unavailable'
import { handleError } from '@/shared/utils/error-handler'

export function useOrganizationStudentRosterRemote(input: {
  organizationApplicationId?: string | number | null
  educationGrade?: string | null
  enabled?: boolean
}) {
  const queryClient = useQueryClient()
  const applicationId =
    input.organizationApplicationId != null && String(input.organizationApplicationId).trim() !== ''
      ? String(input.organizationApplicationId)
      : ''
  const remoteCapability = shouldUseGeneralApplicationsRemoteApi()
  const isTempMockOrgApplication = isTempMockOrgSchoolRowId(applicationId)
  const enabled = Boolean(
    input.enabled !== false && remoteCapability && applicationId && !isTempMockOrgApplication
  )

  useNotifyProgramApiUnavailableOnce(
    Boolean(
      input.enabled !== false &&
        !isTempMockOrgApplication &&
        (!remoteCapability || !applicationId)
    ),
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

  const sourceFileObjectId = query.data?.sourceFileObjectId ?? null

  const commitMutation = useMutation({
    mutationFn: async (rows: SchoolDetailStudentRow[]) => {
      if (!enabled) {
        notifyProgramApiUnavailable('general-student-roster-commit', '참여 기관 · 학생 명단 저장')
        throw new Error('student roster remote unavailable')
      }
      const body = mapStudentRowsToRosterCommitRequest({
        rows,
        educationGrade: input.educationGrade,
        sourceFileObjectId,
      })
      return commitOrganizationStudentRosterRemote(applicationId, body)
    },
    onSuccess: data => {
      queryClient.setQueryData(generalProgramProgressQueryKeys.studentRoster(applicationId), data)
    },
    onError: error => {
      handleError(error, { context: 'useOrganizationStudentRosterRemote.commit' })
    },
  })

  const commitRows = useCallback(
    async (rows: SchoolDetailStudentRow[]) => {
      await commitMutation.mutateAsync(rows)
    },
    [commitMutation]
  )

  return {
    remoteEnabled: enabled,
    students,
    totalCount: query.data?.totalCount ?? students.length,
    sourceFileObjectId,
    isLoading: enabled && query.isLoading,
    isFetching: enabled && query.isFetching,
    isError: enabled && query.isError,
    refetch: query.refetch,
    commitRows,
    isCommitting: commitMutation.isPending,
  }
}
