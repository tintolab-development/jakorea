import type { TimeParagraph } from '@jakorea/form-schema/writing-form'
import { PFTextInput } from '@/shared/ui'
import styles from '../survey-fields.module.css'

type SurveyTimeFieldProps = {
  paragraph: TimeParagraph
  value: string
  onValueChange: (next: string) => void
}

export function SurveyTimeField({ paragraph: _paragraph, value, onValueChange }: SurveyTimeFieldProps) {
  return (
    <div className={styles.surveyFields}>
      <PFTextInput
        type="time"
        variant="formPage"
        placeholder="시간 선택"
        value={value}
        onValueChange={onValueChange}
      />
    </div>
  )
}
