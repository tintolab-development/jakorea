import { useQuery } from '@tanstack/react-query'
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
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useTextbookBusinessAreaSelectOptions(enabled = true) {
  const query = useTextbookBusinessAreasQuery(enabled)
  const options =
    query.data && query.data.length > 0
      ? toBusinessAreaSelectOptions(query.data)
      : TEXTBOOK_BUSINESS_AREA_SELECT_OPTIONS
  return { ...query, options }
}
