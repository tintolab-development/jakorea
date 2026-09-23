/**
 * UJAT 프로그램 등록 위저드 — 필수 필드 검사.
 * economy / 일반 프로그램과 동일 정책: UI 기본값·미기록 fallback, 상세 정보·신청 fill overlay는 gate 제외.
 */

export const UJAT_REGISTRATION_REQUIRED_FIELDS_INCOMPLETE_ERROR =
  'UJAT_REGISTRATION_REQUIRED_FIELDS_INCOMPLETE' as const

export class UjatRegistrationRequiredFieldsIncompleteError extends Error {
  constructor() {
    super(UJAT_REGISTRATION_REQUIRED_FIELDS_INCOMPLETE_ERROR)
    this.name = 'UjatRegistrationRequiredFieldsIncompleteError'
  }
}

import {
  UJAT_BASIC_INFO_PROGRAM_MANAGEMENT_DEFAULT,
  UJAT_BASIC_INFO_PUBLIC_TITLE_DEFAULT,
  UJAT_BASIC_INFO_REP_EN_DEFAULT,
  UJAT_BASIC_INFO_REP_KO_DEFAULT,
  UJAT_DETAILED_PROGRAM_UJAT_VALUE,
  UJAT_SPONSOR_ALL_VALUE,
  UJAT_SURVEY_ITEMS_DEFAULT,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'
import {
  UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS as INSTITUTION_KEYS,
  pickUjatRecruitInstitutionOverlay,
} from '@/features/program/ujat/lib/ujat-recruit-institution-template-merge'
import {
  UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS as VOLUNTEER_KEYS,
  pickUjatRecruitVolunteerOverlay,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
import {
  EMPTY_UJAT_HALF_MULTI_SCHEDULE_BUNDLE,
  type UjatHalfMultiScheduleBundle,
  type UjatHalfSemesterKey,
  ujatHalfScheduleOverlayKeys,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import {
  type UjatRegionCapacityBySemesterState,
  UJAT_REGION_CAPACITY_OVERLAY_KEY,
} from '@/features/program/ujat/lib/ujat-region-capacity-types'
import { listUjatEducationRegionsActive } from '@/features/program/ujat/lib/ujat-education-regions'
import { UJAT_WAGE_OVERLAY_PAYMENT_KEY } from '@/features/program/ujat/lib/ujat-wage-info-display'
import { getUjatProgramRegistrationOverlayRecord } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import { getUjatRecruitInstitutionOverlayRecord } from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import { getUjatRecruitVolunteerOverlayRecord } from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'

function isEmptyText(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === ''
}

function isEmptyNumber(value: unknown): boolean {
  return typeof value !== 'number' || !Number.isFinite(value)
}

function isEmptyStringList(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return true
  return value.every(item => isEmptyText(item))
}

function isRangeSealIncomplete(value: unknown): boolean {
  if (value == null || typeof value !== 'object') return true
  const row = value as { start?: unknown; end?: unknown }
  return isEmptyText(row.start) || isEmptyText(row.end)
}

function read(overlay: Record<string, unknown>, key: string): unknown {
  return overlay[key]
}

function readText(overlay: Record<string, unknown>, key: string, fallback = ''): string {
  const raw = overlay[key]
  if (raw === undefined) return fallback
  return typeof raw === 'string' ? raw : ''
}

function readBoolean(overlay: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const raw = overlay[key]
  if (raw === undefined) return fallback
  return raw === true
}

function isPublished(value: unknown): boolean {
  return value === true || value === 'published'
}

function isMultiScheduleBundleIncomplete(value: unknown): boolean {
  const bundle =
    value != null && typeof value === 'object'
      ? (value as UjatHalfMultiScheduleBundle)
      : EMPTY_UJAT_HALF_MULTI_SCHEDULE_BUNDLE
  const rowIds = Array.isArray(bundle.rowIds) && bundle.rowIds.length > 0 ? bundle.rowIds : [0]
  for (const rowId of rowIds) {
    const key = String(rowId)
    const regions = bundle.regionByRow?.[key]
    const date = bundle.dateByRow?.[key]
    if (!Array.isArray(regions) || regions.length === 0 || regions.every(r => isEmptyText(r))) {
      return true
    }
    if (isEmptyText(date)) return true
  }
  return false
}

function findIncompleteUjatBasicInfoReason(overlay: Record<string, unknown>): string | null {
  const p = 'ujat.basicInfo'
  if (isEmptyText(readText(overlay, `${p}.repKo`, UJAT_BASIC_INFO_REP_KO_DEFAULT))) return 'basicInfo.repKo'
  if (isEmptyText(readText(overlay, `${p}.repEn`, UJAT_BASIC_INFO_REP_EN_DEFAULT))) return 'basicInfo.repEn'
  if (isEmptyText(readText(overlay, `${p}.programManagementName`, UJAT_BASIC_INFO_PROGRAM_MANAGEMENT_DEFAULT))) {
    return 'basicInfo.programManagementName'
  }
  if (isEmptyText(readText(overlay, `${p}.publicProgramTitle`, UJAT_BASIC_INFO_PUBLIC_TITLE_DEFAULT))) {
    return 'basicInfo.publicProgramTitle'
  }
  if (isEmptyText(readText(overlay, `${p}.detailedProgramId`, UJAT_DETAILED_PROGRAM_UJAT_VALUE))) {
    return 'basicInfo.detailedProgramId'
  }
  if (isRangeSealIncomplete(read(overlay, `${p}.operationRangeSeal`))) return 'basicInfo.operationRangeSeal'
  const org = readBoolean(overlay, `${p}.participant.organization`, true)
  const volunteer = readBoolean(overlay, `${p}.participant.volunteer`, true)
  if (!org && !volunteer) return 'basicInfo.audience'
  if (isEmptyText(readText(overlay, `${p}.businessField`, 'economy_finance'))) return 'basicInfo.businessField'
  if (isEmptyText(readText(overlay, `${p}.sponsorId`, UJAT_SPONSOR_ALL_VALUE))) return 'basicInfo.sponsorId'
  const sponsorId = readText(overlay, `${p}.sponsorId`, UJAT_SPONSOR_ALL_VALUE)
  if (sponsorId !== UJAT_SPONSOR_ALL_VALUE) {
    const managerIdsRaw = read(overlay, `${p}.sponsorContactIds`)
    const managerIds = Array.isArray(managerIdsRaw)
      ? managerIdsRaw.map(String).map(id => id.trim()).filter(Boolean)
      : []
    const managerPrimary = readText(overlay, `${p}.sponsorContactId`, UJAT_SPONSOR_ALL_VALUE)
    if (managerIds.length === 0 && isEmptyText(managerPrimary)) return 'basicInfo.sponsorContact'
  }
  const survey = read(overlay, `${p}.surveyItems`)
  if (survey != null && typeof survey === 'object') {
    const row = survey as Record<string, unknown>
    const defaults = UJAT_SURVEY_ITEMS_DEFAULT as Record<string, unknown>
    const any = Object.keys(defaults).some(key => row[key] === true)
    if (!any) return 'basicInfo.surveyItems'
  }
  if (isEmptyText(read(overlay, `${p}.educationCourse`))) return 'basicInfo.educationCourse'
  if (isEmptyText(readText(overlay, `${p}.ipOwned`, 'ja'))) return 'basicInfo.ipOwned'
  if (isEmptyText(readText(overlay, `${p}.courseDeliveredBy`, 'ja'))) return 'basicInfo.courseDeliveredBy'
  if (isEmptyText(readText(overlay, `${p}.partnerInvolvement`, 'no'))) return 'basicInfo.partnerInvolvement'
  if (isEmptyText(readText(overlay, `${p}.ipsCategory`, 'prepare'))) return 'basicInfo.ipsCategory'
  return null
}

function findIncompleteUjatKpiReason(overlay: Record<string, unknown>): string | null {
  const p = 'ujat.kpi'
  if (isEmptyNumber(read(overlay, `${p}.participantCount`))) return 'kpi.participantCount'
  if (isEmptyNumber(read(overlay, `${p}.volunteer`))) return 'kpi.volunteer'
  if (isEmptyNumber(read(overlay, `${p}.dispatchedSchool`))) return 'kpi.dispatchedSchool'
  if (isEmptyNumber(read(overlay, `${p}.dispatchedClass`))) return 'kpi.dispatchedClass'
  return null
}

function findIncompleteUjatWageReason(overlay: Record<string, unknown>): string | null {
  const payment = read(overlay, UJAT_WAGE_OVERLAY_PAYMENT_KEY)
  if (payment === undefined) return null
  if (!Array.isArray(payment) || payment.length === 0) return 'wage.paymentItemValues'
  return null
}

function findIncompleteUjatHalfScheduleReason(
  overlay: Record<string, unknown>,
  half: UjatHalfSemesterKey
): string | null {
  const keys = ujatHalfScheduleOverlayKeys(half)
  // UI 기본값「사전교육(발대식)」은 overlay 미기록일 수 있음 — 진행 일정은 항상 필수
  if (isEmptyText(readText(overlay, keys.preName, '사전교육(발대식)'))) return `${half}.pre.name`
  if (isMultiScheduleBundleIncomplete(read(overlay, keys.preMulti))) return `${half}.pre.schedule`
  if (isEmptyText(read(overlay, keys.eventName))) return `${half}.event.name`
  if (isRangeSealIncomplete(read(overlay, keys.eventRange))) return `${half}.event.range`
  if (isMultiScheduleBundleIncomplete(read(overlay, keys.closingMulti))) return `${half}.closing.multi`
  return null
}

function findIncompleteUjatRegionCapacityReason(overlay: Record<string, unknown>): string | null {
  const raw = overlay[UJAT_REGION_CAPACITY_OVERLAY_KEY]
  const capacity =
    raw != null && typeof raw === 'object'
      ? (raw as UjatRegionCapacityBySemesterState)
      : { h1: {}, h2: {} }
  for (const half of ['h1', 'h2'] as const) {
    for (const region of listUjatEducationRegionsActive()) {
      const row = capacity[half]?.[region.label]
      const classCount = row?.classCount
      const volunteerCount = row?.volunteerCount
      if (isEmptyText(classCount) || isEmptyText(volunteerCount)) {
        return `capacity.${half}.${region.label}`
      }
    }
  }
  return null
}

export function describeIncompleteUjatProgramRegistrationRequiredFields(
  overlay: Record<string, unknown> = getUjatProgramRegistrationOverlayRecord()
): string | null {
  return (
    findIncompleteUjatBasicInfoReason(overlay) ??
    findIncompleteUjatKpiReason(overlay) ??
    findIncompleteUjatWageReason(overlay) ??
    findIncompleteUjatHalfScheduleReason(overlay, 'h1') ??
    findIncompleteUjatHalfScheduleReason(overlay, 'h2') ??
    findIncompleteUjatRegionCapacityReason(overlay) ??
    null
  )
}

export function hasIncompleteUjatProgramRegistrationRequiredFields(
  overlay: Record<string, unknown> = getUjatProgramRegistrationOverlayRecord()
): boolean {
  return describeIncompleteUjatProgramRegistrationRequiredFields(overlay) != null
}

export function getMergedUjatRecruitInstitutionOverlay(): Record<string, unknown> {
  const programOverlay = getUjatProgramRegistrationOverlayRecord()
  return {
    ...pickUjatRecruitInstitutionOverlay(programOverlay),
    ...getUjatRecruitInstitutionOverlayRecord(),
  }
}

export function getMergedUjatRecruitVolunteerOverlay(): Record<string, unknown> {
  const programOverlay = getUjatProgramRegistrationOverlayRecord()
  return {
    ...pickUjatRecruitVolunteerOverlay(programOverlay),
    ...getUjatRecruitVolunteerOverlayRecord(),
  }
}

/** 「상세 정보」단락은 schema `requiredMark: false` — phase gate에서 제외 */
function hasIncompleteUjatInstitutionRecruit(overlay: Record<string, unknown>): boolean {
  if (!isPublished(read(overlay, INSTITUTION_KEYS.announcementPublished))) return true
  if (isRangeSealIncomplete(read(overlay, INSTITUTION_KEYS.programRange))) return true
  if (isEmptyStringList(read(overlay, INSTITUTION_KEYS.targetLevels))) return true
  if (isEmptyText(read(overlay, INSTITUTION_KEYS.district))) return true
  if (isRangeSealIncomplete(read(overlay, INSTITUTION_KEYS.recruitRange))) return true
  const result = read(overlay, INSTITUTION_KEYS.resultAnnounce)
  if (result == null || typeof result !== 'object') return true
  const resultRow = result as { date?: unknown; method?: unknown }
  if (isEmptyText(resultRow.date) || isEmptyText(resultRow.method)) return true
  const contact = read(overlay, INSTITUTION_KEYS.contact)
  if (contact == null || typeof contact !== 'object') return true
  const contactRow = contact as { name?: unknown; phone?: unknown; email?: unknown }
  if (
    isEmptyText(contactRow.name) ||
    isEmptyText(contactRow.phone) ||
    isEmptyText(contactRow.email)
  ) {
    return true
  }
  if (isEmptyText(read(overlay, INSTITUTION_KEYS.notes))) return true
  return false
}

function hasIncompleteUjatVolunteerRecruit(overlay: Record<string, unknown>): boolean {
  if (!isPublished(read(overlay, VOLUNTEER_KEYS.announcementPublished))) return true
  if (isEmptyText(readText(overlay, VOLUNTEER_KEYS.noticeExposure, 'start-day'))) return true
  if (isRangeSealIncomplete(read(overlay, VOLUNTEER_KEYS.programRange))) return true
  if (isEmptyStringList(read(overlay, VOLUNTEER_KEYS.volunteerTargets))) return true
  if (isEmptyText(read(overlay, VOLUNTEER_KEYS.targetDetail))) return true
  if (isRangeSealIncomplete(read(overlay, VOLUNTEER_KEYS.recruitRangeH1))) return true
  if (isRangeSealIncomplete(read(overlay, VOLUNTEER_KEYS.recruitRangeH2))) return true
  if (isEmptyText(read(overlay, VOLUNTEER_KEYS.activityTermH1))) return true
  if (isEmptyText(read(overlay, VOLUNTEER_KEYS.activityTermH2))) return true
  const docAnnounce = read(overlay, VOLUNTEER_KEYS.docAnnounce)
  if (docAnnounce == null || typeof docAnnounce !== 'object') return true
  const docRow = docAnnounce as { date?: unknown; method?: unknown }
  if (isEmptyText(docRow.date) || isEmptyText(docRow.method)) return true
  const interviewMethod = readText(overlay, VOLUNTEER_KEYS.interviewMethod, 'no')
  if (interviewMethod !== 'no' && isRangeSealIncomplete(read(overlay, VOLUNTEER_KEYS.interviewRange))) {
    return true
  }
  const finalAnnounce = read(overlay, VOLUNTEER_KEYS.finalAnnounce)
  if (finalAnnounce == null || typeof finalAnnounce !== 'object') return true
  const finalRow = finalAnnounce as { date?: unknown; method?: unknown }
  if (isEmptyText(finalRow.date) || isEmptyText(finalRow.method)) return true
  const contact = read(overlay, VOLUNTEER_KEYS.contact)
  if (contact == null || typeof contact !== 'object') return true
  const contactRow = contact as { name?: unknown; phone?: unknown; email?: unknown }
  if (
    isEmptyText(contactRow.name) ||
    isEmptyText(contactRow.phone) ||
    isEmptyText(contactRow.email)
  ) {
    return true
  }
  if (isEmptyText(read(overlay, VOLUNTEER_KEYS.notes))) return true
  if (isEmptyText(read(overlay, VOLUNTEER_KEYS.otherNotes))) return true
  return false
}

export function describeIncompleteUjatProgramRecruitmentRequiredFields(): string | null {
  if (hasIncompleteUjatInstitutionRecruit(getMergedUjatRecruitInstitutionOverlay())) {
    return 'recruit.institution'
  }
  if (hasIncompleteUjatVolunteerRecruit(getMergedUjatRecruitVolunteerOverlay())) {
    return 'recruit.volunteer'
  }
  return null
}

export function hasIncompleteUjatProgramRecruitmentRequiredFields(): boolean {
  return describeIncompleteUjatProgramRecruitmentRequiredFields() != null
}

/** 등록 위저드 complete gate — 공통 + 모집만. 신청(template) overlay는 검사하지 않는다. */
export function hasIncompleteUjatProgramRegistrationWizardRequiredFields(): boolean {
  return (
    hasIncompleteUjatProgramRegistrationRequiredFields() ||
    hasIncompleteUjatProgramRecruitmentRequiredFields()
  )
}

export function describeIncompleteUjatProgramRegistrationWizardRequiredFields(): string | null {
  return (
    describeIncompleteUjatProgramRegistrationRequiredFields() ??
    describeIncompleteUjatProgramRecruitmentRequiredFields() ??
    null
  )
}
