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
  mapTransportationSnapshotToBasisDetail,
  DISTANCE_SNAPSHOT_UNLINKED_NOTICE,
  lectureFeeLineDescriptionFromStandardTitle,
  resolveActivityBasisDetailTotalWon,
  resolveBasisDetailModalTitle,
  resolveLodgingBasisDetailTotalWon,
  resolveMealBasisDetailTotalWon,
  mapLectureFeeCalculationDetailToBasisDetail,
  resolvePaymentOrderCalculationBasisDetailForRow,
  resolveTravelBasisDetailTotalWon,
  resolveWithholdingBasisDetailAmountWon,
} from './payment-order-calculation-basis-detail'

describe('payment-order-calculation-basis-detail', () => {
  it('buildLectureFeeTierBasisDetail returns payload for tier 1~3 titles', () => {
    const detail = buildLectureFeeTierBasisDetail('2급 강사비', 915000, '1차시')
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
    const detail = buildLectureFeeSpecialBasisDetail(915000, '1차시')
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
    const detail = buildLectureFeeGeminiBasisDetail(170000, '2차시')
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
    const detail = buildLectureFeeTierBasisDetail('1급 강사비', 500000, '2차시')!
    expect(resolveBasisDetailModalTitle(detail)).toBe('강사비 산정 기준 상세')
  })

  it('isSupportedBasisDetailLayout accepts all supported layouts', () => {
    const lecture = buildLectureFeeTierBasisDetail('3급 강사비', 300000, '3차시')!
    expect(isSupportedBasisDetailLayout(lecture)).toBe(true)
    expect(isSupportedBasisDetailLayout(buildLectureFeeSpecialBasisDetail(915000, '1차시'))).toBe(
      true
    )
    expect(isSupportedBasisDetailLayout(buildLectureFeeGeminiBasisDetail(170000, '2차시'))).toBe(true)
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

  it('교통비 스냅샷 API 응답을 원격 교통비 상세 payload로 매핑한다', () => {
    const detail = mapTransportationSnapshotToBasisDetail({
      snapshotId: 1,
      settlementId: 2,
      provider: 'NAVER_MAPS',
      oneWayDistanceKm: 36.5,
      roundTripDistanceKm: 73,
      tollAmount: 1000,
      fuelType: '휘발유',
      calculatedTransportAmount: 51000,
      snapshotAt: '2026-10-24T12:00:00Z',
    })

    expect(detail).toEqual({
      layout: 'transportSnapshot',
      provider: 'NAVER_MAPS',
      oneWayDistanceKm: 36.5,
      roundTripDistanceKm: 73,
      tollAmount: 1000,
      fuelType: '휘발유',
      calculatedTransportAmount: 51000,
      snapshotAt: '2026-10-24T12:00:00Z',
      fuelCostWon: undefined,
      distanceSnapshotUnlinked: false,
    })
    expect(isSupportedBasisDetailLayout(detail)).toBe(true)
  })

  it('교통비 스냅샷의 fuelCostWon은 산출 교통비로 바꾸지 않는다', () => {
    const detail = mapTransportationSnapshotToBasisDetail({
      provider: 'NAVER_MAPS',
      fuelCostWon: 155052,
      calculatedTransportAmount: 199052,
    })
    expect(detail?.fuelCostWon).toBe(155052)
    expect(detail?.calculatedTransportAmount).toBe(199052)
    expect(detail?.distanceSnapshotUnlinked).toBe(false)
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
      categoryLabel: '참여자 활동비',
      activityFee: {
        amountWon: 50000,
        receiptFileName: '참여자 활동비 영수증.pdf',
      },
      totalWon: 50000,
    })
    expect(resolveActivityBasisDetailTotalWon(activity)).toBe(50000)
    expect(resolveBasisDetailModalTitle(activity)).toBe('참여자 활동비 산정 기준 상세')
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

  it('resolvePaymentOrderCalculationBasisDetailForRow does not invent travel mock without basisDetail', () => {
    const detail = resolvePaymentOrderCalculationBasisDetailForRow({
      kind: 'travel',
      itemLabel: '교통비',
      amount: 30000,
      lineId: 'travel-1',
      lectureSessionDisplay: '1 ~ 2차시',
    })
    expect(detail).toBeUndefined()
  })

  it('원격 교통비 상세가 없어도 정산 행 금액으로 모달을 연다', () => {
    const detail = resolvePaymentOrderCalculationBasisDetailForRow(
      {
        kind: 'travel',
        itemLabel: '교통비',
        amount: 199052,
        lineId: 'travel-remote-1',
        lectureSessionDisplay: '1차시',
      },
      { remoteData: true }
    )

    expect(detail).toMatchObject({
      layout: 'transportSnapshot',
      calculatedTransportAmount: 199052,
      distanceSnapshotUnlinked: true,
    })
  })

  it('일정 이름 숫자로 차시를 만들지 않고 구분이 비면 2급 강사비를 쓰지 않는다', () => {
    const detail = resolvePaymentOrderCalculationBasisDetailForRow(
      {
        kind: 'lecture_fee',
        itemLabel: '강의비',
        amount: 915000,
        lineId: 'lecture-schedule-name',
        lectureSessionDisplay: 'GROK_E2E_API CS03 1회차',
      },
      { lectureFeeStandardTitle: '-' }
    )

    expect(detail?.layout).toBe('lectureFeeTier')
    if (detail?.layout !== 'lectureFeeTier') return
    expect(detail.categoryLabel).toBe('-')
    expect(detail.lectureTimeDisplay).toBe('-')
    expect(detail.lectureTimeDisplay).not.toBe('2차시')
  })

  it('remote lectureFeeTier 합성은 급수 모달로 되돌리되 강의 시간은 calculationDetail 없으면 -', () => {
    const detail = resolvePaymentOrderCalculationBasisDetailForRow(
      {
        kind: 'lecture_fee',
        itemLabel: '1급 강사비',
        amount: 500000,
        lineId: 'lecture-remote-tier',
        lectureSessionDisplay: '1차시',
        basisDetail: {
          layout: 'remote',
          sourceLayout: 'lectureFeeTier',
          title: '강사비 산정 기준 상세',
          lineLabels: [],
          formulaLines: [],
          summaryLabels: [],
          resultAmount: 500000,
        },
      },
      {
        lectureFeeStandardTitle: '1급 강사비',
        sessionOrdinal: 1,
        lectureFeeStandardAmountWon: 500000,
        remoteData: true,
      }
    )

    expect(detail?.layout).toBe('lectureFeeTier')
    if (detail?.layout !== 'lectureFeeTier') return
    expect(detail.categoryLabel).toBe('1급 강사비')
    expect(detail.lectureTimeDisplay).toBe('-')
  })

  it('context.sessionOrdinal·lectureSessionDisplay로 모달 강의 시간을 채우지 않는다', () => {
    const detail = resolvePaymentOrderCalculationBasisDetailForRow(
      {
        kind: 'lecture_fee',
        itemLabel: '강사비',
        amount: 500000,
        lineId: 'lecture-schedule-ordinal',
        lectureSessionDisplay: 'GROK_E2E_API CS03 1회차',
      },
      { lectureFeeStandardTitle: '-', sessionOrdinal: 1 }
    )

    expect(detail?.layout).toBe('lectureFeeTier')
    if (detail?.layout !== 'lectureFeeTier') return
    expect(detail.categoryLabel).toBe('-')
    expect(detail.lectureTimeDisplay).toBe('-')
  })

  it('calculationDetail basisDetail의 canonical 차시만 모달 강의 시간으로 쓴다', () => {
    const bySession = resolvePaymentOrderCalculationBasisDetailForRow(
      {
        kind: 'lecture_fee',
        itemLabel: '강사비',
        amount: 500000,
        lineId: 'lecture-session-1',
        lectureSessionDisplay: '14:30 ~ 16:30',
        basisDetail: {
          layout: 'lectureFeeTier',
          tier: '2',
          categoryLabel: '2급 강사비',
          feeAssessmentWon: 500000,
          lectureTimeDisplay: '1차시',
          totalWon: 500000,
        },
      },
      { lectureFeeStandardTitle: '2급 강사비' }
    )
    expect(bySession?.layout).toBe('lectureFeeTier')
    if (bySession?.layout === 'lectureFeeTier') {
      expect(bySession.lectureTimeDisplay).toBe('1차시')
    }

    const byRound = resolvePaymentOrderCalculationBasisDetailForRow(
      {
        kind: 'lecture_fee',
        itemLabel: '강사비',
        amount: 500000,
        lineId: 'lecture-round-1',
        lectureSessionDisplay: '3회차',
        basisDetail: {
          layout: 'lectureFeeTier',
          tier: '2',
          categoryLabel: '2급 강사비',
          feeAssessmentWon: 500000,
          lectureTimeDisplay: '3회차',
          totalWon: 500000,
        },
      },
      { lectureFeeStandardTitle: '2급 강사비' }
    )
    expect(byRound?.layout).toBe('lectureFeeTier')
    if (byRound?.layout === 'lectureFeeTier') {
      expect(byRound.lectureTimeDisplay).toBe('3회차')
    }
  })

  it('lectureTimeDisplay(차시)가 있으면 hours보다 차시를 우선한다', () => {
    const detail = mapLectureFeeCalculationDetailToBasisDetail({
      layout: 'lectureFeeTier',
      resultAmount: 500_000,
      basisJson: JSON.stringify({
        layout: 'lectureFeeTier',
        itemType: 'LECTURE_FEE',
        feeGrade: 'GRADE_1',
        categoryLabel: '1급 강사비',
        amount: 500_000,
        sessionOrdinal: 1,
        lectureTimeDisplay: '1차시',
        hours: 2,
      }),
    })
    expect(detail?.layout).toBe('lectureFeeTier')
    if (detail?.layout !== 'lectureFeeTier') return
    expect(detail.lectureTimeDisplay).toBe('1차시')
  })

  it('차시·회차가 없고 hours만 있으면 강의 시간에 N시간을 쓴다', () => {
    const detail = mapLectureFeeCalculationDetailToBasisDetail({
      layout: 'lectureFeeTier',
      resultAmount: 500_000,
      basisJson: JSON.stringify({
        layout: 'lectureFeeTier',
        itemType: 'LECTURE_FEE',
        feeGrade: 'GRADE_1',
        categoryLabel: '1급 강사비',
        amount: 500_000,
        hours: 2,
      }),
    })
    expect(detail?.layout).toBe('lectureFeeTier')
    if (detail?.layout !== 'lectureFeeTier') return
    expect(detail.lectureTimeDisplay).toBe('2시간')

    const resolved = resolvePaymentOrderCalculationBasisDetailForRow(
      {
        kind: 'lecture_fee',
        itemLabel: '강사비',
        amount: 500_000,
        lineId: 'lecture-hours-only',
        lectureSessionDisplay: '14:30 ~ 16:30',
        basisDetail: detail,
      },
      { lectureFeeStandardTitle: '1급 강사비', remoteData: true }
    )
    expect(resolved?.layout).toBe('lectureFeeTier')
    if (resolved?.layout !== 'lectureFeeTier') return
    expect(resolved.lectureTimeDisplay).toBe('2시간')
  })

  it('원천징수 행에 lectureFeeTier basisDetail이 있어도 원천징수 모달로 연결한다', () => {
    const detail = resolvePaymentOrderCalculationBasisDetailForRow(
      {
        kind: 'withholding',
        itemLabel: '원천징수',
        amount: -2228,
        lineId: 'withholding-mismatched-lecture',
        lectureSessionDisplay: '1차시',
        basisDetail: {
          layout: 'lectureFeeTier',
          tier: '1',
          categoryLabel: '1급 강사비',
          feeAssessmentWon: 500000,
          lectureTimeDisplay: '1차시',
          totalWon: 500000,
        },
      },
      { withholdingDailySalaryTotalWon: 300000, remoteData: true }
    )
    expect(detail).toBeUndefined()
  })

  it('제미나이 calculationDetail이 있으면 시계열 lectureSessionDisplay를 무시하고 2차시를 쓴다', () => {
    const detail = resolvePaymentOrderCalculationBasisDetailForRow(
      {
        kind: 'lecture_fee',
        itemLabel: '강사비',
        amount: 170000,
        lineId: 'lecture-gemini-185986',
        lectureSessionDisplay: '14:30 ~ 16:30',
        basisDetail: {
          layout: 'lectureFeeGemini',
          categoryLabel: '제미나이 강사비',
          lectureTimeDisplay: '2차시',
          feeAssessmentWon: 170000,
        },
      },
      { lectureFeeStandardTitle: '제미나이 강사비', remoteData: true }
    )
    expect(detail?.layout).toBe('lectureFeeGemini')
    if (detail?.layout !== 'lectureFeeGemini') return
    expect(detail.categoryLabel).toBe('제미나이 강사비')
    expect(detail.feeAssessmentWon).toBe(170000)
    expect(detail.lectureTimeDisplay).toBe('2차시')
  })

  it('row.basisDetail 없어도 강의비·원천징수 등은 산정 기준 상세를 만든다 (교통비는 서버 basis만)', () => {
    const kinds = [
      { kind: 'lecture_fee', itemLabel: '강의비', amount: 200000 },
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
      if (row.kind === 'lecture_fee' && detail && 'lectureTimeDisplay' in detail) {
        expect(detail.lectureTimeDisplay).toBe('-')
      }
    }

    const travelWithoutBasis = resolvePaymentOrderCalculationBasisDetailForRow({
      kind: 'travel',
      itemLabel: '교통비',
      amount: 0,
      lineId: 'travel-empty',
      lectureSessionDisplay: '1 ~ 2차시',
    })
    expect(travelWithoutBasis).toBeUndefined()
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

  it('remote display snapshot은 강의비 fallback보다 우선한다', () => {
    const detail = resolvePaymentOrderCalculationBasisDetailForRow(
      {
        kind: 'lecture_fee',
        itemLabel: '강의비',
        amount: 31500,
        lineId: 'lecture-remote-1',
        lectureSessionDisplay: '1차시',
        basisDetail: {
          layout: 'remote',
          title: '강의비 산출 내역',
          lineLabels: ['회차', '단가'],
          formulaLines: ['회차별 산출'],
          summaryLabels: ['금액'],
          resultAmount: 31500,
        },
      },
      { lectureFeeStandardTitle: '2급 강사비' }
    )

    expect(detail?.layout).toBe('remote')
  })

  it('원격 응답에 basisDetail이 없으면 mock 기준을 만들지 않는다', () => {
    const detail = resolvePaymentOrderCalculationBasisDetailForRow(
      {
        kind: 'meal',
        itemLabel: '식사비',
        amount: 30000,
        lineId: 'meal-remote-empty',
        lectureSessionDisplay: '1차시',
      },
      { remoteData: true }
    )

    expect(detail).toBeUndefined()
  })

  it('DISTANCE_SNAPSHOT_UNLINKED_NOTICE is the F3-2 copy', () => {
    expect(DISTANCE_SNAPSHOT_UNLINKED_NOTICE).toBe('거리 스냅샷 미연결 — 산출 금액만 표시')
  })
})
