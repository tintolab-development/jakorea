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

import { listVolunteerInterviewExceptionBlockIds } from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import {
  UJAT_BASIC_INFO_PROGRAM_MANAGEMENT_DEFAULT,
  UJAT_BASIC_INFO_REP_EN_DEFAULT,
  UJAT_BASIC_INFO_REP_KO_DEFAULT,
  UJAT_DETAILED_PROGRAM_UJAT_VALUE,
  UJAT_SPONSOR_ALL_VALUE,
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
  resolveVolunteerOverlayForHalf,
  ujatVolunteerRecruitInterviewNamespace,
  type UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'
import { pickUjatVolunteerRecruitGeneralStoreSidecar } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-overlay'
import {
  EMPTY_UJAT_HALF_MULTI_SCHEDULE_BUNDLE,
  type UjatHalfMultiScheduleBundle,
  ujatHalfScheduleOverlayKeys,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import {
  type UjatRegionCapacityBySemesterState,
  UJAT_REGION_CAPACITY_OVERLAY_KEY,
} from '@/features/program/ujat/lib/ujat-region-capacity-types'
import { listUjatEducationRegionsActive } from '@/features/program/ujat/lib/ujat-education-regions'
import { UJAT_WAGE_OVERLAY_PAYMENT_KEY } from '@/features/program/ujat/lib/ujat-wage-info-display'
import { getUjatProgramRegistrationOverlayRecord } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import {
  getUjatRecruitInstitutionOverlayRecord,
  peekUjatRecruitInstitutionOverlayRecord,
} from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import {
  getUjatRecruitVolunteerOverlayRecord,
  peekUjatRecruitVolunteerOverlayRecord,
} from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'
import { peekGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { getSelectedOperationalTemplateCode } from '@/features/program/shared/lib/step-template-selection'
import type { UjatBasicInfoFormValues } from './ujat-basic-info-form'

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

function pushReason(reasons: string[], condition: boolean, key: string): void {
  if (condition) reasons.push(key)
}

/** UJAT 등록 공통정보 — 미입력 필수 필드 진단 키 목록 */
export function listIncompleteUjatProgramRegistrationRequiredFields(
  overlay: Record<string, unknown> = getUjatProgramRegistrationOverlayRecord(),
  basicInfo?: Partial<UjatBasicInfoFormValues>
): string[] {
  const reasons: string[] = []
  {
    const p = 'ujat.basicInfo'
    const basicText = (key: keyof UjatBasicInfoFormValues, overlayKey: string, fallback = '') =>
      basicInfo != null
        ? typeof basicInfo[key] === 'string'
          ? String(basicInfo[key])
          : fallback
        : readText(overlay, overlayKey, fallback)
    const basicBoolean = (key: keyof UjatBasicInfoFormValues, overlayKey: string, fallback: boolean) =>
      basicInfo != null ? basicInfo[key] === true : readBoolean(overlay, overlayKey, fallback)
    const basicRange =
      basicInfo != null
        ? { start: basicInfo.startDate, end: basicInfo.endDate }
        : read(overlay, `${p}.operationRangeSeal`)
    const participantTypes =
      basicInfo?.generalParticipantTypes != null
        ? new Set(basicInfo.generalParticipantTypes)
        : null
    pushReason(
      reasons,
      isEmptyText(basicText('mainTitle', `${p}.repKo`, UJAT_BASIC_INFO_REP_KO_DEFAULT)),
      'basicInfo.repKo'
    )
    pushReason(
      reasons,
      isEmptyText(basicText('titleEn', `${p}.repEn`, UJAT_BASIC_INFO_REP_EN_DEFAULT)),
      'basicInfo.repEn'
    )
    pushReason(
      reasons,
      isEmptyText(
        basicText('title', `${p}.programManagementName`, UJAT_BASIC_INFO_PROGRAM_MANAGEMENT_DEFAULT)
      ),
      'basicInfo.programManagementName'
    )
    pushReason(
      reasons,
      isEmptyText(basicText('detailedProgramId', `${p}.detailedProgramId`, UJAT_DETAILED_PROGRAM_UJAT_VALUE)),
      'basicInfo.detailedProgramId'
    )
    pushReason(reasons, isRangeSealIncomplete(basicRange), 'basicInfo.operationRangeSeal')
    const org = participantTypes
      ? participantTypes.has('organization') || participantTypes.has('school_institution')
      : basicBoolean('generalParticipantTypes', `${p}.participant.organization`, true)
    const volunteer = participantTypes
      ? participantTypes.has('volunteer')
      : basicBoolean('generalParticipantTypes', `${p}.participant.volunteer`, true)
    pushReason(reasons, !org && !volunteer, 'basicInfo.audience')
    pushReason(
      reasons,
      isEmptyText(basicText('businessArea', `${p}.businessField`, 'economy_finance')),
      'basicInfo.businessField'
    )
    pushReason(
      reasons,
      isEmptyText(basicText('sponsorId', `${p}.sponsorId`, UJAT_SPONSOR_ALL_VALUE)),
      'basicInfo.sponsorId'
    )
    const sponsorId = basicText('sponsorId', `${p}.sponsorId`, UJAT_SPONSOR_ALL_VALUE)
    if (sponsorId !== UJAT_SPONSOR_ALL_VALUE) {
      const managerIdsRaw = basicInfo?.sponsorManagerContactIds ?? read(overlay, `${p}.sponsorContactIds`)
      const managerIds = Array.isArray(managerIdsRaw)
        ? managerIdsRaw.map(String).map(id => id.trim()).filter(Boolean)
        : []
      const managerPrimary = basicText(
        'sponsorManagerContactId',
        `${p}.sponsorContactId`,
        UJAT_SPONSOR_ALL_VALUE
      )
      pushReason(
        reasons,
        managerIds.length === 0 && isEmptyText(managerPrimary),
        'basicInfo.sponsorContact'
      )
    }
    // 설문 진행 항목 — 0개 선택도 완료 (선택)
    pushReason(
      reasons,
      isEmptyText(basicText('educationProcess', `${p}.educationCourse`)),
      'basicInfo.educationCourse'
    )
    pushReason(reasons, isEmptyText(basicText('ipOwned', `${p}.ipOwned`, 'ja')), 'basicInfo.ipOwned')
    pushReason(
      reasons,
      isEmptyText(basicText('courseDeliveredBy', `${p}.courseDeliveredBy`, 'ja')),
      'basicInfo.courseDeliveredBy'
    )
    pushReason(
      reasons,
      basicInfo != null
        ? basicInfo.partnerInvolvement == null
        : isEmptyText(readText(overlay, `${p}.partnerInvolvement`, 'no')),
      'basicInfo.partnerInvolvement'
    )
    pushReason(
      reasons,
      isEmptyText(basicText('ipsCategory', `${p}.ipsCategory`, 'prepare')),
      'basicInfo.ipsCategory'
    )

    const kpiP = 'ujat.kpi'
    pushReason(reasons, isEmptyNumber(read(overlay, `${kpiP}.participantCount`)), 'kpi.participantCount')
    pushReason(reasons, isEmptyNumber(read(overlay, `${kpiP}.volunteer`)), 'kpi.volunteer')
    pushReason(reasons, isEmptyNumber(read(overlay, `${kpiP}.dispatchedSchool`)), 'kpi.dispatchedSchool')
    pushReason(reasons, isEmptyNumber(read(overlay, `${kpiP}.dispatchedClass`)), 'kpi.dispatchedClass')

    const payment = read(overlay, UJAT_WAGE_OVERLAY_PAYMENT_KEY)
    if (payment !== undefined) {
      pushReason(
        reasons,
        !Array.isArray(payment) || payment.length === 0,
        'wage.paymentItemValues'
      )
    }

    for (const half of ['h1', 'h2'] as const) {
      const keys = ujatHalfScheduleOverlayKeys(half)
      pushReason(
        reasons,
        isEmptyText(readText(overlay, keys.preName, '사전교육(발대식)')),
        `${half}.pre.name`
      )
      pushReason(
        reasons,
        isMultiScheduleBundleIncomplete(read(overlay, keys.preMulti)),
        `${half}.pre.schedule`
      )
      pushReason(reasons, isEmptyText(read(overlay, keys.eventName)), `${half}.event.name`)
      pushReason(
        reasons,
        isRangeSealIncomplete(read(overlay, keys.eventRange)),
        `${half}.event.range`
      )
      pushReason(
        reasons,
        isMultiScheduleBundleIncomplete(read(overlay, keys.closingMulti)),
        `${half}.closing.multi`
      )
    }

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
        pushReason(
          reasons,
          isEmptyText(classCount) || isEmptyText(volunteerCount),
          `capacity.${half}.${region.label}`
        )
      }
    }
  }
  return reasons
}

export function describeIncompleteUjatProgramRegistrationRequiredFields(
  overlay: Record<string, unknown> = getUjatProgramRegistrationOverlayRecord(),
  basicInfo?: Partial<UjatBasicInfoFormValues>
): string | null {
  return listIncompleteUjatProgramRegistrationRequiredFields(overlay, basicInfo)[0] ?? null
}

export function hasIncompleteUjatProgramRegistrationRequiredFields(
  overlay: Record<string, unknown> = getUjatProgramRegistrationOverlayRecord(),
  basicInfo?: Partial<UjatBasicInfoFormValues>
): boolean {
  return describeIncompleteUjatProgramRegistrationRequiredFields(overlay, basicInfo) != null
}

export function getMergedUjatRecruitInstitutionOverlay(
  templateCode?: string
): Record<string, unknown> {
  const programOverlay = getUjatProgramRegistrationOverlayRecord()
  return {
    ...pickUjatRecruitInstitutionOverlay(programOverlay),
    ...(templateCode == null
      ? getUjatRecruitInstitutionOverlayRecord()
      : peekUjatRecruitInstitutionOverlayRecord(templateCode)),
  }
}

export function getMergedUjatRecruitVolunteerOverlay(
  templateCode?: string
): Record<string, unknown> {
  const programOverlay = getUjatProgramRegistrationOverlayRecord()
  const generalRecruit =
    templateCode == null
      ? undefined
      : peekGeneralRecruitOverlayRecord(templateCode)
  return {
    ...pickUjatRecruitVolunteerOverlay(programOverlay),
    ...(templateCode == null
      ? getUjatRecruitVolunteerOverlayRecord()
      : peekUjatRecruitVolunteerOverlayRecord(templateCode)),
    ...pickUjatVolunteerRecruitGeneralStoreSidecar(generalRecruit),
  }
}

/** 「상세 정보」단락은 schema `requiredMark: false` — phase gate에서 제외 */
function listIncompleteUjatInstitutionRecruit(overlay: Record<string, unknown>): string[] {
  const reasons: string[] = []
  const p = 'recruit.institution'
  pushReason(reasons, !isPublished(read(overlay, INSTITUTION_KEYS.announcementPublished)), `${p}.announcementPublished`)
  pushReason(reasons, isRangeSealIncomplete(read(overlay, INSTITUTION_KEYS.programRange)), `${p}.programRangeSeal`)
  pushReason(reasons, isEmptyStringList(read(overlay, INSTITUTION_KEYS.targetLevels)), `${p}.targetLevels`)
  pushReason(reasons, isEmptyText(read(overlay, INSTITUTION_KEYS.district)), `${p}.targetLevelDetail`)
  pushReason(reasons, isRangeSealIncomplete(read(overlay, INSTITUTION_KEYS.recruitRange)), `${p}.recruitRangeSeal`)
  const result = read(overlay, INSTITUTION_KEYS.resultAnnounce)
  const resultRow =
    result != null && typeof result === 'object' ? (result as { date?: unknown; method?: unknown }) : null
  pushReason(reasons, resultRow == null || isEmptyText(resultRow.date), `${p}.finalAnnounceIso`)
  pushReason(reasons, resultRow == null || isEmptyText(resultRow.method), `${p}.finalAnnounceMethod`)
  const contact = read(overlay, INSTITUTION_KEYS.contact)
  const contactRow =
    contact != null && typeof contact === 'object'
      ? (contact as { name?: unknown; phone?: unknown; email?: unknown })
      : null
  pushReason(reasons, contactRow == null || isEmptyText(contactRow.name), `${p}.inquiryContact`)
  pushReason(reasons, contactRow == null || isEmptyText(contactRow.phone), `${p}.inquiryTel`)
  pushReason(reasons, contactRow == null || isEmptyText(contactRow.email), `${p}.inquiryEmail`)
  pushReason(reasons, isEmptyText(read(overlay, INSTITUTION_KEYS.notes)), `${p}.notes`)
  return reasons
}

function listIncompleteUjatVolunteerRecruitHalf(
  overlay: Record<string, unknown>,
  half: UjatVolunteerRecruitHalf
): string[] {
  const reasons: string[] = []
  const p = `recruit.volunteer.${half}`
  const resolved = resolveVolunteerOverlayForHalf(overlay, half)
  pushReason(reasons, !isPublished(read(resolved, VOLUNTEER_KEYS.announcementPublished)), `${p}.announcementPublished`)
  if (half === 'h2') {
    pushReason(
      reasons,
      isEmptyText(readText(resolved, VOLUNTEER_KEYS.noticeExposure, 'start-day')),
      `${p}.noticeExposure`
    )
  }
  pushReason(reasons, isRangeSealIncomplete(read(resolved, VOLUNTEER_KEYS.programRange)), `${p}.programRangeSeal`)
  pushReason(reasons, isEmptyStringList(read(resolved, VOLUNTEER_KEYS.volunteerTargets)), `${p}.volunteerTargets`)
  pushReason(reasons, isEmptyText(read(resolved, VOLUNTEER_KEYS.targetDetail)), `${p}.volunteerTargetDetail`)
  const recruitRangeKey = half === 'h1' ? VOLUNTEER_KEYS.recruitRangeH1 : VOLUNTEER_KEYS.recruitRangeH2
  const activityKey = half === 'h1' ? VOLUNTEER_KEYS.activityTermH1 : VOLUNTEER_KEYS.activityTermH2
  pushReason(reasons, isRangeSealIncomplete(read(resolved, recruitRangeKey)), `${p}.recruitRangeSeal`)
  pushReason(reasons, isEmptyText(read(resolved, activityKey)), `${p}.activityTerm`)
  const docAnnounce = read(resolved, VOLUNTEER_KEYS.docAnnounce)
  const docRow =
    docAnnounce != null && typeof docAnnounce === 'object'
      ? (docAnnounce as { date?: unknown; method?: unknown })
      : null
  pushReason(reasons, docRow == null || isEmptyText(docRow.date) || isEmptyText(docRow.method), `${p}.docAnnounce`)
  const interviewMethod = readText(resolved, VOLUNTEER_KEYS.interviewMethod, 'no')
  pushReason(reasons, isEmptyText(interviewMethod), `${p}.interviewMethod`)
  if (interviewMethod !== 'no') {
    pushReason(
      reasons,
      isRangeSealIncomplete(read(resolved, VOLUNTEER_KEYS.interviewRange)),
      `${p}.interviewRangeSeal`
    )
  }
  const finalAnnounce = read(resolved, VOLUNTEER_KEYS.finalAnnounce)
  const finalRow =
    finalAnnounce != null && typeof finalAnnounce === 'object'
      ? (finalAnnounce as { date?: unknown; method?: unknown })
      : null
  pushReason(reasons, finalRow == null || isEmptyText(finalRow.date), `${p}.finalAnnounceIso`)
  pushReason(reasons, finalRow == null || isEmptyText(finalRow.method), `${p}.finalAnnounceMethod`)
  const contact = read(resolved, VOLUNTEER_KEYS.contact)
  const contactRow =
    contact != null && typeof contact === 'object'
      ? (contact as { name?: unknown; phone?: unknown; email?: unknown })
      : null
  pushReason(reasons, contactRow == null || isEmptyText(contactRow.name), `${p}.inquiryContact`)
  pushReason(reasons, contactRow == null || isEmptyText(contactRow.phone), `${p}.inquiryTel`)
  pushReason(reasons, contactRow == null || isEmptyText(contactRow.email), `${p}.inquiryEmail`)
  pushReason(reasons, isEmptyText(read(resolved, VOLUNTEER_KEYS.notes)), `${p}.notes`)
  pushReason(reasons, isEmptyText(read(resolved, VOLUNTEER_KEYS.otherNotes)), `${p}.otherNotes`)
  return reasons
}

function isInterviewTimeRangeIncomplete(value: unknown): boolean {
  if (value == null) return true
  if (!Array.isArray(value) || value.length < 2) return true
  return value[0] == null || value[1] == null
}

/** schema `requiredMark` — 면접 진행 가능 시간·선택 슬롯 */
function hasIncompleteUjatVolunteerInterviewSchedule(
  overlay: Record<string, unknown>,
  half: UjatVolunteerRecruitHalf
): boolean {
  const ns = ujatVolunteerRecruitInterviewNamespace(half)
  if (isInterviewTimeRangeIncomplete(read(overlay, `${ns}.interviewTimeRange`))) return true
  const slots = read(overlay, `${ns}.selectedSlotKeys`)
  if (!Array.isArray(slots) || slots.length === 0) return true
  if (slots.every(slot => isEmptyText(slot))) return true
  const exceptionIds = listVolunteerInterviewExceptionBlockIds(overlay, 'recruit', ns)
  for (const id of exceptionIds) {
    const prefix = `${ns}.exception.${id}`
    const exceptionDate = read(overlay, `${prefix}.exceptionDate`)
    if (exceptionDate == null || isEmptyText(String(exceptionDate))) return true
    const exceptionSlots = read(overlay, `${prefix}.selectedSlotKeys`)
    if (!Array.isArray(exceptionSlots) || exceptionSlots.length === 0) return true
    if (exceptionSlots.every(slot => isEmptyText(slot))) return true
  }
  return false
}

function listIncompleteUjatVolunteerRecruit(overlay: Record<string, unknown>): string[] {
  const reasons: string[] = []
  for (const half of ['h1', 'h2'] as const) {
    reasons.push(...listIncompleteUjatVolunteerRecruitHalf(overlay, half))
    if (hasIncompleteUjatVolunteerInterviewSchedule(overlay, half)) {
      reasons.push(`recruit.volunteer.${half}.interviewSchedule`)
    }
  }
  return reasons
}

/** UJAT 모집 단계 — 미입력 필수 필드 진단 키 */
type UjatRecruitmentValidationTemplateCodes = {
  institutionTemplateCode: string
  volunteerTemplateCode: string
}

export function listIncompleteUjatProgramRecruitmentRequiredFields(
  templateCodes?: UjatRecruitmentValidationTemplateCodes
): string[] {
  return [
    ...listIncompleteUjatInstitutionRecruit(
      getMergedUjatRecruitInstitutionOverlay(templateCodes?.institutionTemplateCode)
    ),
    ...listIncompleteUjatVolunteerRecruit(
      getMergedUjatRecruitVolunteerOverlay(templateCodes?.volunteerTemplateCode)
    ),
  ]
}

export function describeIncompleteUjatProgramRecruitmentRequiredFields(): string | null {
  return listIncompleteUjatProgramRecruitmentRequiredFields()[0] ?? null
}

export function hasIncompleteUjatProgramRecruitmentRequiredFields(): boolean {
  return describeIncompleteUjatProgramRecruitmentRequiredFields() != null
}

function selectedUjatRecruitmentValidationTemplateCodes(): UjatRecruitmentValidationTemplateCodes {
  return {
    institutionTemplateCode: getSelectedOperationalTemplateCode(
      'UJAT',
      'recruit-participant',
      'recruitment-ujat-school'
    ),
    volunteerTemplateCode: getSelectedOperationalTemplateCode(
      'UJAT',
      'recruit-volunteer',
      'recruitment-ujat-volunteer'
    ),
  }
}

/** 등록 위저드 complete gate — 공통 + 모집만. 신청(template) overlay는 검사하지 않는다. */
export function hasIncompleteUjatProgramRegistrationWizardRequiredFields(
  basicInfo?: Partial<UjatBasicInfoFormValues>
): boolean {
  return listIncompleteUjatProgramRegistrationWizardRequiredFields(basicInfo).length > 0
}

export function listIncompleteUjatProgramRegistrationWizardRequiredFields(
  basicInfo?: Partial<UjatBasicInfoFormValues>
): string[] {
  return [
    ...listIncompleteUjatProgramRegistrationRequiredFields(
      getUjatProgramRegistrationOverlayRecord(),
      basicInfo
    ),
    ...listIncompleteUjatProgramRecruitmentRequiredFields(
      selectedUjatRecruitmentValidationTemplateCodes()
    ),
  ]
}

export function describeIncompleteUjatProgramRegistrationWizardRequiredFields(
  basicInfo?: Partial<UjatBasicInfoFormValues>
): string | null {
  return listIncompleteUjatProgramRegistrationWizardRequiredFields(basicInfo)[0] ?? null
}
