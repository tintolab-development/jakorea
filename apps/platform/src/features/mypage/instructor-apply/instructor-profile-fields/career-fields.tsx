import { CAREER_LEVEL_OPTIONS } from '@jakorea/domain/instructor/career-level'
import { INSTRUCTOR_FORM_PLACEHOLDERS as PH } from '@jakorea/domain/instructor/form-copy'
import {
  EMPTY_INSTRUCTOR_CAREER,
  type InstructorSharedProfileFormValues,
} from '@jakorea/domain/instructor/profile-form-values'
import {
  PFCheckbox,
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
import { InstructorProfileRadioGroup } from './radio-group'
import {
  SettingsCareerRows,
  SettingsField,
  SettingsFieldStack,
  SettingsOptionRow,
} from './settings-stacked-rows'
import type { InstructorProfileFieldsProps } from './types'

export function InstructorCareerProfileFields({
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
    // 회원정보 설정 전용 — 시안 11205:36131 (강사 신청은 아래 기존 테이블 레이아웃)
    return (
      <SettingsFieldStack>
        <SettingsField label="경력 구분" required>
          <SettingsOptionRow>
            <InstructorProfileRadioGroup
              name="careerLevel"
              value={values.careerLevel}
              options={CAREER_LEVEL_OPTIONS}
              onChange={value => patch('careerLevel', value)}
            />
          </SettingsOptionRow>
        </SettingsField>
        {values.careerLevel === 'experienced' ? (
          <SettingsField label="경력 사항" required>
            <SettingsCareerRows
              rows={values.careers}
              placeholders={ph}
              onRowsChange={next => patch('careers', next)}
            />
          </SettingsField>
        ) : null}
      </SettingsFieldStack>
    )
  }

  return (
    <InstructorProfileFieldTable surface={surface}>
      <PFFormFieldRow type="single">
        <PFFormField label="경력 구분" layout={fieldLayout}>
          <InstructorProfileRadioGroup
            name="careerLevel"
            value={values.careerLevel}
            options={CAREER_LEVEL_OPTIONS}
            onChange={value => patch('careerLevel', value)}
          />
        </PFFormField>
      </PFFormFieldRow>
      {values.careerLevel === 'experienced' ? (
        <PFFormFieldRow type="single">
          <PFFormField label="경력 사항" layout={fieldLayout}>
            <div className={styles.fieldStack}>
              {values.careers.map((row, index) => (
                <div key={`career-${index}`} className={styles.fieldStackRow}>
                  <PFFormInlineSeparatedFields>
                    <PFFormPeriodPair>
                      <PFDateInput
                        variant="formPage"
                        size="large"
                        width={200}
                        picker="month"
                        placeholder={PH.careerPeriodStart}
                        value={row.periodStart ?? ''}
                        onValueChange={value => {
                          const next = [...values.careers]
                          next[index] = { ...row, periodStart: value || null }
                          patch('careers', next)
                        }}
                      />
                      <PFFormPeriodTilde />
                      <PFDateInput
                        variant="formPage"
                        size="large"
                        width={200}
                        picker="month"
                        placeholder={PH.careerPeriodEnd}
                        disabled={row.currentlyEmployed}
                        value={row.periodEnd ?? ''}
                        onValueChange={value => {
                          const next = [...values.careers]
                          next[index] = { ...row, periodEnd: value || null }
                          patch('careers', next)
                        }}
                      />
                    </PFFormPeriodPair>
                    <PFTextInput
                      variant="formPage"
                      size="large"
                      width={200}
                      placeholder={PH.companyName}
                      value={row.companyName}
                      onValueChange={value => {
                        const next = [...values.careers]
                        next[index] = { ...row, companyName: value }
                        patch('careers', next)
                      }}
                    />
                    <PFTextInput
                      variant="formPage"
                      size="large"
                      width={160}
                      placeholder={PH.roleName}
                      value={row.roleName}
                      onValueChange={value => {
                        const next = [...values.careers]
                        next[index] = { ...row, roleName: value }
                        patch('careers', next)
                      }}
                    />
                    <PFCheckbox
                      size="large"
                      checked={row.currentlyEmployed}
                      onCheckedChange={checked => {
                        const next = [...values.careers]
                        next[index] = {
                          ...row,
                          currentlyEmployed: checked,
                          periodEnd: checked ? null : row.periodEnd,
                        }
                        patch('careers', next)
                      }}
                    >
                      재직중
                    </PFCheckbox>
                    <ListRowActions
                      isFirst={index === 0}
                      onAdd={() => patch('careers', [...values.careers, { ...EMPTY_INSTRUCTOR_CAREER }])}
                      onRemove={() =>
                        patch(
                          'careers',
                          values.careers.filter((_, i) => i !== index),
                        )
                      }
                    />
                  </PFFormInlineSeparatedFields>
                </div>
              ))}
            </div>
          </PFFormField>
        </PFFormFieldRow>
      ) : null}
    </InstructorProfileFieldTable>
  )
}
