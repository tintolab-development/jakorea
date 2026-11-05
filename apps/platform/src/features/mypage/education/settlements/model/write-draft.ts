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
    tripType: SettlementTripType
    depart: SettlementTripLegDraft
    return: SettlementTripLegDraft
  }
  extraItems: SettlementAmountItemDraft[]
  meal: {
    amount: string
    fileNames: string[]
  }
  activity: {
    amount: string
    fileNames: string[]
  }
}

export type SettlementWriteDraftLocationState = {
  draft?: SettlementWriteDraft
}
