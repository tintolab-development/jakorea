/**
 * 학교 Mock 서비스
 * Phase 2: API 서비스 레이어 패턴 통일
 */

import type { School } from '@/types/domain'
import { mockSchools, mockSchoolsMap } from '@/data/mock'
import { createCrudService } from '@/shared/utils/create-service'

export const schoolService = createCrudService<School>({
  prefix: 'school',
  mockData: mockSchools,
  mockDataMap: mockSchoolsMap,
  nameField: 'name',
})
