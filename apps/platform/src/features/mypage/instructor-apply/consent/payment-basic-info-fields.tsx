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
  overlayPaymentStatementProfileLinkedValues,
  PAYMENT_STATEMENT_DEFAULT_PURPOSE,
  RECEIPT_PRE_CONSENT_DEFAULT_PURPOSE,
  type PaymentStatementBasicInfoValues,
  type PaymentStatementProfileLinkedValues,
} from '@jakorea/form-schema/consent'
import {
  overlayReceiptLockedMemberValues,
  type ReceiptLockedMemberFields,
} from './overlay-receipt-locked-member'

export type { ReceiptLockedMemberFields }
export { overlayReceiptLockedMemberValues }

export type PaymentBasicInfoFieldsProps = {
  values: Partial<PaymentStatementBasicInfoValues>
  onChange: (next: Partial<PaymentStatementBasicInfoValues>) => void
  variant?: 'payment' | 'receipt'
  /** 강사 신청 기본정보 연동 — 성명·소속·자택 주소 비활성 */
  lockProfileFields?: boolean
  profileValues?: PaymentStatementProfileLinkedValues | null
  /** 영수증 — 회원정보 성명(항상) · 개인 회원 자택 주소 비활성 */
  receiptLockedMember?: ReceiptLockedMemberFields | null
  /** 영수증 — 회원정보 소속(표시 전용, 제출 payload 미포함) */
  receiptAffiliationDisplay?: string
}

export function PaymentBasicInfoFields({
  values,
  onChange,
  variant = 'payment',
  lockProfileFields = false,
  profileValues,
  receiptLockedMember,
  receiptAffiliationDisplay,
}: PaymentBasicInfoFieldsProps) {
  const isReceipt = variant === 'receipt'
  const linked = isReceipt
    ? mergePaymentStatementBasicInfo(
        overlayReceiptLockedMemberValues(values, receiptLockedMember)
      )
    : overlayPaymentStatementProfileLinkedValues(
        mergePaymentStatementBasicInfo(values),
        profileValues
      )
  const paymentPurpose = linked.paymentPurpose
  const profileLocked = lockProfileFields && !isReceipt
  const receiptNameLocked = isReceipt && receiptLockedMember != null
  const receiptAddressLocked = isReceipt && receiptLockedMember?.lockAddress === true
  /** 회원정보로 소속이 채워져 있으면(잠금·값 있음) 「소속 없음」은 숨긴다 */
  const affiliationPrefilled =
    profileLocked && !linked.noAffiliation && linked.affiliation.trim() !== ''

  const patch = <K extends keyof PaymentStatementBasicInfoValues>(
    key: K,
    value: PaymentStatementBasicInfoValues[K]
  ) => {
    if (
      (profileLocked &&
        (key === 'nameKo' ||
          key === 'affiliation' ||
          key === 'noAffiliation' ||
          key === 'addressRoad' ||
          key === 'addressDetail')) ||
      (receiptNameLocked && key === 'nameKo') ||
      (receiptAddressLocked && (key === 'addressRoad' || key === 'addressDetail'))
    ) {
      return
    }
    const next = overlayPaymentStatementProfileLinkedValues(
      { ...linked, [key]: value },
      profileLocked ? profileValues : null
    )
    onChange(
      isReceipt
        ? overlayReceiptLockedMemberValues(next, receiptLockedMember)
        : next
    )
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
            disabled={profileLocked || receiptNameLocked}
            value={linked.nameKo}
            onValueChange={value => patch('nameKo', value)}
          />
        </PFFormField>
        <PFFormField label="영문 성명" className={styles.paymentFixedField}>
          <PFTextInput
            variant="formPage"
            size="large"
            className={styles.paymentInputW240}
            placeholder="영문 성명"
            value={linked.nameEn}
            onValueChange={value => patch('nameEn', value)}
          />
        </PFFormField>
      </PFFormFieldRow>
      {isReceipt ? (
        <PFFormFieldRow type="single">
          {/* 시안: 영수증 지급조서 2행 `소속`(전체 폭, 읽기전용·회원정보). 영수증은 소속을 수집하지 않으므로 값은 저장하지 않음 */}
          <PFFormField label="소속" className={styles.paymentFixedField}>
            <PFTextInput
              variant="formPage"
              size="large"
              disabled
              placeholder="소속"
              value={receiptAffiliationDisplay ?? ''}
            />
          </PFFormField>
        </PFFormFieldRow>
      ) : (
      <PFFormFieldRow type="double">
        <PFFormField
          label="주민등록번호"
          className={`${styles.paymentFixedField} ${styles.paymentInputW200}`}
        >
          <PFFormResidentNumberInput
            fillRow
            frontValue={linked.residentFront}
            backValue={linked.residentBack}
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
              placeholder="소속"
              disabled={profileLocked || linked.noAffiliation}
              value={linked.noAffiliation ? '' : linked.affiliation}
              onValueChange={value => patch('affiliation', value)}
            />
            {affiliationPrefilled ? null : (
              <PFCheckbox
                disabled={profileLocked}
                checked={linked.noAffiliation}
                onCheckedChange={checked => {
                  if (profileLocked) return
                  onChange({
                    ...linked,
                    noAffiliation: checked,
                    affiliation: checked ? '' : linked.affiliation,
                  })
                }}
              >
                소속 없음
              </PFCheckbox>
            )}
          </PFFormInlineSeparatedFields>
        </PFFormField>
      </PFFormFieldRow>
      )}
      <PFFormFieldRow type="single">
        <PFFormField
          label="자택 주소"
          className={`${styles.paymentFixedField} ${styles.paymentInputW240}`}
        >
          <PFFormHomeAddressFields
            fillRow
            disabled={profileLocked || receiptAddressLocked}
            roadValue={linked.addressRoad}
            detailValue={linked.addressDetail}
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
              value={linked.bankName}
              onValueChange={value => patch('bankName', value)}
            />
            <PFTextInput
              variant="formPage"
              size="large"
              inputMode="numeric"
              className={styles.paymentInputW240}
              placeholder="계좌번호(숫자만)"
              value={linked.accountNumber}
              onValueChange={value => patch('accountNumber', value.replace(/\D/g, ''))}
            />
            <PFTextInput
              variant="formPage"
              size="large"
              className={styles.paymentInputW160}
              placeholder="예금주명"
              value={linked.accountHolder}
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
