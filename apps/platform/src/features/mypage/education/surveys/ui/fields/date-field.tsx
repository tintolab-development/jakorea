import type { DateParagraph } from '@jakorea/form-schema/writing-form'
import { PFDateInput } from '@/shared/ui'
import styles from '../survey-fields.module.css'

type SurveyDateFieldProps = {
  paragraph: DateParagraph
  value: string
  onValueChange: (next: string) => void
  disabled?: boolean
}

export function SurveyDateField({
  paragraph: _paragraph,
  value,
  onValueChange,
  disabled = false,
}: SurveyDateFieldProps) {
  return (
    <div className={styles.surveyFields}>
      <PFDateInput
        picker="date"
        variant="formPage"
        placeholder="YYYY-MM-DD"
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    </div>
  )
}
