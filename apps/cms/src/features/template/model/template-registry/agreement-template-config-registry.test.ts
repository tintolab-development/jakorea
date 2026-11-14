import { describe, expect, it } from 'vitest'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'
import { RECEIPT_PRE_CONSENT_IDS } from '@/features/template/model/receipt-pre-consent-draft'
import {
  resolveAgreementWritingFormConfig,
  stripAgreementWritingFormStructureLocks,
} from './agreement-template-config-registry'

describe('사전 동의서 — 템플릿 관리 작성 화면 배치(시안 5767:42072·16046:109928)', () => {
  it.each([
    ['agreement-third-party', PAYMENT_STATEMENT_PRE_CONSENT_IDS],
    ['agreement-receipt-pre-consent', RECEIPT_PRE_CONSENT_IDS],
  ] as const)('%s 카탈로그 원본(회원 대리 동의)은 대리 확인 카드를 유지한다', (code, ids) => {
    const config = resolveAgreementWritingFormConfig(code)
    expect(config?.paragraphBodyOptions?.agreementAdminProxyConfirm).toBe(true)
    expect(config?.paragraphBodyOptions?.paymentPreConsentSheetLayout).toBeUndefined()
    expect(config?.paragraphBodyOptions?.hiddenParagraphIds?.has(ids.midDate)).toBe(true)
  })

  it.each([
    ['agreement-third-party', PAYMENT_STATEMENT_PRE_CONSENT_IDS],
    ['agreement-receipt-pre-consent', RECEIPT_PRE_CONSENT_IDS],
  ] as const)('%s 템플릿 관리는 날짜·서명·귀하 카드를 따로 보이고 목록에서만 뺀다', (code, ids) => {
    const catalog = resolveAgreementWritingFormConfig(code)
    expect(catalog).not.toBeNull()
    const config = stripAgreementWritingFormStructureLocks(catalog!)
    const options = config.paragraphBodyOptions
    expect(options?.paymentPreConsentSheetLayout).toBe(true)
    expect(options?.agreementAdminProxyConfirm).toBeUndefined()
    expect(options?.hiddenParagraphIds).toBeUndefined()
    expect(config.navHiddenParagraphIds?.has(ids.midDate)).toBe(true)
    expect(config.navHiddenParagraphIds?.has(ids.closingRecipient)).toBe(true)
    expect(config.agreementClosingFooter?.showRecipient).toBe(false)
    expect(config.templateManagement).toBeUndefined()
    // 지급 목적 고정 등 기존 본문 옵션은 그대로
    expect(options?.paymentStatementBasicInfoOnlyPaymentPurposeLocked).toBe(true)
  })

  it('다른 시스템 동의 양식은 템플릿 관리에서도 기존 대리 확인 카드 옵션을 유지한다', () => {
    const config = stripAgreementWritingFormStructureLocks(
      resolveAgreementWritingFormConfig('agreement-portrait')!
    )
    expect(config.paragraphBodyOptions?.agreementAdminProxyConfirm).toBe(true)
    expect(config.paragraphBodyOptions?.paymentPreConsentSheetLayout).toBeUndefined()
    expect(config.navHiddenParagraphIds).toBeUndefined()
  })
})
