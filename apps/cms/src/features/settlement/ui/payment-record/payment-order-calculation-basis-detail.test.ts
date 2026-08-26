import { describe, expect, it } from 'vitest'
import {
  buildActivityBasisDetail,
  buildLectureFeeGeminiBasisDetail,
  buildLectureFeeSpecialBasisDetail,
  buildLectureFeeTierBasisDetail,
  buildLodgingBasisDetail,
  buildMealBasisDetail,
  buildTravelBasisDetail,
  buildWithholdingBasisDetail,
  isSupportedBasisDetailLayout,
  lectureFeeLineDescriptionFromStandardTitle,
  parseLectureSessionStartFromDisplay,
  resolveActivityBasisDetailTotalWon,
  resolveBasisDetailModalTitle,
  resolveLodgingBasisDetailTotalWon,
  resolveMealBasisDetailTotalWon,
  resolvePaymentOrderCalculationBasisDetailForRow,
  resolveTravelBasisDetailTotalWon,
  resolveWithholdingBasisDetailAmountWon,
} from './payment-order-calculation-basis-detail'

describe('payment-order-calculation-basis-detail', () => {
  it('buildLectureFeeTierBasisDetail returns payload for tier 1~3 titles', () => {
    const detail = buildLectureFeeTierBasisDetail('2급 강사비', 915000, 1)
    expect(detail).toEqual({
      layout: 'lectureFeeTier',
      tier: '2',
      categoryLabel: '2급 강사비',
      feeAssessmentWon: 915000,
      lectureTimeDisplay: '1차시',
      totalWon: 915000,
    })
  })

  it('buildLectureFeeSpecialBasisDetail returns 특강 payload', () => {
    const detail = buildLectureFeeSpecialBasisDetail(915000, 1)
    expect(detail).toEqual({
      layout: 'lectureFeeSpecial',
      categoryLabel: '특강 강사비',
      feeAssessmentWon: 915000,
      lectureTimeDisplay: '1차시',
      totalWon: 915000,
    })
    expect(resolveBasisDetailModalTitle(detail)).toBe('특강 강사비 산정 기준 상세')
    expect(isSupportedBasisDetailLayout(detail)).toBe(true)
  })

  it('buildLectureFeeGeminiBasisDetail returns 제미나이 payload', () => {
    const detail = buildLectureFeeGeminiBasisDetail(170000, 2)
    expect(detail).toEqual({
      layout: 'lectureFeeGemini',
      categoryLabel: '제미나이 강사비',
      lectureTimeDisplay: '2차시',
      feeAssessmentWon: 170000,
    })
    expect(resolveBasisDetailModalTitle(detail)).toBe('강사비 산정 기준 상세')
    expect(isSupportedBasisDetailLayout(detail)).toBe(true)
  })

  it('resolvePaymentOrderCalculationBasisDetailForRow uses 제미나이 layout', () => {
    const detail = resolvePaymentOrderCalculationBasisDetailForRow(
      {
        kind: 'lecture_fee',
        itemLabel: '강의비',
        amount: 170000,
        lineId: 'lecture-gemini-1',
        lectureSessionDisplay: '2차시',
      },
      { lectureFeeStandardTitle: '제미나이 강사비' }
    )
    expect(detail?.layout).toBe('lectureFeeGemini')
  })

  it('구분에 항목 타입 라벨 강사비 대신 강의비 책정 기준을 쓴다', () => {
    const detail = resolvePaymentOrderCalculationBasisDetailForRow(
      {
        kind: 'lecture_fee',
        itemLabel: '강사비',
        amount: 915000,
        lineId: 'lecture-generic-1',
        lectureSessionDisplay: '1차시',
        basisDetail: {
          layout: 'lectureFeeTier',
          tier: '2',
          categoryLabel: '강사비',
          feeAssessmentWon: 915000,
          lectureTimeDisplay: '1차시',
          totalWon: 915000,
        },
      },
      { lectureFeeStandardTitle: '1급 강사비' }
    )
    expect(detail?.layout).toBe('lectureFeeTier')
    if (detail?.layout === 'lectureFeeTier') {
      expect(detail.categoryLabel).toBe('1급 강사비')
      expect(detail.tier).toBe('1')
    }
  })

  it('resolvePaymentOrderCalculationBasisDetailForRow uses 특강 layout', () => {
    const detail = resolvePaymentOrderCalculationBasisDetailForRow(
      {
        kind: 'lecture_fee',
        itemLabel: '강의비',
        amount: 915000,
        lineId: 'lecture-special-1',
        lectureSessionDisplay: '1차시',
      },
      { lectureFeeStandardTitle: '특강 강사비' }
    )
    expect(detail?.layout).toBe('lectureFeeSpecial')
  })

  it('resolveBasisDetailModalTitle returns lecture fee title', () => {
    const detail = buildLectureFeeTierBasisDetail('1급 강사비', 500000, 2)!
    expect(resolveBasisDetailModalTitle(detail)).toBe('강사비 산정 기준 상세')
  })

  it('isSupportedBasisDetailLayout accepts all supported layouts', () => {
    const lecture = buildLectureFeeTierBasisDetail('3급 강사비', 300000, 3)!
    expect(isSupportedBasisDetailLayout(lecture)).toBe(true)
    expect(isSupportedBasisDetailLayout(buildLectureFeeSpecialBasisDetail(915000, 1))).toBe(true)
    expect(isSupportedBasisDetailLayout(buildLectureFeeGeminiBasisDetail(170000, 2))).toBe(true)
    expect(isSupportedBasisDetailLayout(buildTravelBasisDetail(0))).toBe(true)
    expect(isSupportedBasisDetailLayout(buildLodgingBasisDetail(0))).toBe(true)
    expect(isSupportedBasisDetailLayout(buildMealBasisDetail())).toBe(true)
    expect(isSupportedBasisDetailLayout(buildActivityBasisDetail())).toBe(true)
    expect(isSupportedBasisDetailLayout(buildWithholdingBasisDetail(300000))).toBe(true)
    expect(isSupportedBasisDetailLayout(undefined)).toBe(false)
  })

  it('buildTravelBasisDetail cycles round trip, one way, and instructor layouts', () => {
    const roundTrip = buildTravelBasisDetail(0)
    expect(roundTrip.layout).toBe('transportRoundTrip')
    expect(resolveTravelBasisDetailTotalWon(roundTrip)).toBe(50000)

    const oneWay = buildTravelBasisDetail(1)
    expect(oneWay.layout).toBe('transportOneWay')
    expect(resolveTravelBasisDetailTotalWon(oneWay)).toBe(25000)

    const instructor = buildTravelBasisDetail(2)
    expect(instructor.layout).toBe('transportInstructor')
    expect(resolveTravelBasisDetailTotalWon(instructor)).toBe(51000)
  })

  it('resolveBasisDetailModalTitle returns transport title', () => {
    expect(resolveBasisDetailModalTitle(buildTravelBasisDetail(0))).toBe('교통비 산정 기준 상세')
  })

  it('buildLodgingBasisDetail cycles general and 1s1g layouts', () => {
    const general = buildLodgingBasisDetail(0)
    expect(general.layout).toBe('lodgingGeneral')
    expect(general.categoryLabel).toBe('숙박비(일반)')
    expect(resolveLodgingBasisDetailTotalWon(general)).toBe(150000)
    expect(resolveBasisDetailModalTitle(general)).toBe('숙박비 산정 기준 상세')

    const oneCompanyOneSchool = buildLodgingBasisDetail(1)
    expect(oneCompanyOneSchool.layout).toBe('lodging1s1g')
    expect(oneCompanyOneSchool.categoryLabel).toBe('숙박비(1사1교)')
    expect(resolveLodgingBasisDetailTotalWon(oneCompanyOneSchool)).toBe(80000)
    expect(resolveBasisDetailModalTitle(oneCompanyOneSchool)).toBe('1사1교 숙박비 산정 기준 상세')
  })

  it('buildMealBasisDetail returns meal layout with receipt', () => {
    const meal = buildMealBasisDetail()
    expect(meal).toEqual({
      layout: 'meal',
      categoryLabel: '식사비',
      mealFee: {
        amountWon: 30000,
        receiptFileName: '식사비 영수증.pdf',
      },
      totalWon: 30000,
    })
    expect(resolveMealBasisDetailTotalWon(meal)).toBe(30000)
    expect(resolveBasisDetailModalTitle(meal)).toBe('식사비 산정 기준 상세')
  })

  it('buildActivityBasisDetail returns activity layout with receipt', () => {
    const activity = buildActivityBasisDetail()
    expect(activity).toEqual({
      layout: 'activity',
      categoryLabel: '자원봉사자 활동비',
      activityFee: {
        amountWon: 50000,
        receiptFileName: '활동비 영수증.pdf',
      },
      totalWon: 50000,
    })
    expect(resolveActivityBasisDetailTotalWon(activity)).toBe(50000)
    expect(resolveBasisDetailModalTitle(activity)).toBe('활동비 산정 기준 상세')
  })

  it('buildWithholdingBasisDetail returns withholding breakdown for daily salary total', () => {
    const withholding = buildWithholdingBasisDetail(300000)
    expect(withholding).toEqual({
      layout: 'withholding',
      dailySalaryTotalWon: 300000,
      earnedIncomeDeductionWon: 150000,
      incomeTaxRatePercent: 3.3,
      incomeTaxWon: 4950,
      earnedIncomeTaxCreditWon: 2722,
      withholdingTaxAmountWon: 2228,
    })
    expect(resolveWithholdingBasisDetailAmountWon(withholding)).toBe(-2228)
    expect(resolveBasisDetailModalTitle(withholding)).toBe('원천징수 산정 기준 상세')
  })

  it('lectureFeeLineDescriptionFromStandardTitle formats tier descriptions', () => {
    expect(lectureFeeLineDescriptionFromStandardTitle('1급 강사비')).toBe(
      '프로그램 1회 강의비 (1급 강사)'
    )
    expect(lectureFeeLineDescriptionFromStandardTitle('특강 강사비')).toBe(
      '프로그램 1회 강의비 (특강 강사)'
    )
    expect(lectureFeeLineDescriptionFromStandardTitle('제미나이 강사비')).toBe(
      '프로그램 1회 강의비 (제미나이 강사)'
    )
  })

  it('resolvePaymentOrderCalculationBasisDetailForRow builds travel fallback', () => {
    const detail = resolvePaymentOrderCalculationBasisDetailForRow({
      kind: 'travel',
      itemLabel: '교통비',
      amount: 30000,
      lineId: 'travel-1',
      lectureSessionDisplay: '1 ~ 2차시',
    })
    expect(detail?.layout).toMatch(/^transport/)
  })

  it('row.basisDetail 없어도 모든 산정 항목은 산정 기준 상세를 만든다', () => {
    const kinds = [
      { kind: 'lecture_fee', itemLabel: '강의비', amount: 200000 },
      { kind: 'travel', itemLabel: '교통비', amount: 30000 },
      { kind: 'lodging', itemLabel: '숙박비', amount: 150000 },
      { kind: 'meal', itemLabel: '식사비', amount: 30000 },
      { kind: 'activity', itemLabel: '활동비', amount: 50000 },
      { kind: 'withholding', itemLabel: '원천징수', amount: -2228 },
    ] as const

    for (const [index, row] of kinds.entries()) {
      const detail = resolvePaymentOrderCalculationBasisDetailForRow({
        ...row,
        lineId: `line-${index}`,
        lectureSessionDisplay: '1 ~ 2차시',
      })
      expect(detail, row.itemLabel).toBeDefined()
      expect(isSupportedBasisDetailLayout(detail), row.itemLabel).toBe(true)
    }
  })

  it('resolvePaymentOrderCalculationBasisDetailForRow builds activity fallback', () => {
    const detail = resolvePaymentOrderCalculationBasisDetailForRow({
      kind: 'activity',
      itemLabel: '활동비',
      amount: 50000,
      lineId: 'activity-1',
      lectureSessionDisplay: '1 ~ 2차시',
    })
    expect(detail?.layout).toBe('activity')
  })

  it('resolvePaymentOrderCalculationBasisDetailForRow builds withholding fallback', () => {
    const detail = resolvePaymentOrderCalculationBasisDetailForRow(
      {
        kind: 'withholding',
        itemLabel: '원천징수',
        amount: -2228,
        lineId: 'withholding-1',
        lectureSessionDisplay: '1 ~ 2차시',
      },
      { withholdingDailySalaryTotalWon: 300000 }
    )
    expect(detail?.layout).toBe('withholding')
    if (detail?.layout === 'withholding') {
      expect(detail.withholdingTaxAmountWon).toBe(2228)
    }
  })

  it('parseLectureSessionStartFromDisplay extracts first number', () => {
    expect(parseLectureSessionStartFromDisplay('2 ~ 3차시')).toBe(2)
  })
})
