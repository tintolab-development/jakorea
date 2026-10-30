/**
 * 「교육 진행 장소」 재조회 fallback — overlay에 모드·주소·행 값이 없을 때
 * BE가 복사한 `serviceDetailJson.generalCommonInfo`에서 읽는다.
 * 행 키는 educationFormBySession과 같은 카운터: 사전 교육 행은 건너뛰고(키 없음),
 * 본 행만 1부터 센다. 사전 교육 OFF여도 첫 본 행은 '1'.
 * 모드가 null(BE 미지정)이고 공통 주소만 있으면 common으로 본다.
 */
import type {
  GeneralProgramCommonInfoExtension,
  GeneralProgramScheduleDetailKind,
} from '@/types/domain'
import {
  REGISTRATION_WIZARD_EDUCATION_PLACE_ADDRESS_KEY,
  REGISTRATION_WIZARD_EDUCATION_PLACE_BY_DETAIL_KEY,
  REGISTRATION_WIZARD_EDUCATION_PLACE_BY_SESSION_KEY,
  REGISTRATION_WIZARD_EDUCATION_PLACE_SCHEDULE_DETAIL_KEY,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-overlay-path-map'
import {
  isPreEducationCurriculumSession,
  isPreEducationScheduleBlock,
} from '@/features/program/general/lib/schedule-detail-form'

export type EducationPlaceHydrateValues = {
  scheduleDetail?: GeneralProgramScheduleDetailKind
  address?: string
  bySession: Record<number, string>
  byDetail: Record<number, string>
}

function trimmedText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const text = value.trim()
  return text ? text : undefined
}

function hasRowText(raw: unknown): boolean {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return false
  return Object.values(raw as Record<string, unknown>).some(value => trimmedText(value))
}

/** overlay에 장소 모드·공통 주소·행 값이 하나라도 있으면 overlay가 정본이다. */
export function overlayHasEducationPlaceValues(
  overlay: Record<string, unknown> | undefined
): boolean {
  if (!overlay) return false
  const mode = overlay[REGISTRATION_WIZARD_EDUCATION_PLACE_SCHEDULE_DETAIL_KEY]
  return (
    mode === 'common' ||
    mode === 'perSchedule' ||
    trimmedText(overlay[REGISTRATION_WIZARD_EDUCATION_PLACE_ADDRESS_KEY]) !== undefined ||
    hasRowText(overlay[REGISTRATION_WIZARD_EDUCATION_PLACE_BY_SESSION_KEY]) ||
    hasRowText(overlay[REGISTRATION_WIZARD_EDUCATION_PLACE_BY_DETAIL_KEY])
  )
}

/**
 * 커리큘럼 사전 행 판정 — `curriculumOverlayFromProgram`(educationFormBySession 키)과 같은 카운터를 쓰도록
 * 라벨에 「사전」「연수」가 있으면 사전 행으로 본다.
 */
export function isPreCurriculumRowForOverlayKey(row: {
  sessionLabel?: string
  isPreEducation?: boolean
  preEducation?: boolean
}): boolean {
  const label = row.sessionLabel ?? ''
  return isPreEducationCurriculumSession(row) || label.includes('사전') || label.includes('연수')
}

/** 일정형 사전 행 판정 — `scheduleOverlayFromProgram`(educationFormByDetail 키)과 같은 카운터 */
export function isPreScheduleRowForOverlayKey(
  row: Parameters<typeof isPreEducationScheduleBlock>[0]
): boolean {
  const label = row.scheduleLabel ?? ''
  return isPreEducationScheduleBlock(row) || label.includes('사전') || label.includes('연수')
}

function rowPlacesByOverlayKey<T>(
  rows: readonly T[] | undefined,
  isPre: (row: T) => boolean,
  placeOf: (row: T) => unknown
): Record<number, string> {
  const out: Record<number, string> = {}
  let regularCount = 0
  for (const row of rows ?? []) {
    if (isPre(row)) continue
    regularCount += 1
    const place = trimmedText(placeOf(row))
    if (place) out[regularCount] = place
  }
  return out
}

/** BE 복사본(generalCommonInfo) → overlay 키 규칙의 장소 값. 없으면 빈 값. */
export function educationPlaceFromGeneralCommonInfo(
  common: GeneralProgramCommonInfoExtension | undefined
): EducationPlaceHydrateValues {
  if (!common) return { bySession: {}, byDetail: {} }
  const rawMode = common.educationPlaceScheduleDetail
  const address = trimmedText(common.educationPlaceAddress)
  const bySession = rowPlacesByOverlayKey(
    common.curriculumSessions,
    isPreCurriculumRowForOverlayKey,
    row => row.educationPlaceAddress
  )
  const byDetail = rowPlacesByOverlayKey(
    common.scheduleDetails,
    isPreScheduleRowForOverlayKey,
    row => row.educationPlaceAddress
  )
  const scheduleDetail: GeneralProgramScheduleDetailKind | undefined =
    rawMode === 'common' || rawMode === 'perSchedule'
      ? rawMode
      : address
        ? 'common'
        : Object.keys(bySession).length > 0 || Object.keys(byDetail).length > 0
          ? 'perSchedule'
          : undefined
  if (scheduleDetail === 'perSchedule') return { scheduleDetail, bySession, byDetail }
  return { scheduleDetail, ...(address ? { address } : {}), bySession: {}, byDetail: {} }
}

/**
 * 재조회 우선순위: overlay 모드/주소/행 값 → 없으면 generalCommonInfo 복사본.
 * 반환 overlay는 입력을 바꾸지 않은 사본(또는 입력 그대로).
 */
export function overlayWithEducationPlaceCommonInfoFallback(
  overlay: Record<string, unknown> | undefined,
  common: GeneralProgramCommonInfoExtension | undefined
): Record<string, unknown> | undefined {
  if (overlayHasEducationPlaceValues(overlay)) return overlay
  const fallback = educationPlaceFromGeneralCommonInfo(common)
  if (!fallback.scheduleDetail) return overlay
  const next: Record<string, unknown> = {
    ...(overlay ?? {}),
    [REGISTRATION_WIZARD_EDUCATION_PLACE_SCHEDULE_DETAIL_KEY]: fallback.scheduleDetail,
  }
  if (fallback.address) next[REGISTRATION_WIZARD_EDUCATION_PLACE_ADDRESS_KEY] = fallback.address
  if (Object.keys(fallback.bySession).length > 0) {
    next[REGISTRATION_WIZARD_EDUCATION_PLACE_BY_SESSION_KEY] = fallback.bySession
  }
  if (Object.keys(fallback.byDetail).length > 0) {
    next[REGISTRATION_WIZARD_EDUCATION_PLACE_BY_DETAIL_KEY] = fallback.byDetail
  }
  return next
}
