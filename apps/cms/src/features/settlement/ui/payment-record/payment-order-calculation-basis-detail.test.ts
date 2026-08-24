import { describe, expect, it } from 'vitest'
import {
  buildLectureFeeTierBasisDetail,
  buildTravelBasisDetail,
  isSupportedBasisDetailLayout,
  lectureFeeLineDescriptionFromStandardTitle,
  resolveBasisDetailModalTitle,
  resolveTravelBasisDetailTotalWon,
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

  it('buildLectureFeeTierBasisDetail returns undefined for unsupported titles', () => {
    expect(buildLectureFeeTierBasisDetail('특강 강사비', 915000, 1)).toBeUndefined()
  })

  it('resolveBasisDetailModalTitle returns lecture fee title', () => {
    const detail = buildLectureFeeTierBasisDetail('1급 강사비', 500000, 2)!
    expect(resolveBasisDetailModalTitle(detail)).toBe('강사비 산정 기준 상세')
  })

  it('isSupportedBasisDetailLayout accepts lecture and transport layouts', () => {
    const lecture = buildLectureFeeTierBasisDetail('3급 강사비', 300000, 3)!
    expect(isSupportedBasisDetailLayout(lecture)).toBe(true)
    expect(isSupportedBasisDetailLayout(buildTravelBasisDetail(0))).toBe(true)
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

  it('lectureFeeLineDescriptionFromStandardTitle formats tier descriptions', () => {
    expect(lectureFeeLineDescriptionFromStandardTitle('1급 강사비')).toBe(
      '프로그램 1회 강의비 (1급 강사)'
    )
    expect(lectureFeeLineDescriptionFromStandardTitle('특강 강사비')).toBe(
      '프로그램 1회 강의비 (특강 강사)'
    )
  })
})
