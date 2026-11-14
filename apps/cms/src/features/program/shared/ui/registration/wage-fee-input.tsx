import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { clampWageFee } from '@/features/program/shared/lib/wage-fee-input-rules'

export type RegistrationWageFeeInputProps = {
  value: number | null
  onChange: (next: number | null) => void
  max: number
  width?: number
  'aria-label'?: string
}

/**
 * 프로그램 등록 강사비(시간당) 입력 — 오류 문구를 띄우지 않는다.
 * 숫자 외 문자(음수 부호 포함)는 지우고, 최대 금액을 넘는 값(자릿수 초과 포함)은 최대 금액으로 맞춘다.
 */
export function RegistrationWageFeeInput({
  value,
  onChange,
  max,
  width = 120,
  'aria-label': ariaLabel,
}: RegistrationWageFeeInputProps) {
  return (
    <CmsNumericInput
      mode="integer"
      min={0}
      max={max}
      allowNegative={false}
      normalizeOnBlur={false}
      inputSize="small"
      placeholder="직접 입력"
      width={width}
      aria-label={ariaLabel}
      value={value == null ? '' : String(value)}
      onValueChange={raw => {
        const trimmed = raw.trim().replace(/,/g, '')
        if (!trimmed) {
          onChange(null)
          return
        }
        const n = Number(trimmed)
        onChange(Number.isFinite(n) ? clampWageFee(n, max) : null)
      }}
    />
  )
}
