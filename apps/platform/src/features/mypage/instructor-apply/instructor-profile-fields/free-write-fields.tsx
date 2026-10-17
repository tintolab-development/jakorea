import { INSTRUCTOR_FORM_PLACEHOLDERS as PH } from '@jakorea/domain/instructor/form-copy'
import { INSTRUCTOR_FREE_WRITE_ITEMS } from '@jakorea/domain/instructor/free-write'
import type { InstructorFreeWriteFieldName } from '@jakorea/domain/instructor/free-write'
import { PFFormField, PFFormFieldRow } from '@/shared/ui'
import styles from '../instructor-apply-form.module.css'
import { InstructorProfileFieldTable } from './profile-field-table'
import type { InstructorProfileFieldsProps } from './types'

export type InstructorFreeWriteProfileFieldsProps = InstructorProfileFieldsProps & {
  /** 단일 서술 항목만 편집 (설정 화면) */
  onlyField?: InstructorFreeWriteFieldName
}

export function InstructorFreeWriteProfileFields({
  values,
  onValuesChange,
  onlyField,
  surface = 'apply',
}: InstructorFreeWriteProfileFieldsProps) {
  const items = onlyField
    ? INSTRUCTOR_FREE_WRITE_ITEMS.filter(item => item.name === onlyField)
    : INSTRUCTOR_FREE_WRITE_ITEMS

  const patch = <K extends keyof typeof values>(key: K, next: (typeof values)[K]) => {
    onValuesChange(prev => ({ ...prev, [key]: next }))
  }

  const hideFieldLabel = surface === 'settings' && onlyField != null

  return (
    <>
      {items.map(item => (
        <InstructorProfileFieldTable key={item.name} surface={surface}>
          <PFFormFieldRow type="single">
            {hideFieldLabel ? (
              <textarea
                className={styles.textarea}
                placeholder={PH.freeWrite}
                value={values[item.name]}
                maxLength={1000}
                onChange={event => patch(item.name, event.target.value)}
              />
            ) : (
              <PFFormField label={item.label} layout="vertical">
                <textarea
                  className={styles.textarea}
                  placeholder={PH.freeWrite}
                  value={values[item.name]}
                  maxLength={1000}
                  onChange={event => patch(item.name, event.target.value)}
                />
              </PFFormField>
            )}
          </PFFormFieldRow>
        </InstructorProfileFieldTable>
      ))}
    </>
  )
}
