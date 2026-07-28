import { describe, expect, it } from 'vitest'
import { resolveAvailableEducationDetailKeys } from '@/features/user/shared/ui/instructor-register-education-section'

describe('resolveAvailableEducationDetailKeys', () => {
  it('최종 학력 미선택 시 빈 배열', () => {
    expect(resolveAvailableEducationDetailKeys('')).toEqual([])
    expect(resolveAvailableEducationDetailKeys(undefined)).toEqual([])
  })

  it('대학교 2, 3년제면 고등학교·2·3년제만', () => {
    expect(resolveAvailableEducationDetailKeys('college23')).toEqual(['high', 'college23'])
  })

  it('대학원은 전체 단계', () => {
    expect(resolveAvailableEducationDetailKeys('graduate')).toEqual([
      'high',
      'college23',
      'college4',
      'graduate',
    ])
  })
})
