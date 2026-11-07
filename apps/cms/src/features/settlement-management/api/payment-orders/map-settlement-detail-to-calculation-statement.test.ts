import { describe, expect, it } from 'vitest'
import {
  instructorIdentityFromLine,
  mapSettlementDetailToInstructorPageCalculationStatement,
  mapSettlementDetailToProgramCalculationStatement,
} from './map-settlement-detail-to-calculation-statement'
import type { PaymentOrderAdminProgramDetailInstructorRow } from '@/features/settlement-management/model/payment-order-admin-list'
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
    items: [],
    totalAmount: 0,
    ...overrides,
  }
}

describe('mapSettlementDetailToProgramCalculationStatement', () => {
  it('단건 DTO로 진행 회차·강사비 책정·기관명·강의 구간을 채움', () => {
    const mapped = mapSettlementDetailToProgramCalculationStatement(
      lineRow,
      settlement({
        programSessionProgressDisplay: '4 / 16',
        period: '2025.12.08(월) ~ 2026.12.30(수)',
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

  it('institutionName이 null이면 "-" (다른 필드로 보완하지 않음)', () => {
    const mapped = mapSettlementDetailToProgramCalculationStatement(
      { ...lineRow, institutionName: '' },
      settlement({ institutionName: null }),
      'JA 경제교실',
      '홍길동'
    )
    expect(mapped.blocks[0]?.institutionName).toBe('-')
  })

  it('payee·taxIncomeTypeDisplay를 산출 내역서·라인에 매핑한다', () => {
    const mapped = mapSettlementDetailToInstructorPageCalculationStatement(
      lineRow,
      settlement({
        institutionName: null,
        instructorName: '이강사',
        payee: {
          nameEn: 'Lee',
          phone: '010-****-5678',
          email: 'lee***@ex.com',
          gender: '**',
          birthDate: '1990-**-**',
          addressRoad: '서울시 강남구 테헤란로 ***',
          addressDetail: '***',
          bankName: '국민',
          accountNumber: '***',
          accountHolder: '이*',
          affiliation: 'JA',
          residentRegistrationNumber: '900101-*******',
          privacyMaskingLevel: 'MASKED',
        },
        items: [
          {
            type: 'instructor_fee',
            description: '1급 강사비',
            amount: 240000,
          },
          {
            type: 'withholding',
            description: '원천징수',
            amount: -7920,
            taxIncomeType: 'BUSINESS_INCOME',
            taxIncomeTypeDisplay: '사업소득',
          },
        ],
        totalAmount: 232080,
      }),
      instructorIdentityFromLine('이강사'),
      'E2E 프로그램'
    )

    expect(mapped.context).toBe('instructor')
    if (mapped.context !== 'instructor') return
    expect(mapped.basic.nameEn).toBe('Lee')
    expect(mapped.basic.phoneDisplay).toBe('010-****-5678')
    expect(mapped.basic.affiliation).toBe('JA')
    expect(mapped.basic.residentRegistrationNumber).toBe('900101-*******')
    expect(mapped.basic.genderBirthDisplay).toBe('** | 1990-**-**')
    expect(mapped.basic.addressDisplay).toBe('서울시 강남구 테헤란로 *** ***')
    expect(mapped.basic.addressBlurredTail).toBeUndefined()
    expect(mapped.blocks[0]?.institutionName).toBe('-')
    expect(mapped.blocks[0]?.lines.find(l => l.kind === 'withholding')?.taxIncomeTypeDisplay).toBe(
      '사업소득'
    )
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

  it('교통비 calculationDetail이 없어도 거리 스냅샷을 basisDetail로 연결한다', () => {
    const mapped = mapSettlementDetailToProgramCalculationStatement(
      lineRow,
      settlement({
        items: [{ type: 'transportation', description: '교통비', amount: 51000 }],
      }),
      'JA 경제교실',
      '홍길동',
      {
        settlementId: 1001,
        provider: 'NAVER_MAPS',
        oneWayDistanceKm: 36.5,
        roundTripDistanceKm: 73,
        tollAmount: 1000,
        fuelType: '휘발유',
        calculatedTransportAmount: 51000,
      }
    )

    expect(mapped.blocks[0]?.lines[0]?.basisDetail).toMatchObject({
      layout: 'transportSnapshot',
      calculatedTransportAmount: 51000,
    })
  })

  it('교통비 basisJson에 총액이 없으면 정산 행 amount를 총액으로 사용한다', () => {
    const mapped = mapSettlementDetailToProgramCalculationStatement(
      lineRow,
      settlement({
        items: [
          {
            type: 'transportation',
            description: '교통비',
            amount: 199052,
            calculationDetail: {
              basisJson: JSON.stringify({
                itemType: 'TRANSPORTATION',
                provider: 'NAVER_MAPS',
                oneWayDistanceKm: 417.74,
                roundTripDistanceKm: 835.48,
                tollFeeWon: 44000,
                fuelType: 'GASOLINE',
                fuelCostWon: 155052,
              }),
            },
          },
        ],
      }),
      'JA 경제교실',
      '홍길동'
    )

    expect(mapped.blocks[0]?.lines[0]?.basisDetail).toMatchObject({
      layout: 'transportSnapshot',
      fuelCostWon: 155052,
      tollAmount: 44000,
      calculatedTransportAmount: 199052,
    })
  })

  it('교통비 snapshot fallback도 fuelCostWon이 아니라 calculatedTransportAmount를 총액으로 사용한다', () => {
    const mapped = mapSettlementDetailToProgramCalculationStatement(
      lineRow,
      settlement({
        items: [{ type: 'transportation', description: '교통비', amount: 199052 }],
      }),
      'JA 경제교실',
      '홍길동',
      {
        settlementId: 1001,
        provider: 'NAVER_MAPS',
        oneWayDistanceKm: 417.74,
        roundTripDistanceKm: 835.48,
        tollAmount: 44000,
        fuelType: 'GASOLINE',
        calculatedTransportAmount: 199052,
        snapshotAt: '2026-10-24T13:09:52.882808Z',
      }
    )

    expect(mapped.blocks[0]?.lines[0]?.basisDetail).toMatchObject({
      layout: 'transportSnapshot',
      calculatedTransportAmount: 199052,
    })
  })

  it('lectureSessionDisplay 원문을 일정 칸에 그대로 쓴다', () => {
    const mapped = mapSettlementDetailToProgramCalculationStatement(
      { ...lineRow, sessionOrdinal: 1 },
      settlement({
        lectureFeeStandardTitle: undefined,
        lectureFeeStandardAmount: undefined,
        lectureSessionDisplay: 'GROK_E2E_API CS03 1회차',
        sessionOrdinal: 1,
        items: [
          {
            type: 'instructor_fee',
            description: '강사비',
            amount: 500000,
          },
        ],
        totalAmount: 676000,
      }),
      'GROK_E2E_API_CS_03 신청가능진행중',
      '테스트강사'
    )

    expect(mapped.basic.lectureFeeStandardTitle).toBe('-')
    expect(mapped.basic.lectureFeeStandardAmount).toBe('500,000원')
    expect(mapped.blocks[0]?.lectureSessionDisplay).toBe('GROK_E2E_API CS03 1회차')
    expect(mapped.blocks[0]?.lines[0]?.kind).toBe('lecture_fee')
    expect(mapped.blocks[0]?.lines[0]?.amount).toBe(500000)
  })

  it('GET 1694926 계약: 급수 title·1차시·lectureFeeTier 합성을 그대로 쓴다', () => {
    const mapped = mapSettlementDetailToProgramCalculationStatement(
      { ...lineRow, sessionOrdinal: 1 },
      settlement({
        lectureFeeStandardTitle: '1급 강사비',
        lectureFeeStandardAmount: 500000,
        wageItemType: 'TIER1',
        feeGrade: 'GRADE_1',
        lectureSessionDisplay: '1차시',
        sessionOrdinal: 1,
        items: [
          {
            type: 'instructor_fee',
            description: '1급 강사비',
            amount: 500000,
            calculationDetail: {
              layout: 'lectureFeeTier',
              title: '강사비 산정 기준 상세',
              resultAmount: 500000,
              basisJson: JSON.stringify({
                itemType: 'LECTURE_FEE',
                feeGrade: 'GRADE_1',
                wageItemType: 'TIER1',
                amount: 500000,
                sessionOrdinal: 1,
              }),
            },
          },
        ],
        totalAmount: 676000,
      }),
      'GROK_E2E_API_CS_03 신청가능진행중',
      '테스트강사'
    )

    expect(mapped.basic.lectureFeeStandardTitle).toBe('1급 강사비')
    expect(mapped.basic.lectureFeeStandardAmount).toBe('500,000원')
    expect(mapped.blocks[0]?.lectureSessionDisplay).toBe('1차시')
    expect(mapped.blocks[0]?.lines[0]?.description).toBe('1급 강사비')
    expect(mapped.blocks[0]?.lines[0]?.basisDetail).toMatchObject({
      layout: 'lectureFeeTier',
      categoryLabel: '1급 강사비',
      lectureTimeDisplay: '-',
      feeAssessmentWon: 500000,
    })
  })

  it('GET 1694933: 책정 금액은 정책 단가, 행 금액은 item amount', () => {
    const mapped = mapSettlementDetailToProgramCalculationStatement(
      { ...lineRow, sessionOrdinal: 1 },
      settlement({
        lectureFeeStandardTitle: '1급 강사비',
        lectureFeeStandardAmount: 120000,
        lectureSessionDisplay: '1차시',
        sessionOrdinal: 1,
        items: [
          {
            type: 'instructor_fee',
            description: '1급 강사비',
            amount: 240000,
            calculationDetail: {
              layout: 'lectureFeeTier',
              resultAmount: 240000,
              basisJson: JSON.stringify({
                itemType: 'LECTURE_FEE',
                feeGrade: 'GRADE_1',
                wageItemType: 'TIER1',
                amount: 240000,
                sessionOrdinal: 1,
              }),
            },
          },
        ],
      }),
      '공통 교육',
      '홍길동'
    )

    expect(mapped.basic.lectureFeeStandardAmount).toBe('120,000원')
    expect(mapped.blocks[0]?.lines[0]?.amount).toBe(240000)
    expect(mapped.blocks[0]?.lectureSessionDisplay).toBe('1차시')
  })

  it('generic 강사비 제목은 구분에서 버린다', () => {
    const mapped = mapSettlementDetailToProgramCalculationStatement(
      lineRow,
      settlement({
        lectureFeeStandardTitle: '강사비',
        lectureFeeStandardAmount: 120000,
      }),
      'JA 경제교실',
      '홍길동'
    )
    expect(mapped.basic.lectureFeeStandardTitle).toBe('-')
    expect(mapped.basic.lectureFeeStandardAmount).toBe('120,000원')
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
  it('강사 상세도 lectureSessionDisplay 원문을 쓴다', () => {
    const mapped = mapSettlementDetailToInstructorPageCalculationStatement(
      { ...lineRow, sessionOrdinal: 1 },
      settlement({
        lectureSessionDisplay: 'GROK_E2E_API CS03 1회차',
        sessionOrdinal: 1,
      }),
      instructorIdentityFromLine('홍길동'),
      'JA 경제교실'
    )
    expect(mapped.blocks[0]?.lectureSessionDisplay).toBe('GROK_E2E_API CS03 1회차')
  })

  it('강사비 책정은 API 값, 강사 PII는 placeholder 유지', () => {
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

  it('강사 상세 경로도 교통비 스냅샷을 산정 기준 상세로 연결한다', () => {
    const mapped = mapSettlementDetailToInstructorPageCalculationStatement(
      lineRow,
      settlement({
        items: [{ type: 'transportation', description: '교통비', amount: 51000 }],
      }),
      instructorIdentityFromLine('홍길동'),
      'JA 경제교실',
      {
        settlementId: 1001,
        provider: 'NAVER_MAPS',
        oneWayDistanceKm: 36.5,
        roundTripDistanceKm: 73,
        tollAmount: 1000,
        fuelType: '휘발유',
        calculatedTransportAmount: 51000,
      }
    )

    expect(mapped.blocks[0]?.lines[0]?.basisDetail).toMatchObject({
      layout: 'transportSnapshot',
      calculatedTransportAmount: 51000,
    })
  })
})
