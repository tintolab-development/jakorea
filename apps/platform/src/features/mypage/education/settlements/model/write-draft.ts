import type { InstructorTransportPreview } from '../lib/instructor-transport-preview'
import type { SettlementDocumentKind } from '../lib/settlement-status-ui'

export type SettlementTripType = 'one_way' | 'round_trip'

export type SettlementReceiptAttachment = {
  fileObjectId: number
  fileName: string
}

export type SettlementTripLegDraft = {
  transit: string
  amount: string
  fileNames: string[]
  attachments: SettlementReceiptAttachment[]
}

export type SettlementAmountItemDraft = {
  itemType: string
  itemName: string
  evidenceRequired: boolean
  amount: string
  attachments: SettlementReceiptAttachment[]
}

export type SettlementWriteDraft = {
  meta: {
    applicationId: string
    sessionId: string
    scheduleId?: number
    /** 강사 배정 ID. 프로그램 신청 ID가 아님 */
    assignmentId?: number
    isInstructor: boolean
    documentKind: SettlementDocumentKind
    programTitle?: string
    settlementApplicationId?: number
    currentRevisionNo?: number
    resubmit?: boolean
    idempotencyKey: string
    expenseDate?: string
  }
  basic: {
    name: string
    nameEn: string
    residentFront: string
    residentBack: string
    homeAddress: string
    homeAddressDetail: string
    bank: string
    accountNumber: string
    accountHolder: string
  }
  enabledItemTypes: string[]
  transport: {
    itemType?: string
    itemName?: string
    evidenceRequired?: boolean
    autoPreview?: InstructorTransportPreview | null
    tripType: SettlementTripType
    depart: SettlementTripLegDraft
    return: SettlementTripLegDraft
  }
  extraItems: SettlementAmountItemDraft[]
  meal: {
    amount: string
    fileNames: string[]
    attachments: SettlementReceiptAttachment[]
  }
  activity: {
    amount: string
    fileNames: string[]
    attachments: SettlementReceiptAttachment[]
  }
  /**
   * 1사1교 숙박비(LODGING_1C1S) — 신청 1건당 고정액 1건, 금액·박 수 입력 없음, 영수증 필수(BE 2026-11-09).
   * 1사1교가 아니면 항상 미신청. 이전 세션 저장본에는 없을 수 있다.
   */
  companySchoolLodging?: {
    requested: boolean
    fileNames: string[]
    attachments: SettlementReceiptAttachment[]
  }
}

export type SettlementWriteDraftLocationState = {
  draft?: SettlementWriteDraft
}
