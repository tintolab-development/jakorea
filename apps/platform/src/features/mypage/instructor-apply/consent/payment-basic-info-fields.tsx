import {
  PFCheckbox,
  PFFormControlCluster,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormHomeAddressFields,
  PFFormInlineRow,
  PFFormInlineSegment,
  PFFormInlineSeparator,
  PFFormResidentNumberInput,
  PFTextInput,
} from '@/shared/ui'
import {
  mergePaymentStatementBasicInfo,
  PAYMENT_STATEMENT_DEFAULT_PURPOSE,
  type PaymentStatementBasicInfoValues,
} from '@jakorea/form-schema/consent'

export type PaymentBasicInfoFieldsProps = {
  values: Partial<PaymentStatementBasicInfoValues>
  onChange: (next: Partial<PaymentStatementBasicInfoValues>) => void
}

export function PaymentBasicInfoFields({ values, onChange }: PaymentBasicInfoFieldsProps) {
  const merged = mergePaymentStatementBasicInfo(values)
  const paymentPurpose = merged.paymentPurpose

  const patch = <K extends keyof PaymentStatementBasicInfoValues>(
    key: K,
    value: PaymentStatementBasicInfoValues[K]
  ) => {
    onChange({ ...merged, [key]: value })
  }

  return (
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
          <PFFormResidentNumberInput
            frontValue={merged.residentFront}
            backValue={merged.residentBack}
            onFrontChange={value => patch('residentFront', value)}
            onBackChange={value => patch('residentBack', value)}
          />
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
          <PFFormHomeAddressFields
            roadValue={merged.addressRoad}
            detailValue={merged.addressDetail}
            onRoadChange={value => patch('addressRoad', value)}
            onDetailChange={value => patch('addressDetail', value)}
          />
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
  )
}

export function resolvePaymentConsentSignerName(
  paymentBasicInfo: Partial<PaymentStatementBasicInfoValues> | undefined,
  lockedName: string
): string {
  return lockedName || paymentBasicInfo?.nameKo?.trim() || ''
}
