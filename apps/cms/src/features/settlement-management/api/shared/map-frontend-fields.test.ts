import { describe, expect, it } from 'vitest'
import {
  formatLectureFeeStandardTitle,
  formatLectureSessionLabel,
  formatProgramSessionProgressDisplay,
  formatWonAmountDisplay,
  mapCalculationDetailToBasisDetail,
  mapSettlementFrontendItemTypeToLineKind,
  needsPaymentStatementJoin,
  pickBusinessPeriodFromListItems,
  pickProgramSessionProgressFromListItems,
  resolveLectureFeeStandardAmountDisplay,
  resolveLectureFeeStandardTitleFromSettlement,
} from './map-frontend-fields'

describe('formatLectureSessionLabel', () => {
  it('sessionOrdinal → N차시', () => {
    expect(formatLectureSessionLabel(3)).toBe('3차시')
  })

  it('없으면 -', () => {
    expect(formatLectureSessionLabel(undefined)).toBe('-')
  })
})

describe('formatLectureFeeStandardTitle', () => {
  it('급수 제목은 그대로 둔다', () => {
    expect(formatLectureFeeStandardTitle('1급 강사비')).toBe('1급 강사비')
  })

  it('generic 강사비·강의비는 -', () => {
    expect(formatLectureFeeStandardTitle('강사비')).toBe('-')
    expect(formatLectureFeeStandardTitle('강의비')).toBe('-')
    expect(formatLectureFeeStandardTitle(undefined)).toBe('-')
  })
})

describe('resolveLectureFeeStandardTitleFromSettlement', () => {
  it('title이 있으면 정본으로 쓴다', () => {
    expect(
      resolveLectureFeeStandardTitleFromSettlement({
        lectureFeeStandardTitle: '1급 강사비',
        feeGrade: 'GRADE_2',
      })
    ).toBe('1급 강사비')
  })

  it('title이 비면 feeGrade/wageItemType으로 채운다', () => {
    expect(
      resolveLectureFeeStandardTitleFromSettlement({
        lectureFeeStandardTitle: undefined,
        feeGrade: 'GRADE_1',
        wageItemType: 'TIER1',
      })
    ).toBe('1급 강사비')
  })
})

describe('resolveLectureFeeStandardAmountDisplay', () => {
  it('standard amount 우선', () => {
    expect(
      resolveLectureFeeStandardAmountDisplay(120000, [{ type: 'instructor_fee', amount: 500000 }])
    ).toBe('120,000원')
  })

  it('standard가 없으면 instructor_fee amount를 보조로 쓴다', () => {
    expect(
      resolveLectureFeeStandardAmountDisplay(null, [{ type: 'instructor_fee', amount: 500000 }])
    ).toBe('500,000원')
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
      expect(detail.lectureTimeDisplay).toBe('2차시')
    }
  })

  it('Gemini basisJson sessionOrdinal=2 → lectureTimeDisplay 2차시', () => {
    const detail = mapCalculationDetailToBasisDetail({
      layout: 'lectureFeeGemini',
      title: '강사비 산정 기준 상세',
      resultAmount: 170000,
      basisJson: JSON.stringify({
        layout: 'lectureFeeGemini',
        itemType: 'LECTURE_FEE',
        wageItemType: 'GEMINI',
        categoryLabel: '제미나이 강사비',
        feeAssessmentWon: 170000,
        amount: 170000,
        sessionOrdinal: 2,
      }),
    })
    expect(detail?.layout).toBe('lectureFeeGemini')
    if (detail?.layout !== 'lectureFeeGemini') return
    expect(detail.categoryLabel).toBe('제미나이 강사비')
    expect(detail.feeAssessmentWon).toBe(170000)
    expect(detail.lectureTimeDisplay).toBe('2차시')
  })

  it('Gemini typed basisJson 시계열 lectureTimeDisplay는 canonical 거절 후 sessionOrdinal → N차시', () => {
    const detail = mapCalculationDetailToBasisDetail({
      layout: 'lectureFeeGemini',
      basisJson: JSON.stringify({
        layout: 'lectureFeeGemini',
        categoryLabel: '제미나이 강사비',
        feeAssessmentWon: 170000,
        lectureTimeDisplay: '14:30 ~ 16:30',
        sessionOrdinal: 2,
      }),
    })
    expect(detail?.layout).toBe('lectureFeeGemini')
    if (detail?.layout !== 'lectureFeeGemini') return
    expect(detail.lectureTimeDisplay).toBe('2차시')
    expect(detail.lectureTimeDisplay).not.toBe('14:30 ~ 16:30')
  })

  it('BE LECTURE_FEE basisJson(layout=lectureFeeTier) → 급수 모달 payload', () => {
    const detail = mapCalculationDetailToBasisDetail({
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
    })
    expect(detail?.layout).toBe('lectureFeeTier')
    if (detail?.layout !== 'lectureFeeTier') return
    expect(detail.categoryLabel).toBe('1급 강사비')
    expect(detail.tier).toBe('1')
    expect(detail.feeAssessmentWon).toBe(500000)
    expect(detail.lectureTimeDisplay).toBe('1차시')
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

  it('교통비 basisJson 스냅샷을 교통비 상세 payload로 매핑한다', () => {
    const detail = mapCalculationDetailToBasisDetail({
      layout: 'transportInstructor',
      basisJson: JSON.stringify({
        itemType: 'TRANSPORTATION',
        provider: 'NAVER_MAPS',
        oneWayDistanceKm: '36.50',
        roundTripDistanceKm: '73.00',
        tollFeeWon: 1000,
        fuelType: '휘발유',
        fuelCostWon: 50000,
        calculatedTransportAmount: 51000,
        snapshotAt: '2026-09-01T00:00:00Z',
      }),
    })

    expect(detail).toMatchObject({
      layout: 'transportSnapshot',
      provider: 'NAVER_MAPS',
      oneWayDistanceKm: 36.5,
      roundTripDistanceKm: 73,
      tollAmount: 1000,
      fuelCostWon: 50000,
      calculatedTransportAmount: 51000,
    })
  })

  it('fuelCostWon은 산출 교통비 총액으로 대체되지 않는다', () => {
    const detail = mapCalculationDetailToBasisDetail({
      basisJson: JSON.stringify({
        itemType: 'TRANSPORTATION',
        fuelCostWon: 155052,
        tollFeeWon: 44000,
      }),
    })

    expect(detail).toMatchObject({
      layout: 'transportSnapshot',
      fuelCostWon: 155052,
      tollAmount: 44000,
      calculatedTransportAmount: undefined,
    })
  })

  it('표시용 필드도 없으면 basisDetail을 만들지 않는다', () => {
    expect(mapCalculationDetailToBasisDetail({ layout: 'transportInstructor' })).toBeUndefined()
  })

  it('원천징수 basisJson 숫자는 그대로 매핑하고 FE 세율로 다시 계산하지 않는다', () => {
    const detail = mapCalculationDetailToBasisDetail({
      layout: 'withholding',
      basisJson: JSON.stringify({
        itemType: 'WITHHOLDING',
        dailySalaryTotalWon: 200000,
        earnedIncomeDeductionWon: 80000,
        incomeTaxRatePercent: 8.8,
        incomeTaxWon: 10560,
        earnedIncomeTaxCreditWon: 0,
        withholdingTaxAmountWon: 10560,
      }),
    })

    expect(detail).toEqual({
      layout: 'withholding',
      dailySalaryTotalWon: 200000,
      earnedIncomeDeductionWon: 80000,
      incomeTaxRatePercent: 8.8,
      incomeTaxWon: 10560,
      earnedIncomeTaxCreditWon: 0,
      withholdingTaxAmountWon: 10560,
    })
  })

  it('원천징수 필드가 빠지면 3.3% 산출표를 만들지 않는다', () => {
    expect(
      mapCalculationDetailToBasisDetail({
        layout: 'withholding',
        basisJson: JSON.stringify({
          dailySalaryTotalWon: 200000,
          withholdingTaxAmountWon: 6600,
        }),
      })
    ).toBeUndefined()
  })
})
