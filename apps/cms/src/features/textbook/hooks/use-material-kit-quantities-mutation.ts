import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saveMaterialKitQuantities } from '@/features/textbook/api/admin-material-kits-service'
import type { TextbookKitQuantityValues } from '@/features/textbook/ui/textbook-kit-quantity-modal'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'

export function useMaterialKitQuantitiesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: TextbookKitQuantityValues) => saveMaterialKitQuantities(values),
    onSuccess: (_data, values) => {
      queryClient.setQueryData(dataManagementQueryKeys.textbooks.kitQuantities(), values)
    },
  })
}
