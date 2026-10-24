import dayjs from 'dayjs'
import {
  applyApplicationListViewMode,
  parseApplicationListViewMode,
  type ApplicationListViewMode,
} from '@/features/program/general/hooks/application-list-view-params'
import {
  UJAT_INSTITUTION_APPLICATION_VIEW_PARAM,
  UJAT_INSTITUTION_CALENDAR_DATE_PARAM,
} from '@/features/program/ujat/lib/ujat-program-detail-url'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function parseUjatInstitutionCalendarDateParam(raw: string | null | undefined): string | null {
  const value = raw?.trim() ?? ''
  if (!ISO_DATE.test(value)) return null
  const parsed = dayjs(value)
  return parsed.isValid() && parsed.format('YYYY-MM-DD') === value ? value : null
}

export function parseUjatInstitutionApplicationViewMode(
  searchParams: URLSearchParams
): ApplicationListViewMode {
  return parseApplicationListViewMode(searchParams, UJAT_INSTITUTION_APPLICATION_VIEW_PARAM)
}

export function applyUjatInstitutionApplicationViewMode(
  next: URLSearchParams,
  mode: ApplicationListViewMode,
  calendarDateIso?: string | null
): void {
  applyApplicationListViewMode(next, UJAT_INSTITUTION_APPLICATION_VIEW_PARAM, mode)
  if (mode === 'table') {
    next.delete(UJAT_INSTITUTION_CALENDAR_DATE_PARAM)
    return
  }
  const iso = parseUjatInstitutionCalendarDateParam(calendarDateIso)
  if (iso) next.set(UJAT_INSTITUTION_CALENDAR_DATE_PARAM, iso)
}

export function clearUjatInstitutionApplicationViewParams(next: URLSearchParams): void {
  next.delete(UJAT_INSTITUTION_APPLICATION_VIEW_PARAM)
  next.delete(UJAT_INSTITUTION_CALENDAR_DATE_PARAM)
}

export function shouldKeepUjatInstitutionApplicationViewParams(lnb: string, tab: string): boolean {
  return lnb === 'institution_applications' && tab === 'inst_all'
}

/** URL 날짜 → 없으면 첫 이벤트/프로그램 일정 → todayIso(로딩 중이면 null) */
export function resolveUjatInstitutionCalendarFocusIso(
  urlDate: string | null,
  eventIsoDates: readonly string[],
  todayIso?: string | null
): string | null {
  const fromUrl = parseUjatInstitutionCalendarDateParam(urlDate)
  if (fromUrl) return fromUrl
  const firstEvent = eventIsoDates
    .map(value => parseUjatInstitutionCalendarDateParam(value.slice(0, 10)))
    .filter((value): value is string => Boolean(value))
    .sort()[0]
  return firstEvent ?? parseUjatInstitutionCalendarDateParam(todayIso) ?? null
}
