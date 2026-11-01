import { CONSENT_VALUE, type ConsentValue } from '@jakorea/domain/instructor/consent'
import { PFText } from '@/shared/ui'
import { CONSENT_WRITE_RADIO_OPTIONS } from './copy'
import type { ConsentChoice } from './draft-persist'
import styles from './consent-form.module.css'

export function ConsentWriteRadioGroup({
  name,
  value,
  onChange,
  readOnly = false,
  documentTone = false,
  size = 'default',
}: {
  name: string
  value: ConsentChoice
  onChange: (next: ConsentValue) => void
  readOnly?: boolean
  /** A4 문서 — 선택값은 유지하고 청록 강조만 제거 */
  documentTone?: boolean
  /** `large` — 지급조서 작성 화면 표 하단 동의 (Figma Radio 24px · Body/Large/semibold) */
  size?: 'default' | 'large'
}) {
  return (
    <div
      className={[
        styles.radioGroup,
        documentTone ? styles.radioGroupDocument : undefined,
        size === 'large' ? styles.radioGroupLarge : undefined,
      ]
        .filter(Boolean)
        .join(' ')}
      role="radiogroup"
      aria-label={name}
    >
      {CONSENT_WRITE_RADIO_OPTIONS.map(option => (
        <label key={option.value} className={styles.radioOption}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            disabled={readOnly}
            onChange={() => {
              if (readOnly) return
              onChange(option.value)
            }}
          />
          <PFText
            as="span"
            typo={size === 'large' ? 'bd-lg-sb' : 'bd-md-rg'}
            color={documentTone ? 'black' : value === option.value ? 'primary-500' : 'black'}
          >
            {option.label}
          </PFText>
        </label>
      ))}
    </div>
  )
}

export function isConsentAgreed(value: ConsentChoice): boolean {
  return value === CONSENT_VALUE.agree
}
