/**
 * 일반 프로그램 모집 양식 overlay → Program 필드 병합
 * (UJAT applyUjatRecruit*TemplateDefaults 와 동일 역할)
 */

import dayjs from 'dayjs'
import type {
  GeneralProgramVolunteerInterviewScheduleInfo,
  Program,
  TargetLevel,
} from '@/types/domain'
import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-keys'
import { getApplicantRecruitInstitutionOverlayRecord } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { formatAnnouncementLabel } from '@/features/program/shared/lib/announcement-label'
import { getGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import { readRecruitDetailMediaFromOverlay } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
import { buildVolunteerInterviewOverlayKey } from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import { mapVolunteerInterviewExceptionsFromOverlay } from '@/features/program/shared/lib/volunteer-interview-exception-overlay'
import {
  buildRecurringUnavailableLabel,
  type UnavailableDatesExclusionState,
} from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import {
  announcementPublishedFromFormValue,
  type ParticipantRecruitmentAnnouncementPublishedValue,
} from '@/features/program/shared/lib/participant-recruitment-form-options'
import {
  formatDateOnly,
  formatDateRange,
  formatInstructorTargetsLabel,
  formatTargetLevelsLabel,
  formatVolunteerTargetsLabel,
  normalizeInstructorTargetList,
  normalizeVolunteerTargetList,
  parseTargetLevelsFromDisplayLabel,
  resolvePersistedProgramTargetLevels,
  resolveProgramTargetLevels,
} from '@/features/program/shared/lib/program-detail-info-constants'
import {
  applyRecruitmentRowCopy,
  resolveRecruitmentOtherMatters,
} from '@/features/program/shared/lib/recruitment-row-copy'
import { RECRUIT_INTERVIEW_REQUIRED_DEFAULT } from '@/features/program/general/lib/recruit-radio-defaults'

type RangeSeal = { start?: string | null; end?: string | null }

const TARGET_LEVEL_VALUES = new Set<string>(['elementary', 'middle', 'high', 'university', 'adult'])

/** 개인·강사·봉사자 모집 overlay 키 */
export const GENERAL_RECRUIT_OVERLAY_KEYS = {
  individual: {
    recruitRangeSeal: 'recruit.individual.recruitRangeSeal',
    programRangeSeal: 'recruit.individual.programRangeSeal',
    announcementPublished: 'recruit.individual.announcementPublished',
    interviewRequired: 'recruit.individual.interviewRequired',
    targetLevels: 'recruit.individual.targetLevels',
    targetLevelDetail: 'recruit.individual.targetLevelDetail',
    docDeadlineIso: 'recruit.individual.docDeadlineIso',
    docAnnounceMethod: 'recruit.individual.docAnnounceMethod',
    interviewRangeSeal: 'recruit.individual.interviewRangeSeal',
    interviewMethod: 'recruit.individual.interviewMethod',
    finalAnnounceIso: 'recruit.individual.finalAnnounceIso',
    finalAnnounceMethod: 'recruit.individual.finalAnnounceMethod',
    inquiryContact: 'recruit.individual.inquiryContact',
    inquiryTel: 'recruit.individual.inquiryTel',
    inquiryEmail: 'recruit.individual.inquiryEmail',
    notes: 'recruit.individual.notes',
    notesNotApplicable: 'recruit.individual.notesNotApplicable',
  },
  instructor: {
    recruitRangeSeal: 'recruit.instructor.recruitRangeSeal',
    programRangeSeal: 'recruit.instructor.programRangeSeal',
    recruitTargets: 'recruit.instructor.recruitTargets',
    recruitTargetDetail: 'recruit.instructor.recruitTargetDetail',
    announcementPublished: 'recruit.instructor.announcementPublished',
    inquiryContact: 'recruit.instructor.inquiryContact',
    inquiryTel: 'recruit.instructor.inquiryTel',
    inquiryEmail: 'recruit.instructor.inquiryEmail',
    notes: 'recruit.instructor.notes',
    finalAnnounceIso: 'recruit.instructor.finalAnnounceIso',
    finalAnnounceMethod: 'recruit.instructor.finalAnnounceMethod',
  },
  volunteer: {
    recruitRangeSeal: 'recruit.volunteer.recruitRangeSeal',
    programRangeSeal: 'recruit.volunteer.programRangeSeal',
    volunteerTargets: 'recruit.volunteer.volunteerTargets',
    volunteerTargetDetail: 'recruit.volunteer.volunteerTargetDetail',
    announcementPublished: 'recruit.volunteer.announcementPublished',
    interviewRequired: 'recruit.volunteer.interviewRequired',
    docDeadlineIso: 'recruit.volunteer.docDeadlineIso',
    docAnnounceMethod: 'recruit.volunteer.docAnnounceMethod',
    interviewRangeSeal: 'recruit.volunteer.interviewRangeSeal',
    interviewMethod: 'recruit.volunteer.interviewMethod',
    finalAnnounceIso: 'recruit.volunteer.finalAnnounceIso',
    finalAnnounceMethod: 'recruit.volunteer.finalAnnounceMethod',
    inquiryContact: 'recruit.volunteer.inquiryContact',
    inquiryTel: 'recruit.volunteer.inquiryTel',
    inquiryEmail: 'recruit.volunteer.inquiryEmail',
    notes: 'recruit.volunteer.notes',
    notesNotApplicable: 'recruit.volunteer.notesNotApplicable',
  },
  detailInfo: {
    participantDescription: 'recruit.detailInfo.programDescription',
    participantGuide: 'recruit.detailInfo.recruitmentGuide',
    participantMethod: 'recruit.detailInfo.applicationMethod',
    participantLearningSupport: 'recruit.detailInfo.learningSupportContent',
    participantAdditionalHtml: 'recruit.detailInfo.additionalContentHtml',
    participantOtherNotes: 'recruit.detailInfo.otherNotes',
    instructorDescription: 'recruitInstructor.detailInfo.programDescription',
    instructorGuide: 'recruitInstructor.detailInfo.recruitmentGuide',
    instructorMethod: 'recruitInstructor.detailInfo.applicationMethod',
    instructorLearningSupport: 'recruitInstructor.detailInfo.learningSupportContent',
    instructorAdditionalHtml: 'recruitInstructor.detailInfo.additionalContentHtml',
    instructorOtherNotes: 'recruitInstructor.detailInfo.otherNotes',
    volunteerDescription: 'recruitVolunteer.detailInfo.programDescription',
    volunteerGuide: 'recruitVolunteer.detailInfo.recruitmentGuide',
    volunteerMethod: 'recruitVolunteer.detailInfo.applicationMethod',
    volunteerLearningSupport: 'recruitVolunteer.detailInfo.learningSupportContent',
    volunteerAdditionalHtml: 'recruitVolunteer.detailInfo.additionalContentHtml',
    volunteerOtherNotes: 'recruitVolunteer.detailInfo.otherNotes',
  },
} as const

/** 개인 모집 「참여자 면접 유무」 화면 기본값 — 정본은 `recruit-radio-defaults` */
export const INDIVIDUAL_INTERVIEW_REQUIRED_DEFAULT = RECRUIT_INTERVIEW_REQUIRED_DEFAULT

/**
 * 등록(create) 전용. 개인 참여자를 고른 등록에서 라디오를 건드리지 않으면 기본 '면접 있음'이
 * 스토어에 기록되지 않아 overlay 키가 비고 `generalParticipantInterviewEnabled`가 빠진다.
 * 화면에 보이던 기본값을 create 스냅샷에만 채운다. 개인 미선택·키가 이미 있으면 그대로 반환.
 */
export function withIndividualInterviewRequiredCreateDefault(
  overlay: Record<string, unknown>,
  individualSelected: boolean
): Record<string, unknown> {
  const key = GENERAL_RECRUIT_OVERLAY_KEYS.individual.interviewRequired
  if (!individualSelected) return overlay
  if (overlay[key] !== undefined && overlay[key] !== null && overlay[key] !== '') return overlay
  return { ...overlay, [key]: INDIVIDUAL_INTERVIEW_REQUIRED_DEFAULT }
}

/** 봉사 모집 「봉사자 면접 유무」 화면 기본값 — 정본은 `recruit-radio-defaults` */
export const VOLUNTEER_INTERVIEW_REQUIRED_DEFAULT = RECRUIT_INTERVIEW_REQUIRED_DEFAULT

/**
 * 등록(create) 전용. 봉사자를 고른 등록에서 라디오를 건드리지 않으면 기본 '면접 있음'이 스토어에 기록되지 않아
 * `generalVolunteerInterviewEnabled`·봉사 행 `interviewEnabled` 가 false 로 저장되던 문제. 화면 기본값을 create 스냅샷에만 채운다.
 */
export function withVolunteerInterviewRequiredCreateDefault(
  overlay: Record<string, unknown>,
  volunteerSelected: boolean
): Record<string, unknown> {
  const key = GENERAL_RECRUIT_OVERLAY_KEYS.volunteer.interviewRequired
  if (!volunteerSelected) return overlay
  if (overlay[key] !== undefined && overlay[key] !== null && overlay[key] !== '') return overlay
  return { ...overlay, [key]: VOLUNTEER_INTERVIEW_REQUIRED_DEFAULT }
}

/** 1사1교·교육받은교사·Gemini·UJAT 등록 폼 — participant detailInfo prefix 별칭 */
const PARTICIPANT_DETAIL_INFO_PREFIX_ALIASES = [
  'economyRecruit.detailInfo',
  'trainedTeachersRecruit.detailInfo',
  'geminiRecruit.detailInfo',
  'ujatRecruit.detailInfo',
] as const

function overlayString(overlay: Record<string, unknown>, key: string): string | undefined {
  const v = overlay[key]
  if (typeof v !== 'string') return undefined
  const trimmed = v.trim()
  return trimmed ? trimmed : undefined
}

/** 참여자(기관) 상세 필드 — canonical `recruit.detailInfo.*` + 유형별 prefix */
function overlayParticipantDetailString(
  overlay: Record<string, unknown>,
  suffix: string,
  canonicalKey: string
): string | undefined {
  const primary = overlayString(overlay, canonicalKey)
  if (primary) return primary
  for (const prefix of PARTICIPANT_DETAIL_INFO_PREFIX_ALIASES) {
    const aliased = overlayString(overlay, `${prefix}.${suffix}`)
    if (aliased) return aliased
  }
  return undefined
}

function overlayStringArray(overlay: Record<string, unknown>, key: string): string[] | undefined {
  const v = overlay[key]
  if (!Array.isArray(v)) return undefined
  const out = v
    .map(String)
    .map(s => s.trim())
    .filter(Boolean)
  return out.length > 0 ? out : undefined
}

function readRangeSeal(
  overlay: Record<string, unknown>,
  key: string
): { start: string; end: string } | undefined {
  const v = overlay[key]
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined
  const start = (v as RangeSeal).start
  const end = (v as RangeSeal).end
  if (typeof start !== 'string' || typeof end !== 'string') return undefined
  if (!start.trim() || !end.trim()) return undefined
  return { start, end }
}

function coalesceString(
  programVal: string | undefined,
  overlayVal: string | undefined,
  preferOverlay: boolean
): string | undefined {
  if (preferOverlay) {
    if (overlayVal?.trim()) return overlayVal
    const trimmed = programVal?.trim()
    return trimmed ? programVal : overlayVal
  }
  const trimmed = programVal?.trim()
  if (trimmed) return programVal
  return overlayVal
}

function coalesceIso(
  programVal: string | Date | undefined,
  overlayIso: string | undefined,
  preferOverlay: boolean
): string | Date | undefined {
  if (preferOverlay) {
    if (overlayIso?.trim()) return overlayIso
    if (programVal != null && String(programVal).trim() !== '') return programVal
    return overlayIso
  }
  if (programVal != null && String(programVal).trim() !== '') return programVal
  return overlayIso
}

function coalesceBool(
  programVal: boolean | undefined,
  overlayVal: boolean | undefined,
  preferOverlay: boolean
): boolean | undefined {
  if (preferOverlay) {
    if (overlayVal !== undefined) return overlayVal
    return programVal
  }
  if (programVal !== undefined) return programVal
  return overlayVal
}

function parseTargetLevels(raw: string[] | undefined): TargetLevel[] | undefined {
  if (!raw?.length) return undefined
  const levels = raw.filter((item): item is TargetLevel => TARGET_LEVEL_VALUES.has(item))
  return levels.length > 0 ? levels : undefined
}

function overlayAnnouncementPublished(
  overlay: Record<string, unknown>,
  key: string
): boolean | undefined {
  const raw = overlay[key]
  if (raw === 'published' || raw === 'unpublished') {
    return announcementPublishedFromFormValue(
      raw as ParticipantRecruitmentAnnouncementPublishedValue
    )
  }
  if (typeof raw === 'boolean') return raw
  return undefined
}

function overlayYesNoBool(overlay: Record<string, unknown>, key: string): boolean | undefined {
  const raw = overlay[key]
  if (raw === 'yes') return true
  if (raw === 'no') return false
  if (typeof raw === 'boolean') return raw
  return undefined
}

/** 기관 모집 — `need` / `none` → boolean */
function overlayNeedNoneBool(overlay: Record<string, unknown>, key: string): boolean | undefined {
  const raw = overlay[key]
  if (raw === 'need') return true
  if (raw === 'none') return false
  if (typeof raw === 'boolean') return raw
  return undefined
}

function overlayStudentListRequired(
  overlay: Record<string, unknown>,
  key: string
): 'required' | 'not_required' | undefined {
  const raw = overlay[key]
  if (raw === 'need' || raw === 'required') return 'required'
  if (raw === 'none' || raw === 'not_required') return 'not_required'
  return undefined
}

function overlayFiniteNumber(overlay: Record<string, unknown>, key: string): number | undefined {
  const raw = overlay[key]
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function coalesceNumber(
  programVal: number | undefined,
  overlayVal: number | undefined,
  preferOverlay: boolean
): number | undefined {
  if (preferOverlay) {
    if (overlayVal !== undefined) return overlayVal
    return programVal
  }
  if (programVal !== undefined) return programVal
  return overlayVal
}

export function formatAvailableTimeSlotsFromSelectedKeys(keys: unknown): string | undefined {
  if (!Array.isArray(keys) || keys.length === 0) return undefined
  const labels = keys
    .map(key => {
      if (typeof key !== 'string' || !key.trim()) return null
      const match = /^(\d+)-(\d+)$/.exec(key.trim())
      if (!match) return null
      const start = dayjs(Number(match[1]))
      const end = dayjs(Number(match[2]))
      if (!start.isValid() || !end.isValid()) return null
      return `${start.format('HH:mm')} ~ ${end.format('HH:mm')}`
    })
    .filter((label): label is string => label != null)
  return labels.length > 0 ? labels.join(', ') : undefined
}

function parseInterviewScheduleTimeUnitMinutes(value: unknown): number {
  if (value === '15' || value === 15) return 15
  if (value === '60' || value === 60) return 60
  return 30
}

/** overlay `interviewTimeRange` + `timeUnit` — BE hydrate와 동일(슬롯 키 없을 때). */
export function formatAvailableTimeSlotsFromInterviewTimeRange(
  rangeRaw: unknown,
  timeUnitRaw: unknown
): string | undefined {
  if (!Array.isArray(rangeRaw) || rangeRaw.length < 2) return undefined
  const start = dayjs(rangeRaw[0] as string | number | Date)
  const end = dayjs(rangeRaw[1] as string | number | Date)
  if (!start.isValid() || !end.isValid()) return undefined

  const minutes = parseInterviewScheduleTimeUnitMinutes(timeUnitRaw)
  const labels: string[] = []
  let cursor = start

  while (labels.length < 96) {
    const next = cursor.add(minutes, 'minute')
    if (next.isAfter(end)) break
    labels.push(`${cursor.format('HH:mm')} ~ ${next.format('HH:mm')}`)
    cursor = next
  }

  return labels.length > 0 ? labels.join(', ') : undefined
}

export function resolveVolunteerInterviewAvailableTimeSlotsFromOverlay(
  overlay: Record<string, unknown>,
  store: 'recruit' | 'application' = 'recruit'
): string | undefined {
  const key = (suffix: string) => buildVolunteerInterviewOverlayKey(store, suffix)
  return (
    formatAvailableTimeSlotsFromSelectedKeys(overlay[key('selectedSlotKeys')]) ??
    formatAvailableTimeSlotsFromInterviewTimeRange(
      overlay[key('interviewTimeRange')],
      overlay[key('timeUnit')]
    )
  )
}

export function countVolunteerInterviewTimeSlotLabels(value: string | undefined): number {
  if (!value?.trim()) return 0
  return value
    .split(',')
    .map(part => part.trim())
    .filter(Boolean).length
}

export function volunteerInterviewHasSelectedSlotKeys(
  overlay: Record<string, unknown>,
  store: 'recruit' | 'application' = 'recruit'
): boolean {
  const raw = overlay[buildVolunteerInterviewOverlayKey(store, 'selectedSlotKeys')]
  return Array.isArray(raw) && raw.length > 0
}

/**
 * 조회 표시 SSOT — 편집에서 고른 슬롯(selectedSlotKeys) 우선,
 * 그다음 nested availableTimeSlots, 마지막 interviewTimeRange 펼침.
 */
export function resolveVolunteerInterviewAvailableTimeSlotsForDisplay(
  nestedAvailableTimeSlots: string | undefined,
  overlay: Record<string, unknown>,
  store: 'recruit' | 'application' = 'recruit'
): string | undefined {
  const nested = nestedAvailableTimeSlots?.trim()
  const nestedCount = countVolunteerInterviewTimeSlotLabels(nested)
  const fromRange = formatAvailableTimeSlotsFromInterviewTimeRange(
    overlay[buildVolunteerInterviewOverlayKey(store, 'interviewTimeRange')],
    overlay[buildVolunteerInterviewOverlayKey(store, 'timeUnit')]
  )
  const rangeCount = countVolunteerInterviewTimeSlotLabels(fromRange)

  if (volunteerInterviewHasSelectedSlotKeys(overlay, store)) {
    const fromKeys = formatAvailableTimeSlotsFromSelectedKeys(
      overlay[buildVolunteerInterviewOverlayKey(store, 'selectedSlotKeys')]
    )
    if (fromKeys) return fromKeys
  }
  if (fromRange) {
    if (rangeCount > nestedCount) return fromRange
  }
  if (nested) return nested
  return fromRange
}

function pickRicherAvailableTimeSlots(nested?: string, fromOverlay?: string): string | undefined {
  const n = nested?.trim()
  const o = fromOverlay?.trim()
  if (!n) return o
  if (!o) return n
  return countVolunteerInterviewTimeSlotLabels(o) >= countVolunteerInterviewTimeSlotLabels(n)
    ? o
    : n
}

function formatSpecificUnavailableDateLabel(isos: string[]): string | undefined {
  if (isos.length === 0) return undefined
  const labels = isos.map(iso => {
    const formatted = formatDateOnly(iso)
    return formatted === '-' ? iso : formatted
  })
  return labels.join(', ')
}

function readExclusionState(
  overlay: Record<string, unknown>,
  key: string
): UnavailableDatesExclusionState | undefined {
  const raw = overlay[key]
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const row = raw as Partial<UnavailableDatesExclusionState>
  return {
    excludeNone: row.excludeNone === true,
    excludeSaturday: row.excludeSaturday === true,
    excludeSunday: row.excludeSunday === true,
    excludeHoliday: row.excludeHoliday === true,
  }
}

function buildVolunteerInterviewScheduleFromOverlay(
  overlay: Record<string, unknown>
): GeneralProgramVolunteerInterviewScheduleInfo | undefined {
  const key = (suffix: string) => buildVolunteerInterviewOverlayKey('recruit', suffix)
  const exclusion = readExclusionState(overlay, key('exclusionState'))
  const appliedDatesRaw = overlay[key('appliedUnavailableDates')]
  const specificUnavailableDateIsos = Array.isArray(appliedDatesRaw)
    ? appliedDatesRaw
        .map(String)
        .map(s => s.trim())
        .filter(Boolean)
    : []
  const recurringUnavailable = exclusion ? buildRecurringUnavailableLabel(exclusion) : undefined
  const availableTimeSlots = volunteerInterviewHasSelectedSlotKeys(overlay, 'recruit')
    ? formatAvailableTimeSlotsFromSelectedKeys(overlay[key('selectedSlotKeys')])
    : resolveVolunteerInterviewAvailableTimeSlotsFromOverlay(overlay, 'recruit')
  const specificUnavailableDates = formatSpecificUnavailableDateLabel(specificUnavailableDateIsos)
  const exceptions = mapVolunteerInterviewExceptionsFromOverlay(overlay, 'recruit')

  if (
    !recurringUnavailable &&
    !specificUnavailableDates &&
    !specificUnavailableDateIsos.length &&
    !availableTimeSlots &&
    exceptions.length === 0
  ) {
    return undefined
  }

  return {
    ...(recurringUnavailable ? { recurringUnavailable } : {}),
    ...(specificUnavailableDates ? { specificUnavailableDates } : {}),
    ...(specificUnavailableDateIsos.length > 0 ? { specificUnavailableDateIsos } : {}),
    ...(availableTimeSlots ? { availableTimeSlots } : {}),
    ...(exceptions.length > 0 ? { exceptions } : {}),
  }
}

/** 저장·PATCH — keys가 있으면 nested availableTimeSlots는 keys만 반영(첫 슬롯만 merge 금지). */
export function alignVolunteerInterviewScheduleInfoWithSelectedSlotKeys(
  overlay: Record<string, unknown>,
  schedule?: GeneralProgramVolunteerInterviewScheduleInfo
): GeneralProgramVolunteerInterviewScheduleInfo | undefined {
  if (!volunteerInterviewHasSelectedSlotKeys(overlay, 'recruit')) return schedule
  const fromKeys = formatAvailableTimeSlotsFromSelectedKeys(
    overlay[buildVolunteerInterviewOverlayKey('recruit', 'selectedSlotKeys')]
  )
  if (!fromKeys) return schedule
  if (!schedule) return { availableTimeSlots: fromKeys }
  return { ...schedule, availableTimeSlots: fromKeys }
}

function pickNonEmptyScheduleString(nested?: string, fromOverlay?: string): string | undefined {
  const nestedTrim = nested?.trim()
  if (nestedTrim) return nested
  const overlayTrim = fromOverlay?.trim()
  return overlayTrim ? fromOverlay : nested
}

/** nested·overlay 각각에 일부 필드만 있을 때(예: 불가일만 JSON, 슬롯은 overlay) 병합 */
export function mergeVolunteerInterviewScheduleInfo(
  nested: GeneralProgramVolunteerInterviewScheduleInfo | undefined,
  fromOverlay: GeneralProgramVolunteerInterviewScheduleInfo | undefined,
  preferOverlay: boolean
): GeneralProgramVolunteerInterviewScheduleInfo | undefined {
  if (!nested && !fromOverlay) return undefined
  if (!nested) return fromOverlay
  if (!fromOverlay) return nested

  return {
    ...fromOverlay,
    ...nested,
    recurringUnavailable: pickNonEmptyScheduleString(
      preferOverlay ? fromOverlay.recurringUnavailable : nested.recurringUnavailable,
      preferOverlay ? nested.recurringUnavailable : fromOverlay.recurringUnavailable
    ),
    specificUnavailableDates: pickNonEmptyScheduleString(
      preferOverlay ? fromOverlay.specificUnavailableDates : nested.specificUnavailableDates,
      preferOverlay ? nested.specificUnavailableDates : fromOverlay.specificUnavailableDates
    ),
    specificUnavailableDateIsos: preferOverlay
      ? fromOverlay.specificUnavailableDateIsos?.length
        ? fromOverlay.specificUnavailableDateIsos
        : nested.specificUnavailableDateIsos
      : nested.specificUnavailableDateIsos?.length
        ? nested.specificUnavailableDateIsos
        : fromOverlay.specificUnavailableDateIsos,
    availableTimeSlots: preferOverlay
      ? pickNonEmptyScheduleString(fromOverlay.availableTimeSlots, nested.availableTimeSlots)
      : pickRicherAvailableTimeSlots(nested.availableTimeSlots, fromOverlay.availableTimeSlots),
    exceptions: nested.exceptions?.length ? nested.exceptions : fromOverlay.exceptions,
    periodStartDate: nested.periodStartDate ?? fromOverlay.periodStartDate,
    periodEndDate: nested.periodEndDate ?? fromOverlay.periodEndDate,
  }
}

export type ApplyGeneralRecruitOverlayOptions = {
  /**
   * true: 모집 양식 overlay 우선 (등록 create / 세션 중 미리보기)
   * false: Program 값 우선, 비었을 때만 overlay (UJAT defaults 와 동일)
   */
  preferOverlay?: boolean
}

/**
 * 기관·개인·강사·봉사자 모집 overlay를 하나의 Program 스냅샷에 병합.
 * `institutionOverlay` + `generalOverlay` 를 합친 record를 넘기거나, 각각 전달.
 */
export function applyGeneralRecruitOverlayToProgram(
  program: Program,
  overlay: Record<string, unknown>,
  options?: ApplyGeneralRecruitOverlayOptions
): Program {
  if (!overlay || Object.keys(overlay).length === 0) return program

  const preferOverlay = options?.preferOverlay === true
  const keys = GENERAL_RECRUIT_OVERLAY_KEYS
  const inst = APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS
  // GET recruitments[]가 있으면 기간·운영기간·문의처·면접은 행 SSOT — overlay seal로 덮지 않는다.
  const keepRecruitmentRows = (program.programRecruitments?.length ?? 0) > 0

  const participantRecruitRange = keepRecruitmentRows
    ? undefined
    : (readRangeSeal(overlay, inst.recruitRangeSeal) ??
      readRangeSeal(overlay, keys.individual.recruitRangeSeal))
  const participantProgramRange = keepRecruitmentRows
    ? undefined
    : (readRangeSeal(overlay, inst.programRangeSeal) ??
      readRangeSeal(overlay, keys.individual.programRangeSeal))
  const instructorRecruitRange = keepRecruitmentRows
    ? undefined
    : readRangeSeal(overlay, keys.instructor.recruitRangeSeal)
  const instructorProgramRange = keepRecruitmentRows
    ? undefined
    : readRangeSeal(overlay, keys.instructor.programRangeSeal)
  const volunteerRecruitRange = keepRecruitmentRows
    ? undefined
    : readRangeSeal(overlay, keys.volunteer.recruitRangeSeal)
  const volunteerProgramRange = keepRecruitmentRows
    ? undefined
    : readRangeSeal(overlay, keys.volunteer.programRangeSeal)

  const targetLevels =
    parseTargetLevels(overlayStringArray(overlay, inst.targetLevels)) ??
    parseTargetLevels(overlayStringArray(overlay, keys.individual.targetLevels))
  const targetLevelDetail =
    overlayString(overlay, inst.targetLevelDetail) ??
    overlayString(overlay, keys.individual.targetLevelDetail)

  const instructorTargetsRaw = overlayStringArray(overlay, keys.instructor.recruitTargets)
  const instructorTargets =
    instructorTargetsRaw?.length && instructorTargetsRaw.length > 0
      ? normalizeInstructorTargetList(instructorTargetsRaw)
      : instructorTargetsRaw
  const instructorTargetDetail = overlayString(overlay, keys.instructor.recruitTargetDetail)
  const volunteerTargetsRaw = overlayStringArray(overlay, keys.volunteer.volunteerTargets)
  const volunteerTargets =
    volunteerTargetsRaw?.length && volunteerTargetsRaw.length > 0
      ? normalizeVolunteerTargetList(volunteerTargetsRaw)
      : volunteerTargetsRaw
  const volunteerTargetDetail = overlayString(overlay, keys.volunteer.volunteerTargetDetail)

  const participantContact = keepRecruitmentRows
    ? undefined
    : (overlayString(overlay, inst.inquiryContact) ??
      overlayString(overlay, keys.individual.inquiryContact))
  const participantTel = keepRecruitmentRows
    ? undefined
    : (overlayString(overlay, inst.inquiryTel) ??
      overlayString(overlay, keys.individual.inquiryTel))
  const participantEmail = keepRecruitmentRows
    ? undefined
    : (overlayString(overlay, inst.inquiryEmail) ??
      overlayString(overlay, keys.individual.inquiryEmail))

  const instructorContact = keepRecruitmentRows
    ? undefined
    : overlayString(overlay, keys.instructor.inquiryContact)
  const instructorTel = keepRecruitmentRows
    ? undefined
    : overlayString(overlay, keys.instructor.inquiryTel)
  const instructorEmail = keepRecruitmentRows
    ? undefined
    : overlayString(overlay, keys.instructor.inquiryEmail)

  const volunteerContact = keepRecruitmentRows
    ? undefined
    : overlayString(overlay, keys.volunteer.inquiryContact)
  const volunteerTel = keepRecruitmentRows
    ? undefined
    : overlayString(overlay, keys.volunteer.inquiryTel)
  const volunteerEmail = keepRecruitmentRows
    ? undefined
    : overlayString(overlay, keys.volunteer.inquiryEmail)

  const description = coalesceString(
    program.description,
    overlayParticipantDetailString(
      overlay,
      'programDescription',
      keys.detailInfo.participantDescription
    ) ??
      overlayString(overlay, keys.detailInfo.instructorDescription) ??
      overlayString(overlay, keys.detailInfo.volunteerDescription),
    preferOverlay
  )
  const recruitmentGuide = coalesceString(
    program.recruitmentGuide,
    overlayParticipantDetailString(overlay, 'recruitmentGuide', keys.detailInfo.participantGuide) ??
      overlayString(overlay, keys.detailInfo.instructorGuide) ??
      overlayString(overlay, keys.detailInfo.volunteerGuide),
    preferOverlay
  )
  const applicationMethod = coalesceString(
    program.applicationMethod,
    overlayParticipantDetailString(
      overlay,
      'applicationMethod',
      keys.detailInfo.participantMethod
    ) ??
      overlayString(overlay, keys.detailInfo.instructorMethod) ??
      overlayString(overlay, keys.detailInfo.volunteerMethod),
    preferOverlay
  )
  const learningSupportContent = coalesceString(
    program.learningSupportContent,
    overlayParticipantDetailString(
      overlay,
      'learningSupportContent',
      keys.detailInfo.participantLearningSupport
    ) ??
      overlayString(overlay, keys.detailInfo.instructorLearningSupport) ??
      overlayString(overlay, keys.detailInfo.volunteerLearningSupport),
    preferOverlay
  )
  const additionalContentHtml = coalesceString(
    program.additionalContentHtml,
    overlayParticipantDetailString(
      overlay,
      'additionalContentHtml',
      keys.detailInfo.participantAdditionalHtml
    ) ??
      overlayString(overlay, keys.detailInfo.instructorAdditionalHtml) ??
      overlayString(overlay, keys.detailInfo.volunteerAdditionalHtml),
    preferOverlay
  )

  const participantPeriodLabel = participantRecruitRange
    ? formatDateRange(participantRecruitRange.start, participantRecruitRange.end)
    : undefined
  const instructorPeriodLabel = instructorRecruitRange
    ? formatDateRange(instructorRecruitRange.start, instructorRecruitRange.end)
    : undefined
  const volunteerPeriodLabel = volunteerRecruitRange
    ? formatDateRange(volunteerRecruitRange.start, volunteerRecruitRange.end)
    : undefined

  const operationFromParticipant = participantProgramRange
    ? formatDateRange(participantProgramRange.start, participantProgramRange.end)
    : undefined
  const operationFromInstructor = instructorProgramRange
    ? formatDateRange(instructorProgramRange.start, instructorProgramRange.end)
    : undefined
  const operationFromVolunteer = volunteerProgramRange
    ? formatDateRange(volunteerProgramRange.start, volunteerProgramRange.end)
    : undefined

  const common = program.generalCommonInfo ?? {}
  const participantInfo = { ...(common.participantRecruitmentInfo ?? {}) }
  const instructorInfo = { ...(common.instructorRecruitmentInfo ?? {}) }
  const volunteerInfo = { ...(common.volunteerRecruitmentInfo ?? {}) }

  const participantTargetLabel = targetLevels?.length
    ? formatTargetLevelsLabel(targetLevels)
    : undefined
  if (participantTargetLabel && participantTargetLabel !== '-') {
    const nextTarget = coalesceString(
      participantInfo.educationTarget ?? participantInfo.recruitmentTarget,
      participantTargetLabel,
      preferOverlay
    )
    if (nextTarget) {
      participantInfo.educationTarget = nextTarget
      participantInfo.recruitmentTarget = nextTarget
    }
  }
  if (targetLevelDetail) {
    const nextDetail = coalesceString(
      participantInfo.educationTargetDetail ?? participantInfo.recruitmentTargetDetail,
      targetLevelDetail,
      preferOverlay
    )
    if (nextDetail) {
      participantInfo.educationTargetDetail = nextDetail
      participantInfo.recruitmentTargetDetail = nextDetail
    }
  }
  if (participantContact) {
    participantInfo.contactOrganizationName = coalesceString(
      participantInfo.contactOrganizationName,
      participantContact,
      preferOverlay
    )
  }
  if (participantTel) {
    participantInfo.inquiryTel = coalesceString(
      participantInfo.inquiryTel ?? participantInfo.tel ?? participantInfo.contactPhone,
      participantTel,
      preferOverlay
    )
  }
  if (participantEmail) {
    participantInfo.inquiryEmail = coalesceString(
      participantInfo.inquiryEmail ?? participantInfo.email ?? participantInfo.contactEmail,
      participantEmail,
      preferOverlay
    )
  }
  if (participantPeriodLabel && participantPeriodLabel !== '-') {
    participantInfo.recruitmentPeriodLabel = coalesceString(
      participantInfo.recruitmentPeriodLabel,
      participantPeriodLabel,
      preferOverlay
    )
  }
  if (operationFromParticipant && operationFromParticipant !== '-') {
    participantInfo.operationPeriodLabel = coalesceString(
      participantInfo.operationPeriodLabel,
      operationFromParticipant,
      preferOverlay
    )
  }
  const participantDescription = overlayParticipantDetailString(
    overlay,
    'programDescription',
    keys.detailInfo.participantDescription
  )
  const participantGuide = overlayParticipantDetailString(
    overlay,
    'recruitmentGuide',
    keys.detailInfo.participantGuide
  )
  const participantMethod = overlayParticipantDetailString(
    overlay,
    'applicationMethod',
    keys.detailInfo.participantMethod
  )
  const participantRemarks =
    overlayString(overlay, inst.notes) ??
    overlayString(overlay, keys.individual.notes) ??
    overlayParticipantDetailString(overlay, 'otherNotes', keys.detailInfo.participantOtherNotes)
  if (participantDescription) {
    participantInfo.programDescription = coalesceString(
      participantInfo.programDescription,
      participantDescription,
      preferOverlay
    )
  }
  if (participantGuide) {
    participantInfo.recruitmentGuide = coalesceString(
      participantInfo.recruitmentGuide,
      participantGuide,
      preferOverlay
    )
  }
  if (participantMethod) {
    participantInfo.applicationMethod = coalesceString(
      participantInfo.applicationMethod,
      participantMethod,
      preferOverlay
    )
  }
  const participantLearning = overlayParticipantDetailString(
    overlay,
    'learningSupportContent',
    keys.detailInfo.participantLearningSupport
  )
  const participantAdditional = overlayParticipantDetailString(
    overlay,
    'additionalContentHtml',
    keys.detailInfo.participantAdditionalHtml
  )
  if (participantLearning) {
    participantInfo.learningSupportContent = coalesceString(
      participantInfo.learningSupportContent,
      participantLearning,
      preferOverlay
    )
  }
  if (participantAdditional) {
    participantInfo.additionalContentHtml = coalesceString(
      participantInfo.additionalContentHtml,
      participantAdditional,
      preferOverlay
    )
  }
  if (participantRemarks) {
    participantInfo.remarks = coalesceString(
      participantInfo.remarks,
      participantRemarks,
      preferOverlay
    )
  }

  const individualFinalAnnounceIso = overlayString(overlay, keys.individual.finalAnnounceIso)
  const individualFinalAnnounceMethod = overlayString(overlay, keys.individual.finalAnnounceMethod)
  const individualDocDeadlineIso = overlayString(overlay, keys.individual.docDeadlineIso)
  const individualDocAnnounceMethod = overlayString(overlay, keys.individual.docAnnounceMethod)
  const individualInterviewEnabled = keepRecruitmentRows
    ? undefined
    : overlayYesNoBool(overlay, keys.individual.interviewRequired)
  const individualInterviewRange = keepRecruitmentRows
    ? undefined
    : individualInterviewEnabled === false
      ? undefined
      : readRangeSeal(overlay, keys.individual.interviewRangeSeal)
  const individualInterviewMethod = overlayString(overlay, keys.individual.interviewMethod)

  if (individualInterviewEnabled !== undefined) {
    const nextInterview = coalesceBool(
      participantInfo.interviewEnabled,
      individualInterviewEnabled,
      preferOverlay
    )
    if (nextInterview !== undefined) {
      participantInfo.interviewEnabled = nextInterview
    }
  }

  // ── 기관·개인 참여자 모집 (공고·사전안내·명단·상한·최종발표) ─────
  const institutionAnnouncementPublished =
    overlayAnnouncementPublished(overlay, inst.announcementPublished) ??
    overlayAnnouncementPublished(overlay, keys.individual.announcementPublished) ??
    (participantRecruitRange || participantContact ? true : undefined)
  const institutionPreguidance = overlayNeedNoneBool(overlay, inst.preguidanceRequired)
  const institutionStudentList = overlayStudentListRequired(overlay, inst.studentListRequired)
  const institutionCertificateRaw = overlayString(overlay, inst.certificateProvided)
  const institutionCertificate =
    institutionCertificateRaw === 'provided' || institutionCertificateRaw === 'yes'
      ? true
      : institutionCertificateRaw === 'not_provided' ||
          institutionCertificateRaw === 'none' ||
          institutionCertificateRaw === 'no'
        ? false
        : undefined
  const institutionFinalAnnounceIso = overlayString(overlay, inst.finalAnnounceIso)
  const institutionFinalAnnounceMethod = overlayString(overlay, inst.finalAnnounceMethod)
  const participantFinalAnnounceIso = institutionFinalAnnounceIso ?? individualFinalAnnounceIso
  const participantFinalAnnounceMethod =
    institutionFinalAnnounceMethod ?? individualFinalAnnounceMethod
  const participantFinalAnnouncementLabel = formatAnnouncementLabel(
    participantFinalAnnounceIso,
    participantFinalAnnounceMethod
  )
  const institutionMaxInstructors = overlayFiniteNumber(overlay, inst.maxAssignableInstructors)
  const institutionMaxClassCount = overlayFiniteNumber(overlay, inst.maxClassCount)
  const institutionMaxScheduleCount = overlayFiniteNumber(overlay, inst.maxScheduleCount)
  const institutionMaxSessionsPerDay = overlayFiniteNumber(overlay, inst.maxSessionsPerDay)

  if (institutionAnnouncementPublished !== undefined) {
    const nextPublished = coalesceBool(
      participantInfo.announcementPublished,
      institutionAnnouncementPublished,
      preferOverlay
    )
    if (nextPublished !== undefined) {
      participantInfo.announcementPublished = nextPublished
      participantInfo.announcementPublishedLabel = nextPublished ? '게시' : '미게시'
    }
  }
  if (institutionPreguidance !== undefined) {
    const nextPreguidance = coalesceBool(
      participantInfo.preEducationNoticeRequired ?? participantInfo.advanceGuidanceRequired,
      institutionPreguidance,
      preferOverlay
    )
    if (nextPreguidance !== undefined) {
      participantInfo.preEducationNoticeRequired = nextPreguidance
      participantInfo.advanceGuidanceRequired = nextPreguidance
      participantInfo.preEducationNoticeRequiredLabel = nextPreguidance ? '작성' : '해당없음'
      participantInfo.advanceGuidanceRequiredLabel = nextPreguidance ? '작성' : '해당없음'
    }
  }
  if (institutionStudentList !== undefined) {
    if (preferOverlay || participantInfo.studentListRequired == null) {
      participantInfo.studentListRequired = institutionStudentList
      participantInfo.studentListRequiredLabel =
        institutionStudentList === 'required' ? '제출 필요' : '제출 불필요'
    }
  }
  if (institutionCertificate !== undefined) {
    const nextCert = coalesceBool(
      participantInfo.certificateIssuanceProvided,
      institutionCertificate,
      preferOverlay
    )
    if (nextCert !== undefined) {
      participantInfo.certificateIssuanceProvided = nextCert
    }
  }
  if (institutionMaxInstructors !== undefined) {
    participantInfo.maxAssignableInstructors = coalesceNumber(
      participantInfo.maxAssignableInstructors,
      institutionMaxInstructors,
      preferOverlay
    )
  }
  if (institutionMaxClassCount !== undefined) {
    participantInfo.maxClassCount = coalesceNumber(
      participantInfo.maxClassCount,
      institutionMaxClassCount,
      preferOverlay
    )
  }
  if (institutionMaxScheduleCount !== undefined) {
    participantInfo.maxScheduleCount = coalesceNumber(
      participantInfo.maxScheduleCount,
      institutionMaxScheduleCount,
      preferOverlay
    )
  }
  if (institutionMaxSessionsPerDay !== undefined) {
    participantInfo.maxSessionsPerDay = coalesceNumber(
      participantInfo.maxSessionsPerDay,
      institutionMaxSessionsPerDay,
      preferOverlay
    )
  }
  if (participantFinalAnnouncementLabel) {
    const nextFinal = coalesceString(
      participantInfo.finalAnnouncementLabel ?? participantInfo.resultAnnouncementLabel,
      participantFinalAnnouncementLabel,
      preferOverlay
    )
    if (nextFinal) {
      participantInfo.finalAnnouncementLabel = nextFinal
      participantInfo.resultAnnouncementLabel = nextFinal
    }
  }
  const overlayParticipantNotesNA =
    overlay[inst.notesNotApplicable] === true ||
    overlay[keys.individual.notesNotApplicable] === true
      ? true
      : overlay[inst.notesNotApplicable] === false ||
          overlay[keys.individual.notesNotApplicable] === false
        ? false
        : undefined
  if (overlayParticipantNotesNA !== undefined) {
    const nextNotesNA = coalesceBool(
      participantInfo.notesNotApplicable,
      overlayParticipantNotesNA,
      preferOverlay
    )
    if (nextNotesNA !== undefined) {
      participantInfo.notesNotApplicable = nextNotesNA
    }
  }

  const instructorTargetLabel = instructorTargets?.length
    ? formatInstructorTargetsLabel(instructorTargets)
    : undefined
  if (instructorTargetLabel && instructorTargetLabel !== '-') {
    instructorInfo.recruitmentTarget = coalesceString(
      instructorInfo.recruitmentTarget,
      instructorTargetLabel,
      preferOverlay
    )
  }
  if (instructorTargetDetail) {
    instructorInfo.recruitmentTargetDetail = coalesceString(
      instructorInfo.recruitmentTargetDetail,
      instructorTargetDetail,
      preferOverlay
    )
  }
  if (instructorContact) {
    instructorInfo.contactOrganizationName = coalesceString(
      instructorInfo.contactOrganizationName,
      instructorContact,
      preferOverlay
    )
  }
  if (instructorTel) {
    instructorInfo.inquiryTel = coalesceString(
      instructorInfo.inquiryTel ?? instructorInfo.tel ?? instructorInfo.contactPhone,
      instructorTel,
      preferOverlay
    )
  }
  if (instructorEmail) {
    instructorInfo.inquiryEmail = coalesceString(
      instructorInfo.inquiryEmail ?? instructorInfo.email ?? instructorInfo.contactEmail,
      instructorEmail,
      preferOverlay
    )
  }
  if (instructorPeriodLabel && instructorPeriodLabel !== '-') {
    instructorInfo.recruitmentPeriodLabel = coalesceString(
      instructorInfo.recruitmentPeriodLabel,
      instructorPeriodLabel,
      preferOverlay
    )
  }
  if (operationFromInstructor && operationFromInstructor !== '-') {
    instructorInfo.operationPeriodLabel = coalesceString(
      instructorInfo.operationPeriodLabel,
      operationFromInstructor,
      preferOverlay
    )
  }
  const instructorDescription = overlayString(overlay, keys.detailInfo.instructorDescription)
  const instructorGuide = overlayString(overlay, keys.detailInfo.instructorGuide)
  const instructorMethod = overlayString(overlay, keys.detailInfo.instructorMethod)
  const instructorRemarks = overlayString(overlay, keys.instructor.notes)
  const instructorOtherMatters = overlayString(overlay, keys.detailInfo.instructorOtherNotes)
  if (instructorDescription) {
    instructorInfo.programDescription = coalesceString(
      instructorInfo.programDescription,
      instructorDescription,
      preferOverlay
    )
  }
  if (instructorGuide) {
    instructorInfo.recruitmentGuide = coalesceString(
      instructorInfo.recruitmentGuide,
      instructorGuide,
      preferOverlay
    )
  }
  if (instructorMethod) {
    instructorInfo.applicationMethod = coalesceString(
      instructorInfo.applicationMethod,
      instructorMethod,
      preferOverlay
    )
  }
  const instructorLearning = overlayString(overlay, keys.detailInfo.instructorLearningSupport)
  const instructorAdditional = overlayString(overlay, keys.detailInfo.instructorAdditionalHtml)
  if (instructorLearning) {
    instructorInfo.learningSupportContent = coalesceString(
      instructorInfo.learningSupportContent,
      instructorLearning,
      preferOverlay
    )
  }
  if (instructorAdditional) {
    instructorInfo.additionalContentHtml = coalesceString(
      instructorInfo.additionalContentHtml,
      instructorAdditional,
      preferOverlay
    )
  }
  // 등록(preferOverlay)만 overlay notes → 비고. 조회는 nested remarks가 비고 SSOT.
  // leftover overlay notes에 옛 기타사항이 남아 있어도 비고를 채우지 않는다. 값 비교로 건너뛰지 않는다.
  if (preferOverlay && instructorRemarks) {
    instructorInfo.remarks = coalesceString(instructorInfo.remarks, instructorRemarks, true)
  }
  if (instructorOtherMatters) {
    instructorInfo.otherMatters = coalesceString(
      instructorInfo.otherMatters,
      instructorOtherMatters,
      preferOverlay
    )
  }
  const instructorAnnouncementPublished =
    overlayAnnouncementPublished(overlay, keys.instructor.announcementPublished) ??
    // 라디오 기본값 `published` — 값을 안 바꿔도 강사 모집 정보가 있으면 게시로 본다.
    (instructorPeriodLabel || instructorContact || instructorTargets?.length ? true : undefined)
  if (instructorAnnouncementPublished !== undefined) {
    const nextPublished = coalesceBool(
      instructorInfo.announcementPublished,
      instructorAnnouncementPublished,
      preferOverlay
    )
    if (nextPublished !== undefined) {
      instructorInfo.announcementPublished = nextPublished
      instructorInfo.announcementPublishedLabel = nextPublished ? '게시' : '미게시'
    }
  }

  const instructorFinalAnnounceIso = overlayString(overlay, keys.instructor.finalAnnounceIso)
  const instructorFinalAnnounceMethod = overlayString(overlay, keys.instructor.finalAnnounceMethod)
  const instructorFinalAnnouncementLabel = formatAnnouncementLabel(
    instructorFinalAnnounceIso,
    instructorFinalAnnounceMethod
  )
  if (instructorFinalAnnouncementLabel) {
    const nextFinal = coalesceString(
      instructorInfo.finalAnnouncementLabel ?? instructorInfo.resultAnnouncementLabel,
      instructorFinalAnnouncementLabel,
      preferOverlay
    )
    if (nextFinal) {
      instructorInfo.finalAnnouncementLabel = nextFinal
      instructorInfo.resultAnnouncementLabel = nextFinal
    }
  }

  const volunteerTargetLabel = volunteerTargets?.length
    ? formatVolunteerTargetsLabel(volunteerTargets)
    : undefined
  if (volunteerTargetLabel && volunteerTargetLabel !== '-') {
    volunteerInfo.recruitmentTarget = coalesceString(
      volunteerInfo.recruitmentTarget,
      volunteerTargetLabel,
      preferOverlay
    )
  }
  if (volunteerTargetDetail) {
    volunteerInfo.recruitmentTargetDetail = coalesceString(
      volunteerInfo.recruitmentTargetDetail,
      volunteerTargetDetail,
      preferOverlay
    )
  }
  if (volunteerContact) {
    volunteerInfo.contactOrganizationName = coalesceString(
      volunteerInfo.contactOrganizationName,
      volunteerContact,
      preferOverlay
    )
  }
  if (volunteerTel) {
    volunteerInfo.inquiryTel = coalesceString(
      volunteerInfo.inquiryTel ?? volunteerInfo.tel ?? volunteerInfo.contactPhone,
      volunteerTel,
      preferOverlay
    )
  }
  if (volunteerEmail) {
    volunteerInfo.inquiryEmail = coalesceString(
      volunteerInfo.inquiryEmail ?? volunteerInfo.email ?? volunteerInfo.contactEmail,
      volunteerEmail,
      preferOverlay
    )
  }
  if (volunteerPeriodLabel && volunteerPeriodLabel !== '-') {
    volunteerInfo.recruitmentPeriodLabel = coalesceString(
      volunteerInfo.recruitmentPeriodLabel,
      volunteerPeriodLabel,
      preferOverlay
    )
  }
  if (operationFromVolunteer && operationFromVolunteer !== '-') {
    volunteerInfo.operationPeriodLabel = coalesceString(
      volunteerInfo.operationPeriodLabel,
      operationFromVolunteer,
      preferOverlay
    )
  }
  const volunteerDescription = overlayString(overlay, keys.detailInfo.volunteerDescription)
  const volunteerGuide = overlayString(overlay, keys.detailInfo.volunteerGuide)
  const volunteerMethod = overlayString(overlay, keys.detailInfo.volunteerMethod)
  const volunteerRemarks = overlayString(overlay, keys.volunteer.notes)
  const volunteerOtherMatters = overlayString(overlay, keys.detailInfo.volunteerOtherNotes)
  if (volunteerDescription) {
    volunteerInfo.programDescription = coalesceString(
      volunteerInfo.programDescription,
      volunteerDescription,
      preferOverlay
    )
  }
  if (volunteerGuide) {
    volunteerInfo.recruitmentGuide = coalesceString(
      volunteerInfo.recruitmentGuide,
      volunteerGuide,
      preferOverlay
    )
  }
  if (volunteerMethod) {
    volunteerInfo.applicationMethod = coalesceString(
      volunteerInfo.applicationMethod,
      volunteerMethod,
      preferOverlay
    )
  }
  const volunteerLearning = overlayString(overlay, keys.detailInfo.volunteerLearningSupport)
  const volunteerAdditional = overlayString(overlay, keys.detailInfo.volunteerAdditionalHtml)
  if (volunteerLearning) {
    volunteerInfo.learningSupportContent = coalesceString(
      volunteerInfo.learningSupportContent,
      volunteerLearning,
      preferOverlay
    )
  }
  if (volunteerAdditional) {
    volunteerInfo.additionalContentHtml = coalesceString(
      volunteerInfo.additionalContentHtml,
      volunteerAdditional,
      preferOverlay
    )
  }
  if (preferOverlay && volunteerRemarks) {
    volunteerInfo.remarks = coalesceString(volunteerInfo.remarks, volunteerRemarks, true)
  }
  if (volunteerOtherMatters) {
    volunteerInfo.otherMatters = coalesceString(
      volunteerInfo.otherMatters,
      volunteerOtherMatters,
      preferOverlay
    )
  }
  const overlayVolunteerNotesNA =
    overlay[keys.volunteer.notesNotApplicable] === true
      ? true
      : overlay[keys.volunteer.notesNotApplicable] === false
        ? false
        : undefined
  if (overlayVolunteerNotesNA !== undefined) {
    const nextVolunteerNotesNA = coalesceBool(
      volunteerInfo.notesNotApplicable,
      overlayVolunteerNotesNA,
      preferOverlay
    )
    if (nextVolunteerNotesNA !== undefined) {
      volunteerInfo.notesNotApplicable = nextVolunteerNotesNA
    }
  }

  const volunteerInterviewEnabled = keepRecruitmentRows
    ? undefined
    : overlayYesNoBool(overlay, keys.volunteer.interviewRequired)
  const volunteerDocDeadlineIso = overlayString(overlay, keys.volunteer.docDeadlineIso)
  const volunteerDocAnnounceMethod = overlayString(overlay, keys.volunteer.docAnnounceMethod)
  const volunteerInterviewRange = keepRecruitmentRows
    ? undefined
    : readRangeSeal(overlay, keys.volunteer.interviewRangeSeal)
  const volunteerInterviewMethod = overlayString(overlay, keys.volunteer.interviewMethod)
  const volunteerFinalAnnounceIso = overlayString(overlay, keys.volunteer.finalAnnounceIso)
  const volunteerFinalAnnounceMethod = overlayString(overlay, keys.volunteer.finalAnnounceMethod)
  const volunteerFinalAnnouncementLabel = formatAnnouncementLabel(
    volunteerFinalAnnounceIso,
    volunteerFinalAnnounceMethod
  )
  const volunteerAnnouncementPublished =
    overlayAnnouncementPublished(overlay, keys.volunteer.announcementPublished) ??
    // UI 기본값 `published` — 라디오를 안 건드리면 overlay 미기록
    (volunteerInterviewEnabled !== undefined ||
    volunteerFinalAnnouncementLabel ||
    volunteerTargets?.length ||
    volunteerContact
      ? true
      : undefined)
  const volunteerInterviewScheduleFromOverlay =
    volunteerInterviewEnabled === false
      ? undefined
      : buildVolunteerInterviewScheduleFromOverlay(overlay)

  if (volunteerAnnouncementPublished !== undefined) {
    const nextPublished = coalesceBool(
      volunteerInfo.announcementPublished,
      volunteerAnnouncementPublished,
      preferOverlay
    )
    if (nextPublished !== undefined) {
      volunteerInfo.announcementPublished = nextPublished
      volunteerInfo.announcementPublishedLabel = nextPublished ? '게시' : '미게시'
    }
  }
  if (volunteerInterviewEnabled !== undefined) {
    const nextInterview = coalesceBool(
      volunteerInfo.volunteerInterviewEnabled ?? volunteerInfo.generalVolunteerInterviewEnabled,
      volunteerInterviewEnabled,
      preferOverlay
    )
    if (nextInterview !== undefined) {
      volunteerInfo.volunteerInterviewEnabled = nextInterview
      volunteerInfo.generalVolunteerInterviewEnabled = nextInterview
      volunteerInfo.volunteerInterviewEnabledLabel = nextInterview ? '면접 있음' : '면접 없음'
    }
  }
  if (volunteerFinalAnnouncementLabel) {
    const nextFinal = coalesceString(
      volunteerInfo.finalAnnouncementLabel ?? volunteerInfo.resultAnnouncementLabel,
      volunteerFinalAnnouncementLabel,
      preferOverlay
    )
    if (nextFinal) {
      volunteerInfo.finalAnnouncementLabel = nextFinal
      volunteerInfo.resultAnnouncementLabel = nextFinal
    }
  }

  // 서류·면접·최종 — nested에도 저장 (serviceDetailJson round-trip / 상세 표시 SSOT)
  if (volunteerDocDeadlineIso) {
    volunteerInfo.documentPassAnnouncementDate = coalesceString(
      typeof volunteerInfo.documentPassAnnouncementDate === 'string'
        ? volunteerInfo.documentPassAnnouncementDate
        : undefined,
      volunteerDocDeadlineIso,
      preferOverlay
    )
  }
  if (volunteerDocAnnounceMethod) {
    volunteerInfo.documentPassAnnouncementMethod = coalesceString(
      volunteerInfo.documentPassAnnouncementMethod,
      volunteerDocAnnounceMethod,
      preferOverlay
    )
  }
  if (volunteerInterviewRange?.start) {
    volunteerInfo.interviewStartDate = coalesceString(
      typeof volunteerInfo.interviewStartDate === 'string'
        ? volunteerInfo.interviewStartDate
        : undefined,
      volunteerInterviewRange.start,
      preferOverlay
    )
  }
  if (volunteerInterviewRange?.end) {
    volunteerInfo.interviewEndDate = coalesceString(
      typeof volunteerInfo.interviewEndDate === 'string'
        ? volunteerInfo.interviewEndDate
        : undefined,
      volunteerInterviewRange.end,
      preferOverlay
    )
  }
  if (volunteerInterviewMethod) {
    volunteerInfo.interviewMethod = coalesceString(
      volunteerInfo.interviewMethod,
      volunteerInterviewMethod,
      preferOverlay
    )
  }
  if (volunteerFinalAnnounceIso) {
    volunteerInfo.finalPassAnnouncementDate = coalesceString(
      typeof volunteerInfo.finalPassAnnouncementDate === 'string'
        ? volunteerInfo.finalPassAnnouncementDate
        : undefined,
      volunteerFinalAnnounceIso,
      preferOverlay
    )
  }
  if (volunteerFinalAnnounceMethod) {
    volunteerInfo.finalPassAnnouncementMethod = coalesceString(
      volunteerInfo.finalPassAnnouncementMethod,
      volunteerFinalAnnounceMethod,
      preferOverlay
    )
  }

  const nextVolunteerInterviewSchedule = mergeVolunteerInterviewScheduleInfo(
    common.volunteerInterviewScheduleInfo,
    volunteerInterviewScheduleFromOverlay,
    preferOverlay
  )

  const contactPhone = coalesceString(
    typeof program.contactPhone === 'string' ? program.contactPhone : undefined,
    participantTel ?? instructorTel ?? volunteerTel,
    preferOverlay
  )
  const contactEmail = coalesceString(
    typeof program.contactEmail === 'string' ? program.contactEmail : undefined,
    participantEmail ?? instructorEmail ?? volunteerEmail,
    preferOverlay
  )

  const fromProgramLevels = resolveProgramTargetLevels(program)
  const fromNestedLabel = parseTargetLevelsFromDisplayLabel(
    participantInfo.educationTarget ?? participantInfo.recruitmentTarget
  )
  const nextTargetLevels = preferOverlay
    ? resolvePersistedProgramTargetLevels({
        targetLevels: program.targetLevels,
        targetLevel: program.targetLevel,
        registrationOverlay: {
          ...(program.registrationOverlay != null && typeof program.registrationOverlay === 'object'
            ? (program.registrationOverlay as Record<string, unknown>)
            : {}),
          ...overlay,
        },
        generalCommonInfo: {
          ...common,
          participantRecruitmentInfo: participantInfo,
        },
      })
    : fromProgramLevels.length > 0
      ? fromProgramLevels
      : fromNestedLabel.length > 0
        ? fromNestedLabel
        : (targetLevels ?? [])

  const nextInstructorTargets =
    preferOverlay && instructorTargets?.length
      ? instructorTargets
      : program.instructorTargets?.length
        ? program.instructorTargets
        : instructorTargets

  const nextVolunteerTargets =
    preferOverlay && volunteerTargets?.length
      ? volunteerTargets
      : program.volunteerTargets?.length
        ? program.volunteerTargets
        : volunteerTargets

  const detailMedia = readRecruitDetailMediaFromOverlay(overlay)
  const keyVisualImage = coalesceString(
    program.keyVisualImage ?? program.posterImage,
    detailMedia.keyVisualImage,
    preferOverlay
  )
  const attachmentFileNames =
    preferOverlay && detailMedia.attachmentFileNames?.length
      ? detailMedia.attachmentFileNames
      : program.attachmentFileNames?.length
        ? program.attachmentFileNames
        : detailMedia.attachmentFileNames

  return {
    ...program,
    description: description ?? program.description,
    recruitmentGuide: recruitmentGuide ?? program.recruitmentGuide,
    applicationMethod: applicationMethod ?? program.applicationMethod,
    learningSupportContent: learningSupportContent ?? program.learningSupportContent,
    additionalContentHtml: additionalContentHtml ?? program.additionalContentHtml,
    keyVisualImage: keyVisualImage ?? program.keyVisualImage,
    posterImage: keyVisualImage ?? program.posterImage,
    attachmentFileNames: attachmentFileNames ?? program.attachmentFileNames,
    otherNotes: program.otherNotes,
    remarks: coalesceString(
      program.remarks ?? participantInfo.remarks,
      participantRemarks,
      preferOverlay
    ),
    oneLineIntroduction: coalesceString(
      program.oneLineIntroduction,
      overlayString(overlay, keys.individual.notes) ?? overlayString(overlay, inst.notes),
      preferOverlay
    ),
    targetLevels: nextTargetLevels,
    targetLevel: nextTargetLevels?.[0] ?? program.targetLevel,
    district: coalesceString(program.district, targetLevelDetail, preferOverlay),
    instructorTargets: nextInstructorTargets,
    instructorTargetDetail: coalesceString(
      program.instructorTargetDetail,
      instructorTargetDetail,
      preferOverlay
    ),
    volunteerTargets: nextVolunteerTargets,
    volunteerTargetDetail: coalesceString(
      program.volunteerTargetDetail,
      volunteerTargetDetail,
      preferOverlay
    ),
    applicationStartDate: coalesceIso(
      program.applicationStartDate,
      participantRecruitRange?.start,
      preferOverlay
    ),
    applicationEndDate: coalesceIso(
      program.applicationEndDate,
      participantRecruitRange?.end,
      preferOverlay
    ),
    instructorApplicationStartDate: coalesceIso(
      program.instructorApplicationStartDate,
      instructorRecruitRange?.start,
      preferOverlay
    ),
    instructorApplicationEndDate: coalesceIso(
      program.instructorApplicationEndDate,
      instructorRecruitRange?.end,
      preferOverlay
    ),
    volunteerApplicationStartDate: coalesceIso(
      program.volunteerApplicationStartDate,
      volunteerRecruitRange?.start,
      preferOverlay
    ),
    volunteerApplicationEndDate: coalesceIso(
      program.volunteerApplicationEndDate,
      volunteerRecruitRange?.end,
      preferOverlay
    ),
    // 모집 단락 「사업 운영 기간」은 operationPeriodLabel 전용.
    // 공통정보 operationRangeSeal → startDate/endDate/business* 를 덮지 않는다.
    contactPhone: contactPhone ?? program.contactPhone,
    contactEmail: contactEmail ?? program.contactEmail,
    studentListRequired: coalesceString(
      program.studentListRequired,
      institutionStudentList,
      preferOverlay
    ) as Program['studentListRequired'],
    resultAnnouncementDate: coalesceIso(
      program.resultAnnouncementDate,
      participantFinalAnnounceIso ?? volunteerFinalAnnounceIso,
      preferOverlay
    ),
    resultAnnouncementMethod: coalesceString(
      program.resultAnnouncementMethod,
      participantFinalAnnounceMethod ?? volunteerFinalAnnounceMethod,
      preferOverlay
    ),
    documentPassAnnouncementDate: coalesceIso(
      program.documentPassAnnouncementDate,
      individualDocDeadlineIso ?? volunteerDocDeadlineIso,
      preferOverlay
    ),
    documentPassAnnouncementMethod: coalesceString(
      program.documentPassAnnouncementMethod,
      individualDocAnnounceMethod ?? volunteerDocAnnounceMethod,
      preferOverlay
    ),
    interviewStartDate: coalesceIso(
      program.interviewStartDate,
      individualInterviewRange?.start ?? volunteerInterviewRange?.start,
      preferOverlay
    ),
    interviewEndDate: coalesceIso(
      program.interviewEndDate,
      individualInterviewRange?.end ?? volunteerInterviewRange?.end,
      preferOverlay
    ),
    interviewMethod: coalesceString(
      program.interviewMethod,
      individualInterviewMethod ?? volunteerInterviewMethod,
      preferOverlay
    ),
    finalPassAnnouncementDate: coalesceIso(
      program.finalPassAnnouncementDate,
      volunteerFinalAnnounceIso ?? instructorFinalAnnounceIso,
      preferOverlay
    ),
    finalPassAnnouncementMethod: coalesceString(
      program.finalPassAnnouncementMethod,
      volunteerFinalAnnounceMethod ?? instructorFinalAnnounceMethod,
      preferOverlay
    ),
    generalParticipantInterviewEnabled: coalesceBool(
      program.generalParticipantInterviewEnabled,
      individualInterviewEnabled,
      preferOverlay
    ),
    generalVolunteerInterviewEnabled: coalesceBool(
      program.generalVolunteerInterviewEnabled,
      volunteerInterviewEnabled,
      preferOverlay
    ),
    generalCommonInfo: {
      ...common,
      participantRecruitmentInfo: participantInfo,
      instructorRecruitmentInfo: instructorInfo,
      volunteerRecruitmentInfo: volunteerInfo,
      ...(nextVolunteerInterviewSchedule
        ? { volunteerInterviewScheduleInfo: nextVolunteerInterviewSchedule }
        : {}),
    },
  }
}

/** 등록 완료·상세 표시 — 현재 in-memory 모집 overlay를 Program에 병합 */
export function resolveGeneralRecruitDisplayProgram(
  program: Program,
  options?: ApplyGeneralRecruitOverlayOptions
): Program {
  flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()
  const overlay = {
    ...getApplicantRecruitInstitutionOverlayRecord(),
    ...getGeneralRecruitOverlayRecord(),
  }
  return applyGeneralRecruitOverlayToProgram(program, overlay, {
    preferOverlay: options?.preferOverlay ?? true,
  })
}

export type GeneralRecruitDetailAudience = 'participant' | 'instructor' | 'volunteer'

function firstRecruitDetailText(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

/**
 * 모집 정보 탭 상세정보(프로그램 설명·모집 안내 등).
 * 중첩 `*RecruitmentInfo`가 정본. overlay는 중첩이 비었을 때만, 컬럼은 그 다음.
 */
export function resolveGeneralRecruitDetailDisplayProgram(
  program: Program,
  audience: GeneralRecruitDetailAudience,
  options?: { strictRemote?: boolean }
): Program {
  const common = program.generalCommonInfo
  const overlay = options?.strictRemote ? {} : (program.registrationOverlay ?? {})
  const keys = GENERAL_RECRUIT_OVERLAY_KEYS.detailInfo
  const info =
    audience === 'participant'
      ? common?.participantRecruitmentInfo
      : audience === 'instructor'
        ? common?.instructorRecruitmentInfo
        : common?.volunteerRecruitmentInfo

  const description =
    audience === 'participant'
      ? firstRecruitDetailText(
          info?.programDescription,
          overlayParticipantDetailString(
            overlay,
            'programDescription',
            keys.participantDescription
          ),
          program.description
        )
      : firstRecruitDetailText(
          info?.programDescription,
          overlayString(
            overlay,
            audience === 'instructor' ? keys.instructorDescription : keys.volunteerDescription
          )
        )
  const recruitmentGuide =
    audience === 'participant'
      ? firstRecruitDetailText(
          info?.recruitmentGuide,
          overlayParticipantDetailString(overlay, 'recruitmentGuide', keys.participantGuide),
          program.recruitmentGuide
        )
      : firstRecruitDetailText(
          info?.recruitmentGuide,
          overlayString(
            overlay,
            audience === 'instructor' ? keys.instructorGuide : keys.volunteerGuide
          )
        )
  const applicationMethod =
    audience === 'participant'
      ? firstRecruitDetailText(
          info?.applicationMethod,
          overlayParticipantDetailString(overlay, 'applicationMethod', keys.participantMethod),
          program.applicationMethod
        )
      : firstRecruitDetailText(
          info?.applicationMethod,
          overlayString(
            overlay,
            audience === 'instructor' ? keys.instructorMethod : keys.volunteerMethod
          )
        )
  const learningSupportContent =
    audience === 'participant'
      ? firstRecruitDetailText(
          info?.learningSupportContent,
          overlayParticipantDetailString(
            overlay,
            'learningSupportContent',
            keys.participantLearningSupport
          ),
          program.learningSupportContent
        )
      : firstRecruitDetailText(
          info?.learningSupportContent,
          overlayString(
            overlay,
            audience === 'instructor'
              ? keys.instructorLearningSupport
              : keys.volunteerLearningSupport
          )
        )
  const additionalContentHtml =
    audience === 'participant'
      ? firstRecruitDetailText(
          info?.additionalContentHtml,
          overlayParticipantDetailString(
            overlay,
            'additionalContentHtml',
            keys.participantAdditionalHtml
          ),
          program.additionalContentHtml
        )
      : firstRecruitDetailText(
          info?.additionalContentHtml,
          overlayString(
            overlay,
            audience === 'instructor' ? keys.instructorAdditionalHtml : keys.volunteerAdditionalHtml
          )
        )
  const otherNotes =
    info && 'notesNotApplicable' in info && info.notesNotApplicable
      ? undefined
      : audience === 'participant'
        ? firstRecruitDetailText(
            info?.remarks,
            overlayParticipantDetailString(overlay, 'otherNotes', keys.participantOtherNotes),
            program.otherNotes
          )
        : firstRecruitDetailText(
            info != null && 'otherMatters' in info ? info.otherMatters : undefined,
            overlayString(
              overlay,
              audience === 'instructor' ? keys.instructorOtherNotes : keys.volunteerOtherNotes
            )
          )

  const withPersistedRecruitMedia = options?.strictRemote
    ? program
    : applyGeneralRecruitOverlayToProgram(program, overlay, { preferOverlay: false })

  const withAudienceCopy = applyRecruitmentRowCopy(
    {
      ...program,
      description,
      recruitmentGuide,
      applicationMethod,
      learningSupportContent,
      additionalContentHtml,
      otherNotes,
      oneLineIntroduction: otherNotes,
    },
    audience
  )

  const instructorAnnouncement =
    audience === 'instructor'
      ? withPersistedRecruitMedia.generalCommonInfo?.instructorRecruitmentInfo
      : undefined

  return {
    ...withAudienceCopy,
    ...(instructorAnnouncement
      ? {
          generalCommonInfo: {
            ...withAudienceCopy.generalCommonInfo,
            instructorRecruitmentInfo: instructorAnnouncement,
          },
        }
      : {}),
    // 강사·봉사자 상세 「기타사항」은 해당 행 otherMatters. 비고(행 remarks)와 섞지 않는다.
    ...(audience === 'participant'
      ? {}
      : {
          otherNotes: resolveRecruitmentOtherMatters(program, audience),
          oneLineIntroduction: undefined,
        }),
    attachmentFileNames:
      withPersistedRecruitMedia.attachmentFileNames ?? program.attachmentFileNames,
    keyVisualImage: withPersistedRecruitMedia.keyVisualImage ?? program.keyVisualImage,
    posterImage: withPersistedRecruitMedia.posterImage ?? program.posterImage,
  }
}
