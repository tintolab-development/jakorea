/**
 * 스폰서 Mock 서비스
 * Phase 2: API 서비스 레이어 패턴 통일
 */

import type { Sponsor } from '@/types/domain'
import { mockSponsors, mockSponsorsMap } from '@/data/mock'
import { createCrudService } from '@/shared/utils/create-service'

export const sponsorService = createCrudService<Sponsor>({
  prefix: 'sponsor',
  mockData: mockSponsors,
  mockDataMap: mockSponsorsMap,
  nameField: 'name',
})
