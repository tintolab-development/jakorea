import type { SettlementTripLegDraft } from '../model/write-draft.ts'

export function emptySettlementTripLeg(): SettlementTripLegDraft {
  return {
    transit: '',
    amount: '',
    fileNames: [],
    attachments: [],
  }
}

export function readTripLegAttachments(leg: SettlementTripLegDraft): SettlementTripLegDraft['attachments'] {
  return leg.attachments ?? []
}

export function readTripLegFileNames(leg: SettlementTripLegDraft): string[] {
  if ((leg.attachments ?? []).length > 0) return leg.attachments.map(item => item.fileName)
  return leg.fileNames ?? []
}
