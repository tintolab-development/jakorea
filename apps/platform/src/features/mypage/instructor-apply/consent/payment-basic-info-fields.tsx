import {
  PFCheckbox,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormHomeAddressFields,
  PFFormInlineSeparatedFields,
  PFFormResidentNumberInput,
  PFTextInput,
} from '@/shared/ui'
import formStyles from '@/shared/ui/pf-form/pf-form.module.css'
import styles from './consent-form.module.css'
import {
  mergePaymentStatementBasicInfo,
  mergeReceiptPreConsentBasicInfo,
  PAYMENT_STATEMENT_DEFAULT_PURPOSE,
  RECEIPT_PRE_CONSENT_DEFAULT_PURPOSE,
  toReceiptPreConsentFilledBasicInfo,
  type PaymentStatementBasicInfoValues,
} from '@jakorea/form-schema/consent'

export type PaymentBasicInfoFieldsProps = {
  values: Partial<PaymentStatementBasicInfoValues>
  onChange: (next: Partial<PaymentStatementBasicInfoValues>) => void
  variant?: 'payment' | 'receipt'
}

export function PaymentBasicInfoFields({
  values,
  onChange,
  variant = 'payment',
}: PaymentBasicInfoFieldsProps) {
  const isReceipt = variant === 'receipt'
  const merged = isReceipt
    ? {
        ...mergePaymentStatementBasicInfo({
          ...values,
          paymentPurpose: RECEIPT_PRE_CONSENT_DEFAULT_PURPOSE,
          residentFront: '',
          residentBack: '',
          affiliation: '',
          noAffiliation: true,
        }),
        ...mergeReceiptPreConsentBasicInfo(values),
        paymentPurpose: RECEIPT_PRE_CONSENT_DEFAULT_PURPOSE,
      }
    : mergePaymentStatementBasicInfo(values)
  const paymentPurpose = merged.paymentPurpose

  const patch = <K extends keyof PaymentStatementBasicInfoValues>(
    key: K,
    value: PaymentStatementBasicInfoValues[K]
  ) => {
    const next = { ...merged, [key]: value }
    onChange(isReceipt ? toReceiptPreConsentFilledBasicInfo(next) : next)
  }

  return (
    <PFFormFieldTable className={styles.paymentBasicInfo}>
      <PFFormFieldRow type="double">
        <PFFormField label="성명" className={styles.paymentFixedField}>
          <PFTextInput
            variant="formPage"
            size="large"
            className={styles.paymentInputW200}
            placeholder="한글 성명"
            value={merged.nameKo}
            onValueChange={value => patch('nameKo', value)}
          />
        </PFFormField>
        <PFFormField label="영문 성명" className={styles.paymentFixedField}>
          <PFTextInput
            variant="formPage"
            size="large"
            className={styles.paymentInputW240}
            placeholder="영문 성명"
            value={merged.nameEn}
            onValueChange={value => patch('nameEn', value)}
          />
        </PFFormField>
      </PFFormFieldRow>
      {isReceipt ? null : (
      <PFFormFieldRow type="double">
        <PFFormField
          label="주민등록번호"
          className={`${styles.paymentFixedField} ${styles.paymentInputW200}`}
        >
          <PFFormResidentNumberInput
            fillRow
            frontValue={merged.residentFront}
            backValue={merged.residentBack}
            onFrontChange={value => patch('residentFront', value)}
            onBackChange={value => patch('residentBack', value)}
          />
        </PFFormField>
        <PFFormField label="소속" className={styles.paymentFixedField}>
          <PFFormInlineSeparatedFields className={formStyles.inlineRowFill}>
            <PFTextInput
              variant="formPage"
              size="large"
              className={styles.paymentInputW240}
              placeholder="소속 기관명"
              disabled={merged.noAffiliation}
              value={merged.noAffiliation ? '' : merged.affiliation}
              onValueChange={value => patch('affiliation', value)}
            />
            <PFCheckbox
              checked={merged.noAffiliation}
              onCheckedChange={checked =>
                onChange({
                  ...merged,
                  noAffiliation: checked,
                  affiliation: checked ? '' : merged.affiliation,
                })
              }
            >
              소속 없음
            </PFCheckbox>
          </PFFormInlineSeparatedFields>
        </PFFormField>
      </PFFormFieldRow>
      )}
      <PFFormFieldRow type="single">
        <PFFormField
          label={isReceipt ? '지역/주소' : '자택 주소'}
          className={`${styles.paymentFixedField} ${styles.paymentInputW240}`}
        >
          <PFFormHomeAddressFields
            fillRow
            roadValue={merged.addressRoad}
            detailValue={merged.addressDetail}
            onRoadChange={value => patch('addressRoad', value)}
            onDetailChange={value => patch('addressDetail', value)}
          />
        </PFFormField>
      </PFFormFieldRow>
      <PFFormFieldRow type="single">
        <PFFormField label="정산 계좌 정보" className={styles.paymentFixedField}>
          <PFFormInlineSeparatedFields className={formStyles.inlineRowFill}>
            <PFTextInput
              variant="formPage"
              size="large"
              className={styles.paymentInputW160}
              placeholder="은행명"
              value={merged.bankName}
              onValueChange={value => patch('bankName', value)}
            />
            <PFTextInput
              variant="formPage"
              size="large"
              inputMode="numeric"
              className={styles.paymentInputW240}
              placeholder="계좌번호(숫자만)"
              value={merged.accountNumber}
              onValueChange={value => patch('accountNumber', value.replace(/\D/g, ''))}
            />
            <PFTextInput
              variant="formPage"
              size="large"
              className={styles.paymentInputW160}
              placeholder="예금주명"
              value={merged.accountHolder}
              onValueChange={value => patch('accountHolder', value)}
            />
          </PFFormInlineSeparatedFields>
        </PFFormField>
      </PFFormFieldRow>
      <PFFormFieldRow type="single">
        <PFFormField label="지급 목적">
          <PFTextInput
            variant="formPage"
            size="large"
            disabled
            placeholder={
              isReceipt ? RECEIPT_PRE_CONSENT_DEFAULT_PURPOSE : PAYMENT_STATEMENT_DEFAULT_PURPOSE
            }
            value={paymentPurpose}
          />
        </PFFormField>
      </PFFormFieldRow>
    </PFFormFieldTable>
  )
}

export function resolvePaymentConsentSignerName(
  paymentBasicInfo: Partial<PaymentStatementBasicInfoValues> | undefined,
  lockedName: string
): string {
  return lockedName || paymentBasicInfo?.nameKo?.trim() || ''
}
