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

  it('없으면 —', () => {
    expect(formatWonAmountDisplay(undefined)).toBe('—')
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
    expect(
      formatProgramSessionProgressDisplay({ sessionCompleted: 4, sessionTotal: 16 })
    ).toBe('4 / 16')
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
      needsPaymentStatementJoin([
        { settlementId: 1, statementId: 10 },
        { settlementId: 2 },
      ])
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
})
