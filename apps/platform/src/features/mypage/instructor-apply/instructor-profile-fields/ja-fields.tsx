import { INSTRUCTOR_FORM_PLACEHOLDERS as PH } from '@jakorea/domain/instructor/form-copy'
import {
  EMPTY_INSTRUCTOR_JA_KOREA_ROW,
  type InstructorSharedProfileFormValues,
} from '@jakorea/domain/instructor/profile-form-values'
import {
  PFDateInput,
  PFFormField,
  PFFormFieldRow,
  PFFormInlineSeparatedFields,
  PFFormPeriodPair,
  PFFormPeriodTilde,
  PFTextInput,
} from '@/shared/ui'
import styles from '../instructor-apply-form.module.css'
import { ListRowActions } from './list-row-actions'
import {
  InstructorProfileFieldTable,
  resolveInstructorProfileFieldLayout,
} from './profile-field-table'
import type { InstructorProfileFieldsProps } from './types'

export function InstructorJaProfileFields({
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
        <PFFormField label="활동 이력" layout={fieldLayout}>
          <div className={styles.fieldStack}>
            {values.jaKoreaRows.map((row, index) => (
              <div key={`ja-${index}`} className={styles.fieldStackRow}>
                <PFFormInlineSeparatedFields>
                  <PFFormPeriodPair>
                    <PFDateInput
                      variant="formPage"
                      size="large"
                      width={200}
                      placeholder={PH.jaPeriodStart}
                      value={row.periodStart ?? ''}
                      onValueChange={value => {
                        const next = [...values.jaKoreaRows]
                        next[index] = { ...row, periodStart: value || null }
                        patch('jaKoreaRows', next)
                      }}
                    />
                    <PFFormPeriodTilde />
                    <PFDateInput
                      variant="formPage"
                      size="large"
                      width={200}
                      placeholder={PH.jaPeriodEnd}
                      value={row.periodEnd ?? ''}
                      onValueChange={value => {
                        const next = [...values.jaKoreaRows]
                        next[index] = { ...row, periodEnd: value || null }
                        patch('jaKoreaRows', next)
                      }}
                    />
                  </PFFormPeriodPair>
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    width={200}
                    placeholder={PH.jaProgramName}
                    value={row.title}
                    onValueChange={value => {
                      const next = [...values.jaKoreaRows]
                      next[index] = { ...row, title: value }
                      patch('jaKoreaRows', next)
                    }}
                  />
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    width={160}
                    placeholder={PH.jaNote}
                    value={row.note}
                    onValueChange={value => {
                      const next = [...values.jaKoreaRows]
                      next[index] = { ...row, note: value }
                      patch('jaKoreaRows', next)
                    }}
                  />
                  <ListRowActions
                    isFirst={index === 0}
                    onAdd={() =>
                      patch('jaKoreaRows', [...values.jaKoreaRows, { ...EMPTY_INSTRUCTOR_JA_KOREA_ROW }])
                    }
                    onRemove={() =>
                      patch(
                        'jaKoreaRows',
                        values.jaKoreaRows.filter((_, i) => i !== index),
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
