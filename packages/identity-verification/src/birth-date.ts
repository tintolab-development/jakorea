/** UI `1990.01.01` → API `1990-01-01` */
export function toApiBirthDate(birthDate: string): string {
  return birthDate.replace(/\./g, '-')
}

export function toVerifiedBirthDate(birthDate: string): string {
  return birthDate.replace(/\./g, '')
}

/** UI `male`/`female`/`M`/`F` → API `M`/`F` */
export function toApiGender(gender: string | undefined): 'M' | 'F' | undefined {
  const raw = gender?.trim()
  if (!raw) return undefined

  const lower = raw.toLowerCase()
  const upper = raw.toUpperCase()
  if (lower === 'male' || upper === 'M' || lower === 'man' || raw === '남성' || raw === '남') {
    return 'M'
  }
  if (
    lower === 'female' ||
    upper === 'F' ||
    lower === 'woman' ||
    raw === '여성' ||
    raw === '여'
  ) {
    return 'F'
  }
  return undefined
}

/** 생년월일 비교용 — 숫자 8자리(YYYYMMDD)로 정규화 */
export function normalizeBirthDateDigits(birthDate: string | undefined): string {
  return birthDate?.replace(/\D/g, '').slice(0, 8) ?? ''
}
