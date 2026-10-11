import type { Instructor } from '@/types/domain'
import { createEmptyCrudService } from '@/shared/utils/create-service'

export const instructorService = createEmptyCrudService<Instructor>({
  prefix: 'instructor',
  nameField: 'name',
})
