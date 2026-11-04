import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchUjatDirectAssignmentCandidates } from '@/features/program/ujat/api/education-execution-api'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { getApiErrorHttpStatus, readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'
import {
  isRegionDirectAssignClassSlotSelectable,
  mapRegionDirectAssignCandidateOptions,
} from './region-assignment-options'
import type { RegionAssignmentTableData } from './types'

function toEducationSlotId(
  tableData: RegionAssignmentTableData,
  classSlotId: string | undefined
): string | null {
  if (!classSlotId || !/^\d+$/.test(classSlotId)) return null
  const slot = tableData.columns
    .flatMap(column => column.classSlots)
    .find(item => item.id === classSlotId)
  if (slot?.isEducationSlotId === false) return null
  return classSlotId
}

export function useDirectAssignCandidates(input: {
  programId: string
  classSlotId: string | undefined
  enabled: boolean
  tableData: RegionAssignmentTableData
}) {
  const educationSlotId = toEducationSlotId(input.tableData, input.classSlotId)
  const selectable = isRegionDirectAssignClassSlotSelectable(input.tableData, input.classSlotId)
  const query = useQuery({
    queryKey: ujatQueryKeys.directAssignmentCandidates(input.programId, educationSlotId ?? ''),
    queryFn: () => fetchUjatDirectAssignmentCandidates(input.programId, educationSlotId!),
    enabled: input.enabled && educationSlotId != null && selectable,
    staleTime: 0,
    retry: false,
  })

  const existingPrimaryVolunteerName = useMemo(() => {
    const primaryId = query.data?.existingPrimaryParticipantId
    if (primaryId == null) return null
    const row = input.tableData.rows.find(item => item.id === String(primaryId))
    return row?.name ?? '-'
  }, [input.tableData.rows, query.data?.existingPrimaryParticipantId])

  const volunteerOptions = useMemo(
    () => mapRegionDirectAssignCandidateOptions(query.data),
    [query.data]
  )

  const errorMessage = useMemo(() => {
    if (!selectable) return null
    if (input.classSlotId && educationSlotId == null) {
      return '서버 학급 슬롯이 없어 직접 배정할 수 없습니다. 기관 임시 배정 학급을 먼저 확인해 주세요.'
    }
    if (!query.error) return null
    return getApiErrorHttpStatus(query.error) != null
      ? readApiErrorAlertMessage(query.error, '배정 가능한 봉사자를 불러오지 못했습니다.')
      : '배정 가능한 봉사자를 불러오지 못했습니다.'
  }, [educationSlotId, input.classSlotId, query.error, selectable])

  const emptyHint = useMemo(() => {
    if (!input.classSlotId || !selectable || educationSlotId == null) return null
    if (query.isFetching || query.error) return null
    if (!query.isFetched) return null
    if (volunteerOptions.length > 0) return null
    return '이 학급의 서버 후보가 없습니다. 참여 봉사자 탭의 배정 대기는 이 목록에 자동으로 포함되지 않습니다.'
  }, [
    educationSlotId,
    input.classSlotId,
    query.error,
    query.isFetched,
    query.isFetching,
    selectable,
    volunteerOptions.length,
  ])

  return {
    volunteerOptions,
    existingPrimaryVolunteerName,
    loading: query.isFetching,
    errorMessage,
    emptyHint,
  }
}
