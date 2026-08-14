import { CONSENT_VALUE, type ConsentValue } from '@jakorea/domain/instructor/consent'
import { PFText } from '@/shared/ui'
import { CONSENT_WRITE_RADIO_OPTIONS } from './copy'
import type { ConsentChoice } from './draft-persist'
import styles from './consent-form.module.css'

export function ConsentWriteRadioGroup({
  name,
  value,
  onChange,
}: {
  name: string
  value: ConsentChoice
  onChange: (next: ConsentValue) => void
}) {
  return (
    <div className={styles.radioGroup} role="radiogroup" aria-label={name}>
      {CONSENT_WRITE_RADIO_OPTIONS.map(option => (
        <label key={option.value} className={styles.radioOption}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <PFText as="span" typo="bd-md-rg" color="black">
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
