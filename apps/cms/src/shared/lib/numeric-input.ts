export type NumericInputMode = 'integer' | 'decimal' | 'currency' | 'numericText'

export interface NumericInputOptions {
  mode: NumericInputMode
  allowNegative?: boolean
  min?: number
  max?: number
  precision?: number
}

function normalizeFullWidthDigits(value: string): string {
  return value.replace(/[０-９]/g, digit =>
    String.fromCharCode(digit.charCodeAt(0) - 0xfee0)
  )
}

function sanitizeSignedValue(value: string, allowDecimal: boolean): string {
  const asciiValue = normalizeFullWidthDigits(value)
  const hasLeadingMinus = asciiValue.trimStart().startsWith('-')
  const unsigned = asciiValue.replace(/[^\d.]/g, '')

  if (!allowDecimal) {
    const digits = unsigned.replace(/\./g, '')
    return hasLeadingMinus ? `-${digits}` : digits
  }

  const dotIndex = unsigned.indexOf('.')
  const normalized =
    dotIndex < 0
      ? unsigned
      : `${unsigned.slice(0, dotIndex)}.${unsigned.slice(dotIndex + 1).replace(/\./g, '')}`

  return hasLeadingMinus ? `-${normalized}` : normalized
}

/**
 * 입력 중 사용할 숫자 문자열 정제 함수.
 * 빈 문자열, "-", ".", "-." 같은 중간 상태는 의도적으로 보존한다.
 */
export function sanitizeNumericInput(
  value: string,
  { mode, precision }: NumericInputOptions
): string {
  const asciiValue = normalizeFullWidthDigits(value)
  if (mode === 'currency' || mode === 'numericText') {
    return asciiValue.replace(/\D/g, '')
  }

  if (mode === 'integer') {
    return sanitizeSignedValue(asciiValue, false)
  }

  const sanitized = sanitizeSignedValue(asciiValue, true)
  if (precision == null) return sanitized

  const safePrecision = Math.max(0, Math.trunc(precision))
  const dotIndex = sanitized.indexOf('.')
  if (dotIndex < 0) return sanitized
  if (safePrecision === 0) return sanitized.slice(0, dotIndex)

  return `${sanitized.slice(0, dotIndex + 1)}${sanitized
    .slice(dotIndex + 1)
    .slice(0, safePrecision)}`
}

function removeLeadingZeros(value: string): string {
  const normalized = value.replace(/^0+(?=\d)/, '')
  return normalized === '' ? '0' : normalized
}

function stripTrailingZeros(fraction: string): string {
  return fraction.replace(/0+$/, '')
}

function normalizeNumber(value: string, mode: NumericInputMode): string {
  const negative = value.startsWith('-')
  const unsigned = negative ? value.slice(1) : value

  if (mode === 'decimal') {
    const [integer = '', fraction] = unsigned.split('.')
    const normalizedInteger = removeLeadingZeros(integer || '0')
    const normalizedFraction = fraction == null ? null : stripTrailingZeros(fraction)
    const normalized =
      normalizedFraction == null || normalizedFraction === ''
        ? normalizedInteger
        : `${normalizedInteger}.${normalizedFraction}`
    return negative ? `-${normalized}` : normalized
  }

  const normalized = removeLeadingZeros(unsigned)
  return negative ? `-${normalized}` : normalized
}

function serializeConstraint(value: number, mode: NumericInputMode, precision?: number): string {
  if (mode === 'integer' || mode === 'currency') {
    return String(Math.trunc(value))
  }

  if (mode === 'decimal' && precision != null) {
    const safePrecision = Math.max(0, Math.trunc(precision))
    return String(Number(value.toFixed(safePrecision)))
  }

  return String(value)
}

/**
 * blur 시에만 부호 허용 여부와 min/max를 적용한다.
 * 숫자로 완성되지 않은 중간 상태는 빈 문자열로 정리한다.
 */
export function normalizeNumericInputOnBlur(
  value: string,
  options: NumericInputOptions
): string {
  const sanitized = sanitizeNumericInput(value, options)
  if (options.mode === 'numericText') return sanitized
  if (sanitized === '' || sanitized === '-' || sanitized === '.' || sanitized === '-.') return ''

  let normalized = normalizeNumber(sanitized, options.mode)
  let numericValue = Number(normalized)
  if (!Number.isFinite(numericValue)) return ''

  if (!options.allowNegative && numericValue < 0) {
    numericValue = Math.abs(numericValue)
    normalized = normalizeNumber(String(numericValue), options.mode)
  }

  if (options.min != null && numericValue < options.min) {
    normalized = serializeConstraint(options.min, options.mode, options.precision)
    numericValue = Number(normalized)
  }
  if (options.max != null && numericValue > options.max) {
    normalized = serializeConstraint(options.max, options.mode, options.precision)
  }

  return normalized
}

export function formatCurrencyInput(value: string): string {
  if (value === '') return ''

  const digits = value.replace(/\D/g, '')
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** 정수부 천단위 구분. 부호는 유지한다. */
export function formatGroupedDigits(value: string): string {
  if (value === '' || value === '-') return value
  const negative = value.startsWith('-')
  const digits = (negative ? value.slice(1) : value).replace(/\D/g, '')
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return negative ? `-${grouped}` : grouped
}

/** 입력 표시용 소수 — 정수부만 천단위 구분, 입력 중 소수부는 그대로 둔다. */
export function formatDecimalInputDisplay(value: string): string {
  if (value === '' || value === '-' || value === '.' || value === '-.') return value
  const negative = value.startsWith('-')
  const unsigned = negative ? value.slice(1) : value
  const dotIndex = unsigned.indexOf('.')
  if (dotIndex < 0) {
    const grouped = formatGroupedDigits(unsigned)
    return negative ? `-${grouped}` : grouped
  }
  const intPart = unsigned.slice(0, dotIndex)
  const frac = unsigned.slice(dotIndex + 1)
  const groupedInt = intPart === '' ? '' : formatGroupedDigits(intPart)
  return `${negative ? '-' : ''}${groupedInt}.${frac}`
}

/** 목록·화면 숫자 표시 — 천단위 구분, 후행 0 제거 */
export function formatNumberDisplay(value: number | string | null | undefined): string {
  if (value == null || value === '') return '-'
  const numeric = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
  if (!Number.isFinite(numeric)) return '-'
  return numeric.toLocaleString('ko-KR', { maximumFractionDigits: 20 })
}
