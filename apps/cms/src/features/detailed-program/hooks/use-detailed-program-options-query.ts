import { useQuery } from '@tanstack/react-query'
import { getDetailedProgramOptionsList } from '@/features/detailed-program/api/admin-detailed-programs-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'

/** 프로그램 등록·상세 「세부 프로그램명」 CmsSelect 옵션 (세부 프로그램 관리 목록) */
export function useDetailedProgramOptionsQuery(enabled = true) {
  return useQuery({
    queryKey: dataManagementQueryKeys.detailedPrograms.options(),
    queryFn: getDetailedProgramOptionsList,
    enabled,
    staleTime: 60_000,
    retry: 1,
  })
}

export function useDetailedProgramSelectOptions(enabled = true) {
  const query = useDetailedProgramOptionsQuery(enabled)
  const options = (query.data ?? []).map(row => ({
    value: row.id,
    label: row.name,
  }))
  return { ...query, options }
}
