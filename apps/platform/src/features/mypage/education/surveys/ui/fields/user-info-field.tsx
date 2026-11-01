import type { UserInfoFieldEntry } from '@jakorea/form-schema/writing-form'
import { PFFormField, PFFormFieldRow, PFFormFieldTable } from '@/shared/ui'
import { EMPTY_SETTINGS_VALUE } from '@/features/mypage/settings/lib/constants'

type SurveyUserInfoFieldProps = {
  entries: readonly UserInfoFieldEntry[]
  /** fieldKey → 로그인·프로그램 컨텍스트에서 해석된 표시값 */
  values?: Record<string, string>
}

/** 설문자 정보 — CMS 템플릿과 같은 자동입력 표 (작성 입력 없음). Platform 공통 PFFormFieldTable 사용 */
export function SurveyUserInfoField({ entries, values }: SurveyUserInfoFieldProps) {
  const rows: UserInfoFieldEntry[][] = []
  for (let index = 0; index < entries.length; index += 2) {
    rows.push(entries.slice(index, index + 2))
  }
  return (
    <div role="group" aria-label="설문자 정보">
      <PFFormFieldTable>
        {rows.map(row => (
          <PFFormFieldRow key={row[0].key} type={row.length === 2 ? 'double' : 'single'}>
            {row.map(entry => (
              <PFFormField key={entry.key} label={entry.label}>
                {values?.[entry.key]?.trim() || EMPTY_SETTINGS_VALUE}
              </PFFormField>
            ))}
          </PFFormFieldRow>
        ))}
      </PFFormFieldTable>
    </div>
  )
}
