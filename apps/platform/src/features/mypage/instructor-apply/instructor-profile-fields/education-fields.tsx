import { useMemo } from 'react'
import { INSTRUCTOR_FORM_PLACEHOLDERS as PH } from '@jakorea/domain/instructor/form-copy'
import {
  EDUCATION_DEGREE_OPTIONS,
  EDUCATION_DETAIL_OPTIONS,
  EDUCATION_SCHOOL_TYPE_OPTIONS,
  EDUCATION_STATUS_OPTIONS,
  isEducationDetailKey,
  orderEducationDetailKeys,
  resolveAvailableEducationDetailKeys,
  type EducationDetailKey,
} from '@jakorea/domain/instructor/education-options'
import {
  EMPTY_INSTRUCTOR_EDUCATION_GRADUATE_ROW,
  EMPTY_INSTRUCTOR_EDUCATION_SCHOOL_ROW,
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
  PFSelect,
  PFTextInput,
} from '@/shared/ui'
import { EducationSchoolNameField } from '../education-school-name-field'
import styles from '../instructor-apply-form.module.css'
import { ListRowActions } from './list-row-actions'
import {
  InstructorProfileFieldTable,
  resolveInstructorProfileFieldLayout,
} from './profile-field-table'
import type { InstructorProfileFieldsProps } from './types'

function toSelectOptions(
  options: readonly { value: string; label: string }[],
): { value: string; label: string }[] {
  return options.map(option => ({ value: option.value, label: option.label }))
}

export function InstructorEducationProfileFields({
  values,
  onValuesChange,
  surface = 'apply',
}: InstructorProfileFieldsProps) {
  const fieldLayout = resolveInstructorProfileFieldLayout(surface)
  const availableEducationKeys = useMemo(
    () => resolveAvailableEducationDetailKeys(values.eduSchoolType),
    [values.eduSchoolType],
  )
  const lockedEducationKey = isEducationDetailKey(values.eduSchoolType) ? values.eduSchoolType : null
  const finalEducationEnrolled = values.eduStatus === 'enrolled'

  const patch = <K extends keyof InstructorSharedProfileFormValues>(
    key: K,
    next: InstructorSharedProfileFormValues[K],
  ) => {
    onValuesChange(prev => ({ ...prev, [key]: next }))
  }

  const handleEduSchoolTypeChange = (eduSchoolType: string) => {
    const available = resolveAvailableEducationDetailKeys(eduSchoolType)
    const locked = isEducationDetailKey(eduSchoolType) ? eduSchoolType : null
    onValuesChange(prev => ({
      ...prev,
      eduSchoolType,
      educationDetailKeys: locked
        ? orderEducationDetailKeys([
            ...prev.educationDetailKeys.filter(key => available.includes(key)),
            locked,
          ])
        : [],
    }))
  }

  const toggleEducationDetail = (key: EducationDetailKey) => {
    if (key === values.eduSchoolType) return
    onValuesChange(prev => {
      const has = prev.educationDetailKeys.includes(key)
      const nextKeys = has
        ? prev.educationDetailKeys.filter(item => item !== key)
        : [...prev.educationDetailKeys, key]
      return {
        ...prev,
        educationDetailKeys: orderEducationDetailKeys(nextKeys),
      }
    })
  }

  return (
          <InstructorProfileFieldTable surface={surface}>
            <PFFormFieldRow type="single">
              <PFFormField layout={fieldLayout} label="최종 학력">
                <PFFormInlineSeparatedFields>
                  <PFSelect
                    variant="formPage"
                    size="large"
                    width={160}
                    placeholder={PH.eduSchoolType}
                    options={toSelectOptions(EDUCATION_SCHOOL_TYPE_OPTIONS)}
                    value={values.eduSchoolType}
                    onValueChange={handleEduSchoolTypeChange}
                  />
                  <PFSelect
                    variant="formPage"
                    size="large"
                    width={120}
                    placeholder={PH.eduStatus}
                    options={toSelectOptions(EDUCATION_STATUS_OPTIONS)}
                    value={values.eduStatus}
                    onValueChange={value => patch('eduStatus', value)}
                  />
                </PFFormInlineSeparatedFields>
              </PFFormField>
            </PFFormFieldRow>
            {availableEducationKeys.length > 0 ? (
              <PFFormFieldRow type="single">
                <PFFormField layout={fieldLayout} label="학력 상세">
                  <div className={styles.radioGroup}>
                    {EDUCATION_DETAIL_OPTIONS.filter(option =>
                      availableEducationKeys.includes(option.value)
                    ).map(option => {
                      const locked = option.value === values.eduSchoolType
                      const checked = values.educationDetailKeys.includes(option.value)
                      return (
                        <PFCheckbox
                          key={option.value}
                          size="large"
                          checked={checked}
                          disabled={locked}
                          onCheckedChange={() => toggleEducationDetail(option.value)}
                        >
                          {option.label}
                        </PFCheckbox>
                      )
                    })}
                  </div>
                </PFFormField>
              </PFFormFieldRow>
            ) : null}

            {values.educationDetailKeys.includes('high') ? (
              <PFFormFieldRow type="single">
                <PFFormField layout={fieldLayout} label="고등학교">
                  <PFFormInlineSeparatedFields>
                    <PFFormPeriodPair>
                      <PFDateInput
                        variant="formPage"
                        size="large"
                        width={200}
                        picker="year"
                        placeholder={PH.admitYear}
                        value={values.highSchool.admitYear ?? ''}
                        onValueChange={value =>
                          patch('highSchool', {
                            ...values.highSchool,
                            admitYear: value || null,
                          })
                        }
                      />
                      <PFFormPeriodTilde />
                      <PFDateInput
                        variant="formPage"
                        size="large"
                        width={200}
                        picker="year"
                        placeholder={PH.gradYear}
                        disabled={finalEducationEnrolled && lockedEducationKey === 'high'}
                        value={values.highSchool.gradYear ?? ''}
                        onValueChange={value =>
                          patch('highSchool', {
                            ...values.highSchool,
                            gradYear: value || null,
                          })
                        }
                      />
                    </PFFormPeriodPair>
                    <EducationSchoolNameField
                      detailKey="high"
                      value={values.highSchool.schoolName}
                      onChange={schoolName =>
                        patch('highSchool', { ...values.highSchool, schoolName })
                      }
                    />
                  </PFFormInlineSeparatedFields>
                </PFFormField>
              </PFFormFieldRow>
            ) : null}

            {values.educationDetailKeys.includes('college23') ? (
              <PFFormFieldRow type="single">
                <PFFormField layout={fieldLayout} label="대학교 2, 3년제">
                  <div className={styles.fieldStack}>
                    {values.college23Rows.map((row, index) => (
                      <div key={`college23-${index}`} className={styles.fieldStackRow}>
                        <PFFormInlineSeparatedFields>
                          <PFFormPeriodPair>
                            <PFDateInput
                              variant="formPage"
                              size="large"
                              width={200}
                              picker="year"
                              placeholder={PH.admitYear}
                              value={row.admitYear ?? ''}
                              onValueChange={value => {
                                const next = [...values.college23Rows]
                                next[index] = { ...row, admitYear: value || null }
                                patch('college23Rows', next)
                              }}
                            />
                            <PFFormPeriodTilde />
                            <PFDateInput
                              variant="formPage"
                              size="large"
                              width={200}
                              picker="year"
                              placeholder={PH.gradYear}
                              disabled={finalEducationEnrolled && lockedEducationKey === 'college23'}
                              value={row.gradYear ?? ''}
                              onValueChange={value => {
                                const next = [...values.college23Rows]
                                next[index] = { ...row, gradYear: value || null }
                                patch('college23Rows', next)
                              }}
                            />
                          </PFFormPeriodPair>
                          <EducationSchoolNameField
                            detailKey="college23"
                            value={row.schoolName}
                            onChange={schoolName => {
                              const next = [...values.college23Rows]
                              next[index] = { ...row, schoolName }
                              patch('college23Rows', next)
                            }}
                          />
                          <PFTextInput
                            variant="formPage"
                            size="large"
                            width={160}
                            placeholder={PH.major}
                            value={row.major}
                            onValueChange={value => {
                              const next = [...values.college23Rows]
                              next[index] = { ...row, major: value }
                              patch('college23Rows', next)
                            }}
                          />
                          <ListRowActions
                            isFirst={index === 0}
                            onAdd={() =>
                              patch('college23Rows', [
                                ...values.college23Rows,
                                { ...EMPTY_INSTRUCTOR_EDUCATION_SCHOOL_ROW },
                              ])
                            }
                            onRemove={() =>
                              patch(
                                'college23Rows',
                                values.college23Rows.filter((_, i) => i !== index)
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

            {values.educationDetailKeys.includes('college4') ? (
              <PFFormFieldRow type="single">
                <PFFormField layout={fieldLayout} label="대학교 4년제">
                  <div className={styles.fieldStack}>
                    {values.college4Rows.map((row, index) => (
                      <div key={`college4-${index}`} className={styles.fieldStackRow}>
                        <PFFormInlineSeparatedFields>
                          <PFFormPeriodPair>
                            <PFDateInput
                              variant="formPage"
                              size="large"
                              width={200}
                              picker="year"
                              placeholder={PH.admitYear}
                              value={row.admitYear ?? ''}
                              onValueChange={value => {
                                const next = [...values.college4Rows]
                                next[index] = { ...row, admitYear: value || null }
                                patch('college4Rows', next)
                              }}
                            />
                            <PFFormPeriodTilde />
                            <PFDateInput
                              variant="formPage"
                              size="large"
                              width={200}
                              picker="year"
                              placeholder={PH.gradYear}
                              disabled={finalEducationEnrolled && lockedEducationKey === 'college4'}
                              value={row.gradYear ?? ''}
                              onValueChange={value => {
                                const next = [...values.college4Rows]
                                next[index] = { ...row, gradYear: value || null }
                                patch('college4Rows', next)
                              }}
                            />
                          </PFFormPeriodPair>
                          <EducationSchoolNameField
                            detailKey="college4"
                            value={row.schoolName}
                            onChange={schoolName => {
                              const next = [...values.college4Rows]
                              next[index] = { ...row, schoolName }
                              patch('college4Rows', next)
                            }}
                          />
                          <PFTextInput
                            variant="formPage"
                            size="large"
                            width={160}
                            placeholder={PH.major}
                            value={row.major}
                            onValueChange={value => {
                              const next = [...values.college4Rows]
                              next[index] = { ...row, major: value }
                              patch('college4Rows', next)
                            }}
                          />
                          <ListRowActions
                            isFirst={index === 0}
                            onAdd={() =>
                              patch('college4Rows', [
                                ...values.college4Rows,
                                { ...EMPTY_INSTRUCTOR_EDUCATION_SCHOOL_ROW },
                              ])
                            }
                            onRemove={() =>
                              patch(
                                'college4Rows',
                                values.college4Rows.filter((_, i) => i !== index)
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

            {values.educationDetailKeys.includes('graduate') ? (
              <PFFormFieldRow type="single">
                <PFFormField layout={fieldLayout} label="대학원">
                  <div className={styles.fieldStack}>
                    {values.graduateRows.map((row, index) => (
                      <div key={`graduate-${index}`} className={styles.fieldStackRow}>
                        <PFFormInlineSeparatedFields>
                          <PFFormPeriodPair>
                            <PFDateInput
                              variant="formPage"
                              size="large"
                              width={200}
                              picker="year"
                              placeholder={PH.admitYear}
                              value={row.admitYear ?? ''}
                              onValueChange={value => {
                                const next = [...values.graduateRows]
                                next[index] = { ...row, admitYear: value || null }
                                patch('graduateRows', next)
                              }}
                            />
                            <PFFormPeriodTilde />
                            <PFDateInput
                              variant="formPage"
                              size="large"
                              width={200}
                              picker="year"
                              placeholder={PH.gradYear}
                              disabled={finalEducationEnrolled && lockedEducationKey === 'graduate'}
                              value={row.gradYear ?? ''}
                              onValueChange={value => {
                                const next = [...values.graduateRows]
                                next[index] = { ...row, gradYear: value || null }
                                patch('graduateRows', next)
                              }}
                            />
                            <PFSelect
                              variant="formPage"
                              size="large"
                              width={120}
                              className={styles.degreeSelectMargin}
                              placeholder={PH.degree}
                              options={toSelectOptions(EDUCATION_DEGREE_OPTIONS)}
                              value={row.degree}
                              onValueChange={value => {
                                const next = [...values.graduateRows]
                                next[index] = { ...row, degree: value }
                                patch('graduateRows', next)
                              }}
                            />
                          </PFFormPeriodPair>
                          <EducationSchoolNameField
                            detailKey="graduate"
                            value={row.schoolName}
                            onChange={schoolName => {
                              const next = [...values.graduateRows]
                              next[index] = { ...row, schoolName }
                              patch('graduateRows', next)
                            }}
                          />
                          <PFTextInput
                            variant="formPage"
                            size="large"
                            width={160}
                            placeholder={PH.major}
                            value={row.major}
                            onValueChange={value => {
                              const next = [...values.graduateRows]
                              next[index] = { ...row, major: value }
                              patch('graduateRows', next)
                            }}
                          />
                          <ListRowActions
                            isFirst={index === 0}
                            onAdd={() =>
                              patch('graduateRows', [
                                ...values.graduateRows,
                                { ...EMPTY_INSTRUCTOR_EDUCATION_GRADUATE_ROW },
                              ])
                            }
                            onRemove={() =>
                              patch(
                                'graduateRows',
                                values.graduateRows.filter((_, i) => i !== index)
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
