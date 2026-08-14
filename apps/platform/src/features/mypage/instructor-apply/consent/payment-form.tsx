import {
  PFCheckbox,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormSection,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import { ConsentWriteRadioGroup } from './consent-radio'
import { PAYMENT_CLOSING, PAYMENT_FINAL_CONFIRM, PAYMENT_INTRO_BODY, PAYMENT_INTRO_TITLE, PAYMENT_MID_CONSENT, PAYMENT_TABLES } from './copy'
import type { PaymentConsentDraft } from './draft-persist'
import { ConsentInfoTable } from './info-table'
import styles from './consent-form.module.css'

export function PaymentConsentForm({
  draft,
  onChange,
}: {
  draft: PaymentConsentDraft
  onChange: (next: PaymentConsentDraft) => void
}) {
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
          <ConsentInfoTable headers={table.headers} rows={table.rows} />
          <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600" className={styles.prose}>
            {table.footer}
          </PFText>
          <PFFormFieldTable>
            <PFFormFieldRow type="single">
              <PFFormField label="동의 여부" required>
                <ConsentWriteRadioGroup
                  name={`payment-table-consent-${index}`}
                  value={draft.tableConsents[index] ?? ''}
                  onChange={next => {
                    const tableConsents = [...draft.tableConsents] as PaymentConsentDraft['tableConsents']
                    tableConsents[index] = next
                    patch('tableConsents', tableConsents)
                  }}
                />
              </PFFormField>
            </PFFormFieldRow>
          </PFFormFieldTable>
        </PFFormSection>
      ))}

      <PFFormSection id="payment-mid" title="동의 확인">
        <PFText as="p" typo="bd-md-rg" color="black" className={styles.prose}>
          {PAYMENT_MID_CONSENT}
        </PFText>
      </PFFormSection>

      <PFFormSection id="payment-basic" title="지급조서 기본정보" required>
        <PFFormFieldTable>
          <PFFormFieldRow type="double">
            <PFFormField label="성명" required>
              <PFTextInput
                variant="formPage"
                size="large"
                placeholder="성명"
                value={draft.nameKo}
                onValueChange={value => patch('nameKo', value)}
              />
            </PFFormField>
            <PFFormField label="주민등록번호" required>
              <div className={styles.inlineFields}>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width={120}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="앞 6자리"
                  value={draft.residentFront}
                  onValueChange={value => patch('residentFront', value.replace(/\D/g, '').slice(0, 6))}
                />
                <span className={styles.hyphen} aria-hidden>
                  -
                </span>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width={140}
                  inputMode="numeric"
                  maxLength={7}
                  placeholder="뒤 7자리"
                  value={draft.residentBack}
                  onValueChange={value => patch('residentBack', value.replace(/\D/g, '').slice(0, 7))}
                />
              </div>
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow type="double">
            <PFFormField label="소속">
              <div className={styles.inlineFields}>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  placeholder="소속 기관명"
                  disabled={draft.noAffiliation}
                  value={draft.noAffiliation ? '' : draft.affiliation}
                  onValueChange={value => patch('affiliation', value)}
                />
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
              </div>
            </PFFormField>
            <PFFormField label="지급 목적">
              <PFTextInput variant="formPage" size="large" value="" disabled placeholder="—" />
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow type="double">
            <PFFormField label="주소" required>
              <PFTextInput
                variant="formPage"
                size="large"
                placeholder="도로명 또는 지번"
                value={draft.addressRoad}
                onValueChange={value => patch('addressRoad', value)}
              />
            </PFFormField>
            <PFFormField label="상세 주소" required>
              <PFTextInput
                variant="formPage"
                size="large"
                placeholder="상세 주소"
                value={draft.addressDetail}
                onValueChange={value => patch('addressDetail', value)}
              />
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow type="double">
            <PFFormField label="은행명" required>
              <PFTextInput
                variant="formPage"
                size="large"
                placeholder="은행명"
                value={draft.bankName}
                onValueChange={value => patch('bankName', value)}
              />
            </PFFormField>
            <PFFormField label="계좌번호" required>
              <PFTextInput
                variant="formPage"
                size="large"
                placeholder="계좌번호"
                value={draft.accountNumber}
                onValueChange={value => patch('accountNumber', value)}
              />
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow type="single">
            <PFFormField label="예금주명" required>
              <PFTextInput
                variant="formPage"
                size="large"
                placeholder="예금주명"
                value={draft.accountHolder}
                onValueChange={value => patch('accountHolder', value)}
              />
            </PFFormField>
          </PFFormFieldRow>
        </PFFormFieldTable>
      </PFFormSection>

      <PFFormSection id="payment-final" title="수령 확인">
        <PFText as="p" typo="bd-md-rg" color="black" className={styles.prose}>
          {PAYMENT_FINAL_CONFIRM}
        </PFText>
        <PFText as="p" typo="bd-md-rg" color="black" className={styles.prose}>
          {PAYMENT_CLOSING}
        </PFText>
      </PFFormSection>
    </>
  )
}