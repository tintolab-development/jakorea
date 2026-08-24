/**
 * 산출 내역서 — 산정 기준 상세 모달 payload (read-only viewer SSOT)
 */

export interface PaymentOrderCalculationBasisDetailLectureFeeTier {
  layout: 'lectureFeeTier'
  tier: '1' | '2' | '3'
  categoryLabel: string
  feeAssessmentWon: number
  lectureTimeDisplay: string
  totalWon: number
}

export interface PaymentOrderCalculationBasisDetailTransportPublicTransit {
  modeLabel: string
  amountWon: number
  receiptFileName?: string
  receiptUrl?: string
}

export interface PaymentOrderCalculationBasisDetailTransportTripLeg {
  categoryLabel: string
  publicTransit: PaymentOrderCalculationBasisDetailTransportPublicTransit
}

/** 학생 왕복 */
export interface PaymentOrderCalculationBasisDetailTransportRoundTrip {
  layout: 'transportRoundTrip'
  outbound: PaymentOrderCalculationBasisDetailTransportTripLeg
  inbound: PaymentOrderCalculationBasisDetailTransportTripLeg
  totalWon: number
}

/** 학생 편도 */
export interface PaymentOrderCalculationBasisDetailTransportOneWay {
  layout: 'transportOneWay'
  trip: PaymentOrderCalculationBasisDetailTransportTripLeg
}

/** 강사 교통비(1사1교) */
export interface PaymentOrderCalculationBasisDetailTransportInstructor {
  layout: 'transportInstructor'
  categoryLabel: string
  distanceKm: number
  fuelCostWon: number
  tollFeeWon: number
  totalWon: number
}

export type PaymentOrderCalculationBasisDetail =
  | PaymentOrderCalculationBasisDetailLectureFeeTier
  | PaymentOrderCalculationBasisDetailTransportRoundTrip
  | PaymentOrderCalculationBasisDetailTransportOneWay
  | PaymentOrderCalculationBasisDetailTransportInstructor

const LECTURE_FEE_TIER_TITLE_MAP: Record<string, PaymentOrderCalculationBasisDetailLectureFeeTier['tier']> =
  {
    '1급 강사비': '1',
    '2급 강사비': '2',
    '3급 강사비': '3',
  }

const DEFAULT_PARTICIPANT_TRANSIT: PaymentOrderCalculationBasisDetailTransportPublicTransit = {
  modeLabel: '기차(KTX·SRT·무궁화호 등)',
  amountWon: 25000,
  receiptFileName: '대중교통 이용 영수증.pdf',
}

function defaultParticipantTripLeg(): PaymentOrderCalculationBasisDetailTransportTripLeg {
  return {
    categoryLabel: '참여자 교통비',
    publicTransit: { ...DEFAULT_PARTICIPANT_TRANSIT },
  }
}

export function resolveBasisDetailModalTitle(detail: PaymentOrderCalculationBasisDetail): string {
  switch (detail.layout) {
    case 'lectureFeeTier':
      return '강사비 산정 기준 상세'
    case 'transportRoundTrip':
    case 'transportOneWay':
    case 'transportInstructor':
      return '교통비 산정 기준 상세'
    default:
      return '산정 기준 상세'
  }
}

export function isSupportedBasisDetailLayout(
  detail: PaymentOrderCalculationBasisDetail | undefined
): detail is PaymentOrderCalculationBasisDetail {
  if (!detail) return false
  return (
    detail.layout === 'lectureFeeTier' ||
    detail.layout === 'transportRoundTrip' ||
    detail.layout === 'transportOneWay' ||
    detail.layout === 'transportInstructor'
  )
}

export function resolveTravelBasisDetailTotalWon(
  detail: Extract<
    PaymentOrderCalculationBasisDetail,
    { layout: 'transportRoundTrip' | 'transportOneWay' | 'transportInstructor' }
  >
): number {
  switch (detail.layout) {
    case 'transportRoundTrip':
      return detail.totalWon
    case 'transportOneWay':
      return detail.trip.publicTransit.amountWon
    case 'transportInstructor':
      return detail.totalWon
    default:
      return 0
  }
}

/** mock·데모 — seed로 학생 왕복 / 학생 편도 / 강사(1사1교) 순환 */
export function buildTravelBasisDetail(
  seed: number
):
  | PaymentOrderCalculationBasisDetailTransportRoundTrip
  | PaymentOrderCalculationBasisDetailTransportOneWay
  | PaymentOrderCalculationBasisDetailTransportInstructor {
  const variant = seed % 3

  if (variant === 0) {
    const leg = defaultParticipantTripLeg()
    return {
      layout: 'transportRoundTrip',
      outbound: leg,
      inbound: {
        categoryLabel: leg.categoryLabel,
        publicTransit: { ...leg.publicTransit },
      },
      totalWon: leg.publicTransit.amountWon * 2,
    }
  }

  if (variant === 1) {
    return {
      layout: 'transportOneWay',
      trip: defaultParticipantTripLeg(),
    }
  }

  return {
    layout: 'transportInstructor',
    categoryLabel: '교통비(1사1교)',
    distanceKm: 36,
    fuelCostWon: 50000,
    tollFeeWon: 1000,
    totalWon: 51000,
  }
}

export function buildLectureFeeTierBasisDetail(
  lectureFeeStandardTitle: string,
  lectureFee: number,
  sessionStart: number
): PaymentOrderCalculationBasisDetailLectureFeeTier | undefined {
  const tier = LECTURE_FEE_TIER_TITLE_MAP[lectureFeeStandardTitle]
  if (!tier) return undefined

  return {
    layout: 'lectureFeeTier',
    tier,
    categoryLabel: lectureFeeStandardTitle,
    feeAssessmentWon: lectureFee,
    lectureTimeDisplay: `${sessionStart}차시`,
    totalWon: lectureFee,
  }
}

export function lectureFeeLineDescriptionFromStandardTitle(lectureFeeStandardTitle: string): string {
  if (lectureFeeStandardTitle === '특강 강사비') {
    return '프로그램 1회 강의비 (특강 강사)'
  }
  const tier = LECTURE_FEE_TIER_TITLE_MAP[lectureFeeStandardTitle]
  if (tier) {
    return `프로그램 1회 강의비 (${tier}급 강사)`
  }
  const short = lectureFeeStandardTitle.replace(/ 강사비$/, '')
  return `프로그램 1회 강의비 (${short})`
}
