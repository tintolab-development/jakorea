import {
  formatResidentNumberForPreview,
  mergePaymentStatementBasicInfo,
  mergeReceiptPreConsentBasicInfo,
  type PaymentStatementBasicInfoValues,
} from '@jakorea/form-schema/consent'
import previewTypography from './consent-document-preview-typography.module.css'

function textOrDash(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  return trimmed || '-'
}

function displayAffiliation(value: string, noAffiliation: boolean): string {
  if (noAffiliation) return '소속 없음'
  return textOrDash(value)
}

function PaymentField({
  label,
  value,
  single = false,
}: {
  label: string
  value: string
  single?: boolean
}) {
  return (
    <div
      className={[
        previewTypography.paymentInfoField,
        single ? previewTypography.paymentInfoFieldSingle : undefined,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={previewTypography.paymentInfoLabel}>{label}</div>
      <div className={previewTypography.paymentInfoValue}>{value}</div>
    </div>
  )
}

/** CMS A4 `PaymentStatementBasicInfoDetailForm` document(view) 배치 */
export function ConsentPreviewPaymentInfo({
  values,
  variant = 'payment',
}: {
  values?: Partial<PaymentStatementBasicInfoValues>
  variant?: 'payment' | 'receipt'
}) {
  const isReceipt = variant === 'receipt'
  const receiptMerged = mergeReceiptPreConsentBasicInfo(values)
  const paymentMerged = mergePaymentStatementBasicInfo(values)
  const merged = isReceipt ? receiptMerged : paymentMerged
  const address = [merged.addressRoad, merged.addressDetail].filter(part => part.trim()).join(' ')
  const account = [textOrDash(merged.bankName), merged.accountNumber, merged.accountHolder]
    .filter(part => part && part !== '-')
    .join(' · ')

  return (
    <div className={previewTypography.paymentInfo}>
      <div className={previewTypography.paymentInfoRow}>
        <PaymentField label="성명" value={textOrDash(merged.nameKo)} />
        <PaymentField label="영문 성명" value={textOrDash(merged.nameEn)} />
      </div>
      {isReceipt ? null : (
        <div className={previewTypography.paymentInfoRow}>
          <PaymentField
            label="주민등록번호"
            value={textOrDash(
              formatResidentNumberForPreview(paymentMerged.residentFront, paymentMerged.residentBack),
            )}
          />
          <PaymentField
            label="소속"
            value={displayAffiliation(paymentMerged.affiliation, paymentMerged.noAffiliation)}
          />
        </div>
      )}
      <div className={previewTypography.paymentInfoRow}>
        <PaymentField
          label={isReceipt ? '지역/주소' : '자택 주소'}
          value={textOrDash(address)}
          single
        />
      </div>
      <div className={previewTypography.paymentInfoRow}>
        <PaymentField label="정산 계좌 정보" value={textOrDash(account)} single />
      </div>
      <div className={previewTypography.paymentInfoRow}>
        <PaymentField label="지급 목적" value={textOrDash(merged.paymentPurpose)} single />
      </div>
    </div>
  )
}
