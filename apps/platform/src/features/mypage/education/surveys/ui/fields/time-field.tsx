import type { TimeParagraph } from '@jakorea/form-schema/writing-form'
import hostStyles from '@/features/program/ui/apply-form-field-host.module.css'
import { PFFormField, PFFormFieldRow, PFFormFieldTable, PFTextInput } from '@/shared/ui'

type SurveyTimeFieldProps = {
  paragraph: TimeParagraph
  value: string
  onValueChange: (next: string) => void
  disabled?: boolean
}

export function SurveyTimeField({
  paragraph: _paragraph,
  value,
  onValueChange,
  disabled = false,
}: SurveyTimeFieldProps) {
  return (
    <div className={hostStyles.root}>
      <PFFormFieldTable>
        <PFFormFieldRow type="single">
          <PFFormField label={_paragraph.paragraphTitle?.trim() || '시간'}>
            <PFTextInput
              type="time"
              variant="formPage"
              placeholder="시간 선택"
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
