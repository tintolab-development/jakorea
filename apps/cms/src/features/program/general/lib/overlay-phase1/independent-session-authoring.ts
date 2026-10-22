/**
 * Independent 세션 작성 계약. 제품 apply/extrasFromGeneralProgram 을 호출하지 않는다.
 * nested curriculumSessions 가 정본. overlay maps 는 미러 또는 nested 부재 시 레거시 복원.
 */
import type {
  GeneralProgramCurriculumSessionRow,
  GeneralProgramScheduleDetailRow,
  Program,
} from '@/types/domain'
import type { GeneralRegistrationEditorExtras } from '@/features/program/general/lib/registration-overlay-to-program'
import {
  isPreEducationCurriculumSession,
  isPreEducationScheduleBlock,
} from '@/features/program/general/lib/schedule-detail-form'
import type {
  CommonInfoCurriculumMaps,
  CommonInfoScheduleMaps,
  IndependentNestedArrayIntent,
  IndependentSessionAuthoring,
} from './common-info-form-values'

export type NestedArrayPatchIntent = 'omit' | 'clear' | 'replace'

function isPositiveInt(value: number): boolean {
  return Number.isInteger(value) && value > 0
}

function sessionValueFilled(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() !== ''
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return false
  const row = value as { enabled?: boolean; period?: string; category?: string }
  return row.enabled === true || Boolean(row.period?.trim()) || Boolean(row.category?.trim())
}

export function collectPositiveMapKeys(records: Array<Record<number, unknown>>): number[] {
  const keys = new Set<number>()
  for (const record of records) {
    for (const [raw, value] of Object.entries(record)) {
      const index = Number(raw)
      if (!isPositiveInt(index) || !sessionValueFilled(value)) continue
      keys.add(index)
    }
  }
  return [...keys].sort((a, b) => a - b)
}

export function parseSessionNoFromLabel(label: string | undefined): number | undefined {
  const match = label?.match(/(\d+)\s*(회차|차시)/)
  if (!match) return undefined
  const n = Number(match[1])
  return isPositiveInt(n) ? n : undefined
}

export function nestedCurriculumSessionNos(
  sessions: GeneralProgramCurriculumSessionRow[] | undefined
): number[] {
  return (sessions ?? [])
    .filter(session => !isPreEducationCurriculumSession(session))
    .map((session, index) => {
      if (typeof session.sessionNo === 'number' && isPositiveInt(session.sessionNo)) {
        return session.sessionNo
      }
      return parseSessionNoFromLabel(session.sessionLabel) ?? index + 1
    })
}

/**
 * 상세 RHF mapper는 sessionNo를 쓰지 않는다. Independent 상세 PATCH가 기존 식별자를 유지한다.
 * 새 행은 구멍을 채우지 않고 max+1을 붙인다.
 */
export function preserveCurriculumSessionNos(
  mapped: GeneralProgramCurriculumSessionRow[] | undefined,
  existing: GeneralProgramCurriculumSessionRow[] | undefined
): GeneralProgramCurriculumSessionRow[] | undefined {
  if (!mapped) return mapped
  const existingRegular = (existing ?? []).filter(session => !isPreEducationCurriculumSession(session))
  const existingNos = nestedCurriculumSessionNos(existing)
  const used = new Set<number>()
  let regularIndex = 0
  return mapped.map(row => {
    if (isPreEducationCurriculumSession(row)) return row
    const index = regularIndex
    regularIndex += 1
    if (typeof row.sessionNo === 'number' && isPositiveInt(row.sessionNo)) {
      used.add(row.sessionNo)
      return row
    }
    const fromExisting = existingNos[index]
    if (fromExisting != null && !used.has(fromExisting)) {
      used.add(fromExisting)
      return { ...row, sessionNo: fromExisting }
    }
    const labeled = parseSessionNoFromLabel(row.sessionLabel)
    if (labeled != null && !used.has(labeled)) {
      used.add(labeled)
      return { ...row, sessionNo: labeled }
    }
    let next = existingNos.length > 0 ? Math.max(...existingNos, ...used) + 1 : used.size + 1
    if (existingRegular.length === 0 && labeled == null) next = Math.max(next, index + 1)
    while (used.has(next)) next += 1
    used.add(next)
    return { ...row, sessionNo: next }
  })
}

export function isNestedArrayPresent<T>(value: T[] | undefined | null): value is T[] {
  return Array.isArray(value)
}

function extrasCurriculumCount(extras: GeneralRegistrationEditorExtras): number | undefined {
  return extras.sessionRoundType === 'multi'
    ? extras.curriculumSessionCount
    : extras.curriculumChartSessionCount ?? extras.curriculumSessionCount
}

function appendSparseSessionNos(current: number[], needed: number): number[] {
  const out = [...current]
  let next = out.length > 0 ? Math.max(...out) + 1 : 1
  while (out.length < needed) {
    if (!out.includes(next)) out.push(next)
    next += 1
  }
  return out
}

/**
 * 정본 sessionNo 목록.
 * nested가 있으면 overlay map 최대 키로 개수를 늘리지 않는다.
 * 구멍(1,3)을 2로 채우지 않는다.
 */
export function resolveCurriculumSessionNos(args: {
  maps: CommonInfoCurriculumMaps
  extras: GeneralRegistrationEditorExtras
  baseline: Program
  explicitSessionNos?: number[]
  intent?: IndependentNestedArrayIntent<GeneralProgramCurriculumSessionRow>
}): number[] {
  if (args.intent?.kind === 'clear') return []
  if (args.intent?.kind === 'replace') {
    return nestedCurriculumSessionNos(args.intent.value)
  }
  if (args.explicitSessionNos) {
    return args.explicitSessionNos.filter(isPositiveInt)
  }
  if (args.intent?.kind === 'maps' && args.intent.sessionNos) {
    return args.intent.sessionNos.filter(isPositiveInt)
  }

  const mapKeys = collectPositiveMapKeys([
    args.maps.unitNameBySession,
    args.maps.unitContentBySession,
    args.maps.progressSessionByRound,
    args.maps.roundContentByRound,
    args.maps.ipsBySession,
    args.maps.assignmentByRound,
    args.maps.educationFormBySession,
    args.maps.participationBySession,
  ])
  const extrasCount = extrasCurriculumCount(args.extras)
  const nested = args.baseline.generalCommonInfo?.curriculumSessions
  const nestedPresent = isNestedArrayPresent(nested)

  if (extrasCount === 0 && mapKeys.length === 0) return []

  if (nestedPresent) {
    const nestedNos = nestedCurriculumSessionNos(nested)
    const target = extrasCount ?? nestedNos.length
    if (target === 0) return []
    if (target <= nestedNos.length) return nestedNos.slice(0, target)
    const extraNeeded = target - nestedNos.length
    const fromMaps = mapKeys.filter(key => !nestedNos.includes(key)).slice(0, extraNeeded)
    return appendSparseSessionNos([...nestedNos, ...fromMaps], target)
  }

  if (mapKeys.length > 0) {
    if (extrasCount == null) return mapKeys
    if (extrasCount === 0) return []
    if (extrasCount < mapKeys.length) return mapKeys.slice(0, extrasCount)
    if (extrasCount === mapKeys.length) return mapKeys
    return appendSparseSessionNos(mapKeys, extrasCount)
  }

  const createSlots = extrasCount ?? 1
  if (createSlots <= 0) return []
  return Array.from({ length: createSlots }, (_, index) => index + 1)
}

export function resolveScheduleDetailNos(args: {
  maps: CommonInfoScheduleMaps
  extras: GeneralRegistrationEditorExtras
  baseline: Program
  intent?: IndependentNestedArrayIntent<GeneralProgramScheduleDetailRow>
}): number[] {
  if (args.intent?.kind === 'clear') return []
  if (args.intent?.kind === 'replace') {
    return args.intent.value
      .filter(row => !isPreEducationScheduleBlock(row))
      .map((_, index) => index + 1)
  }
  const mapKeys = collectPositiveMapKeys([
    args.maps.eventNameByDetail,
    args.maps.scheduleDateByDetailIso,
    args.maps.groupTimesByDetail,
    args.maps.educationFormByDetail,
    args.maps.participationByDetail,
    args.maps.ipsByDetailIndex,
    args.maps.assignmentByDetail,
  ])
  const extrasCount = args.extras.scheduleCurriculumDetailCount
  const nested = args.baseline.generalCommonInfo?.scheduleDetails
  const nestedPresent = isNestedArrayPresent(nested)
  const nestedCount = (nested ?? []).filter(row => !isPreEducationScheduleBlock(row)).length

  if (extrasCount === 0 && mapKeys.length === 0) return []

  if (nestedPresent) {
    const target = extrasCount ?? nestedCount
    if (target === 0) return []
    if (target <= nestedCount) {
      return Array.from({ length: target }, (_, index) => index + 1)
    }
    const extraNeeded = target - nestedCount
    const fromMaps = mapKeys.filter(key => key > nestedCount).slice(0, extraNeeded)
    return appendSparseSessionNos(
      [
        ...Array.from({ length: nestedCount }, (_, index) => index + 1),
        ...fromMaps,
      ],
      target
    )
  }

  if (mapKeys.length > 0) {
    if (extrasCount == null) return mapKeys
    if (extrasCount === 0) return []
    if (extrasCount < mapKeys.length) return mapKeys.slice(0, extrasCount)
    if (extrasCount === mapKeys.length) return mapKeys
    return appendSparseSessionNos(mapKeys, extrasCount)
  }

  const createSlots = extrasCount ?? 1
  if (createSlots <= 0) return []
  return Array.from({ length: createSlots }, (_, index) => index + 1)
}

export function resolveNestedArrayIntent<T>(
  intent: IndependentNestedArrayIntent<T> | undefined,
  built: T[] | undefined,
  baseline: T[] | undefined
): { intent: NestedArrayPatchIntent; value?: T[] } {
  if (intent?.kind === 'omit') return { intent: 'omit' }
  if (intent?.kind === 'clear') return { intent: 'clear', value: [] }
  if (intent?.kind === 'replace') return { intent: 'replace', value: intent.value }
  if (built === undefined) return { intent: 'omit' }
  if (nestedRowsEqual(built, baseline)) return { intent: 'omit' }
  if (built.length === 0) return { intent: 'clear', value: [] }
  return { intent: 'replace', value: built }
}

export function nestedRowsEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizeNested(a)) === JSON.stringify(normalizeNested(b))
}

function isMapperDefaultEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === false || value === ''
}

function normalizeNested(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeNested)
  if (value != null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const item = (value as Record<string, unknown>)[key]
      if (isMapperDefaultEmpty(item)) continue
      out[key] = normalizeNested(item)
    }
    return out
  }
  return value
}

export function resolveProgramEducationStructure(
  program: Pick<Program, 'generalProgramEducationStructure'>
): 'curriculum' | 'schedule' {
  return program.generalProgramEducationStructure === 'schedule' ? 'schedule' : 'curriculum'
}

export function isEducationStructureChanged(
  existing: Pick<Program, 'generalProgramEducationStructure'>,
  next: 'curriculum' | 'schedule'
): boolean {
  return resolveProgramEducationStructure(existing) !== next
}

export function pickCurriculumForDraft(args: {
  extras: GeneralRegistrationEditorExtras
  authoring?: IndependentSessionAuthoring
  builtFromMaps: GeneralProgramCurriculumSessionRow[]
  baseline: Program
}): GeneralProgramCurriculumSessionRow[] | undefined {
  const intent = args.authoring?.curriculum
  if (intent?.kind === 'omit') return args.baseline.generalCommonInfo?.curriculumSessions
  if (intent?.kind === 'clear') return []
  if (intent?.kind === 'replace') return intent.value
  if (args.extras.programType === 'schedule') {
    if (resolveProgramEducationStructure(args.baseline) === 'schedule') {
      return args.baseline.generalCommonInfo?.curriculumSessions
    }
    return []
  }
  return args.builtFromMaps
}

export function pickScheduleForDraft(args: {
  extras: GeneralRegistrationEditorExtras
  authoring?: IndependentSessionAuthoring
  builtFromMaps: GeneralProgramScheduleDetailRow[]
  baseline: Program
}): GeneralProgramScheduleDetailRow[] | undefined {
  const intent = args.authoring?.schedule
  if (intent?.kind === 'omit') return args.baseline.generalCommonInfo?.scheduleDetails
  if (intent?.kind === 'clear') return []
  if (intent?.kind === 'replace') return intent.value
  if (args.extras.programType !== 'schedule') {
    if (resolveProgramEducationStructure(args.baseline) === 'curriculum') {
      return args.baseline.generalCommonInfo?.scheduleDetails
    }
    return []
  }
  return args.builtFromMaps
}
