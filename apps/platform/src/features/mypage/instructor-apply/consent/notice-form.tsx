import {
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormSection,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import {
  AGREEMENT_NOTICE_ID_TYPE_RESIDENT_OPTION_ID,
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  createDefaultIdTypeWithInputOptions,
} from '@jakorea/form-schema/writing-form'
import { applyKoreanPhoneInputChange } from '@jakorea/domain/shared/korean-phone'
import { formatConsentBirthDateInput } from '@jakorea/form-schema/consent'
import { ConsentWriteRadioGroup } from './consent-radio'
import {
  NOTICE_CONFIRMATION,
  NOTICE_CONSENT_LINES,
  NOTICE_TABLE_FIRST_ROW,
  NOTICE_TABLE_FOOTER,
  NOTICE_TABLE_HEADERS,
} from './copy'
import type { NoticeConsentDraft } from './draft-persist'
import { ConsentInfoTable } from './info-table'
import { PlatformIdTypeWithInputFields } from './id-type-with-input-fields'
import styles from './consent-form.module.css'

const NOTICE_ID_TYPE_PARAGRAPH = {
  id: AGREEMENT_NOTICE_PARAGRAPH_IDS.idType,
  kind: 'single_item' as const,
  variant: 'id_type_with_input' as const,
  requiredMark: false,
  paragraphTitle: '',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  options: createDefaultIdTypeWithInputOptions(),
  selectedOptionId: AGREEMENT_NOTICE_ID_TYPE_RESIDENT_OPTION_ID,
  inputPlaceholder: '주민등록번호를 입력해 주세요',
  inputValue: '',
  answerRequired: false,
}

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
        <ConsentInfoTable
          headers={NOTICE_TABLE_HEADERS}
          rows={[NOTICE_TABLE_FIRST_ROW]}
          hideEmptyPairs
        />
        <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600" className={styles.prose}>
          {NOTICE_TABLE_FOOTER}
        </PFText>
        <PlatformIdTypeWithInputFields
          paragraph={{ ...NOTICE_ID_TYPE_PARAGRAPH, inputValue: draft.idNumber }}
          lockResidentIdType
          onChange={next => patch('idNumber', next.inputValue)}
        />
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
                placeholder="1991.01.01"
                inputMode="numeric"
                maxLength={10}
                value={draft.birthDate}
                onValueChange={value =>
                  patch('birthDate', formatConsentBirthDateInput(value))
                }
              />
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow type="single">
            <PFFormField label="전화번호" required>
              <PFTextInput
                variant="formPage"
                size="large"
                placeholder="전화번호를 입력해 주세요"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={draft.phone}
                onChange={event => {
                  const result = applyKoreanPhoneInputChange(
                    draft.phone,
                    event.target.value,
                    event.target.selectionStart
                  )
                  event.target.value = result.formatted
                  patch('phone', result.formatted)
                  requestAnimationFrame(() => {
                    event.target.setSelectionRange(result.caret, result.caret)
                  })
                }}
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
