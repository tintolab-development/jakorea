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
import {
  SettingsField,
  SettingsFieldStack,
  SettingsLicenseOrAwardRows,
} from './settings-stacked-rows'
import type { InstructorProfileFieldsProps } from './types'

export function InstructorAwardProfileFields({
  values,
  onValuesChange,
  surface = 'apply',
  placeholders,
}: InstructorProfileFieldsProps) {
  const fieldLayout = resolveInstructorProfileFieldLayout(surface)
  const ph = { ...PH, ...placeholders }
  const patch = <K extends keyof InstructorSharedProfileFormValues>(
    key: K,
    next: InstructorSharedProfileFormValues[K],
  ) => {
    onValuesChange(prev => ({ ...prev, [key]: next }))
  }

  if (surface === 'settings') {
    // 회원정보 설정 전용 — 시안 12208:131447
    return (
      <SettingsFieldStack>
        <SettingsField label="수상 및 수료 내역">
          <SettingsLicenseOrAwardRows
            rows={values.awardRows}
            keyPrefix="award"
            placeholders={{ year: ph.awardYear, title: ph.awardTitle, issuer: ph.awardIssuer }}
            onRowsChange={next => patch('awardRows', next)}
          />
        </SettingsField>
      </SettingsFieldStack>
    )
  }

  return (
    <InstructorProfileFieldTable surface={surface}>
      <PFFormFieldRow type="single">
        <PFFormField label="수상 및 수료 내역" layout={fieldLayout}>
          <div className={styles.fieldStack}>
            {values.awardRows.map((row, index) => (
              <div key={`award-${index}`} className={styles.fieldStackRow}>
                <PFFormInlineSeparatedFields>
                  <PFDateInput
                    variant="formPage"
                    size="large"
                    width={200}
                    picker="year"
                    placeholder={PH.awardYear}
                    value={row.acquiredYear ?? ''}
                    onValueChange={value => {
                      const next = [...values.awardRows]
                      next[index] = { ...row, acquiredYear: value || null }
                      patch('awardRows', next)
                    }}
                  />
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    width={200}
                    placeholder={PH.awardTitle}
                    value={row.title}
                    onValueChange={value => {
                      const next = [...values.awardRows]
                      next[index] = { ...row, title: value }
                      patch('awardRows', next)
                    }}
                  />
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    width={160}
                    placeholder={PH.awardIssuer}
                    value={row.issuer}
                    onValueChange={value => {
                      const next = [...values.awardRows]
                      next[index] = { ...row, issuer: value }
                      patch('awardRows', next)
                    }}
                  />
                  <ListRowActions
                    isFirst={index === 0}
                    onAdd={() =>
                      patch('awardRows', [
                        ...values.awardRows,
                        { ...EMPTY_INSTRUCTOR_LICENSE_OR_AWARD_ROW },
                      ])
                    }
                    onRemove={() =>
                      patch(
                        'awardRows',
                        values.awardRows.filter((_, i) => i !== index),
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
