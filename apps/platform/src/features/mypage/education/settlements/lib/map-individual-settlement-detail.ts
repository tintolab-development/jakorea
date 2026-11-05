import { emptySettlementTripLeg } from './empty-trip-leg.ts'
import { formatSettlementAmountInput } from './format-write-draft.ts'
import { isTransportPaymentItemType, receiptPaymentItemLabel } from './payment-items.ts'
import { createSettlementIdempotencyKey } from './seoul-deadline.ts'
import type {
  PortalIndividualSettlementDetail,
  PortalIndividualSettlementItemDetail,
} from '../../applications/api/activity-client.ts'
import type {
  SettlementAmountItemDraft,
  SettlementReceiptAttachment,
  SettlementWriteDraft,
} from '../model/write-draft.ts'

function latestRevision(detail: PortalIndividualSettlementDetail) {
  const revisions = detail.revisions ?? []
  if (revisions.length === 0) return undefined
  return revisions.slice().sort((a, b) => (b.revisionNo ?? 0) - (a.revisionNo ?? 0))[0]
}

function filesOf(item: PortalIndividualSettlementItemDetail): SettlementReceiptAttachment[] {
  return (item.expenses ?? []).flatMap(expense =>
    (expense.files ?? []).flatMap(file => {
      const fileObjectId = file.fileObjectId
      if (fileObjectId == null) return []
      return [
        {
          fileObjectId,
          fileName: file.fileName?.trim() || file.originalFileName?.trim() || `파일-${fileObjectId}`,
        },
      ]
    }),
  )
}

export function mapIndividualSettlementDetailToDraft(input: {
  detail: PortalIndividualSettlementDetail
  applicationId: string
  name: string
  homeAddress: string
  homeAddressDetail: string
  bank?: string
  accountNumber?: string
  accountHolder?: string
}): SettlementWriteDraft | null {
  const revision = latestRevision(input.detail)
  const items = revision?.items ?? []
  if (input.detail.settlementApplicationId == null && items.length === 0) return null

  const transportItem = items.find(item => isTransportPaymentItemType(item.itemType))
  const extraItems: SettlementAmountItemDraft[] = items
    .filter(item => !isTransportPaymentItemType(item.itemType) && item.itemType)
    .map(item => ({
      itemType: item.itemType!.trim().toUpperCase(),
      itemName: receiptPaymentItemLabel(item),
      evidenceRequired: item.evidenceRequired === true,
      amount: formatSettlementAmountInput(String(item.amount ?? '')),
      attachments: filesOf(item),
    }))

  const departExpense = transportItem?.expenses?.find(expense => expense.description?.includes('가는'))
  const returnExpense = transportItem?.expenses?.find(expense => expense.description?.includes('오는'))
  const departFiles = (departExpense?.files ?? transportItem?.expenses?.[0]?.files ?? []).flatMap(file => {
    if (file.fileObjectId == null) return []
    return [
      {
        fileObjectId: file.fileObjectId,
        fileName: file.fileName?.trim() || file.originalFileName?.trim() || `파일-${file.fileObjectId}`,
      },
    ]
  })
  const returnFiles = (returnExpense?.files ?? []).flatMap(file => {
    if (file.fileObjectId == null) return []
    return [
      {
        fileObjectId: file.fileObjectId,
        fileName: file.fileName?.trim() || file.originalFileName?.trim() || `파일-${file.fileObjectId}`,
      },
    ]
  })

  return {
    meta: {
      applicationId: input.applicationId,
      sessionId: input.detail.scheduleId != null ? String(input.detail.scheduleId) : '',
      scheduleId: input.detail.scheduleId,
      isInstructor: false,
      documentKind: 'receipt',
      settlementApplicationId: input.detail.settlementApplicationId,
      currentRevisionNo: input.detail.currentRevisionNo,
      idempotencyKey: createSettlementIdempotencyKey(),
    },
    basic: {
      name: input.name,
      nameEn: '',
      residentFront: '',
      residentBack: '',
      homeAddress: input.homeAddress,
      homeAddressDetail: input.homeAddressDetail,
      bank: input.bank ?? '',
      accountNumber: input.accountNumber ?? '',
      accountHolder: input.accountHolder ?? input.name,
    },
    enabledItemTypes: items.flatMap(item => (item.itemType ? [item.itemType.trim().toUpperCase()] : [])),
    transport: {
      itemType: transportItem?.itemType?.trim().toUpperCase(),
      itemName: transportItem ? receiptPaymentItemLabel(transportItem) : undefined,
      evidenceRequired: transportItem?.evidenceRequired,
      tripType: returnExpense ? 'round_trip' : 'one_way',
      depart: transportItem
        ? {
            transit: '',
            amount: formatSettlementAmountInput(String((departExpense ?? transportItem.expenses?.[0])?.amount ?? transportItem.amount ?? '')),
            fileNames: departFiles.map(file => file.fileName),
            attachments: departFiles,
          }
        : emptySettlementTripLeg(),
      return: returnExpense
        ? {
            transit: '',
            amount: formatSettlementAmountInput(String(returnExpense.amount ?? '')),
            fileNames: returnFiles.map(file => file.fileName),
            attachments: returnFiles,
          }
        : emptySettlementTripLeg(),
    },
    extraItems,
    meal: { amount: '', fileNames: [] },
    activity: { amount: '', fileNames: [] },
  }
}
