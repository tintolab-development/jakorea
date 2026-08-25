import { PFTextInput } from '../pf-text-input'
import { PFFormPeriodHyphen, PFFormPeriodPair } from './pf-form-inline'

export type PFFormResidentNumberInputProps = {
  frontValue: string
  backValue: string
  onFrontChange: (value: string) => void
  onBackChange: (value: string) => void
  frontPlaceholder?: string
  backPlaceholder?: string
  disabled?: boolean
}

/** Platform 양식 — 주민등록번호 앞·뒤 (모바일 50% − 50%) */
export function PFFormResidentNumberInput({
  frontValue,
  backValue,
  onFrontChange,
  onBackChange,
  frontPlaceholder = '주민등록 앞 6자리',
  backPlaceholder = '주민등록 뒤 7자리',
  disabled = false,
}: PFFormResidentNumberInputProps) {
  return (
    <PFFormPeriodPair>
      <PFTextInput
        variant="formPage"
        size="large"
        inputMode="numeric"
        maxLength={6}
        placeholder={frontPlaceholder}
        disabled={disabled}
        value={frontValue}
        onValueChange={value => onFrontChange(value.replace(/\D/g, '').slice(0, 6))}
      />
      <PFFormPeriodHyphen />
      <PFTextInput
        variant="formPage"
        size="large"
        inputMode="numeric"
        maxLength={7}
        placeholder={backPlaceholder}
        disabled={disabled}
        value={backValue}
        onValueChange={value => onBackChange(value.replace(/\D/g, '').slice(0, 7))}
      />
    </PFFormPeriodPair>
  )
}
