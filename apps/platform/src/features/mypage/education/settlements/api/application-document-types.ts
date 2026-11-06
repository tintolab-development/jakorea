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

export type SettlementApplicationDocumentCalcInfo = {
  lectureFeeType: string | null
  instructorFeeAmount: number | null
  businessIncomeYn: boolean | null
  educationSessionCount: number | null
  totalStudentCount: number | null
  totalLectureFee: number | null
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
