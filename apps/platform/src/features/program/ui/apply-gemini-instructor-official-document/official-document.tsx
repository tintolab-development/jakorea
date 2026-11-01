import {
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import { ApplyFormRadioGroup } from '../apply-form-radio'
import hostStyles from '../apply-form-field-host.module.css'
import styles from './official-document.module.css'
import {
  type ApplyGeminiInstructorOfficialDocumentValues,
  type ApplyGeminiInstructorOfficialNeed,
} from './official-document-answers.ts'

export {
  emptyGeminiInstructorOfficialDocument,
  findIncompleteGeminiInstructorOfficialDocumentMessage,
  geminiInstructorOfficialDocumentAnswerFromValues,
  geminiInstructorOfficialDocumentValuesFromDraftAnswer,
  type ApplyGeminiInstructorOfficialDocumentValues,
  type ApplyGeminiInstructorOfficialNeed,
} from './official-document-answers.ts'

const NEED_OPTIONS = [
  { value: 'needed', label: '필요' },
  { value: 'not_needed', label: '필요 없음' },
] as const

type ApplyGeminiInstructorOfficialDocumentProps = {
  value: ApplyGeminiInstructorOfficialDocumentValues
  onChange: (next: ApplyGeminiInstructorOfficialDocumentValues) => void
}

export function ApplyGeminiInstructorOfficialDocument({
  value,
  onChange,
}: ApplyGeminiInstructorOfficialDocumentProps) {
  return (
    <div className={styles.root}>
      <PFFormFieldTable className={[styles.table, hostStyles.root].join(' ')}>
        <PFFormFieldRow type="single">
          <PFFormField label="공문 필요 여부" fullWidth>
            <ApplyFormRadioGroup
              name="apply-gemini-instructor-official-need"
              value={value.officialNeed}
              options={NEED_OPTIONS}
              onChange={next =>
                onChange({
                  ...value,
                  officialNeed: next as ApplyGeminiInstructorOfficialNeed,
                })
              }
            />
          </PFFormField>
        </PFFormFieldRow>
        <PFFormFieldRow type="single">
          <PFFormField label="공문 필요 정보" fullWidth>
            <PFTextInput
              variant="formPage"
              size="large"
              width="100%"
              placeholder="공문에 필요한 정보를 작성해 주세요."
              value={value.officialDetail}
              onValueChange={officialDetail => onChange({ ...value, officialDetail })}
            />
          </PFFormField>
        </PFFormFieldRow>
      </PFFormFieldTable>
      <div className={styles.notes}>
        <PFText as="p" typo="bd-md-md" color="black">
          개인정보를 제외한 필요한 정보 리스트를 작성해주세요.
        </PFText>
        <PFText as="p" typo="bd-md-md" color="black">
          (O) 이름, 소속(학교), 연수예정일시, 연수인원 / (X) 이름예시, 한국초등학교, 2024-8-15, 15명
        </PFText>
      </div>
    </div>
  )
}
