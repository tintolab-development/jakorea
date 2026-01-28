/**
 * 강사 Mock 서비스
 * Phase 2: API 서비스 레이어 패턴 통일
 */

import type { Instructor } from '@/types/domain'
import { mockInstructors, mockInstructorsMap } from '@/data/mock'
import { createCrudService } from '@/shared/utils/create-service'

export const instructorService = createCrudService<Instructor>({
  prefix: 'instructor',
  mockData: mockInstructors,
  mockDataMap: mockInstructorsMap,
  nameField: 'name',
})
