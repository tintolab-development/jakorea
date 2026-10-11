import type { Settlement } from '@/types/domain'
import { createEmptyCrudService } from '@/shared/utils/create-service'

export const settlementService = createEmptyCrudService<Settlement>({
  prefix: 'settlement',
  nameField: 'id',
})
