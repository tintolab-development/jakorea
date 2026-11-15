import {
  PaymentStatementBasicInfoDetailForm,
  type PaymentStatementBasicInfoAutofillValues,
  type PaymentStatementBasicInfoIssuanceLayout,
} from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'
import type { PaymentStatementIssuanceParagraphDisplayMode } from '@/features/template/ui/form-set/payment-statement-issuance/display-mode'

interface BasicInfoParagraphProps {
  values?: Partial<PaymentStatementBasicInfoAutofillValues>
  displayMode?: PaymentStatementIssuanceParagraphDisplayMode
  onlyPaymentPurposeLocked?: boolean
  lockedProfileFields?: boolean
  hideResidentFields?: boolean
  /** 영수증 정산 신청서 — 주민등록번호 행만 숨김(소속은 유지) */
  hideResidentNumberRow?: boolean
  onValuesChange?: (values: PaymentStatementBasicInfoAutofillValues) => void
  /** 발급 양식 편집기(지급조서·정산 신청서) — 템플릿 관리 화면 시안 레이아웃 */
  issuanceLayout?: PaymentStatementBasicInfoIssuanceLayout
}

export function BasicInfoParagraph({
  values,
  displayMode = 'editor',
  onlyPaymentPurposeLocked,
  lockedProfileFields,
  hideResidentFields,
  hideResidentNumberRow,
  onValuesChange,
  issuanceLayout,
}: BasicInfoParagraphProps) {
  return (
    <div className="form-editor-body payment-statement-basic-info-detail-form-host">
      <PaymentStatementBasicInfoDetailForm
        values={values}
        displayMode={displayMode}
        onlyPaymentPurposeLocked={onlyPaymentPurposeLocked}
        lockedProfileFields={lockedProfileFields}
        hideResidentFields={hideResidentFields}
        hideResidentNumberRow={hideResidentNumberRow}
        onValuesChange={onValuesChange}
        issuanceLayout={issuanceLayout}
      />
    </div>
  )
}
