import type { DateParagraph } from '@jakorea/form-schema/writing-form'
import hostStyles from '@/features/program/ui/apply-form-field-host.module.css'
import { PFDateInput, PFFormField, PFFormFieldRow, PFFormFieldTable } from '@/shared/ui'

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
    <div className={hostStyles.root}>
      <PFFormFieldTable>
        <PFFormFieldRow type="single">
          <PFFormField label={_paragraph.paragraphTitle?.trim() || '날짜'}>
            <PFDateInput
              picker="date"
              variant="formPage"
              placeholder="YYYY-MM-DD"
              value={value}
              onValueChange={onValueChange}
              disabled={disabled}
            />
          </PFFormField>
        </PFFormFieldRow>
      </PFFormFieldTable>
    </div>
  )
}
