import type { Sponsor } from '@/types/domain'
import { createEmptyCrudService } from '@/shared/utils/create-service'

export const sponsorService = createEmptyCrudService<Sponsor>({
  prefix: 'sponsor',
  nameField: 'name',
})
