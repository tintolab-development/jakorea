import { PFText } from '@/shared/ui'
import styles from './apply-form-radio.module.css'

export type ApplyFormRadioOption = {
  value: string
  label: string
}

type ApplyFormRadioGroupProps = {
  name: string
  value: string
  options: readonly ApplyFormRadioOption[]
  onChange: (next: string) => void
}

/** 신청 양식 라디오 — 교육받은 교사 기본정보와 동일 마크업 */
export function ApplyFormRadioGroup({
  name,
  value,
  options,
  onChange,
}: ApplyFormRadioGroupProps) {
  return (
    <div className={styles.radioGroup} role="radiogroup" aria-label={name}>
      {options.map(option => (
        <label key={option.value} className={styles.radioOption}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <PFText
            as="span"
            typo="bd-md-rg"
            color={value === option.value ? 'primary-500' : 'black'}
          >
            {option.label}
          </PFText>
        </label>
      ))}
    </div>
  )
}
