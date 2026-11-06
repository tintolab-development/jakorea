import type { SettlementDocumentKind } from './settlement-status-ui'

export const RECEIPT_PRE_CONSENT_MODAL_TITLE = '영수증 사전 동의서를 작성해 주세요.'
export const RECEIPT_PRE_CONSENT_MODAL_DESCRIPTION = [
  '영수증을 제출하려면 영수증 사전 동의서가 필요해요.',
  '처음 한 번만 작성하면 10년간 유지되며,',
  '동의를 철회한 경우에는 다시 작성해야 해요.',
].join('\n')

export const PAYMENT_STATEMENT_PRE_CONSENT_MODAL_TITLE =
  '지급조서 사전 동의서를 작성해 주세요.'
export const PAYMENT_STATEMENT_PRE_CONSENT_MODAL_DESCRIPTION = [
  '지급조서를 제출하려면 지급조서 사전 동의서가 필요해요.',
  '처음 한 번만 작성하면 10년간 유지되며,',
  '동의를 철회한 경우에는 다시 작성해야 해요.',
].join('\n')

export function settlementPreConsentModalCopy(variant: SettlementDocumentKind = 'receipt'): {
  title: string
  description: string
} {
  if (variant === 'payment_statement') {
    return {
      title: PAYMENT_STATEMENT_PRE_CONSENT_MODAL_TITLE,
      description: PAYMENT_STATEMENT_PRE_CONSENT_MODAL_DESCRIPTION,
    }
  }
  return {
    title: RECEIPT_PRE_CONSENT_MODAL_TITLE,
    description: RECEIPT_PRE_CONSENT_MODAL_DESCRIPTION,
  }
}
