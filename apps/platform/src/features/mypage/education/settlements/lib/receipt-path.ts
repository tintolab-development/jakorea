import { buildSettlementConfirmPath, buildSettlementWritePath, type SettlementArea } from './write-path.ts'

export function isReceiptSubmitAudience(applicationType: string | null | undefined): boolean {
  const normalized = applicationType?.trim().toUpperCase()
  return normalized === 'INDIVIDUAL' || normalized === 'VOLUNTEER'
}

export function buildReceiptSubmitPath(options: {
  applicationId: string
  sessionId: string
  area?: SettlementArea
  applicationType?: string
}): string {
  return buildSettlementWritePath(options)
}

export function buildReceiptViewPath(options: {
  applicationId: string
  sessionId: string
  area?: SettlementArea
  applicationType?: string
  receiptId?: number
  settlementApplicationId?: number
}): string | null {
  if (options.settlementApplicationId == null && options.receiptId == null) return null
  return buildSettlementConfirmPath({
    applicationId: options.applicationId,
    sessionId: options.sessionId,
    area: options.area,
    applicationType: options.applicationType,
    mode: 'view',
  })
}
