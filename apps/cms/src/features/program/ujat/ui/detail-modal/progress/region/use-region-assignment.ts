import { useCallback, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCmsAlert } from '@/shared/ui'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import {
  fetchUjatAllocationMatrix,
  postUjatDirectAssignment,
  postUjatPartnerAssignmentsAuto,
  postUjatScheduleUnavailability,
  putUjatAttendanceManager,
} from '@/features/program/ujat/api/education-execution-api'
import { mapAllocationMatrixToRegionTableData } from '@/features/program/ujat/api/allocation-matrix-adapters'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { toUjatEducationRegionCode } from '@/features/program/ujat/api/ujat-education-region-code'
import { toUjatRecruitHalfApi } from '@/features/program/ujat/api/ujat-recruit-half'
import { fetchUjatOrganizationScheduleAssignments } from '@/features/program/ujat/api/temporary-schedule-api'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import type { EducationProgressHalfKey } from '../tabs'
import type { RegionAttendanceManagerAssignments } from './attendance-manager'
import { applyRegionAttendanceManagersFromData } from './attendance-manager'
import type { RegionBlockedDateModalPayload } from './blocked-date-modal'
import {
  getRegionAssignmentTableDataFromStore,
  setRegionAssignmentTableData,
} from './region-assignment-store'
import type { RegionAssignmentTableData } from './types'

function emptyTable(regionKey: UjatInstitutionApplicationRegionKey): RegionAssignmentTableData {
  return getRegionAssignmentTableDataFromStore(regionKey)
}

export function useRegionAssignment(
  programId: string,
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  const educationRegionCode = toUjatEducationRegionCode(regionKey)
  const semesterType = toUjatRecruitHalfApi(half)

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'ujat-progress-region',
    'UJAT 진행 현황 · 지역 배정'
  )

  const matrixQuery = useQuery({
    queryKey: ujatQueryKeys.allocationMatrix(programId, educationRegionCode, semesterType),
    enabled: remoteEnabled,
    queryFn: async () => {
      const [matrix, orgAssignments] = await Promise.all([
        fetchUjatAllocationMatrix(programId, { educationRegionCode, semesterType }),
        fetchUjatOrganizationScheduleAssignments(programId).catch(() => ({ content: [] })),
      ])
      return mapAllocationMatrixToRegionTableData({
        matrix,
        regionKey,
        orgSlots: orgAssignments.content ?? [],
      })
    },
  })

  useEffect(() => {
    if (matrixQuery.data) {
      setRegionAssignmentTableData(regionKey, matrixQuery.data)
    }
  }, [matrixQuery.data, regionKey])

  const tableData = useMemo(() => {
    if (matrixQuery.data) return matrixQuery.data
    return emptyTable(regionKey)
  }, [matrixQuery.data, regionKey])

  const invalidateMatrix = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ujatQueryKeys.allocationMatrix(programId, educationRegionCode, semesterType),
    })
  }, [educationRegionCode, programId, queryClient, semesterType])

  const autoAssignMutation = useMutation({
    mutationFn: () =>
      postUjatPartnerAssignmentsAuto(programId, { educationRegionCode, semesterType }),
    onSuccess: async () => {
      await invalidateMatrix()
      showAlert({ title: '안내', content: '교육일이 자동 배정되었습니다.' })
    },
    onError: () => {
      showAlert({
        title: '오류',
        content: '자동 배정에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      })
    },
  })

  const directAssignMutation = useMutation({
    mutationFn: async (payload: { classSlotId: string; volunteerId: string }) => {
      const participantId = Number(payload.volunteerId)
      const educationSlotId = Number(payload.classSlotId)
      if (!Number.isFinite(participantId) || !Number.isFinite(educationSlotId)) {
        throw new Error('INVALID_DIRECT_ASSIGN_IDS')
      }
      return postUjatDirectAssignment(programId, educationSlotId, { participantId })
    },
    onSuccess: async () => {
      await invalidateMatrix()
      showAlert({ title: '안내', content: '교육일이 직접 배정되었습니다.' })
    },
    onError: () => {
      showAlert({
        title: '오류',
        content: '직접 배정에 실패했습니다. 학급 슬롯·봉사자 상태를 확인해 주세요.',
      })
    },
  })

  const blockedDateMutation = useMutation({
    mutationFn: async (payload: RegionBlockedDateModalPayload) => {
      const participantId = Number(payload.volunteerId)
      const replacementParticipantId = Number(payload.substituteVolunteerId)
      if (!Number.isFinite(participantId)) throw new Error('INVALID_PARTICIPANT')

      const scheduleIds = [
        ...new Set(
          tableData.columns
            .filter(col => payload.blockedDateLabels.includes(col.dateLabel) && col.scheduleId)
            .map(col => col.scheduleId as string)
        ),
      ]
      if (scheduleIds.length === 0) throw new Error('NO_SCHEDULES_FOR_DATES')

      for (const scheduleId of scheduleIds) {
        await postUjatScheduleUnavailability(programId, scheduleId, {
          participantId,
          replacementParticipantId: Number.isFinite(replacementParticipantId)
            ? replacementParticipantId
            : null,
          reason: 'CMS 배정 불가일 설정',
        })
      }
    },
    onSuccess: async () => {
      await invalidateMatrix()
      showAlert({ title: '안내', content: '배정 불가일이 설정되었습니다.' })
    },
    onError: () => {
      showAlert({
        title: '오류',
        content: '배정 불가일 설정에 실패했습니다.',
      })
    },
  })

  const attendanceManagerMutation = useMutation({
    mutationFn: async (assignments: RegionAttendanceManagerAssignments) => {
      const optimistic = applyRegionAttendanceManagersFromData(tableData, assignments)
      setRegionAssignmentTableData(regionKey, optimistic)

      for (const [columnId, volunteerId] of Object.entries(assignments)) {
        const column = tableData.columns.find(c => c.id === columnId)
        const scheduleId = column?.scheduleId
        const participantId = Number(volunteerId)
        if (!scheduleId || !Number.isFinite(participantId)) continue
        await putUjatAttendanceManager(programId, scheduleId, { participantId })
      }
    },
    onSuccess: async () => {
      await invalidateMatrix()
      showAlert({ title: '안내', content: '출결 담당자가 저장되었습니다.' })
    },
    onError: () => {
      showAlert({
        title: '오류',
        content: '출결 담당자 저장에 실패했습니다.',
      })
    },
  })

  const runAutoAssign = useCallback(() => {
    if (!remoteEnabled) return tableData
    autoAssignMutation.mutate()
    return tableData
  }, [autoAssignMutation, remoteEnabled, tableData])

  const confirmDirectAssign = useCallback(
    (payload: { classSlotId: string; volunteerId: string }) => {
      if (!remoteEnabled) return
      directAssignMutation.mutate(payload)
    },
    [directAssignMutation, remoteEnabled]
  )

  const confirmBlockedDate = useCallback(
    (payload: RegionBlockedDateModalPayload) => {
      if (!remoteEnabled) return
      blockedDateMutation.mutate(payload)
    },
    [blockedDateMutation, remoteEnabled]
  )

  const saveAttendanceManagers = useCallback(
    (assignments: RegionAttendanceManagerAssignments) => {
      if (!remoteEnabled) return
      attendanceManagerMutation.mutate(assignments)
    },
    [attendanceManagerMutation, remoteEnabled]
  )

  return {
    tableData,
    tableVersion: matrixQuery.dataUpdatedAt,
    isLoading: remoteEnabled && matrixQuery.isLoading,
    isRemote: remoteEnabled,
    runAutoAssign,
    confirmDirectAssign,
    confirmBlockedDate,
    saveAttendanceManagers,
    isMutating:
      autoAssignMutation.isPending ||
      directAssignMutation.isPending ||
      blockedDateMutation.isPending ||
      attendanceManagerMutation.isPending,
  }
}
