import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listTextbookBusinessAreas,
  toBusinessAreaSelectOptions,
} from '@/features/textbook/api/admin-business-areas-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { TEXTBOOK_BUSINESS_AREA_SELECT_OPTIONS } from '@/features/textbook/model/textbook-business-areas'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'

export function useTextbookBusinessAreasQuery(enabled = true) {
  const remoteEnabled = useDataManagementRemoteEnabled('textbooks', enabled)

  return useQuery({
    queryKey: dataManagementQueryKeys.textbooks.businessAreas(),
    queryFn: () => listTextbookBusinessAreas(),
    enabled: remoteEnabled || enabled,
    staleTime: 30_000,
  })
}

export function useTextbookBusinessAreaSelectOptions() {
  const query = useTextbookBusinessAreasQuery()
  const options =
    query.data && query.data.length > 0
      ? toBusinessAreaSelectOptions(query.data)
      : TEXTBOOK_BUSINESS_AREA_SELECT_OPTIONS
  return { ...query, options }
}

export function useInvalidateTextbookBusinessAreas() {
  const queryClient = useQueryClient()
  return async () => {
    await queryClient.invalidateQueries({
      queryKey: dataManagementQueryKeys.textbooks.businessAreas(),
    })
    await queryClient.invalidateQueries({
      queryKey: dataManagementQueryKeys.textbooks.lists(),
    })
  }
}
