import { describe, expect, it } from 'vitest'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'
import { RECEIPT_PRE_CONSENT_IDS } from '@/features/template/model/receipt-pre-consent-draft'
import { AGREEMENT_NOTICE_PARAGRAPH_IDS } from '@/features/template/model/writing-form-draft.schema'
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
    expect(config?.paragraphBodyOptions?.agreementConfirmSheetLayout).toBeUndefined()
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
    expect(options?.agreementConfirmSheetLayout).toBe(true)
    expect(options?.agreementAdminProxyConfirm).toBeUndefined()
    expect(options?.hiddenParagraphIds).toBeUndefined()
    expect(config.navHiddenParagraphIds?.has(ids.midDate)).toBe(true)
    expect(config.navHiddenParagraphIds?.has(ids.closingRecipient)).toBe(true)
    expect(config.agreementClosingFooter?.showRecipient).toBe(false)
    expect(config.templateManagement).toBeUndefined()
    // 지급 목적 고정 등 기존 본문 옵션은 그대로
    expect(options?.paymentStatementBasicInfoOnlyPaymentPurposeLocked).toBe(true)
  })

  it.each([
    ['agreement-third-party', '강사비 및 교통비 등 실비 지급'],
    ['agreement-receipt-pre-consent', '교통비·식사비·활동비 등 실비 지급'],
  ] as const)(
    '%s 템플릿 관리 「지급 목적」은 시안 문구, 회원 작성은 업무 상수 그대로',
    (code, purpose) => {
      const catalog = resolveAgreementWritingFormConfig(code)!
      const config = stripAgreementWritingFormStructureLocks(catalog)
      expect(config.paragraphBodyOptions?.paymentStatementBasicInfoValues?.paymentPurpose).toBe(
        purpose
      )
      expect(
        catalog.paragraphBodyOptions?.paymentStatementBasicInfoValues?.paymentPurpose
      ).not.toBe(purpose)
    }
  )

  it('행정정보 공동이용 — 템플릿 관리는 확인 문구·날짜·서명을 따로 보이고, 목록은 「5. 대상자 본인」까지(시안 5767:41434)', () => {
    const catalog = resolveAgreementWritingFormConfig('agreement-notice')!
    expect(catalog.paragraphBodyOptions?.agreementAdminProxyConfirm).toBe(true)
    const config = stripAgreementWritingFormStructureLocks(catalog)
    expect(config.paragraphBodyOptions?.agreementConfirmSheetLayout).toBe(true)
    expect(config.paragraphBodyOptions?.agreementAdminProxyConfirm).toBeUndefined()
    expect(config.paragraphBodyOptions?.hiddenParagraphIds).toBeUndefined()
    for (const id of [
      AGREEMENT_NOTICE_PARAGRAPH_IDS.subjectNote,
      AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing,
      AGREEMENT_NOTICE_PARAGRAPH_IDS.systemDate,
      AGREEMENT_NOTICE_PARAGRAPH_IDS.systemSignature,
    ]) {
      expect(config.navHiddenParagraphIds?.has(id)).toBe(true)
    }
  })

  it('다른 시스템 동의 양식은 템플릿 관리에서도 기존 대리 확인 카드 옵션을 유지한다', () => {
    const config = stripAgreementWritingFormStructureLocks(
      resolveAgreementWritingFormConfig('agreement-portrait')!
    )
    expect(config.paragraphBodyOptions?.agreementAdminProxyConfirm).toBe(true)
    expect(config.paragraphBodyOptions?.agreementConfirmSheetLayout).toBeUndefined()
    expect(config.navHiddenParagraphIds).toBeUndefined()
  })
})
