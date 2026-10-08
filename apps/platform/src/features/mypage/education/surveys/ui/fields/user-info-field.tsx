import type { UserInfoFieldEntry } from '@jakorea/form-schema/writing-form'
import { PFText } from '@/shared/ui'
import { EMPTY_SETTINGS_VALUE } from '@/features/mypage/settings/lib/constants'
import styles from './user-info-field.module.css'

type SurveyUserInfoFieldProps = {
  entries: readonly UserInfoFieldEntry[]
  /** fieldKey → 로그인·프로그램 컨텍스트에서 해석된 표시값 */
  values?: Record<string, string>
}

/** 설문자 정보 — CMS 템플릿과 같은 자동입력 표 (작성 입력 없음) */
export function SurveyUserInfoField({ entries, values }: SurveyUserInfoFieldProps) {
  return (
    <dl className={styles.table} aria-label="설문자 정보">
      {entries.map(entry => (
        <div key={entry.key} className={styles.pair}>
          <dt className={styles.label}>
            <PFText typo="bd-md-bd" color="neutral-cool-600">
              {entry.label}
            </PFText>
          </dt>
          <dd className={styles.value}>
            <PFText typo="bd-md-rg" color="black">
              {values?.[entry.key]?.trim() || EMPTY_SETTINGS_VALUE}
            </PFText>
          </dd>
        </div>
      ))}
    </dl>
  )
}
