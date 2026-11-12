import { useState } from 'react'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import {
  isWageFeeOutOfRange,
  resolveWageFeeInputMessage,
  wageFeeMaxDigits,
  type WageFeeRejectReason,
} from '@/features/program/shared/lib/wage-fee-input-rules'

export type RegistrationWageFeeInputProps = {
  value: number | null
  onChange: (next: number | null) => void
  max: number
  width?: number
  'aria-label'?: string
}

/**
 * 프로그램 등록 강사비(시간당) 입력 — 값을 한도로 바꾸거나 부호를 지우지 않고 오류로 안내한다(QA-0383-ab40).
 */
export function RegistrationWageFeeInput({
  value,
  onChange,
  max,
  width = 120,
  'aria-label': ariaLabel,
}: RegistrationWageFeeInputProps) {
  const [rejected, setRejected] = useState<WageFeeRejectReason | null>(null)
  const message = resolveWageFeeInputMessage(value, max, rejected)
  return (
    <CmsNumericInput
      mode="integer"
      min={0}
      max={max}
      allowNegative={false}
      maxDigits={wageFeeMaxDigits(max)}
      rejectInvalidInput
      normalizeOnBlur={false}
      inputSize="small"
      placeholder="직접 입력"
      width={width}
      aria-label={ariaLabel}
      error={rejected != null || isWageFeeOutOfRange(value, max)}
      message={message}
      value={value == null ? '' : String(value)}
      onInvalidInput={reason => setRejected(reason)}
      onValueChange={raw => {
        setRejected(null)
        const trimmed = raw.trim().replace(/,/g, '')
        if (!trimmed) {
          onChange(null)
          return
        }
        const n = Number(trimmed)
        onChange(Number.isFinite(n) ? n : null)
      }}
    />
  )
}
