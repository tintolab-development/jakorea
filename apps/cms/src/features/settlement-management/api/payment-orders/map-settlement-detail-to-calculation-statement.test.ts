import { describe, expect, it } from 'vitest'
import {
  instructorIdentityFromLine,
  mapSettlementDetailToInstructorPageCalculationStatement,
  mapSettlementDetailToProgramCalculationStatement,
} from './map-settlement-detail-to-calculation-statement'
import type { PaymentOrderAdminProgramDetailInstructorRow } from '@/data/mock/payment-order-admin-list'
import type { SettlementFrontendResponse } from '@/shared/api/generated/settlement/schemas'

const lineRow: PaymentOrderAdminProgramDetailInstructorRow = {
  id: '1001',
  no: 1,
  settlementId: 1001,
  statementId: 501,
  instructorName: '홍길동',
  institutionName: '○○초등학교',
  lectureDate: '2026-08-15',
  sessionOrdinal: 3,
  processingStatus: 'pending',
  estimatedAmount: 915000,
}

function settlement(
  overrides: Partial<SettlementFrontendResponse> = {}
): SettlementFrontendResponse {
  return {
    id: '1001',
    programNameKo: 'JA 경제교실',
    ...overrides,
  }
}

describe('mapSettlementDetailToProgramCalculationStatement', () => {
  it('단건 DTO로 진행 회차·강의비 책정·기관명·강의 구간을 채움', () => {
    const mapped = mapSettlementDetailToProgramCalculationStatement(
      lineRow,
      settlement({
        programSessionProgressDisplay: '4 / 16',
        period: '2025. 12. 08(월) ~ 2026. 12. 30(수)',
        lectureFeeStandardTitle: '2급 강사비',
        lectureFeeStandardAmount: 915000,
        businessIncomeEarnerLabel: '해당 없음',
        institutionName: '○○초등학교',
        lectureSessionDisplay: '2 ~ 3차시',
        items: [
          {
            type: 'instructor_fee',
            description: '강사비 (2차시)',
            amount: 915000,
            calculationDetail: {
              basisJson: JSON.stringify({
                layout: 'lectureFeeTier',
                tier: '2',
                categoryLabel: '2급 강사비',
                feeAssessmentWon: 915000,
                lectureTimeDisplay: '2차시',
                totalWon: 915000,
              }),
            },
          },
        ],
        totalAmount: 915000,
      }),
      'JA 경제교실',
      '홍길동'
    )

    expect(mapped.context).toBe('program')
    if (mapped.context !== 'program') return
    expect(mapped.basic.programSessionProgressDisplay).toBe('4 / 16')
    expect(mapped.basic.lectureFeeStandardTitle).toBe('2급 강사비')
    expect(mapped.basic.lectureFeeStandardAmount).toBe('915,000원')
    expect(mapped.blocks[0]?.institutionName).toBe('○○초등학교')
    expect(mapped.blocks[0]?.lectureSessionDisplay).toBe('2 ~ 3차시')
    expect(mapped.blocks[0]?.lines[0]?.kind).toBe('lecture_fee')
    expect(mapped.blocks[0]?.lines[0]?.basisDetail?.layout).toBe('lectureFeeTier')
  })

  it('calculationDetail가 미지원이면 basisDetail 없음', () => {
    const mapped = mapSettlementDetailToProgramCalculationStatement(
      lineRow,
      settlement({
        items: [
          {
            type: 'transportation',
            description: '교통비',
            amount: 31500,
            calculationDetail: { layout: 'transportInstructor' },
          },
        ],
      }),
      'JA 경제교실',
      '홍길동'
    )
    expect(mapped.blocks[0]?.lines[0]?.kind).toBe('travel')
    expect(mapped.blocks[0]?.lines[0]?.basisDetail).toBeUndefined()
  })

  it('meal / activity kind 매핑', () => {
    const mapped = mapSettlementDetailToProgramCalculationStatement(
      lineRow,
      settlement({
        items: [
          { type: 'meal', description: '식사비', amount: 15000 },
          { type: 'activity', description: '활동비', amount: 20000 },
        ],
      }),
      'JA 경제교실',
      '홍길동'
    )
    expect(mapped.blocks[0]?.lines.map(line => line.kind)).toEqual(['activity', 'meal'])
  })
})

describe('mapSettlementDetailToInstructorPageCalculationStatement', () => {
  it('강의비 책정은 API 값, 강사 PII는 placeholder 유지', () => {
    const mapped = mapSettlementDetailToInstructorPageCalculationStatement(
      lineRow,
      settlement({
        lectureFeeStandardTitle: '특강 강사비',
        lectureFeeStandardAmount: 1200000,
      }),
      instructorIdentityFromLine('홍길동'),
      'JA 경제교실'
    )
    expect(mapped.context).toBe('instructor')
    if (mapped.context !== 'instructor') return
    expect(mapped.basic.lectureFeeStandardTitle).toBe('특강 강사비')
    expect(mapped.basic.lectureFeeStandardAmount).toBe('1,200,000원')
    expect(mapped.basic.phoneDisplay).toBe('-')
    expect(mapped.basic.genderBirthDisplay).toBe('-')
  })
})
