import { describe, expect, it } from 'vitest'
import {
  formatLectureSessionLabel,
  formatProgramSessionProgressDisplay,
  formatWonAmountDisplay,
  mapCalculationDetailToBasisDetail,
  mapSettlementFrontendItemTypeToLineKind,
  needsPaymentStatementJoin,
  pickBusinessPeriodFromListItems,
  pickProgramSessionProgressFromListItems,
} from './map-frontend-fields'

describe('formatLectureSessionLabel', () => {
  it('sessionOrdinal → N차시', () => {
    expect(formatLectureSessionLabel(3)).toBe('3차시')
  })

  it('없으면 -', () => {
    expect(formatLectureSessionLabel(undefined)).toBe('-')
  })
})

describe('formatWonAmountDisplay', () => {
  it('금액을 원 단위로 포맷', () => {
    expect(formatWonAmountDisplay(915000)).toBe('915,000원')
  })

  it('없으면 -', () => {
    expect(formatWonAmountDisplay(undefined)).toBe('-')
  })
})

describe('formatProgramSessionProgressDisplay', () => {
  it('display 문자열 우선', () => {
    expect(
      formatProgramSessionProgressDisplay({
        programSessionProgressDisplay: '4 / 16',
        sessionCompleted: 1,
        sessionTotal: 1,
      })
    ).toBe('4 / 16')
  })

  it('completed/total 조합', () => {
    expect(formatProgramSessionProgressDisplay({ sessionCompleted: 4, sessionTotal: 16 })).toBe(
      '4 / 16'
    )
  })
})

describe('pickProgramSessionProgressFromListItems', () => {
  it('라인 건수가 아니라 첫 유효 sessionCompleted/Total', () => {
    expect(
      pickProgramSessionProgressFromListItems([
        { sessionCompleted: 4, sessionTotal: 16 },
        { sessionCompleted: 4, sessionTotal: 16 },
        { sessionCompleted: 4, sessionTotal: 16 },
      ])
    ).toEqual({ sessionCompleted: 4, sessionTotal: 16 })
  })

  it('display 파싱', () => {
    expect(
      pickProgramSessionProgressFromListItems([{ programSessionProgressDisplay: '2 / 8' }])
    ).toEqual({ sessionCompleted: 2, sessionTotal: 8 })
  })
})

describe('pickBusinessPeriodFromListItems', () => {
  it('businessPeriodStart/End 우선, lectureDate min/max는 fallback', () => {
    expect(
      pickBusinessPeriodFromListItems([
        {
          businessPeriodStart: '2025-12-08',
          businessPeriodEnd: '2026-12-30',
          lectureDate: '2026-08-15',
        },
      ])
    ).toEqual({
      businessPeriodStart: '2025-12-08',
      businessPeriodEnd: '2026-12-30',
    })
  })
})

describe('needsPaymentStatementJoin', () => {
  it('모든 행에 statementId가 있으면 false', () => {
    expect(
      needsPaymentStatementJoin([
        { settlementId: 1, statementId: 10 },
        { settlementId: 2, statementId: 20 },
      ])
    ).toBe(false)
  })

  it('statementId 없는 행이 있으면 true', () => {
    expect(
      needsPaymentStatementJoin([{ settlementId: 1, statementId: 10 }, { settlementId: 2 }])
    ).toBe(true)
  })
})

describe('mapSettlementFrontendItemTypeToLineKind', () => {
  it('meal / activity를 lecture_fee로 떨어뜨리지 않음', () => {
    expect(mapSettlementFrontendItemTypeToLineKind('meal', 15000)).toBe('meal')
    expect(mapSettlementFrontendItemTypeToLineKind('activity', 20000)).toBe('activity')
  })
})

describe('mapCalculationDetailToBasisDetail', () => {
  it('basisJson typed payload → basisDetail', () => {
    const detail = mapCalculationDetailToBasisDetail({
      layout: 'lectureFeeTier',
      basisJson: JSON.stringify({
        layout: 'lectureFeeTier',
        tier: '2',
        categoryLabel: '2급 강사비',
        feeAssessmentWon: 915000,
        lectureTimeDisplay: '2차시',
        totalWon: 915000,
      }),
    })
    expect(detail?.layout).toBe('lectureFeeTier')
    if (detail?.layout === 'lectureFeeTier') {
      expect(detail.tier).toBe('2')
      expect(detail.totalWon).toBe(915000)
    }
  })

  it('lectureFeeSpecial basisJson → basisDetail', () => {
    const detail = mapCalculationDetailToBasisDetail({
      layout: 'lectureFeeSpecial',
      basisJson: JSON.stringify({
        layout: 'lectureFeeSpecial',
        categoryLabel: '특강 강사비',
        feeAssessmentWon: 915000,
        lectureTimeDisplay: '1차시',
        totalWon: 915000,
      }),
    })
    expect(detail?.layout).toBe('lectureFeeSpecial')
    if (detail?.layout === 'lectureFeeSpecial') {
      expect(detail.categoryLabel).toBe('특강 강사비')
      expect(detail.totalWon).toBe(915000)
    }
  })

  it('lectureFeeGemini basisJson → basisDetail', () => {
    const detail = mapCalculationDetailToBasisDetail({
      layout: 'lectureFeeGemini',
      basisJson: JSON.stringify({
        layout: 'lectureFeeGemini',
        categoryLabel: '제미나이 강사비',
        lectureTimeDisplay: '2차시',
        feeAssessmentWon: 170000,
      }),
    })
    expect(detail?.layout).toBe('lectureFeeGemini')
    if (detail?.layout === 'lectureFeeGemini') {
      expect(detail.feeAssessmentWon).toBe(170000)
    }
  })

  it('layout만 있고 typed 필드 없으면 undefined', () => {
    expect(
      mapCalculationDetailToBasisDetail({
        layout: 'lectureFeeTier',
        title: '2급 강사비',
      })
    ).toBeUndefined()
  })

  it('잘못된 JSON이면 undefined (typed 필드 없을 때)', () => {
    expect(
      mapCalculationDetailToBasisDetail({
        layout: 'transportInstructor',
        basisJson: '{not-json',
      })
    ).toBeUndefined()
  })

  it('typed 필드가 없어도 백엔드 display snapshot을 generic basisDetail로 매핑한다', () => {
    const detail = mapCalculationDetailToBasisDetail({
      layout: 'transportInstructor',
      title: '교통비 산출 내역',
      formulaText: '출강일별 이동 거리 × 교통비 단가',
      lineLabels: ['출강일', '출발지', '도착지', '거리', '단가', '금액'],
      formulaLines: ['출강일별 이동 구간 확인', '거리/단가 기준 금액 계산'],
      summaryLabels: ['인정 건수', '산출 금액'],
      resultAmount: 31500,
    })

    expect(detail).toMatchObject({
      layout: 'remote',
      sourceLayout: 'transportInstructor',
      title: '교통비 산출 내역',
      formulaText: '출강일별 이동 거리 × 교통비 단가',
      resultAmount: 31500,
    })
  })

  it('표시용 필드도 없으면 basisDetail을 만들지 않는다', () => {
    expect(mapCalculationDetailToBasisDetail({ layout: 'transportInstructor' })).toBeUndefined()
  })
})
