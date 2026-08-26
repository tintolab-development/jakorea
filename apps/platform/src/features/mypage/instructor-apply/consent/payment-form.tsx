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
  PFFormSection,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import { useInstructorApplyLockedBasic } from '../use-instructor-apply-locked-basic'
import { ConsentWriteRadioGroup } from './consent-radio'
import {
  PAYMENT_BASIC_SECTION_TITLE,
  PAYMENT_CLOSING,
  PAYMENT_FINAL_CONFIRM,
  PAYMENT_INTRO_BODY,
  PAYMENT_INTRO_TITLE,
  PAYMENT_MID_CONSENT,
  PAYMENT_PURPOSE_FIXED,
  PAYMENT_TABLES,
} from './copy'
import type { PaymentConsentDraft } from './draft-persist'
import { ConsentInfoTable } from './info-table'
import { ConsentSignatureStatement } from './signature-statement'
import styles from './consent-form.module.css'

export function PaymentConsentForm({
  draft,
  onChange,
}: {
  draft: PaymentConsentDraft
  onChange: (next: PaymentConsentDraft) => void
}) {
  const { lockedBasic } = useInstructorApplyLockedBasic()
  const signerName = lockedBasic.name || draft.nameKo
  const paymentPurpose = draft.paymentPurpose.trim() || PAYMENT_PURPOSE_FIXED

  const patch = <K extends keyof PaymentConsentDraft>(key: K, value: PaymentConsentDraft[K]) => {
    onChange({ ...draft, [key]: value })
  }

  return (
    <>
      <PFFormSection id="payment-intro" title={PAYMENT_INTRO_TITLE}>
        <PFText as="p" typo="bd-md-rg" color="black" className={styles.prose}>
          {PAYMENT_INTRO_BODY}
        </PFText>
      </PFFormSection>

      {PAYMENT_TABLES.map((table, index) => (
        <PFFormSection key={table.title} id={`payment-table-${index}`} title={table.title} required>
          <div className={styles.tableBlock}>
            <ConsentInfoTable
              headers={table.headers}
              rows={table.rows}
              emphasizedColumns={table.emphasizedColumns}
            />
            <div className={styles.tableAfter}>
              <p className={styles.tableDescription}>{table.footer}</p>
              <ConsentWriteRadioGroup
                name={`payment-table-consent-${index}`}
                value={draft.tableConsents[index] ?? ''}
                onChange={next => {
                  const tableConsents = [...draft.tableConsents] as PaymentConsentDraft['tableConsents']
                  tableConsents[index] = next
                  patch('tableConsents', tableConsents)
                }}
              />
            </div>
          </div>
        </PFFormSection>
      ))}

      <ConsentSignatureStatement
        statement={PAYMENT_MID_CONSENT}
        signerName={signerName}
        signature={draft.midSignature}
        onSignatureChange={midSignature => patch('midSignature', midSignature)}
      />

      <PFFormSection id="payment-basic" title={PAYMENT_BASIC_SECTION_TITLE} required>
        <PFFormFieldTable>
          <PFFormFieldRow type="double">
            <PFFormField label="성명" required>
              <PFTextInput
                variant="formPage"
                size="large"
                placeholder="한글 성명"
                value={draft.nameKo}
                onValueChange={value => patch('nameKo', value)}
              />
            </PFFormField>
            <PFFormField label="영문 성명">
              <PFTextInput
                variant="formPage"
                size="large"
                placeholder="영문 성명"
                value={draft.nameEn}
                onValueChange={value => patch('nameEn', value)}
              />
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow type="double">
            <PFFormField label="주민등록번호" required>
              <PFFormResidentNumberInput
                frontValue={draft.residentFront}
                backValue={draft.residentBack}
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
                    disabled={draft.noAffiliation}
                    value={draft.noAffiliation ? '' : draft.affiliation}
                    onValueChange={value => patch('affiliation', value)}
                  />
                </PFFormInlineSegment>
                <PFFormInlineSeparator />
                <PFFormInlineSegment>
                  <PFCheckbox
                    checked={draft.noAffiliation}
                    onCheckedChange={checked =>
                      onChange({
                        ...draft,
                        noAffiliation: checked,
                        affiliation: checked ? '' : draft.affiliation,
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
                roadValue={draft.addressRoad}
                detailValue={draft.addressDetail}
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
                      value={draft.bankName}
                      onValueChange={value => patch('bankName', value)}
                    />
                    <PFTextInput
                      variant="formPage"
                      size="large"
                      inputMode="numeric"
                      placeholder="계좌번호(숫자만)"
                      value={draft.accountNumber}
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
                    value={draft.accountHolder}
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
                placeholder={PAYMENT_PURPOSE_FIXED}
                value={paymentPurpose}
              />
            </PFFormField>
          </PFFormFieldRow>
        </PFFormFieldTable>
      </PFFormSection>

      <ConsentSignatureStatement
        statement={PAYMENT_FINAL_CONFIRM}
        signerName={signerName}
        signature={draft.finalSignature}
        onSignatureChange={finalSignature => patch('finalSignature', finalSignature)}
      />

      <div className={styles.closingRecipient}>
        <p className={styles.closingRecipientText}>{PAYMENT_CLOSING}</p>
      </div>
    </>
  )
}