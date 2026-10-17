import { INSTRUCTOR_FORM_PLACEHOLDERS as PH } from '@jakorea/domain/instructor/form-copy'
import {
  EMPTY_INSTRUCTOR_LICENSE_OR_AWARD_ROW,
  type InstructorSharedProfileFormValues,
} from '@jakorea/domain/instructor/profile-form-values'
import {
  PFDateInput,
  PFFormField,
  PFFormFieldRow,
  PFFormInlineSeparatedFields,
  PFTextInput,
} from '@/shared/ui'
import styles from '../instructor-apply-form.module.css'
import { ListRowActions } from './list-row-actions'
import {
  InstructorProfileFieldTable,
  resolveInstructorProfileFieldLayout,
} from './profile-field-table'
import type { InstructorProfileFieldsProps } from './types'

export function InstructorLicenseProfileFields({
  values,
  onValuesChange,
  surface = 'apply',
}: InstructorProfileFieldsProps) {
  const fieldLayout = resolveInstructorProfileFieldLayout(surface)
  const patch = <K extends keyof InstructorSharedProfileFormValues>(
    key: K,
    next: InstructorSharedProfileFormValues[K],
  ) => {
    onValuesChange(prev => ({ ...prev, [key]: next }))
  }

  return (
    <InstructorProfileFieldTable surface={surface}>
      <PFFormFieldRow type="single">
        <PFFormField label="자격 및 면허 내역" layout={fieldLayout}>
          <div className={styles.fieldStack}>
            {values.licenseRows.map((row, index) => (
              <div key={`license-${index}`} className={styles.fieldStackRow}>
                <PFFormInlineSeparatedFields>
                  <PFDateInput
                    variant="formPage"
                    size="large"
                    width={200}
                    picker="year"
                    placeholder={PH.licenseYear}
                    value={row.acquiredYear ?? ''}
                    onValueChange={value => {
                      const next = [...values.licenseRows]
                      next[index] = { ...row, acquiredYear: value || null }
                      patch('licenseRows', next)
                    }}
                  />
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    width={200}
                    placeholder={PH.licenseTitle}
                    value={row.title}
                    onValueChange={value => {
                      const next = [...values.licenseRows]
                      next[index] = { ...row, title: value }
                      patch('licenseRows', next)
                    }}
                  />
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    width={160}
                    placeholder={PH.licenseIssuer}
                    value={row.issuer}
                    onValueChange={value => {
                      const next = [...values.licenseRows]
                      next[index] = { ...row, issuer: value }
                      patch('licenseRows', next)
                    }}
                  />
                  <ListRowActions
                    isFirst={index === 0}
                    onAdd={() =>
                      patch('licenseRows', [
                        ...values.licenseRows,
                        { ...EMPTY_INSTRUCTOR_LICENSE_OR_AWARD_ROW },
                      ])
                    }
                    onRemove={() =>
                      patch(
                        'licenseRows',
                        values.licenseRows.filter((_, i) => i !== index),
                      )
                    }
                  />
                </PFFormInlineSeparatedFields>
              </div>
            ))}
          </div>
        </PFFormField>
      </PFFormFieldRow>
    </InstructorProfileFieldTable>
  )
}
