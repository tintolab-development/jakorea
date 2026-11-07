/**
 * UJAT 반기 typed-detail(`ujatTypedDetail`, BE UjatTypedDetailSupport) ↔ overlay 반기 일정 키 변환.
 *
 * - 쓰기: overlay(`ujat.{h1,h2}.{pre,event,closing}.*`, `ujat.{h}.eduSchedule.*`)에서 BE legacy fallback과
 *   같은 규칙으로 반기 계획을 만든다. BE 검증(필수 이름·방식, 범위 안 날짜, excludeNone 단독)을 통과하도록 정리한다.
 * - 읽기: typed 가 저장된 프로그램만 반기 값이 overlay 와 다를 때 overlay 키를 typed 값으로 맞춘다.
 * - common(설문·참여 유형)은 다루지 않는다(overlay·기존 echo 경로 그대로).
 * - typed 가 없는 기존 프로그램에는 아무것도 쓰지 않는다(backfill 금지).
 */
import type { UjatHalfSemesterKey } from '@/features/program/ujat/lib/ujat-half-education-schedule-types'

/** BE UJAT typed / overlay exclusion (공휴일 키는 `excludeHoliday`; generic `ExclusionPolicy`와 다름). */
export type UjatTypedExclusionPolicy = {
  excludeNone?: boolean | null
  excludeSaturday?: boolean | null
  excludeSunday?: boolean | null
  excludeHoliday?: boolean | null
}

export const UJAT_TYPED_DETAIL_ROOT_KEY = 'ujatTypedDetail'
export const UJAT_TYPED_SCHEMA_VERSION = 1

export type UjatTypedSemester = 'FIRST_HALF' | 'SECOND_HALF'
export type UjatTypedStage = 'PRE_EDUCATION' | 'MAIN_EDUCATION' | 'POST_EDUCATION'

export type UjatTypedExclusion = UjatTypedExclusionPolicy

export type UjatTypedScheduleRow = {
  rowId?: string | null
  displayOrder?: number | null
  educationName?: string | null
  educationMethod?: string | null
  regionCode?: string | null
  startDate?: string | null
  endDate?: string | null
  dates?: string[] | null
  scheduleIds?: number[] | null
  textbook?: { provisionMethod?: string | null; responsiblePerson?: string | null } | null
  excludedDates?: string[] | null
  exclusion?: UjatTypedExclusion | null
}

export type UjatTypedStagePlan = {
  stage: UjatTypedStage | string
  rows?: UjatTypedScheduleRow[] | null
}
export type UjatTypedHalfPlan = {
  semesterType: UjatTypedSemester | string
  stages?: UjatTypedStagePlan[] | null
}

export type UjatTypedDetail = {
  schemaVersion?: number | null
  halfPlans?: UjatTypedHalfPlan[] | null
  common?: Record<string, unknown> | null
  revision?: number | null
}

export const UJAT_TYPED_SEMESTER_BY_HALF: Record<UjatHalfSemesterKey, UjatTypedSemester> = {
  h1: 'FIRST_HALF',
  h2: 'SECOND_HALF',
}

const STAGE_ORDER: UjatTypedStage[] = ['PRE_EDUCATION', 'MAIN_EDUCATION', 'POST_EDUCATION']
const STAGE_SECTION: Record<UjatTypedStage, 'pre' | 'event' | 'closing'> = {
  PRE_EDUCATION: 'pre',
  MAIN_EDUCATION: 'event',
  POST_EDUCATION: 'closing',
}
/** BE fromLegacy 기본 이름·방식 */
const DEFAULT_NAME: Record<UjatTypedStage, (half: UjatHalfSemesterKey) => string> = {
  PRE_EDUCATION: () => '사전교육',
  MAIN_EDUCATION: half => half,
  POST_EDUCATION: () => '사후교육',
}
export const UJAT_TYPED_LEGACY_METHOD = 'LEGACY'

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000

function legacyRowId(semester: UjatTypedSemester, stage: UjatTypedStage): string {
  return `legacy-${semester}-${stage}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown): string | null {
  if (value == null || typeof value === 'object') return null
  const s = String(value).trim()
  return s ? s : null
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0')
}

function isIntIn(n: unknown, min: number, max: number): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max
}

/**
 * Jackson `WRITE_DATES_AS_TIMESTAMPS` 배열 → 문자열.
 * - LocalDate `[y,m,d]` → `"YYYY-MM-DD"` (typed-detail GET 과 같은 모양)
 * - LocalDateTime `[y,m,d,h,mi,s?,nanos?]` → 서울 시각 `"YYYY-MM-DDTHH:mm:ss(.SSS)+09:00"`
 * 정수가 아니거나 범위를 벗어나면 null. 달력상 없는 날짜(2/30 등)는 `ujatTypedDate` 가 걸러낸다.
 */
function jacksonDateArrayText(value: readonly unknown[]): string | null {
  const [y, m, d, h = 0, mi = 0, s = 0, nanos = 0] = value
  if (!isIntIn(y, 1, 9999) || !isIntIn(m, 1, 12) || !isIntIn(d, 1, 31)) return null
  const date = `${pad(y, 4)}-${pad(m)}-${pad(d)}`
  if (value.length === 3) return date
  if (value.length < 5 || value.length > 7) return null
  if (!isIntIn(h, 0, 23) || !isIntIn(mi, 0, 59) || !isIntIn(s, 0, 59)) return null
  if (!isIntIn(nanos, 0, 999_999_999)) return null
  const ms = Math.floor(nanos / 1_000_000)
  return `${date}T${pad(h)}:${pad(mi)}:${pad(s)}${ms ? `.${pad(ms, 3)}` : ''}+09:00`
}

function toInstantText(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value.trim() || null
  if (Array.isArray(value)) return jacksonDateArrayText(value)
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString()
  if (
    typeof value === 'object' &&
    typeof (value as { toISOString?: unknown }).toISOString === 'function'
  ) {
    try {
      return String((value as { toISOString: () => string }).toISOString())
    } catch {
      return null
    }
  }
  return null
}

/** BE `date()` — LocalDate 우선, 아니면 Instant → 서울 날짜 */
export function ujatTypedDate(value: unknown): string | null {
  const raw = toInstantText(value)
  if (!raw) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T00:00:00.000Z`)
    return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== raw ? null : raw
  }
  if (!/^\d{4}-\d{2}-\d{2}T/.test(raw)) return null
  const ms = Date.parse(raw)
  if (Number.isNaN(ms)) return null
  return new Date(ms + SEOUL_OFFSET_MS).toISOString().slice(0, 10)
}

/** 서울 자정 ISO. 날짜로 읽을 수 없으면 null(throw 하지 않는다) */
function seoulMidnightIso(value: unknown): string | null {
  const date = ujatTypedDate(value)
  if (!date) return null
  return new Date(Date.parse(`${date}T00:00:00.000Z`) - SEOUL_OFFSET_MS).toISOString()
}

function warnDroppedStoredDate(path: string, value: unknown): void {
  if (import.meta.env.DEV) {
    console.warn('[ujat-typed-detail] stored typed date ignored', path, value)
  }
}

function overlayKeys(half: UjatHalfSemesterKey) {
  const p = `ujat.${half}`
  return {
    name: (section: 'pre' | 'event' | 'closing') => `${p}.${section}.name`,
    delivery: (section: 'pre' | 'event' | 'closing') => `${p}.${section}.delivery`,
    range: `${p}.event.range`,
    unavailableDates: `${p}.eduSchedule.unavailableDates`,
    exclusion: `${p}.eduSchedule.exclusion`,
  }
}

/** Overlay/응답의 공휴일 제외. GET에는 `excludeHoliday`만 온다. null은 미설정이며 true로 승격하지 않는다. */
export function holidayExcludedFromTyped(
  exclusion: Pick<UjatTypedExclusion, 'excludeHoliday'> | Record<string, unknown> | null | undefined
): boolean {
  if (exclusion == null || typeof exclusion !== 'object') return false
  return (exclusion as { excludeHoliday?: boolean | null }).excludeHoliday === true
}

function copyExclusionFlag(
  raw: Record<string, unknown>,
  key: 'excludeNone' | 'excludeSaturday' | 'excludeSunday' | 'excludeHoliday',
  target: UjatTypedExclusion
) {
  if (!Object.prototype.hasOwnProperty.call(raw, key)) return
  const value = raw[key]
  if (value === true || value === false || value === null) target[key] = value
}

/** typed-detail 쓰기: GET exclusion을 통째로 보내되 구키는 빼고 omit/null/false를 구분한다. */
export function exclusionForTypedWrite(raw: unknown): UjatTypedExclusion | null {
  if (!isRecord(raw)) return null
  const next: UjatTypedExclusion = {}
  copyExclusionFlag(raw, 'excludeNone', next)
  copyExclusionFlag(raw, 'excludeSaturday', next)
  copyExclusionFlag(raw, 'excludeSunday', next)
  copyExclusionFlag(raw, 'excludeHoliday', next)
  return next
}

/** Overlay `excludeHoliday` → BE typed `excludeHoliday`. 구키는 보내지 않는다. */
export function exclusionFromOverlay(raw: unknown, excludedDates: string[] = []): UjatTypedExclusion | null {
  if (!isRecord(raw)) return null
  const none = raw.excludeNone === true
  return {
    // BE 검증: excludeNone 은 다른 제외(요일·공휴일·특정일)와 같이 못 쓴다.
    excludeNone: none && excludedDates.length === 0,
    excludeSaturday: !none && raw.excludeSaturday === true,
    excludeSunday: !none && raw.excludeSunday === true,
    excludeHoliday: !none && holidayExcludedFromTyped(raw),
  }
}

/** overlay → 반기 계획(BE fromLegacy 규칙 + 검증 통과용 정리). 단계가 하나도 없으면 null */
export function buildUjatTypedHalfPlanFromOverlay(
  overlay: Record<string, unknown> | null | undefined,
  half: UjatHalfSemesterKey
): UjatTypedHalfPlan | null {
  const source = overlay ?? {}
  const semester = UJAT_TYPED_SEMESTER_BY_HALF[half]
  const keys = overlayKeys(half)
  const stages: UjatTypedStagePlan[] = []
  for (const stage of STAGE_ORDER) {
    const section = STAGE_SECTION[stage]
    const name = text(source[keys.name(section)])
    const method = text(source[keys.delivery(section)])
    const rangeRaw = stage === 'MAIN_EDUCATION' ? source[keys.range] : undefined
    const hasRange = isRecord(rangeRaw)
    if (!name && !method && !hasRange) continue
    const row: UjatTypedScheduleRow = {
      rowId: legacyRowId(semester, stage),
      displayOrder: 1,
      educationName: name ?? DEFAULT_NAME[stage](half),
      educationMethod: method ?? UJAT_TYPED_LEGACY_METHOD,
      regionCode: null,
      startDate: null,
      endDate: null,
      dates: [],
      scheduleIds: [],
      textbook: null,
      excludedDates: [],
      exclusion: null,
    }
    if (stage === 'MAIN_EDUCATION') {
      let start = hasRange ? ujatTypedDate((rangeRaw as Record<string, unknown>).start) : null
      let end = hasRange ? ujatTypedDate((rangeRaw as Record<string, unknown>).end) : null
      if (start == null || end == null || start > end) {
        start = null
        end = null
      }
      row.startDate = start
      row.endDate = end
      const rawDates = source[keys.unavailableDates]
      const excluded: string[] = []
      if (Array.isArray(rawDates)) {
        for (const item of rawDates) {
          const d = ujatTypedDate(item)
          if (!d || excluded.includes(d)) continue
          if (start != null && end != null && (d < start || d > end)) continue
          excluded.push(d)
        }
      }
      excluded.sort()
      row.excludedDates = excluded
      row.exclusion = exclusionFromOverlay(source[keys.exclusion], excluded)
    }
    stages.push({ stage, rows: [row] })
  }
  return stages.length > 0 ? { semesterType: semester, stages } : null
}

/** 생성 요청용 typed 문서 — common 은 넣지 않는다(설문·참여 유형은 overlay 경로 유지). */
export function buildUjatTypedDetailForCreate(
  overlay: Record<string, unknown> | null | undefined
): UjatTypedDetail {
  const halfPlans = (['h1', 'h2'] as const)
    .map(half => buildUjatTypedHalfPlanFromOverlay(overlay, half))
    .filter((plan): plan is UjatTypedHalfPlan => plan != null)
  return { schemaVersion: UJAT_TYPED_SCHEMA_VERSION, halfPlans }
}

function inRange(
  dates: string[] | null | undefined,
  start: string | null,
  end: string | null
): string[] {
  return (dates ?? []).filter(d => start == null || end == null || (d >= start && d <= end))
}

/**
 * 저장된 반기 계획 위에 overlay 에서 만든 legacy 행 값을 얹는다.
 * - overlay 가 다루는 값(이름·방식·기간·불가일·제외)만 바꾸고 지역·날짜·scheduleIds·교재 등은 유지한다.
 * - overlay 에 없는 legacy 행은 지운다. legacy 가 아닌 행(다른 도구가 만든 행)은 그대로 둔다.
 */
export function mergeUjatTypedHalfPlan(
  current: UjatTypedHalfPlan | null | undefined,
  built: UjatTypedHalfPlan | null,
  half: UjatHalfSemesterKey
): UjatTypedHalfPlan {
  const semester = UJAT_TYPED_SEMESTER_BY_HALF[half]
  const stages: UjatTypedStagePlan[] = []
  for (const stage of STAGE_ORDER) {
    const legacyId = legacyRowId(semester, stage)
    const currentRows =
      current?.stages?.find(s => String(s.stage).toUpperCase() === stage)?.rows ?? []
    const builtRow = built?.stages?.find(s => s.stage === stage)?.rows?.[0] ?? null
    const others = currentRows.filter(r => r.rowId !== legacyId)
    const existing = currentRows.find(r => r.rowId === legacyId) ?? null
    const rows: UjatTypedScheduleRow[] = [...others]
    if (builtRow) {
      const usedOrders = new Set(others.map(r => r.displayOrder))
      let order = existing?.displayOrder ?? builtRow.displayOrder ?? 1
      while (usedOrders.has(order)) order += 1
      const start = builtRow.startDate ?? null
      const end = builtRow.endDate ?? null
      const next: UjatTypedScheduleRow = existing
        ? {
            ...existing,
            displayOrder: order,
            educationName: builtRow.educationName,
            educationMethod: builtRow.educationMethod,
          }
        : { ...builtRow, displayOrder: order }
      if (stage === 'MAIN_EDUCATION') {
        next.startDate = start
        next.endDate = end
        next.dates = inRange(next.dates, start, end)
        next.excludedDates = builtRow.excludedDates ?? []
        next.exclusion = builtRow.exclusion ?? null
      }
      rows.push(next)
    }
    if (rows.length > 0) {
      rows.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      stages.push({ stage, rows })
    }
  }
  return { semesterType: semester, stages }
}

function canonicalHalf(plan: UjatTypedHalfPlan | null | undefined): string {
  const stages = [...(plan?.stages ?? [])]
    .filter(s => (s.rows ?? []).length > 0)
    .map(s => ({
      stage: String(s.stage).toUpperCase(),
      rows: [...(s.rows ?? [])]
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map(r => ({
          rowId: r.rowId ?? null,
          displayOrder: r.displayOrder ?? null,
          educationName: r.educationName ?? null,
          educationMethod: r.educationMethod ?? null,
          regionCode: r.regionCode ?? null,
          startDate: r.startDate ?? null,
          endDate: r.endDate ?? null,
          dates: [...(r.dates ?? [])].sort(),
          scheduleIds: [...(r.scheduleIds ?? [])].sort((x, y) => x - y),
          textbook: r.textbook
            ? {
                provisionMethod: r.textbook.provisionMethod ?? null,
                responsiblePerson: r.textbook.responsiblePerson ?? null,
              }
            : null,
          excludedDates: [...(r.excludedDates ?? [])].sort(),
          exclusion: r.exclusion
            ? {
                excludeNone: r.exclusion.excludeNone === true,
                excludeSaturday: r.exclusion.excludeSaturday === true,
                excludeSunday: r.exclusion.excludeSunday === true,
                excludeHoliday: holidayExcludedFromTyped(r.exclusion),
              }
            : null,
        })),
    }))
    .sort(
      (a, b) =>
        STAGE_ORDER.indexOf(a.stage as UjatTypedStage) -
        STAGE_ORDER.indexOf(b.stage as UjatTypedStage)
    )
  return JSON.stringify(stages)
}

export function ujatTypedHalfPlansEqual(
  a: UjatTypedHalfPlan | null | undefined,
  b: UjatTypedHalfPlan | null | undefined
): boolean {
  return canonicalHalf(a) === canonicalHalf(b)
}

/** 프로그램 GET serviceDetailJson 에 저장된 typed 문서(없으면 null — 기존 legacy 프로그램) */
export function parseStoredUjatTypedDetail(
  serviceDetailJson: string | null | undefined
): UjatTypedDetail | null {
  if (!serviceDetailJson) return null
  try {
    const parsed: unknown = JSON.parse(serviceDetailJson)
    if (!isRecord(parsed)) return null
    const typed = parsed[UJAT_TYPED_DETAIL_ROOT_KEY]
    return isRecord(typed) ? normalizeStoredUjatTypedDetail(typed as UjatTypedDetail) : null
  } catch {
    return null
  }
}

function normalizeStoredDate(value: unknown, path: string): string | null {
  if (value == null) return null
  const date = ujatTypedDate(value)
  if (!date) warnDroppedStoredDate(path, value)
  return date
}

function normalizeStoredDateList(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) {
    if (value != null) warnDroppedStoredDate(path, value)
    return []
  }
  const out: string[] = []
  value.forEach((item, i) => {
    const date = normalizeStoredDate(item, `${path}[${i}]`)
    if (date) out.push(date)
  })
  return out
}

/**
 * 저장 문서(serviceDetailJson.ujatTypedDetail) 날짜 정규화.
 * BE UjatTypedDetailSupport MAPPER 는 LocalDate 를 Jackson 배열(`[2027,3,19]`)로 쓰고,
 * typed-detail GET 은 `"2027-03-19"` 로 돌려준다 → 저장 문서도 GET 과 같은 문자열로 맞춘다.
 * 읽을 수 없는 날짜는 버리고, 기간은 시작·끝 중 하나라도 못 읽으면 기간 전체를 비운다.
 */
function normalizeStoredRow(row: UjatTypedScheduleRow, at: string): UjatTypedScheduleRow {
  let startDate = normalizeStoredDate(row.startDate, `${at}.startDate`)
  let endDate = normalizeStoredDate(row.endDate, `${at}.endDate`)
  if (startDate == null || endDate == null) {
    startDate = null
    endDate = null
  }
  const next: UjatTypedScheduleRow = { ...row, startDate, endDate }
  if (row.dates !== undefined) next.dates = normalizeStoredDateList(row.dates, `${at}.dates`)
  if (row.excludedDates !== undefined) {
    next.excludedDates = normalizeStoredDateList(row.excludedDates, `${at}.excludedDates`)
  }
  return next
}

function recordsOf<T>(value: unknown): T[] | null {
  return Array.isArray(value) ? (value.filter(isRecord) as T[]) : null
}

/** 읽기 정규화 — typed-detail GET·저장 문서의 레거시 배열 날짜를 `"YYYY-MM-DD"` 로 맞춘다(쓰기 전 기준값에도 쓴다). */
export function normalizeUjatTypedDetailDates<T extends UjatTypedDetail | null | undefined>(
  detail: T
): T {
  if (!isRecord(detail)) return detail
  return normalizeStoredUjatTypedDetail(detail as UjatTypedDetail) as T
}

function normalizeStoredUjatTypedDetail(detail: UjatTypedDetail): UjatTypedDetail {
  const halfPlans = recordsOf<UjatTypedHalfPlan>(detail.halfPlans)
  if (!halfPlans) return detail
  return {
    ...detail,
    halfPlans: halfPlans.map((plan, pi) => ({
      ...plan,
      stages:
        recordsOf<UjatTypedStagePlan>(plan.stages)?.map((stagePlan, si) => ({
          ...stagePlan,
          rows:
            recordsOf<UjatTypedScheduleRow>(stagePlan.rows)?.map((row, ri) =>
              normalizeStoredRow(row, `halfPlans[${pi}].stages[${si}].rows[${ri}]`)
            ) ?? null,
        })) ?? null,
    })),
  }
}

export function findUjatTypedHalf(
  detail: UjatTypedDetail | null | undefined,
  half: UjatHalfSemesterKey
): UjatTypedHalfPlan | null {
  const semester = UJAT_TYPED_SEMESTER_BY_HALF[half]
  return detail?.halfPlans?.find(p => String(p.semesterType).toUpperCase() === semester) ?? null
}

/**
 * 조회 — 저장된 typed 반기 값을 overlay 반기 키에 반영한다.
 * typed 가 없거나, overlay 에서 만든 반기 계획과 같으면 overlay 를 그대로 돌려준다.
 */
export function applyStoredUjatTypedHalvesToOverlay(
  overlay: Record<string, unknown>,
  detail: UjatTypedDetail | null | undefined
): Record<string, unknown> {
  if (!detail) return overlay
  let next: Record<string, unknown> | null = null
  for (const half of ['h1', 'h2'] as const) {
    const typedHalf = findUjatTypedHalf(detail, half)
    const fromOverlay = mergeUjatTypedHalfPlan(
      typedHalf,
      buildUjatTypedHalfPlanFromOverlay(overlay, half),
      half
    )
    if (ujatTypedHalfPlansEqual(typedHalf, fromOverlay)) continue
    next = next ?? { ...overlay }
    const keys = overlayKeys(half)
    const semester = UJAT_TYPED_SEMESTER_BY_HALF[half]
    for (const stage of STAGE_ORDER) {
      const section = STAGE_SECTION[stage]
      const rows = typedHalf?.stages?.find(s => String(s.stage).toUpperCase() === stage)?.rows ?? []
      const row = rows.find(r => r.rowId === legacyRowId(semester, stage)) ?? rows[0] ?? null
      if (!row) {
        delete next[keys.name(section)]
        delete next[keys.delivery(section)]
        if (stage === 'MAIN_EDUCATION') delete next[keys.range]
        continue
      }
      if (row.educationName) next[keys.name(section)] = row.educationName
      else delete next[keys.name(section)]
      if (row.educationMethod && row.educationMethod !== UJAT_TYPED_LEGACY_METHOD) {
        next[keys.delivery(section)] = row.educationMethod
      } else delete next[keys.delivery(section)]
      if (stage === 'MAIN_EDUCATION') {
        const start = seoulMidnightIso(row.startDate)
        const end = seoulMidnightIso(row.endDate)
        if (start && end) next[keys.range] = { start, end }
        else delete next[keys.range]
        next[keys.unavailableDates] = (row.excludedDates ?? [])
          .map(d => ujatTypedDate(d))
          .filter((d): d is string => d != null)
        if (row.exclusion) {
          next[keys.exclusion] = {
            excludeNone: row.exclusion.excludeNone === true,
            excludeSaturday: row.exclusion.excludeSaturday === true,
            excludeSunday: row.exclusion.excludeSunday === true,
            excludeHoliday: holidayExcludedFromTyped(row.exclusion),
          }
        } else delete next[keys.exclusion]
      }
    }
  }
  return next ?? overlay
}

/**
 * 쓰기 직전 날짜 정규화 — BE 계약: typed 날짜는 항상 `"YYYY-MM-DD"` 문자열(number[]·Date·dayjs 금지).
 * - 필드 생략은 생략, `null` 은 `null`, `[]` 는 `[]` 그대로(JSON Merge Patch 의미 유지).
 * - 레거시 배열(`[2027,3,19]`)·Date·dayjs·시각 문자열은 서울 날짜 문자열로 바꾼다.
 * - 읽을 수 없는 날짜는 뺀다. 기간은 시작·끝 중 하나라도 못 읽으면 둘 다 `null`.
 */
function writeRowDates(row: UjatTypedScheduleRow, at: string): UjatTypedScheduleRow {
  const next: UjatTypedScheduleRow = { ...row }
  const hasStart = Object.prototype.hasOwnProperty.call(row, 'startDate')
  const hasEnd = Object.prototype.hasOwnProperty.call(row, 'endDate')
  if (hasStart || hasEnd) {
    const start =
      row.startDate == null ? null : normalizeStoredDate(row.startDate, `${at}.startDate`)
    const end = row.endDate == null ? null : normalizeStoredDate(row.endDate, `${at}.endDate`)
    const broken = (row.startDate != null && start == null) || (row.endDate != null && end == null)
    if (hasStart) next.startDate = broken ? null : start
    if (hasEnd) next.endDate = broken ? null : end
  }
  if (Array.isArray(row.dates)) next.dates = normalizeStoredDateList(row.dates, `${at}.dates`)
  if (Array.isArray(row.excludedDates)) {
    next.excludedDates = normalizeStoredDateList(row.excludedDates, `${at}.excludedDates`)
  }
  if (row.exclusion != null && isRecord(row.exclusion)) {
    next.exclusion = exclusionForTypedWrite(row.exclusion)
  }
  return next
}

export function normalizeUjatTypedHalfPlanForWrite(
  plan: UjatTypedHalfPlan,
  at = 'halfPlan'
): UjatTypedHalfPlan {
  if (!Array.isArray(plan.stages)) return plan
  return {
    ...plan,
    stages: plan.stages.map((stagePlan, si) =>
      Array.isArray(stagePlan.rows)
        ? {
            ...stagePlan,
            rows: stagePlan.rows.map((row, ri) =>
              isRecord(row) ? writeRowDates(row, `${at}.stages[${si}].rows[${ri}]`) : row
            ),
          }
        : stagePlan
    ),
  }
}

export function normalizeUjatTypedDetailForWrite<T extends object>(detail: T): T {
  if (!isRecord(detail) || !Array.isArray(detail.halfPlans)) return detail
  return {
    ...detail,
    halfPlans: detail.halfPlans.map((plan, pi) =>
      isRecord(plan)
        ? normalizeUjatTypedHalfPlanForWrite(plan as UjatTypedHalfPlan, `halfPlans[${pi}]`)
        : plan
    ),
  }
}
