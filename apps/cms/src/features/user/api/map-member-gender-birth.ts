import { birthDateFormValueToApi } from '@/shared/ui/date-text-input'

/** CMS·플랫폼 공통 — API 전송용 성별 (`M` | `F`) */
export function toApiGender(gender: string | undefined | null): 'M' | 'F' | undefined {
  const raw = gender?.trim()
  if (!raw) return undefined

  const upper = raw.toUpperCase()
  if (
    upper === 'MALE' ||
    upper === 'M' ||
    upper === 'MAN' ||
    upper === '1' ||
    raw === '남성' ||
    raw === '남' ||
    raw === '남자' ||
    raw.toLowerCase() === 'male'
  ) {
    return 'M'
  }
  if (
    upper === 'FEMALE' ||
    upper === 'F' ||
    upper === 'WOMAN' ||
    upper === 'W' ||
    upper === '2' ||
    raw === '여성' ||
    raw === '여' ||
    raw === '여자' ||
    raw.toLowerCase() === 'female'
  ) {
    return 'F'
  }
  return undefined
}

/** BE 마스킹 성별(`*`, `**`, `•`만으로 된 값) */
export function isMaskedGenderValue(gender: string | undefined | null): boolean {
  const raw = gender?.trim()
  if (!raw) return false
  return /^[*•]+$/.test(raw)
}

/** 회원 상세·목록 표시용 성별 — `남성` | `여성` | 마스킹 원문 | `-` */
export function toDisplayGender(gender: string | undefined | null): string {
  const raw = gender?.trim()
  if (!raw) return '-'
  if (isMaskedGenderValue(raw)) return raw
  const api = toApiGender(raw)
  if (api === 'M') return '남성'
  if (api === 'F') return '여성'
  return '-'
}

/**
 * 어댑터용 성별 라벨 — `남성` | `여성`, 알 수 없는 값은 원문 유지, 빈 값은 `undefined`.
 * 화면 모델에 `MALE`/`M` 같은 API 원시값이 남지 않게 한다.
 */
export function toGenderLabelOrRaw(gender: string | undefined | null): string | undefined {
  const raw = gender?.trim()
  if (!raw) return undefined
  const label = toDisplayGender(raw)
  return label === '-' ? raw : label
}

/**
 * API `format: date` 전송용 `YYYY-MM-DD`.
 * `YYYY.MM.DD` / `YYYY-MM-DD` / `YYYYMMDD` 입력을 허용한다.
 */
export function toApiBirthDate(birthDate: string | undefined | null): string | undefined {
  const raw = birthDate?.trim()
  if (!raw) return undefined

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw

  // ISO datetime / datetime-local → date part
  const isoDate = raw.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s].*)?$/)
  if (isoDate) return isoDate[1]

  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  }

  const dotted = raw.includes('.')
    ? raw
    : raw.replace(/^(\d{4})-(\d{1,2})-(\d{1,2})$/, '$1.$2.$3')
  const converted = birthDateFormValueToApi(dotted)
  if (/^\d{4}-\d{2}-\d{2}$/.test(converted)) return converted
  return undefined
}
