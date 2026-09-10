import {
  formatUserInfoWritePlaceholder,
  type UserInfoParagraph,
} from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { PFTextarea } from '@/shared/ui'
import styles from '../survey-fields.module.css'
import type { SurveySidecarState } from '../../lib/survey-sidecar'

type SurveyUserInfoFieldProps = {
  paragraph: UserInfoParagraph
  fieldKey: string
  label: string
  onUpdateParagraph: FormUpdateParagraph
  sidecar: SurveySidecarState
  onSidecarChange: (next: SurveySidecarState) => void
}

export function SurveyUserInfoField({
  paragraph,
  fieldKey,
  label,
  onUpdateParagraph,
  sidecar,
  onSidecarChange,
}: SurveyUserInfoFieldProps) {
  const sidecarValue = sidecar.userInfoAnswers[paragraph.id]?.[fieldKey]
  const value = sidecarValue ?? paragraph.fieldAnswers?.[fieldKey] ?? ''

  return (
    <div className={styles.surveyFields}>
      <PFTextarea
        variant="formPage"
        placeholder={formatUserInfoWritePlaceholder(label)}
        value={value}
        onValueChange={next => {
          onSidecarChange({
            ...sidecar,
            userInfoAnswers: {
              ...sidecar.userInfoAnswers,
              [paragraph.id]: {
                ...sidecar.userInfoAnswers[paragraph.id],
                [fieldKey]: next,
              },
            },
          })
          onUpdateParagraph(paragraph.id, current => {
            if (current.kind !== 'single_item' || current.variant !== 'user_info') {
              return current
            }
            return {
              ...current,
              fieldAnswers: { ...current.fieldAnswers, [fieldKey]: next },
            }
          })
        }}
      />
    </div>
  )
}
