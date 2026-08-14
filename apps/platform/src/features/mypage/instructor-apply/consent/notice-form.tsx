import {
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormSection,
  PFSelect,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import { ConsentWriteRadioGroup } from './consent-radio'
import {
  NOTICE_CONFIRMATION,
  NOTICE_CONSENT_LINES,
  NOTICE_ID_TYPE_OPTIONS,
  NOTICE_TABLE_FIRST_ROW,
  NOTICE_TABLE_FOOTER,
  NOTICE_TABLE_HEADERS,
} from './copy'
import type { NoticeConsentDraft } from './draft-persist'
import { ConsentInfoTable } from './info-table'
import styles from './consent-form.module.css'

const ID_TYPE_OPTIONS = NOTICE_ID_TYPE_OPTIONS.map(option => ({
  value: option.value,
  label: option.label,
}))

export function NoticeConsentForm({
  draft,
  onChange,
}: {
  draft: NoticeConsentDraft
  onChange: (next: NoticeConsentDraft) => void
}) {
  const patch = <K extends keyof NoticeConsentDraft>(key: K, value: NoticeConsentDraft[K]) => {
    onChange({ ...draft, [key]: value })
  }

  return (
    <>
      <PFFormSection id="notice-org" title="이용기관 및 이용목적" required>
        <PFFormFieldTable>
          <PFFormFieldRow type="double">
            <PFFormField label="이용기관 명칭" required>
              <PFTextInput
                variant="formPage"
                size="large"
                placeholder="이용기관 명칭을 입력해 주세요"
                value={draft.institution}
                onValueChange={value => patch('institution', value)}
              />
            </PFFormField>
            <PFFormField label="이용사무(이용목적)" required>
              <PFTextInput
                variant="formPage"
                size="large"
                placeholder="이용 목적을 입력해 주세요"
                value={draft.purpose}
                onValueChange={value => patch('purpose', value)}
              />
            </PFFormField>
          </PFFormFieldRow>
        </PFFormFieldTable>
      </PFFormSection>

      <PFFormSection id="notice-table" title="공동이용 행정정보(구비서류)">
        <ConsentInfoTable headers={NOTICE_TABLE_HEADERS} rows={[NOTICE_TABLE_FIRST_ROW]} />
        <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600" className={styles.prose}>
          {NOTICE_TABLE_FOOTER}
        </PFText>
        <PFFormFieldTable>
          <PFFormFieldRow type="double">
            <PFFormField label="식별번호 종류" required>
              <PFSelect
                variant="formPage"
                size="large"
                options={ID_TYPE_OPTIONS}
                value={draft.idType}
                onValueChange={value => patch('idType', value)}
              />
            </PFFormField>
            <PFFormField label="식별번호" required>
              <PFTextInput
                variant="formPage"
                size="large"
                placeholder="식별번호를 입력해 주세요"
                value={draft.idNumber}
                onValueChange={value => patch('idNumber', value)}
              />
            </PFFormField>
          </PFFormFieldRow>
        </PFFormFieldTable>
      </PFFormSection>

      <PFFormSection id="notice-subject" title="대상자 본인" required>
        <PFFormFieldTable>
          <PFFormFieldRow type="double">
            <PFFormField label="성명" required>
              <PFTextInput
                variant="formPage"
                size="large"
                placeholder="성명을 입력해 주세요"
                value={draft.name}
                onValueChange={value => patch('name', value)}
              />
            </PFFormField>
            <PFFormField label="생년월일" required>
              <PFTextInput
                variant="formPage"
                size="large"
                placeholder="생년월일 8자리"
                inputMode="numeric"
                maxLength={8}
                value={draft.birthDate}
                onValueChange={value => patch('birthDate', value.replace(/\D/g, '').slice(0, 8))}
              />
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow type="single">
            <PFFormField label="전화번호" required>
              <PFTextInput
                variant="formPage"
                size="large"
                placeholder="전화번호를 입력해 주세요"
                value={draft.phone}
                onValueChange={value => patch('phone', value)}
              />
            </PFFormField>
          </PFFormFieldRow>
        </PFFormFieldTable>
      </PFFormSection>

      <PFFormSection id="notice-confirm" title="정보주체(본인) 동의사항" required>
        <ul className={styles.proseList}>
          {NOTICE_CONSENT_LINES.map(line => (
            <li key={line}>
              <PFText as="p" typo="bd-md-rg" color="black" className={styles.prose}>
                {line}
              </PFText>
            </li>
          ))}
        </ul>
        <PFText as="p" typo="bd-md-rg" color="black" className={styles.prose}>
          {NOTICE_CONFIRMATION}
        </PFText>
        <PFFormFieldTable>
          <PFFormFieldRow type="single">
            <PFFormField label="동의 여부" required>
              <ConsentWriteRadioGroup
                name="notice-confirm"
                value={draft.confirm}
                onChange={next => patch('confirm', next)}
              />
            </PFFormField>
          </PFFormFieldRow>
        </PFFormFieldTable>
      </PFFormSection>
    </>
  )
}
