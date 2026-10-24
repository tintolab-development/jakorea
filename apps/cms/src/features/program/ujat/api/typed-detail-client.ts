import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { UjatBasicInfoFormValues } from '@/features/program/ujat/lib/ujat-basic-info-form'

/**
 * JABACK UJAT Typed detail v1.
 *
 * This module intentionally keeps the legacy overlay conversion at the FE boundary only. The
 * admin API stores the typed document under `ujatTypedDetail`; it never receives a
 * `registration.overlay` write from these functions.
 */
export type UjatTypedTextbookPlan = {
  provisionMethod?: string | null
  responsiblePerson?: string | null
}

export type UjatTypedExclusionPolicy = {
  excludeNone?: boolean | null
  excludeSaturday?: boolean | null
  excludeSunday?: boolean | null
  excludePublicHoliday?: boolean | null
}

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
  textbook?: UjatTypedTextbookPlan | null
  excludedDates?: string[] | null
  exclusion?: UjatTypedExclusionPolicy | null
}

export type UjatTypedEducationStagePlan = {
  stage?: 'PRE_EDUCATION' | 'MAIN_EDUCATION' | 'POST_EDUCATION' | string | null
  rows?: UjatTypedScheduleRow[] | null
}

export type UjatTypedHalfPlan = {
  semesterType?: 'FIRST_HALF' | 'SECOND_HALF' | string | null
  stages?: UjatTypedEducationStagePlan[] | null
}

export type UjatTypedHalfSettings = {
  semesterType?: 'FIRST_HALF' | 'SECOND_HALF' | string | null
  enabled?: boolean | null
  note?: string | null
}

export type UjatTypedAttendancePolicy = {
  maxAbsenceCount?: number | null
  lateCountsAsAbsent?: boolean | null
  lateDeductStartTime?: string | null
}

export type UjatTyped1365Policy = {
  enabled?: boolean | null
  defaultHours?: number | null
}

export type UjatTypedSurveySetting = {
  surveyType?:
    | 'SURVEY'
    | 'VOLUNTEER_SATISFACTION'
    | 'SCHOOL_SATISFACTION'
    | 'LECTURE_EVALUATION'
    | string
    | null
  enabled?: boolean | null
}

export type UjatTypedParticipantSettings = {
  individual?: boolean | null
  organization?: boolean | null
  teacher?: boolean | null
  volunteer?: boolean | null
}

export type UjatTypedCommonSettings = {
  halfSettings?: UjatTypedHalfSettings[] | null
  regionGroups?: string[] | null
  attendancePolicy?: UjatTypedAttendancePolicy | null
  i1365?: UjatTyped1365Policy | null
  surveySettings?: UjatTypedSurveySetting[] | null
  participantSettings?: UjatTypedParticipantSettings | null
}

export type UjatTypedDetail = {
  schemaVersion?: number | null
  halfPlans?: UjatTypedHalfPlan[] | null
  common?: UjatTypedCommonSettings | null
}

/** Build the Typed common settings directly from the registration Wizard RHF snapshot. */
export function typedDetailFromUjatBasicInfo(
  values: Partial<UjatBasicInfoFormValues>,
  existing?: UjatTypedDetail
): UjatTypedDetail {
  const participantTypes = new Set(values.generalParticipantTypes ?? [])
  const common = { ...(existing?.common ?? {}) }
  common.surveySettings = ([
    ['SURVEY', values.surveySurvey === true],
    ['VOLUNTEER_SATISFACTION', values.surveyVolunteerSatisfaction === true],
    ['SCHOOL_SATISFACTION', values.surveySchoolSatisfaction === true],
    ['LECTURE_EVALUATION', values.surveyLectureEvaluation === true],
  ] as const).map(([surveyType, enabled]) => ({ surveyType, enabled }))
  common.participantSettings = {
    individual: participantTypes.has('individual'),
    organization:
      participantTypes.has('organization') || participantTypes.has('school_institution'),
    teacher: participantTypes.has('teacher') || participantTypes.has('teacher_instructor'),
    volunteer: participantTypes.has('volunteer'),
  }
  return {
    ...(existing ?? {}),
    schemaVersion: existing?.schemaVersion ?? 1,
    common,
  }
}

export async function fetchUjatTypedDetailRemote(programId: string): Promise<UjatTypedDetail> {
  const response = await customInstance<unknown>({
    url: `/api/admin/programs/${encodeURIComponent(programId)}/ujat/typed-detail`,
    method: 'GET',
  })
  return unwrapApiBody<UjatTypedDetail>(response)
}

export async function replaceUjatTypedDetailRemote(
  programId: string,
  detail: UjatTypedDetail
): Promise<UjatTypedDetail> {
  const response = await customInstance<unknown>({
    url: `/api/admin/programs/${encodeURIComponent(programId)}/ujat/typed-detail`,
    method: 'PUT',
    data: detail,
  })
  return unwrapApiBody<UjatTypedDetail>(response)
}

export async function patchUjatTypedDetailRemote(
  programId: string,
  patch: Record<string, unknown>
): Promise<UjatTypedDetail> {
  const response = await customInstance<unknown>({
    url: `/api/admin/programs/${encodeURIComponent(programId)}/ujat/typed-detail`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/merge-patch+json' },
    data: patch,
  })
  return unwrapApiBody<UjatTypedDetail>(response)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function own(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key)
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function numberList(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null
  const values = value
    .map(item => (typeof item === 'number' ? item : Number(item)))
    .filter(item => Number.isInteger(item) && item > 0)
  return values.length === value.length ? values : null
}

function readRange(value: unknown): { startDate: string | null; endDate: string | null } {
  const range: Record<string, unknown> = isRecord(value) ? value : {}
  return {
    startDate: stringValue(range.start ?? range.startDate),
    endDate: stringValue(range.end ?? range.endDate),
  }
}

function stagePrefix(half: 'h1' | 'h2', stage: 'pre' | 'event' | 'closing'): string {
  return `ujat.${half}.${stage}`
}

function stageCode(stage: 'pre' | 'event' | 'closing') {
  return stage === 'pre' ? 'PRE_EDUCATION' : stage === 'event' ? 'MAIN_EDUCATION' : 'POST_EDUCATION'
}

function overlayStageKeys(half: 'h1' | 'h2', stage: 'pre' | 'event' | 'closing') {
  const prefix = stagePrefix(half, stage)
  return {
    name: `${prefix}.name`,
    delivery: `${prefix}.delivery`,
    range: `${prefix}.range`,
    scheduleIds: `${prefix}.scheduleIds`,
    multi: `${prefix}.multi`,
  }
}

function overlayStageToRows(
  overlay: Record<string, unknown>,
  half: 'h1' | 'h2',
  stage: 'pre' | 'event' | 'closing',
  existingRows: UjatTypedScheduleRow[] = []
): UjatTypedScheduleRow[] {
  const keys = overlayStageKeys(half, stage)
  const base = existingRows[0] ?? {}
  const name = stringValue(overlay[keys.name]) ?? stringValue(base.educationName) ?? `${half}-${stage}`
  const method =
    stringValue(overlay[keys.delivery]) ?? stringValue(base.educationMethod) ?? 'LEGACY'
  const rawRange = isRecord(overlay[keys.range])
    ? (overlay[keys.range] as Record<string, unknown>)
    : null
  const range = rawRange
    ? {
        startDate:
          own(rawRange, 'start') || own(rawRange, 'startDate')
            ? stringValue(rawRange.start ?? rawRange.startDate)
            : base.startDate ?? null,
        endDate:
          own(rawRange, 'end') || own(rawRange, 'endDate')
            ? stringValue(rawRange.end ?? rawRange.endDate)
            : base.endDate ?? null,
      }
    : readRange(overlay[keys.range])
  const scheduleIds =
    numberList(overlay[keys.scheduleIds]) ?? base.scheduleIds ?? []
  const unavailableDatesKey = `ujat.${half}.eduSchedule.unavailableDates`
  const exclusionKey = `ujat.${half}.eduSchedule.exclusion`
  const excludedDates =
    Array.isArray(overlay[unavailableDatesKey])
      ? (overlay[unavailableDatesKey] as unknown[]).filter(
          (item): item is string => typeof item === 'string'
        )
      : base.excludedDates ?? null
  const exclusion = isRecord(overlay[exclusionKey])
    ? (overlay[exclusionKey] as UjatTypedExclusionPolicy)
    : base.exclusion ?? null
  const textbook =
    stage === 'pre' &&
    (own(overlay, `ujat.${half}.pre.textbookMode`) ||
      own(overlay, `ujat.${half}.pre.textbookInstructorId`))
      ? {
          provisionMethod: own(overlay, `ujat.${half}.pre.textbookMode`)
            ? stringValue(overlay[`ujat.${half}.pre.textbookMode`])
            : base.textbook?.provisionMethod ?? null,
          responsiblePerson: own(overlay, `ujat.${half}.pre.textbookInstructorId`)
            ? stringValue(overlay[`ujat.${half}.pre.textbookInstructorId`])
            : base.textbook?.responsiblePerson ?? null,
        }
      : base.textbook ?? null
  const multi = isRecord(overlay[keys.multi])
    ? (overlay[keys.multi] as Record<string, unknown>)
    : null
  const rowIds = Array.isArray(multi?.rowIds)
    ? multi.rowIds.map(String).filter(Boolean)
    : []

  if (rowIds.length > 1) {
    return rowIds.map((rowId, index) => {
      const existing = existingRows[index] ?? base
      const dateByRow = isRecord(multi?.dateByRow) ? multi.dateByRow[rowId] : undefined
      return {
        rowId: rowId || existing.rowId || `${half}-${stage}-${index + 1}`,
        displayOrder: index + 1,
        educationName: name,
        educationMethod: method,
        regionCode: stringValue(existing.regionCode),
        startDate: stage === 'event' ? stringValue(dateByRow) ?? range.startDate : null,
        endDate: stage === 'event' ? stringValue(dateByRow) ?? range.endDate : null,
        dates: existing.dates ?? null,
        scheduleIds: existing.scheduleIds ?? scheduleIds,
        textbook: existing.textbook ?? textbook,
        excludedDates,
        exclusion,
      }
    })
  }

  return [
    {
      ...base,
      rowId: base.rowId ?? `${half}-${stage}-1`,
      displayOrder: base.displayOrder ?? 1,
      educationName: name,
      educationMethod: method,
      startDate: stage === 'event' ? range.startDate : base.startDate ?? null,
      endDate: stage === 'event' ? range.endDate : base.endDate ?? null,
      scheduleIds,
      textbook,
      excludedDates,
      exclusion,
    },
  ]
}

function baseStages(
  detail: UjatTypedDetail | undefined,
  semester: 'FIRST_HALF' | 'SECOND_HALF'
): UjatTypedEducationStagePlan[] {
  return detail?.halfPlans?.find(item => item.semesterType === semester)?.stages ?? []
}

/** Convert the old dotted overlay to the backend's versioned typed document. */
export function typedDetailFromUjatOverlay(
  overlay: Record<string, unknown>,
  existing?: UjatTypedDetail
): UjatTypedDetail {
  const halfPlans = (['h1', 'h2'] as const).flatMap(half => {
    const semester = half === 'h1' ? 'FIRST_HALF' : 'SECOND_HALF'
    const existingStages = baseStages(existing, semester)
    const stages = (['pre', 'event', 'closing'] as const).flatMap(stage => {
      const keys = overlayStageKeys(half, stage)
      const existingStage = existingStages.find(item => item.stage === stageCode(stage))
      const hasOverlayValue = [keys.name, keys.delivery, keys.range, keys.scheduleIds, keys.multi].some(
        key => own(overlay, key)
      )
      if (!hasOverlayValue && !existingStage) return []
      return [
        {
          stage: stageCode(stage),
          rows: overlayStageToRows(overlay, half, stage, existingStage?.rows ?? []),
        },
      ]
    })
    if (stages.length === 0 && !existingStages.length) return []
    return [{ semesterType: semester, stages }]
  })

  const common = existing?.common ? { ...existing.common } : {}
  const survey = overlay['ujat.basicInfo.surveyItems']
  if (isRecord(survey)) {
    const existingSurvey = new Map(
      (existing?.common?.surveySettings ?? []).map(item => [item.surveyType, item.enabled ?? null])
    )
    common.surveySettings = ([
      ['SURVEY', 'survey'],
      ['VOLUNTEER_SATISFACTION', 'volunteer_satisfaction'],
      ['SCHOOL_SATISFACTION', 'school_satisfaction'],
      ['LECTURE_EVALUATION', 'lecture_evaluation'],
    ] as const).map(([surveyType, key]) => ({
      surveyType,
      enabled: own(survey, key) ? survey[key] === true : existingSurvey.get(surveyType) ?? null,
    }))
  }

  const participantKeys = ['individual', 'organization', 'teacher', 'volunteer'] as const
  if (participantKeys.some(key => own(overlay, `ujat.basicInfo.participant.${key}`))) {
    const existingParticipants = existing?.common?.participantSettings
    common.participantSettings = Object.fromEntries(
      participantKeys.map(key => [
        key,
        own(overlay, `ujat.basicInfo.participant.${key}`)
          ? overlay[`ujat.basicInfo.participant.${key}`] === true
          : existingParticipants?.[key] ?? null,
      ])
    )
  }

  return {
    schemaVersion: 1,
    halfPlans,
    common: Object.keys(common).length > 0 ? common : existing?.common ?? null,
  }
}

/**
 * 공통정보 RHF가 직접 만든 Program PATCH 값을 Typed detail에도 반영한다.
 * UJAT의 설문·참여자 설정은 더 이상 화면 Overlay가 갱신하지 않으므로,
 * PATCH의 명시적 빈 배열/false도 그대로 typed document에 기록해야 한다.
 */
export function applyUjatProgramPatchToTypedDetail(
  detail: UjatTypedDetail,
  patch: {
    generalSurveyMenuKeys?: readonly string[] | null
    generalParticipantTypes?: readonly string[] | null
  }
): UjatTypedDetail {
  const common = { ...(detail.common ?? {}) }
  if (Object.prototype.hasOwnProperty.call(patch, 'generalSurveyMenuKeys')) {
    const keys = new Set(patch.generalSurveyMenuKeys ?? [])
    common.surveySettings = ([
      ['SURVEY', ['survey', 'survey-poll']],
      ['VOLUNTEER_SATISFACTION', ['volunteer_satisfaction', 'survey-volunteer-satisfaction']],
      ['SCHOOL_SATISFACTION', ['school_satisfaction', 'survey-school-satisfaction']],
      ['LECTURE_EVALUATION', ['lecture_evaluation', 'survey-lecture-eval']],
    ] as const).map(([surveyType, aliases]) => ({
      surveyType,
      enabled: aliases.some(alias => keys.has(alias)),
    }))
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'generalParticipantTypes')) {
    const types = new Set(patch.generalParticipantTypes ?? [])
    common.participantSettings = {
      individual: types.has('individual'),
      organization: types.has('organization') || types.has('school_institution'),
      teacher: types.has('teacher') || types.has('teacher_instructor'),
      volunteer: types.has('volunteer'),
    }
  }
  return {
    ...detail,
    schemaVersion: detail.schemaVersion ?? 1,
    common,
  }
}

/** Project typed values back into the existing UI read model during the migration window. */
export function ujatOverlayFromTypedDetail(detail: UjatTypedDetail): Record<string, unknown> {
  const overlay: Record<string, unknown> = {}
  for (const halfPlan of detail.halfPlans ?? []) {
    const half = halfPlan.semesterType === 'SECOND_HALF' ? 'h2' : 'h1'
    for (const stagePlan of halfPlan.stages ?? []) {
      const stage =
        stagePlan.stage === 'PRE_EDUCATION'
          ? 'pre'
          : stagePlan.stage === 'POST_EDUCATION'
            ? 'closing'
            : 'event'
      const rows = stagePlan.rows ?? []
      const row = rows[0]
      if (!row) continue
      const keys = overlayStageKeys(half, stage)
      if (row.educationName != null) overlay[keys.name] = row.educationName
      if (row.educationMethod != null) overlay[keys.delivery] = row.educationMethod
      if (row.scheduleIds != null) overlay[keys.scheduleIds] = [...row.scheduleIds]
      if (rows.length > 1) {
        overlay[keys.multi] = {
          rowIds: rows.map((item, index) => item.rowId ?? index + 1),
          regionByRow: Object.fromEntries(
            rows.map((item, index) => [
              String(item.rowId ?? index + 1),
              item.regionCode ? [item.regionCode] : [],
            ])
          ),
          dateByRow: Object.fromEntries(
            rows.map((item, index) => [
              String(item.rowId ?? index + 1),
              item.startDate ?? item.endDate ?? null,
            ])
          ),
        }
      }
      if (stage === 'event' && (row.startDate != null || row.endDate != null)) {
        overlay[keys.range] = { start: row.startDate ?? null, end: row.endDate ?? null }
      }
      if (stage === 'pre' && row.textbook != null) {
        if (row.textbook.provisionMethod != null) {
          overlay[`ujat.${half}.pre.textbookMode`] = row.textbook.provisionMethod
        }
        if (row.textbook.responsiblePerson != null) {
          overlay[`ujat.${half}.pre.textbookInstructorId`] = row.textbook.responsiblePerson
        }
      }
      if (row.excludedDates != null) overlay[`ujat.${half}.eduSchedule.unavailableDates`] = [...row.excludedDates]
      if (row.exclusion != null) overlay[`ujat.${half}.eduSchedule.exclusion`] = { ...row.exclusion }
    }
  }

  const surveyItems: Record<string, boolean> = {}
  for (const item of detail.common?.surveySettings ?? []) {
    const key =
      item.surveyType === 'VOLUNTEER_SATISFACTION'
        ? 'volunteer_satisfaction'
        : item.surveyType === 'SCHOOL_SATISFACTION'
          ? 'school_satisfaction'
          : item.surveyType === 'LECTURE_EVALUATION'
            ? 'lecture_evaluation'
            : 'survey'
    surveyItems[key] = item.enabled === true
  }
  if (Array.isArray(detail.common?.surveySettings)) {
    overlay['ujat.basicInfo.surveyItems'] = surveyItems
  }
  const participant = detail.common?.participantSettings
  if (participant) {
    for (const key of ['individual', 'organization', 'teacher', 'volunteer'] as const) {
      if (participant[key] != null) overlay[`ujat.basicInfo.participant.${key}`] = participant[key]
    }
  }
  return overlay
}

/** Remove only fields now owned by Typed detail; recruitment/wage/media compatibility data stays. */
export function stripUjatTypedLegacyOverlay(
  overlay: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(overlay).filter(([key]) => {
      if (key.startsWith('ujat.recruit.')) return true
      return !(
        key.startsWith('ujat.basicInfo.') ||
        key.startsWith('ujat.kpi.') ||
        key.startsWith('ujat.h1.') ||
        key.startsWith('ujat.h2.')
      )
    })
  )
}
