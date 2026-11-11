/**
 * Portal 정산 신청서 문서 미리보기 — OpenAPI SettlementApplicationDocumentResponse
 * (제출 revision 스냅샷. 프로필/사전동의 현재값 아님)
 */

export type SettlementApplicationDocumentType = 'RECEIPT_SETTLEMENT' | 'PAYMENT_STATEMENT'

export type SettlementApplicationDocumentBasicInfo = {
  name: string | null
  englishName: string | null
  residentNumberMasked: string | null
  affiliation: string | null
  homeAddress: string | null
  homeAddressDetail: string | null
  bank: string | null
  accountNumberMasked: string | null
  accountHolder: string | null
  paymentPurpose: string | null
}

/** OpenAPI `SettlementApplicationDocumentCalcInfo.instructorFeeCalculationUnit` */
export type SettlementApplicationDocumentInstructorFeeCalculationUnit =
  | 'PER_HOUR'
  | 'PER_CLASS'
  | 'PER_SESSION'
  | 'PER_LECTURE'

/**
 * OpenAPI `SettlementApplicationDocumentCalcInfo` — 지급조서(PAYMENT_STATEMENT)만, 영수증은 calcInfo = null.
 * 제출 스냅샷 값. 구 스냅샷은 필드를 생략할 수 있으므로 모든 필드는 optional·nullable이며
 * 누락(undefined)과 null을 동일하게 "값 없음"으로 다룬다. 현재 프로필·일정·정책으로 채우지 않는다.
 */
export type SettlementApplicationDocumentCalcInfo = {
  lectureFeeType?: string | null
  instructorFeeCalculationUnit?: SettlementApplicationDocumentInstructorFeeCalculationUnit | null
  /** 책정 단가(원). 총액 아님 */
  instructorFeeAmount?: number | null
  businessIncomeYn?: boolean | null
  /** 교육 회차 번호(sessionNo). 인정 차시 아님 — 「교육 진행 차시」 표시에 쓰지 않는다 */
  educationSessionCount?: number | null
  /** 강사비 산정에 적용된 인정 차시 — 「교육 진행 차시」 표시 기준 */
  recognizedSessionCount?: number | null
  /** ISO-8601 instant (snapshot program_schedule.start_at). 표시는 Asia/Seoul HH:mm */
  educationStartAt?: string | null
  /** ISO-8601 instant (snapshot program_schedule.end_at). 표시는 Asia/Seoul HH:mm */
  educationEndAt?: string | null
  actualTrainingMinutes?: number | null
  totalStudentCount?: number | null
  totalLectureFee?: number | null
  /**
   * 1사1교 장거리 강사비 단가 적용 여부(제출 스냅샷, BE K11). 제출 전 lectureFeePreview.longDistance와 같다.
   * 제미나이·영수증·배포 전 제출 건은 null. null을 false로 바꾸거나 거리로 다시 판정하지 않는다.
   */
  longDistance?: boolean | null
  oneWayDistanceKm?: number | null
  fuelCostWon?: number | null
  tollFeeWon?: number | null
  calculatedTransportAmount?: number | null
}

export type SettlementApplicationDocumentLineDirection = 'PAYMENT' | 'DEDUCTION'

export type SettlementApplicationDocumentLine = {
  institutionName: string | null
  educationDate: string | null
  sessionLabel: string | null
  direction: SettlementApplicationDocumentLineDirection
  category: string | null
  description: string | null
  amount: number
}

export type SettlementApplicationDocumentTotal = {
  amount: number
  formulaLabel: string | null
}

export type SettlementApplicationDocumentAttachment = {
  submissionFileId?: number
  questionKey?: string
  fileObjectId?: number
  originalFileName?: string
  contentType?: string
  fileSize?: number
  downloadPolicyPath?: string
}

export type SettlementApplicationDocumentResponse = {
  documentType: SettlementApplicationDocumentType
  title: string
  revisionNo: number
  submittedAt: string | null
  status: string
  basicInfo: SettlementApplicationDocumentBasicInfo
  calcInfo: SettlementApplicationDocumentCalcInfo | null
  lines: SettlementApplicationDocumentLine[]
  total: SettlementApplicationDocumentTotal
  attachments: SettlementApplicationDocumentAttachment[]
}

export type SettlementApplicationDocumentKind = 'individual' | 'instructor'
