/**
 * 모집 정보 「발표일 | 방법」 합성 라벨 (최종 합격자 발표 등)
 * 모집별 정보(`*RecruitmentInfo.finalAnnouncementLabel`)에 저장하고, 상세 조회·수정 시드에서 다시 쪼갠다.
 */
import dayjs from 'dayjs'
import { dateRangeUsesClockTime } from '@/features/template/lib/date-range-clock'
import { formatDateOnly } from '@/features/program/shared/lib/program-detail-info-constants'

type DateValue = string | Date | null | undefined

const DATE_SEGMENT_RE =
  /^(\d{4})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{1,2})\.?\s*(?:\([^)]*\))?(?:\s+(\d{1,2}):(\d{2}))?$/

function hasDate(value: DateValue): value is string | Date {
  if (value == null || value === '') return false
  return dayjs(value).isValid()
}

function cleanMethod(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed && trimmed !== '-' ? trimmed : undefined
}

/** 날짜·방법 중 하나만 있어도 만든다. 둘 다 없으면 undefined */
export function formatAnnouncementLabel(
  date: DateValue,
  method: string | null | undefined
): string | undefined {
  const dateLabel = (() => {
    if (!hasDate(date)) return undefined
    const parsed = dayjs(date)
    if (parsed.isValid() && dateRangeUsesClockTime(parsed, parsed)) {
      return parsed.format('YYYY.MM.DD HH:mm')
    }
    return formatDateOnly(date)
  })()
  const parts = [dateLabel, cleanMethod(method)].filter((part): part is string => Boolean(part))
  return parts.length > 0 ? parts.join(' | ') : undefined
}

export type AnnouncementParts = {
  /** 해당 일 00:00 (로컬) ISO */
  date?: string
  method?: string
}

/** 맨 앞 세그먼트가 날짜일 때만 날짜로 본다. 방법 문구 안의 `|`는 보존한다. */
export function parseAnnouncementLabel(label: string | null | undefined): AnnouncementParts {
  const text = label?.trim()
  if (!text || text === '-') return {}
  const [first = '', ...rest] = text.split('|').map(part => part.trim())
  const match = DATE_SEGMENT_RE.exec(first)
  if (!match) return { method: cleanMethod(text) }
  const hour = match[4] != null ? Number(match[4]) : 0
  const minute = match[5] != null ? Number(match[5]) : 0
  const parsed = dayjs(
    `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
  ).hour(hour).minute(minute).second(0).millisecond(0)
  const method = cleanMethod(rest.join(' | '))
  return {
    ...(parsed.isValid()
      ? {
          date:
            match[4] != null
              ? parsed.toISOString()
              : parsed.startOf('day').toISOString(),
        }
      : {}),
    ...(method ? { method } : {}),
  }
}

export type ResolvedAnnouncement = {
  date?: string | Date
  method?: string
}

/**
 * 상세 조회용 발표일·방법.
 * 모집별 정보(합성 라벨 → 분리 필드)를 먼저 보고, 없으면 프로그램 공용 컬럼으로 채운다.
 * 날짜·방법은 각각 따로 채운다(라벨에 방법만 있으면 날짜는 컬럼에서).
 */
export function resolveAnnouncement(sources: {
  labels?: ReadonlyArray<string | null | undefined>
  nested?: { date?: DateValue; method?: string | null }
  column?: { date?: DateValue; method?: string | null }
}): ResolvedAnnouncement {
  const fromLabel =
    (sources.labels ?? [])
      .map(label => parseAnnouncementLabel(label))
      .find(parts => parts.date || parts.method) ?? {}
  const dateCandidates: DateValue[] = [fromLabel.date, sources.nested?.date, sources.column?.date]
  const methodCandidates = [fromLabel.method, sources.nested?.method, sources.column?.method]
  const date = dateCandidates.find(hasDate)
  const method = methodCandidates.map(cleanMethod).find(Boolean)
  return {
    ...(date ? { date } : {}),
    ...(method ? { method } : {}),
  }
}
