import { useState } from 'react'
import { AddressSearchModal } from '@/features/auth'
import {
  PFButton,
  PFCheckbox,
  PFFormControlCluster,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormInlineRow,
  PFFormInlineSegment,
  PFFormInlineSeparator,
  PFTextInput,
} from '@/shared/ui'
import {
  EMPTY_PAYMENT_STATEMENT_BASIC_INFO,
  PAYMENT_STATEMENT_DEFAULT_PURPOSE,
  type PaymentStatementBasicInfoValues,
} from '@jakorea/form-schema/consent'
import styles from './consent-form.module.css'

export type PaymentBasicInfoFieldsProps = {
  values: Partial<PaymentStatementBasicInfoValues>
  onChange: (next: Partial<PaymentStatementBasicInfoValues>) => void
}

export function PaymentBasicInfoFields({ values, onChange }: PaymentBasicInfoFieldsProps) {
  const merged = { ...EMPTY_PAYMENT_STATEMENT_BASIC_INFO, ...values }
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const paymentPurpose = merged.paymentPurpose.trim() || PAYMENT_STATEMENT_DEFAULT_PURPOSE

  const patch = <K extends keyof PaymentStatementBasicInfoValues>(
    key: K,
    value: PaymentStatementBasicInfoValues[K]
  ) => {
    onChange({ ...merged, [key]: value })
  }

  return (
    <>
      <PFFormFieldTable>
        <PFFormFieldRow type="double">
          <PFFormField label="성명" required>
            <PFTextInput
              variant="formPage"
              size="large"
              placeholder="한글 성명"
              value={merged.nameKo}
              onValueChange={value => patch('nameKo', value)}
            />
          </PFFormField>
          <PFFormField label="영문 성명">
            <PFTextInput
              variant="formPage"
              size="large"
              placeholder="영문 성명"
              value={merged.nameEn}
              onValueChange={value => patch('nameEn', value)}
            />
          </PFFormField>
        </PFFormFieldRow>
        <PFFormFieldRow type="double">
          <PFFormField label="주민등록번호" required>
            <PFFormInlineRow>
              <PFFormInlineSegment>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="주민등록 앞 6자리"
                  value={merged.residentFront}
                  onValueChange={value =>
                    patch('residentFront', value.replace(/\D/g, '').slice(0, 6))
                  }
                />
              </PFFormInlineSegment>
              <span className={styles.hyphen} aria-hidden>
                -
              </span>
              <PFFormInlineSegment>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  inputMode="numeric"
                  maxLength={7}
                  placeholder="주민등록 뒤 7자리"
                  value={merged.residentBack}
                  onValueChange={value =>
                    patch('residentBack', value.replace(/\D/g, '').slice(0, 7))
                  }
                />
              </PFFormInlineSegment>
            </PFFormInlineRow>
          </PFFormField>
          <PFFormField label="소속">
            <PFFormInlineRow>
              <PFFormInlineSegment>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  placeholder="소속 기관명"
                  disabled={merged.noAffiliation}
                  value={merged.noAffiliation ? '' : merged.affiliation}
                  onValueChange={value => patch('affiliation', value)}
                />
              </PFFormInlineSegment>
              <PFFormInlineSeparator />
              <PFFormInlineSegment>
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
              </PFFormInlineSegment>
            </PFFormInlineRow>
          </PFFormField>
        </PFFormFieldRow>
        <PFFormFieldRow type="single">
          <PFFormField label="자택 주소" required>
            <PFFormInlineRow>
              <PFFormInlineSegment>
                <div className={styles.inlineFields}>
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    placeholder="건물명, 도로명 또는 지번"
                    value={merged.addressRoad}
                    onValueChange={value => patch('addressRoad', value)}
                  />
                  <PFButton
                    size="small"
                    variant="secondary"
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                  >
                    주소 검색
                  </PFButton>
                </div>
              </PFFormInlineSegment>
              <PFFormInlineSeparator />
              <PFFormInlineSegment>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  placeholder="상세 주소"
                  value={merged.addressDetail}
                  onValueChange={value => patch('addressDetail', value)}
                />
              </PFFormInlineSegment>
            </PFFormInlineRow>
          </PFFormField>
        </PFFormFieldRow>
        <PFFormFieldRow type="single">
          <PFFormField label="정산 계좌 정보" required>
            <PFFormInlineRow>
              <PFFormInlineSegment>
                <PFFormControlCluster>
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    placeholder="은행명"
                    value={merged.bankName}
                    onValueChange={value => patch('bankName', value)}
                  />
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    inputMode="numeric"
                    placeholder="계좌번호(숫자만)"
                    value={merged.accountNumber}
                    onValueChange={value => patch('accountNumber', value.replace(/\D/g, ''))}
                  />
                </PFFormControlCluster>
              </PFFormInlineSegment>
              <PFFormInlineSeparator />
              <PFFormInlineSegment>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  placeholder="예금주명"
                  value={merged.accountHolder}
                  onValueChange={value => patch('accountHolder', value)}
                />
              </PFFormInlineSegment>
            </PFFormInlineRow>
          </PFFormField>
        </PFFormFieldRow>
        <PFFormFieldRow type="single">
          <PFFormField label="지급 목적">
            <PFTextInput
              variant="formPage"
              size="large"
              disabled
              placeholder={PAYMENT_STATEMENT_DEFAULT_PURPOSE}
              value={paymentPurpose}
            />
          </PFFormField>
        </PFFormFieldRow>
      </PFFormFieldTable>

      <AddressSearchModal
        open={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSelect={selection => {
          patch('addressRoad', selection.address)
          setIsAddressModalOpen(false)
        }}
      />
    </>
  )
}

export function resolvePaymentConsentSignerName(
  paymentBasicInfo: Partial<PaymentStatementBasicInfoValues> | undefined,
  lockedName: string
): string {
  return lockedName || paymentBasicInfo?.nameKo?.trim() || ''
}
