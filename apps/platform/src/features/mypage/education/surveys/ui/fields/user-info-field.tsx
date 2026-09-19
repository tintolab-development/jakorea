import { PFTextInput } from '@/shared/ui'
import styles from '../survey-fields.module.css'

type SurveyUserInfoFieldProps = {
  label: string
  /** 로그인·프로그램 컨텍스트에서 해석된 표시값 */
  value: string
}

/** 설문자 정보 — 작성 요청이 아니라 로그인 사용자 정보를 비활성 input으로 노출 */
export function SurveyUserInfoField({ label, value }: SurveyUserInfoFieldProps) {
  return (
    <div className={styles.surveyFields}>
      <PFTextInput
        variant="formPage"
        size="xlarge"
        width="100%"
        value={value}
        disabled
        readOnly
        aria-label={label}
      />
    </div>
  )
}
