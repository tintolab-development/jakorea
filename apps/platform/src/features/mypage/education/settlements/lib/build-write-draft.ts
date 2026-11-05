import type { InstructorTransportPreview } from './instructor-transport-preview.ts'
import type { SettlementDocumentKind } from './settlement-status-ui.ts'
import { createSettlementIdempotencyKey } from './seoul-deadline.ts'
import { emptySettlementTripLeg } from './empty-trip-leg.ts'
import type {
  SettlementAmountItemDraft,
  SettlementReceiptAttachment,
  SettlementWriteDraft,
} from '../model/write-draft.ts'

type BuildSettlementWriteDraftInput = {
  applicationId: string
  sessionId: string
  scheduleId?: number
  assignmentId?: number
  isInstructor: boolean
  documentKind?: SettlementDocumentKind
  programTitle?: string
  settlementApplicationId?: number
  currentRevisionNo?: number
  resubmit?: boolean
  idempotencyKey?: string
  expenseDate?: string
  enabledItemTypes?: string[]
  name: string
  nameEn?: string
  residentFront?: string
  residentBack?: string
  homeAddress: string
  homeAddressDetail: string
  bank: string
  accountNumber: string
  accountHolder: string
  transportItemType?: string
  transportItemName?: string
  transportEvidenceRequired?: boolean
  transportAutoPreview?: InstructorTransportPreview | null
  tripType: SettlementWriteDraft['transport']['tripType']
  departTransit: string
  departAmount: string
  departFiles?: string[]
  departAttachments?: SettlementReceiptAttachment[]
  returnTransit: string
  returnAmount: string
  returnFiles?: string[]
  returnAttachments?: SettlementReceiptAttachment[]
  extraItems?: SettlementAmountItemDraft[]
  mealAmount: string
  mealFiles: string[]
  activityAmount: string
  activityFiles: string[]
}

export function buildSettlementWriteDraft(
  input: BuildSettlementWriteDraftInput
): SettlementWriteDraft {
  const documentKind = input.documentKind ?? (input.isInstructor ? 'payment_statement' : 'receipt')
  return {
    meta: {
      applicationId: input.applicationId,
      sessionId: input.sessionId,
      scheduleId: input.scheduleId,
      assignmentId: input.assignmentId,
      isInstructor: input.isInstructor,
      documentKind,
      programTitle: input.programTitle,
      settlementApplicationId: input.settlementApplicationId,
      currentRevisionNo: input.currentRevisionNo,
      resubmit: input.resubmit,
      idempotencyKey: input.idempotencyKey?.trim() || createSettlementIdempotencyKey(),
      expenseDate: input.expenseDate,
    },
    basic: {
      name: input.name,
      nameEn: input.nameEn?.trim() ?? '',
      residentFront: input.residentFront?.trim() ?? '',
      residentBack: input.residentBack?.trim() ?? '',
      homeAddress: input.homeAddress,
      homeAddressDetail: input.homeAddressDetail,
      bank: input.bank,
      accountNumber: input.accountNumber,
      accountHolder: input.accountHolder,
    },
    enabledItemTypes: input.enabledItemTypes ?? [],
    transport: {
      itemType: input.transportItemType,
      itemName: input.transportItemName,
      evidenceRequired: input.transportEvidenceRequired,
      autoPreview: input.transportAutoPreview ?? null,
      tripType: input.tripType,
      depart: {
        transit: input.departTransit,
        amount: input.departAmount,
        fileNames: input.departFiles ?? [],
        attachments: input.departAttachments ?? [],
      },
      return: {
        transit: input.returnTransit,
        amount: input.returnAmount,
        fileNames: input.returnFiles ?? [],
        attachments: input.returnAttachments ?? [],
      },
    },
    extraItems: input.extraItems ?? [],
    meal: {
      amount: input.mealAmount,
      fileNames: input.mealFiles,
    },
    activity: {
      amount: input.activityAmount,
      fileNames: input.activityFiles,
    },
  }
}

export function hydrateSettlementWriteFormState(draft: SettlementWriteDraft) {
  return {
    name: draft.basic.name,
    nameEn: draft.basic.nameEn ?? '',
    residentFront: draft.basic.residentFront,
    residentBack: draft.basic.residentBack,
    homeAddress: draft.basic.homeAddress,
    homeAddressDetail: draft.basic.homeAddressDetail,
    bank: draft.basic.bank,
    accountNumber: draft.basic.accountNumber,
    accountHolder: draft.basic.accountHolder,
    tripType: draft.transport.tripType,
    departTransit: draft.transport.depart.transit,
    departAmount: draft.transport.depart.amount,
    departFiles: draft.transport.depart.fileNames,
    departAttachments: draft.transport.depart.attachments,
    returnTransit: draft.transport.return.transit,
    returnAmount: draft.transport.return.amount,
    returnFiles: draft.transport.return.fileNames,
    returnAttachments: draft.transport.return.attachments,
    extraItems: draft.extraItems,
    mealAmount: draft.meal.amount,
    mealFiles: draft.meal.fileNames,
    activityAmount: draft.activity.amount,
    activityFiles: draft.activity.fileNames,
    idempotencyKey: draft.meta.idempotencyKey,
  }
}

export function createEmptyAmountItemDraft(item: {
  itemType: string
  itemName: string
  evidenceRequired?: boolean | null
}): SettlementAmountItemDraft {
  return {
    itemType: item.itemType,
    itemName: item.itemName,
    evidenceRequired: item.evidenceRequired === true,
    amount: '',
    attachments: [],
  }
}

export { emptySettlementTripLeg }
