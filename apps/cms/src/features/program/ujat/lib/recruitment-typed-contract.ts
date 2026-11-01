import type {
  ProgramRecruitmentWindow,
  RecruitmentInterviewConfig,
  RecruitmentInterviewException,
  RecruitmentNoticeExposureTiming,
} from '@/types/domain'
import { announcementPublishedFromFormValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { toUjatVolunteerNoticeExposurePayload } from '@/features/template/lib/ujat-volunteer-notice-exposure'
import { ujatVolunteerRecruitInterviewNamespace } from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'

export const UJAT_RECRUITMENT_VOLUNTEER_TARGET_CODES = [
  'elementary',
  'middle',
  'high',
  'university',
  'adult',
  '기타',
] as const

export type UjatRecruitmentVolunteerTargetCode =
  (typeof UJAT_RECRUITMENT_VOLUNTEER_TARGET_CODES)[number]

const VOLUNTEER_TARGET_SET = new Set<string>(UJAT_RECRUITMENT_VOLUNTEER_TARGET_CODES)

export type UjatRecruitmentTypedRequestFields = {
  announcementPublished?: boolean | null
  documentPassAnnouncementAt?: string | null
  finalPassAnnouncementAt?: string | null
  noticeExposureTiming?: RecruitmentNoticeExposureTiming | null
  volunteerTargets?: string[] | null
  remarksNotApplicable?: boolean | null
  interviewConfig?: RecruitmentInterviewConfig | null
  expectedRevision?: number | null
}

export function isRecruitmentNoticeExposureTiming(
  value: unknown
): value is RecruitmentNoticeExposureTiming {
  return value === 'start-day' || value === 'one-day-before' || value === 'one-week-before'
}

export function mapUjatVolunteerTargetsToApi(values: unknown): string[] | null {
  if (values == null) return null
  if (!Array.isArray(values)) return null
  const next = values
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(item => VOLUNTEER_TARGET_SET.has(item))
  return next
}

export function parseRecruitmentInterviewConfig(
  value: unknown
): RecruitmentInterviewConfig | null | undefined {
  if (value === undefined) return undefined
  if (value == null) return null
  if (typeof value !== 'object' || Array.isArray(value)) return null
  const row = value as Record<string, unknown>
  const timeUnit =
    typeof row.timeUnit === 'number' && Number.isFinite(row.timeUnit)
      ? row.timeUnit
      : typeof row.timeUnit === 'string' && row.timeUnit.trim()
        ? Number(row.timeUnit)
        : undefined
  const exclusion =
    row.exclusionState != null &&
    typeof row.exclusionState === 'object' &&
    !Array.isArray(row.exclusionState)
      ? (row.exclusionState as RecruitmentInterviewConfig['exclusionState'])
      : undefined
  const exceptions = Array.isArray(row.exceptions)
    ? row.exceptions.flatMap(item => {
        if (item == null || typeof item !== 'object' || Array.isArray(item)) return []
        const exception = item as RecruitmentInterviewException
        return [exception]
      })
    : undefined
  return {
    schemaVersion: 1,
    ...(Array.isArray(row.selectedSlotKeys)
      ? { selectedSlotKeys: row.selectedSlotKeys.filter((key): key is string => typeof key === 'string') }
      : {}),
    ...(timeUnit != null && Number.isFinite(timeUnit) ? { timeUnit } : {}),
    ...(Array.isArray(row.interviewTimeRange)
      ? {
          interviewTimeRange: row.interviewTimeRange.filter(
            (item): item is string => typeof item === 'string'
          ),
        }
      : {}),
    ...(Array.isArray(row.specificUnavailableDates)
      ? {
          specificUnavailableDates: row.specificUnavailableDates.filter(
            (item): item is string => typeof item === 'string'
          ),
        }
      : {}),
    ...(Array.isArray(row.appliedUnavailableDates)
      ? {
          appliedUnavailableDates: row.appliedUnavailableDates.filter(
            (item): item is string => typeof item === 'string'
          ),
        }
      : {}),
    ...(exclusion ? { exclusionState: exclusion } : {}),
    ...(exceptions ? { exceptions } : {}),
  }
}

export function interviewConfigFromLegacyOverlay(
  overlay: Record<string, unknown> | undefined,
  namespace: string
): RecruitmentInterviewConfig | null {
  if (overlay == null) return null
  const prefix = `${namespace}.`
  const selectedSlotKeys = Array.isArray(overlay[`${prefix}selectedSlotKeys`])
    ? (overlay[`${prefix}selectedSlotKeys`] as unknown[]).filter(
        (item): item is string => typeof item === 'string'
      )
    : []
  const timeUnitRaw = overlay[`${prefix}timeUnit`]
  const timeUnit =
    typeof timeUnitRaw === 'number'
      ? timeUnitRaw
      : typeof timeUnitRaw === 'string'
        ? Number(timeUnitRaw)
        : undefined
  const interviewTimeRange = Array.isArray(overlay[`${prefix}interviewTimeRange`])
    ? (overlay[`${prefix}interviewTimeRange`] as unknown[]).filter(
        (item): item is string => typeof item === 'string'
      )
    : []
  const specificUnavailableDates = Array.isArray(overlay[`${prefix}specificUnavailableDates`])
    ? (overlay[`${prefix}specificUnavailableDates`] as unknown[]).filter(
        (item): item is string => typeof item === 'string'
      )
    : []
  const appliedUnavailableDates = Array.isArray(overlay[`${prefix}appliedUnavailableDates`])
    ? (overlay[`${prefix}appliedUnavailableDates`] as unknown[]).filter(
        (item): item is string => typeof item === 'string'
      )
    : []
  const exclusionRaw = overlay[`${prefix}exclusionState`]
  const exclusionState =
    exclusionRaw != null && typeof exclusionRaw === 'object' && !Array.isArray(exclusionRaw)
      ? {
          excludeSaturday: (exclusionRaw as { excludeSaturday?: boolean }).excludeSaturday === true,
          excludeSunday: (exclusionRaw as { excludeSunday?: boolean }).excludeSunday === true,
          excludeHoliday: (exclusionRaw as { excludeHoliday?: boolean }).excludeHoliday === true,
        }
      : undefined
  const exceptions: RecruitmentInterviewException[] = []
  for (const [key, value] of Object.entries(overlay)) {
    const match = key.match(new RegExp(`^${namespace.replace('.', '\\.')}\\.exception\\.(\\d+)\\.exceptionDate$`))
    if (!match) continue
    const id = match[1]
    const selected = overlay[`${namespace}.exception.${id}.selectedSlotKeys`]
    exceptions.push({
      id,
      exceptionDate: typeof value === 'string' ? value : String(value ?? ''),
      selectedSlotKeys: Array.isArray(selected)
        ? selected.filter((item): item is string => typeof item === 'string')
        : [],
    })
  }
  const empty =
    selectedSlotKeys.length === 0 &&
    interviewTimeRange.length === 0 &&
    specificUnavailableDates.length === 0 &&
    appliedUnavailableDates.length === 0 &&
    exclusionState == null &&
    exceptions.length === 0 &&
    timeUnit == null
  if (empty) return null
  return {
    schemaVersion: 1,
    selectedSlotKeys,
    ...(timeUnit != null && Number.isFinite(timeUnit) ? { timeUnit } : {}),
    interviewTimeRange,
    specificUnavailableDates,
    appliedUnavailableDates,
    ...(exclusionState ? { exclusionState } : {}),
    exceptions,
  }
}

export function interviewConfigToLegacyOverlayRecord(
  config: RecruitmentInterviewConfig | null | undefined,
  namespace: string
): Record<string, unknown> {
  if (config == null) return {}
  const prefix = `${namespace}.`
  const out: Record<string, unknown> = {
    [`${prefix}selectedSlotKeys`]: config.selectedSlotKeys ?? [],
    [`${prefix}timeUnit`]:
      config.timeUnit == null ? undefined : String(config.timeUnit),
    [`${prefix}interviewTimeRange`]: config.interviewTimeRange ?? [],
    [`${prefix}specificUnavailableDates`]: config.specificUnavailableDates ?? [],
    [`${prefix}appliedUnavailableDates`]: config.appliedUnavailableDates ?? [],
    [`${prefix}exclusionState`]: config.exclusionState ?? {
      excludeSaturday: false,
      excludeSunday: false,
      excludeHoliday: false,
    },
  }
  for (const exception of config.exceptions ?? []) {
    const id = exception.id?.trim() || String(Date.now())
    out[`${prefix}exception.${id}.exceptionDate`] = exception.exceptionDate ?? ''
    out[`${prefix}exception.${id}.selectedSlotKeys`] = exception.selectedSlotKeys ?? []
  }
  return out
}

export function overlayRecordToInterviewConfig(
  record: Record<string, unknown>,
  namespace: string
): RecruitmentInterviewConfig {
  return (
    interviewConfigFromLegacyOverlay(record, namespace) ?? {
      schemaVersion: 1,
      selectedSlotKeys: [],
      interviewTimeRange: [],
      specificUnavailableDates: [],
      appliedUnavailableDates: [],
      exceptions: [],
    }
  )
}

export function interviewConfigHasSelectedSlots(
  config: RecruitmentInterviewConfig | null | undefined
): boolean {
  return Array.isArray(config?.selectedSlotKeys) && config.selectedSlotKeys.length > 0
}

export function resolveInterviewConfigForDisplay(
  row: ProgramRecruitmentWindow | undefined,
  overlay: Record<string, unknown> | undefined,
  half: 'h1' | 'h2'
): RecruitmentInterviewConfig | null {
  if (row && Object.prototype.hasOwnProperty.call(row, 'interviewConfig')) {
    return row.interviewConfig ?? null
  }
  return interviewConfigFromLegacyOverlay(
    overlay,
    ujatVolunteerRecruitInterviewNamespace(half)
  )
}

export function typedFieldsFromRecruitmentFormValues(
  values: ProgramDetailEditFormValues,
  kind: 'institution' | 'volunteer'
): UjatRecruitmentTypedRequestFields {
  if (kind === 'institution') {
    return {
      announcementPublished:
        announcementPublishedFromFormValue(values.participantRecruitmentAnnouncementPublished) ??
        null,
      remarksNotApplicable: values.participantRecruitmentNotesNotApplicable === 'not_applicable',
      // 기관 폼의 최종 합격자 발표일 → 수정 경로(adapters finalPassAnnouncementAt)와 동일
      finalPassAnnouncementAt: values.resultAnnouncementDate?.trim() || null,
    }
  }
  return {
    announcementPublished:
      announcementPublishedFromFormValue(values.volunteerRecruitmentAnnouncementPublished) ?? null,
    noticeExposureTiming:
      toUjatVolunteerNoticeExposurePayload(values.volunteerRecruitmentNoticeExposure) ?? null,
    volunteerTargets: mapUjatVolunteerTargetsToApi(values.volunteerTargets),
    remarksNotApplicable: values.volunteerRecruitmentNotesNotApplicable === 'not_applicable',
    documentPassAnnouncementAt: values.documentPassAnnouncementDate?.trim() || null,
    finalPassAnnouncementAt: values.finalPassAnnouncementDate?.trim() || null,
    interviewConfig: parseRecruitmentInterviewConfig(values.volunteerInterviewConfig) ?? null,
  }
}

export function assignUjatTypedRecruitmentRequestFields(
  body: Record<string, unknown>,
  row: ProgramRecruitmentWindow,
  audience: 'participant' | 'volunteer'
): void {
  if (row.announcementPublished != null) body.announcementPublished = row.announcementPublished
  if (row.remarksNotApplicable != null) body.remarksNotApplicable = row.remarksNotApplicable
  if (row.contentRevision != null) body.expectedRevision = row.contentRevision
  // 기관·봉사자 모두 최종 발표일을 보낸다 (생성·수정 경로 동일)
  if (row.finalPassAnnouncementAt !== undefined) {
    body.finalPassAnnouncementAt = row.finalPassAnnouncementAt
  }
  if (audience !== 'volunteer') return
  if (row.documentPassAnnouncementAt !== undefined) {
    body.documentPassAnnouncementAt = row.documentPassAnnouncementAt
  }
  if (row.noticeExposureTiming !== undefined) {
    body.noticeExposureTiming = row.noticeExposureTiming
  }
  if (row.volunteerTargets !== undefined) body.volunteerTargets = row.volunteerTargets
  if (row.interviewConfig !== undefined) body.interviewConfig = row.interviewConfig
}

export function readUjatTypedRecruitmentWindowFields(
  row: Record<string, unknown>
): Partial<ProgramRecruitmentWindow> {
  const next: Partial<ProgramRecruitmentWindow> = {}
  if ('announcementPublished' in row && typeof row.announcementPublished === 'boolean') {
    next.announcementPublished = row.announcementPublished
  } else if (row.announcementPublished === null) {
    next.announcementPublished = null
  }
  if ('documentPassAnnouncementAt' in row) {
    next.documentPassAnnouncementAt =
      typeof row.documentPassAnnouncementAt === 'string' ? row.documentPassAnnouncementAt : null
  }
  if ('finalPassAnnouncementAt' in row) {
    next.finalPassAnnouncementAt =
      typeof row.finalPassAnnouncementAt === 'string' ? row.finalPassAnnouncementAt : null
  }
  if ('noticeExposureTiming' in row) {
    next.noticeExposureTiming = isRecruitmentNoticeExposureTiming(row.noticeExposureTiming)
      ? row.noticeExposureTiming
      : null
  }
  if ('volunteerTargets' in row) {
    next.volunteerTargets = mapUjatVolunteerTargetsToApi(row.volunteerTargets)
  }
  if ('remarksNotApplicable' in row && typeof row.remarksNotApplicable === 'boolean') {
    next.remarksNotApplicable = row.remarksNotApplicable
  } else if (row.remarksNotApplicable === null) {
    next.remarksNotApplicable = null
  }
  if ('interviewConfig' in row) {
    next.interviewConfig = parseRecruitmentInterviewConfig(row.interviewConfig) ?? null
  }
  if (typeof row.contentRevision === 'number' && Number.isFinite(row.contentRevision)) {
    next.contentRevision = row.contentRevision
  }
  return next
}
