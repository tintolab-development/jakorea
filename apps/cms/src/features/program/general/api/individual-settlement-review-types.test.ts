import { describe, expect, it } from 'vitest'
import {
  individualSettlementReviewApplicationTypeLabel,
  resolveIndividualSettlementReviewApplicationType,
} from '@/features/program/general/api/individual-settlement-review-types'

describe('individual settlement review applicationType', () => {
  it('VOLUNTEER는 봉사자, 그 밖의 값·누락은 참여자로 본다', () => {
    expect(individualSettlementReviewApplicationTypeLabel('VOLUNTEER')).toBe('봉사자')
    expect(individualSettlementReviewApplicationTypeLabel('volunteer')).toBe('봉사자')
    expect(individualSettlementReviewApplicationTypeLabel('INDIVIDUAL')).toBe('참여자')
    expect(individualSettlementReviewApplicationTypeLabel(undefined)).toBe('참여자')
    expect(resolveIndividualSettlementReviewApplicationType(null)).toBe('INDIVIDUAL')
  })
})
