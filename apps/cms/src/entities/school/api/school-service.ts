import type { School } from '@/types/domain'
import { createEmptyCrudService } from '@/shared/utils/create-service'

export const schoolService = createEmptyCrudService<School>({
  prefix: 'school',
  nameField: 'name',
})
