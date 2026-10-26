/**
 * 일반 봉사 모집 행 `interviewConfig`(BE RecruitmentInterviewConfig, V80) ↔ overlay 면접 키 변환.
 *
 * - 쓰기: 상세 모집 저장 overlay(`recruit.volunteer.interview.*`)에서 typed 값을 만든다.
 * - 읽기: 행 응답의 typed 값이 overlay와 다를 때만 overlay 면접 키를 typed 값으로 덮는다.
 *   typed 가 null 이거나, BE overlay fallback 결과와 같으면 overlay를 그대로 둔다(기존 데이터 동작 유지).
 * UJAT 반기(h1/h2) 행은 여기서 다루지 않는다.
 */

export const VOLUNTEER_INTERVIEW_OVERLAY_PREFIX = 'recruit.volunteer.interview'

export type RecruitmentInterviewExclusionState = {
  excludeSaturday?: boolean | null
  excludeSunday?: boolean | null
  excludeHoliday?: boolean | null
}

export type RecruitmentInterviewException = {
  id?: string | null
  exceptionDate?: string | null
  selectedSlotKeys?: string[] | null
}

export type RecruitmentInterviewConfig = {
  schemaVersion?: number | null
  selectedSlotKeys?: string[] | null
  timeUnit?: number | null
  interviewTimeRange?: string[] | null
  specificUnavailableDates?: string[] | null
  appliedUnavailableDates?: string[] | null
  exclusionState?: RecruitmentInterviewExclusionState | null
  exceptions?: RecruitmentInterviewException[] | null
}

export const INTERVIEW_CONFIG_SCHEMA_VERSION = 1

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000
const SLOT_KEY = /^(\d+)-(\d+)$/
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/
const EXCEPTION_KEY = /^recruit\.volunteer\.interview\.exception\.([^.]+)\.(.+)$/

/** overlay 면접 키 중 typed 값이 덮는 접미사 */
const COVERED_SUFFIXES = [
  'selectedSlotKeys',
  'timeUnit',
  'interviewTimeRange',
  'appliedUnavailableDates',
  'specificUnavailableDates',
  'exclusionState',
] as const

function isPresent(value: unknown): boolean {
  return value !== null && value !== undefined
}

/** Dayjs·Date·문자열 → ISO 문자열 */
function toInstantText(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value.trim() || null
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

function parseInstantMs(raw: string | null): number | null {
  if (!raw || !ISO_INSTANT.test(raw)) return null
  const ms = Date.parse(raw)
  return Number.isNaN(ms) ? null : ms
}

function seoulDateOfMs(ms: number): string {
  return new Date(ms + SEOUL_OFFSET_MS).toISOString().slice(0, 10)
}

/** BE `isoDate` 와 같은 규칙 — 시각이면 서울 날짜, 아니면 앞 10자리 날짜 */
function isoDate(value: unknown): string | null {
  const raw = toInstantText(value)
  if (!raw) return null
  const ms = parseInstantMs(raw)
  if (ms != null) return seoulDateOfMs(ms)
  const head = raw.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(head)) return null
  const d = new Date(`${head}T00:00:00.000Z`)
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== head ? null : head
}

function textArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const item of value) {
    const text = toInstantText(item)
    if (text) out.push(text)
  }
  return out
}

function dateArray(value: unknown): string[] {
  return textArray(value)
    .map(isoDate)
    .filter((d): d is string => d != null)
}

function integerOrNull(value: unknown): number | null {
  if (value == null) return null
  const n =
    typeof value === 'number' ? Math.trunc(value) : Number.parseInt(String(value).trim(), 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

function booleanOrNull(value: unknown): boolean | null {
  if (value == null) return null
  if (typeof value === 'boolean') return value
  const text = String(value).trim().toLowerCase()
  if (text === 'true' || text === 'yes' || text === '1') return true
  if (text === 'false' || text === 'no' || text === '0') return false
  return null
}

/** BE `firstOverlay`(half 없음) — `ujat.recruit.volunteer.<suffix>` → `recruit.volunteer.<suffix>` */
function readOverlay(overlay: Record<string, unknown>, suffix: string): unknown {
  for (const key of [`ujat.recruit.volunteer.${suffix}`, `recruit.volunteer.${suffix}`]) {
    const v = overlay[key]
    if (isPresent(v)) return v
  }
  return undefined
}

function exceptionsFromOverlay(overlay: Record<string, unknown>): RecruitmentInterviewException[] {
  const drafts = new Map<string, RecruitmentInterviewException>()
  for (const [key, value] of Object.entries(overlay)) {
    const m = EXCEPTION_KEY.exec(key)
    if (!m) continue
    const [, id, suffix] = m
    const current = drafts.get(id) ?? { id, exceptionDate: null, selectedSlotKeys: [] }
    if (suffix === 'exceptionDate' || suffix === 'exceptionDateIso') {
      drafts.set(id, { ...current, exceptionDate: isoDate(value) })
    } else if (suffix === 'selectedSlotKeys') {
      drafts.set(id, { ...current, selectedSlotKeys: textArray(value) })
    }
  }
  return [...drafts.values()]
}

/**
 * BE `fromOverlay`(일반 행) 미러 — typed 가 null 인 봉사 행에서 서버가 돌려주는 값과 같은 모양.
 * 읽기에서 "typed 값이 overlay fallback 결과인지" 판별할 때만 쓴다.
 */
export function volunteerInterviewConfigFromOverlayLikeServer(
  overlay: Record<string, unknown> | null | undefined
): RecruitmentInterviewConfig | null {
  if (!overlay || Object.keys(overlay).length === 0) return null
  const slotKeys = textArray(
    readOverlay(overlay, 'interview.selectedSlotKeys') ?? readOverlay(overlay, 'selectedSlotKeys')
  )
  const timeUnit = integerOrNull(
    readOverlay(overlay, 'interview.timeUnit') ?? readOverlay(overlay, 'timeUnit')
  )
  const range = textArray(
    readOverlay(overlay, 'interview.interviewTimeRange') ??
      readOverlay(overlay, 'interviewTimeRange')
  )
    .map(t => parseInstantMs(t))
    .filter((ms): ms is number => ms != null)
    .map(ms => new Date(ms).toISOString())
  const applied = dateArray(
    readOverlay(overlay, 'interview.appliedUnavailableDates') ??
      readOverlay(overlay, 'appliedUnavailableDates')
  )
  const specific = dateArray(
    readOverlay(overlay, 'interview.specificUnavailableDates') ??
      readOverlay(overlay, 'specificUnavailableDates')
  )
  const exclusionRaw =
    readOverlay(overlay, 'interview.exclusionState') ?? readOverlay(overlay, 'exclusionState')
  const exclusion =
    exclusionRaw &&
    typeof exclusionRaw === 'object' &&
    !Array.isArray(exclusionRaw) &&
    Object.keys(exclusionRaw).length > 0
      ? (() => {
          const o = exclusionRaw as Record<string, unknown>
          return {
            excludeSaturday: booleanOrNull(o.excludeSaturday),
            excludeSunday: booleanOrNull(o.excludeSunday),
            excludeHoliday: booleanOrNull(
              'excludeHoliday' in o ? o.excludeHoliday : o.excludePublicHoliday
            ),
          }
        })()
      : null
  const exceptions = exceptionsFromOverlay(overlay)
  const present =
    slotKeys.length > 0 ||
    timeUnit != null ||
    range.length > 0 ||
    applied.length > 0 ||
    specific.length > 0 ||
    exclusion != null ||
    exceptions.length > 0
  if (!present) return null
  return {
    schemaVersion: INTERVIEW_CONFIG_SCHEMA_VERSION,
    selectedSlotKeys: slotKeys,
    timeUnit,
    interviewTimeRange: range,
    specificUnavailableDates: specific,
    appliedUnavailableDates: applied,
    exclusionState: exclusion,
    exceptions,
  }
}

function validSlotKeys(raw: unknown): string[] {
  const out: string[] = []
  for (const key of textArray(raw)) {
    const m = SLOT_KEY.exec(key)
    if (!m || Number(m[2]) <= Number(m[1])) continue
    if (!out.includes(key)) out.push(key)
  }
  return out
}

function uniq(values: string[]): string[] {
  return [...new Set(values)]
}

/**
 * 저장용 typed 값 — 화면 overlay 의미 그대로(`excludeNone` 이면 제외 없음).
 * 서버 400 을 피하려고 형식이 틀린 슬롯·날짜·범위는 뺀다. 면접 값이 하나도 없으면 빈 typed(`{schemaVersion:1}`).
 */
export function buildVolunteerInterviewConfigForSave(
  overlay: Record<string, unknown> | null | undefined
): RecruitmentInterviewConfig {
  const source = overlay ?? {}
  const p = VOLUNTEER_INTERVIEW_OVERLAY_PREFIX
  const config: RecruitmentInterviewConfig = { schemaVersion: INTERVIEW_CONFIG_SCHEMA_VERSION }

  const slotKeys = validSlotKeys(source[`${p}.selectedSlotKeys`])
  if (slotKeys.length > 0) config.selectedSlotKeys = slotKeys

  const timeUnit = integerOrNull(source[`${p}.timeUnit`])
  if (timeUnit != null && timeUnit >= 5 && timeUnit <= 120) config.timeUnit = timeUnit

  const rangeMs = textArray(source[`${p}.interviewTimeRange`]).map(parseInstantMs)
  if (rangeMs.length === 2 && rangeMs[0] != null && rangeMs[1] != null && rangeMs[1] > rangeMs[0]) {
    config.interviewTimeRange = rangeMs.map(ms => new Date(ms as number).toISOString())
  }

  const applied = uniq(dateArray(source[`${p}.appliedUnavailableDates`]))
  if (applied.length > 0) config.appliedUnavailableDates = applied
  const specific = uniq(dateArray(source[`${p}.specificUnavailableDates`]))
  if (specific.length > 0) config.specificUnavailableDates = specific

  const exclusionRaw = source[`${p}.exclusionState`]
  if (exclusionRaw && typeof exclusionRaw === 'object' && !Array.isArray(exclusionRaw)) {
    const o = exclusionRaw as Record<string, unknown>
    const none = o.excludeNone === true
    config.exclusionState = {
      excludeSaturday: !none && o.excludeSaturday === true,
      excludeSunday: !none && o.excludeSunday === true,
      excludeHoliday: !none && o.excludeHoliday === true,
    }
  }

  const exceptions: RecruitmentInterviewException[] = []
  for (const block of exceptionsFromOverlay(source)) {
    const keys = validSlotKeys(source[`${p}.exception.${block.id}.selectedSlotKeys`])
    if (block.exceptionDate == null && keys.length === 0) continue
    exceptions.push({
      id: block.id,
      exceptionDate: block.exceptionDate ?? null,
      selectedSlotKeys: keys,
    })
  }
  if (exceptions.length > 0) config.exceptions = exceptions
  return config
}

type Canonical = {
  slots: string
  timeUnit: number | null
  range: string
  specific: string
  applied: string
  sat: boolean
  sun: boolean
  hol: boolean
  exceptions: string
}

function canonical(config: RecruitmentInterviewConfig): Canonical {
  const sorted = (xs: string[] | null | undefined) => [...new Set(xs ?? [])].sort().join(',')
  const rangeMs = (config.interviewTimeRange ?? []).map(t => parseInstantMs(t) ?? t)
  return {
    slots: sorted(config.selectedSlotKeys),
    timeUnit: config.timeUnit ?? null,
    range: rangeMs.join(','),
    specific: sorted(config.specificUnavailableDates),
    applied: sorted(config.appliedUnavailableDates),
    sat: config.exclusionState?.excludeSaturday === true,
    sun: config.exclusionState?.excludeSunday === true,
    hol: config.exclusionState?.excludeHoliday === true,
    exceptions: (config.exceptions ?? [])
      .map(e => `${e.id ?? ''}|${e.exceptionDate ?? ''}|${sorted(e.selectedSlotKeys)}`)
      .sort()
      .join(';'),
  }
}

export function volunteerInterviewConfigsEqual(
  a: RecruitmentInterviewConfig | null | undefined,
  b: RecruitmentInterviewConfig | null | undefined
): boolean {
  if (a == null || b == null) return a == null && b == null
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b))
}

function isEmptyConfig(config: RecruitmentInterviewConfig): boolean {
  const c = canonical(config)
  return (
    !c.slots &&
    c.timeUnit == null &&
    !c.range &&
    !c.specific &&
    !c.applied &&
    !c.sat &&
    !c.sun &&
    !c.hol &&
    !c.exceptions
  )
}

/** 서울 자정 ISO. 날짜로 읽을 수 없으면 null(throw 하지 않는다) */
function seoulMidnightIso(value: unknown): string | null {
  const date = isoDate(value)
  if (!date) return null
  return new Date(Date.parse(`${date}T00:00:00.000Z`) - SEOUL_OFFSET_MS).toISOString()
}

function slotBounds(keys: string[]): [string, string] | null {
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  for (const key of keys) {
    const m = SLOT_KEY.exec(key)
    if (!m) continue
    min = Math.min(min, Number(m[1]))
    max = Math.max(max, Number(m[2]))
  }
  return Number.isFinite(min) && Number.isFinite(max) && max > min
    ? [new Date(min).toISOString(), new Date(max).toISOString()]
    : null
}

/**
 * 조회 — 행 typed 값을 overlay 면접 키에 반영한다.
 * typed 가 null/undefined 이거나 overlay 에서 나온 값(BE fallback·저장 모양)과 같으면 overlay 를 그대로 돌려준다.
 */
export function applyTypedVolunteerInterviewToOverlay(
  overlay: Record<string, unknown> | undefined,
  config: RecruitmentInterviewConfig | null | undefined
): Record<string, unknown> | undefined {
  if (config == null) return overlay
  const base = overlay ?? {}
  const fromServerFallback = volunteerInterviewConfigFromOverlayLikeServer(base)
  if (fromServerFallback != null && volunteerInterviewConfigsEqual(config, fromServerFallback))
    return overlay
  const fromSaveShape = buildVolunteerInterviewConfigForSave(base)
  if (volunteerInterviewConfigsEqual(config, fromSaveShape)) return overlay
  if (overlay == null && isEmptyConfig(config)) return overlay

  const p = VOLUNTEER_INTERVIEW_OVERLAY_PREFIX
  const next: Record<string, unknown> = { ...base }
  for (const suffix of COVERED_SUFFIXES) delete next[`${p}.${suffix}`]

  const slots = config.selectedSlotKeys ?? []
  if (slots.length > 0) next[`${p}.selectedSlotKeys`] = [...slots]
  if (config.timeUnit != null) next[`${p}.timeUnit`] = String(config.timeUnit)
  const range = (config.interviewTimeRange ?? [])
    .map(t => parseInstantMs(t))
    .filter((ms): ms is number => ms != null)
  if (range.length === 2)
    next[`${p}.interviewTimeRange`] = range.map(ms => new Date(ms).toISOString())
  if ((config.appliedUnavailableDates ?? []).length > 0) {
    next[`${p}.appliedUnavailableDates`] = [...(config.appliedUnavailableDates ?? [])]
  }
  if ((config.specificUnavailableDates ?? []).length > 0) {
    next[`${p}.specificUnavailableDates`] = [...(config.specificUnavailableDates ?? [])]
  }
  if (config.exclusionState != null) {
    const sat = config.exclusionState.excludeSaturday === true
    const sun = config.exclusionState.excludeSunday === true
    const hol = config.exclusionState.excludeHoliday === true
    const hasDates =
      (config.appliedUnavailableDates ?? []).length > 0 ||
      (config.specificUnavailableDates ?? []).length > 0
    next[`${p}.exclusionState`] = {
      excludeNone: !sat && !sun && !hol && !hasDates,
      excludeSaturday: sat,
      excludeSunday: sun,
      excludeHoliday: hol,
    }
  }

  const keepIds = new Set(
    (config.exceptions ?? []).map(e => e.id).filter((id): id is string => !!id)
  )
  for (const key of Object.keys(next)) {
    const m = EXCEPTION_KEY.exec(key)
    if (m && !keepIds.has(m[1])) delete next[key]
  }
  for (const exception of config.exceptions ?? []) {
    if (!exception.id) continue
    const block = `${p}.exception.${exception.id}`
    const isNewBlock = !Object.keys(base).some(k => k.startsWith(`${block}.`))
    const exceptionDate = seoulMidnightIso(exception.exceptionDate)
    if (exceptionDate) next[`${block}.exceptionDate`] = exceptionDate
    else delete next[`${block}.exceptionDate`]
    delete next[`${block}.exceptionDateIso`]
    const keys = exception.selectedSlotKeys ?? []
    next[`${block}.selectedSlotKeys`] = [...keys]
    if (isNewBlock) {
      if (config.timeUnit != null) next[`${block}.timeUnit`] = String(config.timeUnit)
      const bounds = slotBounds(keys)
      if (bounds) next[`${block}.interviewTimeRange`] = bounds
    }
  }
  return next
}

/**
 * typed `interviewConfig` 가 완전히 덮는 overlay 면접 키(프로그램 생성·PATCH 본문에서 빼는 대상).
 * - `recruit.volunteer.interview.{selectedSlotKeys,timeUnit,interviewTimeRange,appliedUnavailableDates,
 *   specificUnavailableDates,exclusionState}`
 * - `recruit.volunteer.interview.exception.<id>.{exceptionDate,exceptionDateIso,selectedSlotKeys}`
 * 예외 블록의 `timeUnit`·`interviewTimeRange`, `interviewTime`·`exceptionDate`(루트), `interviewRequired`·
 * `interviewMethod`, 접두사 없는 legacy `recruit.volunteer.<suffix>`, UJAT `ujat.recruit.volunteer.*` 는
 * typed 가 덮지 않으므로 그대로 보낸다.
 */
const TYPED_COVERED_EXCEPTION_SUFFIXES = new Set([
  'exceptionDate',
  'exceptionDateIso',
  'selectedSlotKeys',
])

export function isTypedCoveredVolunteerInterviewOverlayKey(key: string): boolean {
  const p = `${VOLUNTEER_INTERVIEW_OVERLAY_PREFIX}.`
  if (!key.startsWith(p)) return false
  const rest = key.slice(p.length)
  if ((COVERED_SUFFIXES as readonly string[]).includes(rest)) return true
  const m = EXCEPTION_KEY.exec(key)
  return m != null && TYPED_COVERED_EXCEPTION_SUFFIXES.has(m[2])
}

/**
 * 프로그램 생성·PATCH 의 serviceDetailJson 에서 typed 가 덮는 면접 키를 뺀다(생성은 봉사 행 interviewConfig 와 함께).
 * BE PATCH 는 키 단위 deep merge(빠진 키 유지)라 서버에 저장된 overlay 값은 지워지지 않는다(읽기 fallback 유지).
 * 뺄 키가 없으면 입력 문자열을 그대로 돌려준다.
 */
export function omitTypedVolunteerInterviewKeysFromServiceDetailJson(
  serviceDetailJson: string | undefined
): string | undefined {
  if (!serviceDetailJson) return serviceDetailJson
  let parsed: unknown
  try {
    parsed = JSON.parse(serviceDetailJson)
  } catch {
    return serviceDetailJson
  }
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed))
    return serviceDetailJson
  const root = parsed as Record<string, unknown>
  const registration = root.registration
  if (registration == null || typeof registration !== 'object' || Array.isArray(registration)) {
    return serviceDetailJson
  }
  const overlay = (registration as Record<string, unknown>).overlay
  if (overlay == null || typeof overlay !== 'object' || Array.isArray(overlay)) {
    return serviceDetailJson
  }
  const entries = Object.entries(overlay as Record<string, unknown>)
  const kept = entries.filter(([key]) => !isTypedCoveredVolunteerInterviewOverlayKey(key))
  if (kept.length === entries.length) return serviceDetailJson
  ;(registration as Record<string, unknown>).overlay = Object.fromEntries(kept)
  return JSON.stringify(root)
}

/**
 * Part7(keonhee 2026-10-25 21:09) — 저장(생성·PATCH) 본문에서 빼는 overlay 봉사 면접 키.
 * typed `interviewConfig`(봉사 행) 또는 행 필드(`interviewEnabled`)에 같은 정보가 있는 키만 뺀다.
 * - typed 가 덮는 9종(`isTypedCoveredVolunteerInterviewOverlayKey`)
 * - `recruit.volunteer.interviewRequired` → 행 `interviewEnabled`(BE 면접 스위치, typed 있으면 BE 가 보지 않음)
 * - `recruit.volunteer.interview.interviewTime` → typed `interviewTimeRange[0]`(시간 선택기 시작값, 화면도 범위에서 기본값을 만든다)
 * - `recruit.volunteer.interview.exceptionDate`(루트) → 공통 일정 칸에는 날짜 입력이 없다(예외 블록 날짜는 typed exceptions[].exceptionDate)
 * - 접두사 없는 legacy `recruit.volunteer.{selectedSlotKeys,timeUnit,interviewTimeRange,appliedUnavailableDates,
 *   specificUnavailableDates,exclusionState}` → typed 같은 필드(BE overlay fallback 만 읽고 FE 는 쓰지 않음)
 * 남기는 키(typed·행 어디에도 없음 — keonhee 확인 대상): `interviewMethod`, `interviewRangeSeal`·`interviewAnchorIso`
 * (면접 기간 — GENERAL 행 interviewStartAt/EndAt 은 GET 에서 null, CMS 읽기는 nested·overlay),
 * 예외 블록 `exception.<id>.{timeUnit,interviewTimeRange,interviewTime,exclusionState,appliedUnavailableDates}`(typed 예외는 id·날짜·슬롯만).
 */
const SAVE_OMITTED_VOLUNTEER_INTERVIEW_KEYS = new Set([
  'recruit.volunteer.interviewRequired',
  `${VOLUNTEER_INTERVIEW_OVERLAY_PREFIX}.interviewTime`,
  `${VOLUNTEER_INTERVIEW_OVERLAY_PREFIX}.exceptionDate`,
  ...COVERED_SUFFIXES.map(suffix => `recruit.volunteer.${suffix}`),
])

export function isVolunteerInterviewOverlayKeyOmittedOnSave(key: string): boolean {
  return (
    isTypedCoveredVolunteerInterviewOverlayKey(key) ||
    SAVE_OMITTED_VOLUNTEER_INTERVIEW_KEYS.has(key)
  )
}

/**
 * 저장 본문 serviceDetailJson — overlay 봉사 면접 키(`isVolunteerInterviewOverlayKeyOmittedOnSave`)와
 * `generalCommonInfo.volunteerInterviewScheduleInfo`(BE 가 typed 로 만드는 표시 복사본)를 뺀다.
 * 조건(호출부): UJAT 아님 + 반기 아닌 봉사 행 1개(생성은 그 행에 typed interviewConfig 를 함께 보냄).
 * BE PATCH 는 키 단위 deep merge 라 서버에 저장된 값은 지워지지 않는다(구 프로그램 읽기 fallback 유지).
 * 뺄 것이 없으면 입력 문자열을 그대로 돌려준다.
 */
export function omitVolunteerInterviewSaveKeysFromServiceDetailJson(
  serviceDetailJson: string | undefined
): string | undefined {
  if (!serviceDetailJson) return serviceDetailJson
  let parsed: unknown
  try {
    parsed = JSON.parse(serviceDetailJson)
  } catch {
    return serviceDetailJson
  }
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed))
    return serviceDetailJson
  const root = parsed as Record<string, unknown>
  let changed = false
  const common = root.generalCommonInfo
  if (
    common != null &&
    typeof common === 'object' &&
    !Array.isArray(common) &&
    Object.prototype.hasOwnProperty.call(common, 'volunteerInterviewScheduleInfo')
  ) {
    const { volunteerInterviewScheduleInfo: _schedule, ...rest } = common as Record<string, unknown>
    root.generalCommonInfo = rest
    changed = true
  }
  const registration = root.registration
  if (registration != null && typeof registration === 'object' && !Array.isArray(registration)) {
    const overlay = (registration as Record<string, unknown>).overlay
    if (overlay != null && typeof overlay === 'object' && !Array.isArray(overlay)) {
      const entries = Object.entries(overlay as Record<string, unknown>)
      const kept = entries.filter(([key]) => !isVolunteerInterviewOverlayKeyOmittedOnSave(key))
      if (kept.length !== entries.length) {
        ;(registration as Record<string, unknown>).overlay = Object.fromEntries(kept)
        changed = true
      }
    }
  }
  return changed ? JSON.stringify(root) : serviceDetailJson
}

/** overlay `recruit.volunteer.interviewRequired`(yes/no) → boolean. 없거나 다른 값이면 undefined */
export function volunteerInterviewRequiredFromOverlay(
  overlay: Record<string, unknown> | null | undefined
): boolean | undefined {
  const raw = overlay?.['recruit.volunteer.interviewRequired']
  if (raw === 'yes' || raw === true) return true
  if (raw === 'no' || raw === false) return false
  return undefined
}

/**
 * 저장용 전체 typed — 모든 필드를 명시한다(배열은 `[]`, 값 없음은 null).
 * BE `interviewConfig` 는 객체 단위 교체이고 normalizeAndValidate 가 생략 배열을 `[]` 로 만든다(keonhee 2026-10-25) —
 * 보낸 객체가 그대로 저장 값이 되도록 빈 값도 드러낸다.
 */
export function completeVolunteerInterviewConfig(
  config: RecruitmentInterviewConfig | null | undefined
): RecruitmentInterviewConfig {
  const c = config ?? {}
  return {
    schemaVersion: INTERVIEW_CONFIG_SCHEMA_VERSION,
    selectedSlotKeys: [...(c.selectedSlotKeys ?? [])],
    timeUnit: c.timeUnit ?? null,
    interviewTimeRange: [...(c.interviewTimeRange ?? [])],
    specificUnavailableDates: [...(c.specificUnavailableDates ?? [])],
    appliedUnavailableDates: [...(c.appliedUnavailableDates ?? [])],
    exclusionState: c.exclusionState
      ? {
          excludeSaturday: c.exclusionState.excludeSaturday ?? null,
          excludeSunday: c.exclusionState.excludeSunday ?? null,
          excludeHoliday: c.exclusionState.excludeHoliday ?? null,
        }
      : null,
    exceptions: (c.exceptions ?? []).map(exception => ({
      id: exception.id ?? null,
      exceptionDate: exception.exceptionDate ?? null,
      selectedSlotKeys: [...(exception.selectedSlotKeys ?? [])],
    })),
  }
}

const CONFIG_FIELD_BY_SUFFIX = {
  selectedSlotKeys: 'selectedSlotKeys',
  timeUnit: 'timeUnit',
  interviewTimeRange: 'interviewTimeRange',
  specificUnavailableDates: 'specificUnavailableDates',
  appliedUnavailableDates: 'appliedUnavailableDates',
  exclusionState: 'exclusionState',
} as const satisfies Record<(typeof COVERED_SUFFIXES)[number], keyof RecruitmentInterviewConfig>

/**
 * 모집 행 PATCH 용 interviewConfig — 저장된 typed 와 이번 저장 폼(overlay)을 합친 전체 객체. 부분 객체는 만들지 않는다.
 * - overlay 에 typed 가 덮는 면접 키(`isTypedCoveredVolunteerInterviewOverlayKey`)가 하나도 없으면 undefined
 *   (보내지 않음 = BE 유지). overlay 에 남는 예외 블록 `timeUnit`·`interviewTimeRange` 만으로는 보내지 않는다.
 * - 필드별: overlay 에 그 키가 있으면 폼 값(빈 배열이면 비움), 없으면 저장 typed 값.
 *   typed 가 없는 구 프로그램은 BE overlay fallback 과 같은 규칙(접두사 없는 legacy 키 포함)으로 읽은 값.
 * - 예외: overlay 에 예외 날짜·슬롯 키가 있거나 시간대(selectedSlotKeys) 키가 있으면(폼 면접 일정 전체 상태) 폼 예외,
 *   아니면 저장 값.
 */
export function buildVolunteerInterviewConfigForRowSave(
  overlay: Record<string, unknown> | null | undefined,
  stored: RecruitmentInterviewConfig | null | undefined
): RecruitmentInterviewConfig | undefined {
  const source = overlay ?? {}
  const p = VOLUNTEER_INTERVIEW_OVERLAY_PREFIX
  const keys = Object.keys(source).filter(isTypedCoveredVolunteerInterviewOverlayKey)
  if (keys.length === 0) return undefined
  const fromForm = buildVolunteerInterviewConfigForSave(source)
  const base = stored ?? volunteerInterviewConfigFromOverlayLikeServer(source) ?? {}
  const merged: RecruitmentInterviewConfig = { schemaVersion: INTERVIEW_CONFIG_SCHEMA_VERSION }
  for (const suffix of COVERED_SUFFIXES) {
    const field = CONFIG_FIELD_BY_SUFFIX[suffix]
    const value = Object.prototype.hasOwnProperty.call(source, `${p}.${suffix}`)
      ? fromForm[field]
      : base[field]
    ;(merged as Record<string, unknown>)[field] = value ?? null
  }
  const formOwnsExceptions =
    keys.some(key => EXCEPTION_KEY.test(key)) ||
    Object.prototype.hasOwnProperty.call(source, `${p}.selectedSlotKeys`)
  merged.exceptions = formOwnsExceptions ? (fromForm.exceptions ?? []) : (base.exceptions ?? [])
  return completeVolunteerInterviewConfig(merged)
}
