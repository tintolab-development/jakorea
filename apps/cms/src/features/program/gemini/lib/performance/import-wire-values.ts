import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

const JAVA_INT_MAX = 2_147_483_647

/** BE `KoreanPhoneNumbers.REGEXP` — 하이픈 없는 값은 `@Valid`에서 요청 전체가 거절된다. */
const KOREAN_PHONE =
  /^(?:010-\d{4}-\d{4}|070-\d{4}-\d{4}|02-\d{3,4}-\d{4}|(?:031|032|033|041|042|043|044|051|052|053|054|055|061|062|063|064)-\d{3,4}-\d{4})$/

const AREA_CODES = new Set([
  '031',
  '032',
  '033',
  '041',
  '042',
  '043',
  '044',
  '051',
  '052',
  '053',
  '054',
  '055',
  '061',
  '062',
  '063',
  '064',
])

const DATE_FORMATS = [
  'YYYY-MM-DD',
  'YYYY-M-D',
  'YYYY.MM.DD',
  'YYYY.M.D',
  'YYYY. M. D',
  'YYYY/M/D',
  'YYYY/MM/DD',
  'M/D/YYYY',
  'M/D/YY',
  'YYYY년 M월 D일',
] as const

const TIME_FORMATS = [
  'HH:mm:ss',
  'H:mm:ss',
  'HH:mm',
  'H:mm',
  'h:mm:ss A',
  'hh:mm:ss A',
  'h:mm A',
  'hh:mm A',
] as const

function normalizeDateRaw(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/\.+$/, '')
    .trim()
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function utcYmd(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`
}

function localYmd(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function excelSerialToIsoDate(serial: number): string | undefined {
  if (!Number.isFinite(serial) || serial < 20_000 || serial > 80_000) return undefined
  const utc = Date.UTC(1899, 11, 30) + Math.floor(serial) * 86_400_000
  return utcYmd(new Date(utc))
}

function jsDateToIsoDate(date: Date): string | undefined {
  if (Number.isNaN(date.getTime())) return undefined
  if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0) {
    return utcYmd(date)
  }
  return localYmd(date)
}

/** ExcelJS Date·시리얼·표시 문자열 → `YYYY-MM-DD` */
export function formatExcelDateValue(value: unknown): string | undefined {
  if (value instanceof Date) return jsDateToIsoDate(value)
  if (typeof value === 'number') return excelSerialToIsoDate(value)
  if (typeof value === 'string') return toJavaLocalDate(value)
  return undefined
}

/** Jackson `LocalDate` — `YYYY-MM-DD`만 보낸다. 파싱 실패 값은 생략한다. */
export function toJavaLocalDate(raw: string): string | undefined {
  const trimmed = normalizeDateRaw(raw)
  if (!trimmed) return undefined

  if (/^\d{5}(?:\.\d+)?$/.test(trimmed)) {
    return excelSerialToIsoDate(Number(trimmed))
  }

  const datePrefix = /^(\d{4}-\d{1,2}-\d{1,2})(?:\s|T|$)/.exec(trimmed)
  const candidate = datePrefix?.[1] ?? trimmed

  for (const format of DATE_FORMATS) {
    const parsed = dayjs(candidate, format, true)
    if (parsed.isValid()) return parsed.format('YYYY-MM-DD')
  }

  if (/\b(?:GMT|UTC)\b/.test(trimmed) || /^[A-Z][a-z]{2} [A-Z][a-z]{2} /.test(trimmed)) {
    return jsDateToIsoDate(new Date(trimmed))
  }

  return undefined
}

function parseKoreanMeridiem(raw: string): dayjs.Dayjs | null {
  const match = /^(오전|오후)\s*(\d{1,2})\s*:\s*(\d{2})(?:\s*:\s*(\d{2}))?$/.exec(raw)
  if (!match) return null
  let hour = Number(match[2])
  const minute = Number(match[3])
  const second = Number(match[4] ?? '0')
  if (hour < 1 || hour > 12 || minute > 59 || second > 59) return null
  if (match[1] === '오전') {
    if (hour === 12) hour = 0
  } else if (hour !== 12) {
    hour += 12
  }
  return dayjs('2000-01-01').hour(hour).minute(minute).second(second).millisecond(0)
}

function parseExcelTimeFraction(raw: string): dayjs.Dayjs | null {
  if (!/^\d*\.\d+$/.test(raw)) return null
  const fraction = Number(raw)
  if (!Number.isFinite(fraction) || fraction < 0 || fraction >= 1) return null
  const totalSeconds = Math.round(fraction * 86_400)
  return dayjs('2000-01-01')
    .hour(Math.floor(totalSeconds / 3600))
    .minute(Math.floor((totalSeconds % 3600) / 60))
    .second(totalSeconds % 60)
    .millisecond(0)
}

export function parsePerformanceTime(raw: string): dayjs.Dayjs | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const korean = parseKoreanMeridiem(trimmed)
  if (korean) return korean

  const fraction = parseExcelTimeFraction(trimmed)
  if (fraction) return fraction

  for (const format of TIME_FORMATS) {
    const parsed = dayjs(trimmed, format, true)
    if (parsed.isValid()) return parsed
  }

  return null
}

/** Jackson `LocalTime` — 시 한 자리(`9:00`)·오전/오후는 `HH:mm:ss`로 맞춘다. */
export function toJavaLocalTime(raw: string): string | undefined {
  const parsed = parsePerformanceTime(raw)
  return parsed ? parsed.format('HH:mm:ss') : undefined
}

/** Jackson `Integer`. 소수·범위 밖은 생략해 요청 전체 파싱 실패를 막는다. */
export function toJavaInt(value: number | null | undefined): number | undefined {
  if (value == null || !Number.isFinite(value)) return undefined
  if (!Number.isInteger(value)) return undefined
  if (value < 0 || value > JAVA_INT_MAX) return undefined
  return value
}

export function toKoreanPhone(raw: string): string | undefined {
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  if (KOREAN_PHONE.test(trimmed)) return trimmed

  const digits = trimmed.replace(/\D/g, '')
  if ((digits.startsWith('010') || digits.startsWith('070')) && digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  if (digits.startsWith('02') && (digits.length === 9 || digits.length === 10)) {
    const midLength = digits.length === 9 ? 3 : 4
    return `02-${digits.slice(2, 2 + midLength)}-${digits.slice(2 + midLength)}`
  }
  const area = digits.slice(0, 3)
  if (AREA_CODES.has(area) && (digits.length === 10 || digits.length === 11)) {
    const midLength = digits.length === 10 ? 3 : 4
    const formatted = `${area}-${digits.slice(3, 3 + midLength)}-${digits.slice(3 + midLength)}`
    return KOREAN_PHONE.test(formatted) ? formatted : undefined
  }
  return undefined
}
