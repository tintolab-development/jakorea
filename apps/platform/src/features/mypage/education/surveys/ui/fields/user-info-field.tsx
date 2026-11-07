import styles from './user-info-field.module.css'
import type { UserInfoFieldEntry } from '@jakorea/form-schema/writing-form'
import hostStyles from '@/features/program/ui/apply-form-field-host.module.css'
import { PFFormField, PFFormFieldRow, PFFormFieldTable, PFTextInput } from '@/shared/ui'
import { EMPTY_SETTINGS_VALUE } from '@/features/mypage/settings/lib/constants'

type SurveyUserInfoFieldProps = {
  entries: readonly UserInfoFieldEntry[]
  /** fieldKey → 로그인·프로그램 컨텍스트에서 해석된 표시값 */
  values?: Record<string, string>
  /** 비로그인 공개 설문처럼 자동입력이 없으면 직접 작성 */
  editable?: boolean
  /** editable일 때 필수 표시·검증 대상 key. 미지정 시 노출 항목 전체 */
  requiredFieldKeys?: readonly string[]
  disabled?: boolean
  onValueChange?: (key: string, value: string) => void
}

/** 설문자 정보 — 회원 작성은 자동입력 표, 공개 공유는 입력란 */
export function SurveyUserInfoField({
  entries,
  values,
  editable = false,
  requiredFieldKeys,
  disabled = false,
  onValueChange,
}: SurveyUserInfoFieldProps) {
  const isFieldRequired = (key: string) =>
    editable && (requiredFieldKeys == null || requiredFieldKeys.includes(key))
  const rows: UserInfoFieldEntry[][] = []
  for (let index = 0; index < entries.length; index += 2) {
    rows.push(entries.slice(index, index + 2))
  }
  return (
    <div className={[styles.root, hostStyles.root].join(' ')} role="group" aria-label="설문자 정보">
      <PFFormFieldTable>
        {rows.map(row => (
          <PFFormFieldRow key={row[0].key} type={row.length === 2 ? 'double' : 'single'}>
            {row.map(entry => (
              <PFFormField key={entry.key} label={entry.label} required={isFieldRequired(entry.key)}>
                {editable ? (
                  <PFTextInput
                    variant="formPage"
                    size="medium"
                    width="100%"
                    aria-label={entry.label}
                    placeholder={`${entry.label}을 입력해 주세요`}
                    value={values?.[entry.key] ?? ''}
                    disabled={disabled}
                    onValueChange={next => onValueChange?.(entry.key, next)}
                  />
                ) : (
                  values?.[entry.key]?.trim() || EMPTY_SETTINGS_VALUE
                )}
              </PFFormField>
            ))}
          </PFFormFieldRow>
        ))}
      </PFFormFieldTable>
    </div>
  )
}
