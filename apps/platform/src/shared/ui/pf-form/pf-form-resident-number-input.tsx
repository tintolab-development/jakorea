import { useState } from 'react'
import {
  applyResidentBackMaskedDisplayChange,
  formatResidentBackDisplayForInput,
  sanitizeResidentBackDigits,
} from '@jakorea/form-schema/consent'
import { PFTextInput } from '../pf-text-input'
import { EyeIcon } from '../pf-text-input/icons/eye-icon'
import { EyeOffIcon } from '../pf-text-input/icons/eye-off-icon'
import textStyles from '../pf-text-input/pf-text-input.module.css'
import { PFFormPeriodHyphen, PFFormPeriodPair } from './pf-form-inline'
import styles from './pf-form.module.css'
import backStyles from './pf-form-resident-number-input.module.css'

export type PFFormResidentNumberInputProps = {
  frontValue: string
  backValue: string
  onFrontChange: (value: string) => void
  onBackChange: (value: string) => void
  frontPlaceholder?: string
  backPlaceholder?: string
  disabled?: boolean
  /** true면 앞·뒤 인풋이 한 행을 50%씩 채움 */
  fillRow?: boolean
}

function PFFormResidentBackInput({
  value,
  onValueChange,
  placeholder,
  disabled,
}: {
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  disabled: boolean
}) {
  const [revealed, setRevealed] = useState(false)
  const digits = sanitizeResidentBackDigits(value)
  const display = formatResidentBackDisplayForInput(value, revealed)
  const displayHasMask = display.includes('*')

  const fieldClassName = [
    textStyles.field,
    textStyles.large,
    disabled ? textStyles.disabled : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  const inputClassName = [textStyles.input, textStyles.formPageInput, backStyles.input]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={['pf-text-input', textStyles.root, backStyles.backRoot].join(' ')}>
      <div className={fieldClassName}>
        <input
          className={inputClassName}
          type="text"
          inputMode={displayHasMask ? 'text' : 'numeric'}
          autoComplete="off"
          maxLength={7}
          disabled={disabled}
          placeholder={placeholder}
          value={display}
          aria-label="주민등록번호 뒷자리"
          onChange={event => {
            if (disabled) return
            const next = applyResidentBackMaskedDisplayChange(
              digits,
              event.target.value,
              revealed
            )
            if (next === digits) return
            onValueChange(next)
          }}
        />
        <button
          type="button"
          className={backStyles.toggle}
          aria-label={revealed ? '뒷자리 숨기기' : '뒷자리 보기'}
          aria-pressed={revealed}
          disabled={disabled}
          tabIndex={-1}
          onMouseDown={event => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onClick={() => {
            if (disabled) return
            setRevealed(prev => !prev)
          }}
        >
          {revealed ? (
            <EyeIcon className={backStyles.toggleIcon} />
          ) : (
            <EyeOffIcon className={backStyles.toggleIcon} />
          )}
        </button>
      </div>
    </div>
  )
}

/** Platform 양식 — 앞 6자리는 일반 인풋, 뒤 7자리는 마스킹 인풋 */
export function PFFormResidentNumberInput({
  frontValue,
  onFrontChange,
  backValue,
  onBackChange,
  frontPlaceholder = '주민등록 앞 6자리',
  backPlaceholder = '주민등록 뒤 7자리',
  disabled = false,
  fillRow = false,
}: PFFormResidentNumberInputProps) {
  return (
    <PFFormPeriodPair className={fillRow ? styles.periodPairFill : undefined}>
      <PFTextInput
        variant="formPage"
        size="large"
        inputMode="numeric"
        maxLength={6}
        placeholder={frontPlaceholder}
        disabled={disabled}
        value={frontValue}
        aria-label="주민등록번호 앞자리"
        onValueChange={value => onFrontChange(value.replace(/\D/g, '').slice(0, 6))}
      />
      <PFFormPeriodHyphen />
      <PFFormResidentBackInput
        value={backValue}
        onValueChange={onBackChange}
        placeholder={backPlaceholder}
        disabled={disabled}
      />
    </PFFormPeriodPair>
  )
}
