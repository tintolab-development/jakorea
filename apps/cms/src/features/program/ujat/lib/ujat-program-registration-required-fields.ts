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
  interviewConfigHasSelectedSlots,
  parseRecruitmentInterviewConfig,
} from '@/features/program/ujat/lib/recruitment-typed-contract'
import {
  UJAT_SPONSOR_ALL_VALUE,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'
import {
  isAnnouncementPublishedChoiceMissing,
  isAnnouncementUnpublished,
} from '@/features/program/shared/lib/participant-recruitment-form-options'
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
import { type UjatRegionCapacityBySemesterState } from '@/features/program/ujat/lib/ujat-region-capacity-types'
import { cloneUjatRegionCapacityState } from '@/features/program/ujat/lib/ujat-kpi-wage-capacity-typed'
import { listUjatEducationRegionsActive } from '@/features/program/ujat/lib/ujat-education-regions'
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
import type { DefaultValues } from 'react-hook-form'
import type { UjatBasicInfoFormValues } from './ujat-basic-info-form'
import type {
  UjatTypedDetail,
  UjatTypedScheduleRow,
} from '@/features/program/ujat/api/typed-detail-client'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'

type UjatBasicInfoValidationValues = DefaultValues<UjatBasicInfoFormValues>

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

function isEmptyFormText(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === ''
}

function isEmptyFormStringList(value: unknown): boolean {
  return !Array.isArray(value) || value.length === 0 || value.every(item => isEmptyFormText(item))
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


function typedHalfPlan(detail: UjatTypedDetail | undefined, half: 'h1' | 'h2') {
  return detail?.halfPlans?.find(item =>
    half === 'h1' ? item.semesterType === 'FIRST_HALF' : item.semesterType === 'SECOND_HALF'
  )
}

function typedStageRows(
  detail: UjatTypedDetail | undefined,
  half: 'h1' | 'h2',
  stage: 'PRE_EDUCATION' | 'MAIN_EDUCATION' | 'POST_EDUCATION'
): UjatTypedScheduleRow[] {
  return typedHalfPlan(detail, half)?.stages?.find(item => item.stage === stage)?.rows ?? []
}

function typedRowDate(row: UjatTypedScheduleRow): string | null {
  return row.dates?.find(date => !isEmptyText(date)) ?? row.startDate ?? row.endDate ?? null
}

function isTypedScheduleRowsIncomplete(rows: readonly UjatTypedScheduleRow[]): boolean {
  if (rows.length === 0) return true
  return rows.some(row => isEmptyText(row.regionCode) || isEmptyText(typedRowDate(row)))
}

function pushReason(reasons: string[], condition: boolean, key: string): void {
  if (condition) reasons.push(key)
}

/** UJAT 등록 공통정보 — 미입력 필수 필드 진단 키 목록 */
export function listIncompleteUjatProgramRegistrationRequiredFields(
  overlay: Record<string, unknown> = getUjatProgramRegistrationOverlayRecord(),
  basicInfo?: UjatBasicInfoValidationValues,
  typedDetail?: UjatTypedDetail
): string[] {
  void overlay
  const reasons: string[] = []
  {
    const p = 'ujat.basicInfo'
    const useTypedBasic = basicInfo != null
    const basicText = (key: keyof UjatBasicInfoFormValues, _overlayKey: string, fallback = '') => {
      if (!useTypedBasic) return ''
      return typeof basicInfo[key] === 'string' ? String(basicInfo[key]) : fallback
    }
    const basicBoolean = (
      key: keyof UjatBasicInfoFormValues,
      _overlayKey: string,
      _fallback: boolean
    ) => (useTypedBasic ? basicInfo[key] === true : false)
    const basicRange = useTypedBasic
      ? { start: basicInfo.startDate, end: basicInfo.endDate }
      : undefined
    const participantTypes =
      basicInfo?.generalParticipantTypes != null ? new Set(basicInfo.generalParticipantTypes) : null
    pushReason(
      reasons,
      isEmptyText(basicText('mainTitle', `${p}.repKo`)),
      'basicInfo.repKo'
    )
    pushReason(
      reasons,
      isEmptyText(basicText('titleEn', `${p}.repEn`)),
      'basicInfo.repEn'
    )
    pushReason(
      reasons,
      isEmptyText(basicText('title', `${p}.programManagementName`)),
      'basicInfo.programManagementName'
    )
    pushReason(
      reasons,
      isEmptyText(basicText('detailedProgramId', `${p}.detailedProgramId`)),
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
      isEmptyText(basicText('businessArea', `${p}.businessField`)),
      'basicInfo.businessField'
    )
    pushReason(
      reasons,
      isEmptyText(basicText('sponsorId', `${p}.sponsorId`)) ||
        basicText('sponsorId', `${p}.sponsorId`) === UJAT_SPONSOR_ALL_VALUE,
      'basicInfo.sponsorId'
    )
    const sponsorId = basicText('sponsorId', `${p}.sponsorId`)
    if (useTypedBasic && sponsorId && sponsorId !== UJAT_SPONSOR_ALL_VALUE) {
      const managerIdsRaw = basicInfo?.sponsorManagerContactIds
      const managerIds = Array.isArray(managerIdsRaw)
        ? managerIdsRaw
            .map(String)
            .map(id => id.trim())
            .filter(Boolean)
        : []
      const managerPrimary = basicText('sponsorManagerContactId', `${p}.sponsorContactId`)
      pushReason(
        reasons,
        managerIds.length === 0 &&
          (isEmptyText(managerPrimary) || managerPrimary === UJAT_SPONSOR_ALL_VALUE),
        'basicInfo.sponsorContact'
      )
    }
    // 설문 진행 항목 — 0개 선택도 완료 (선택)
    pushReason(
      reasons,
      isEmptyText(basicText('educationProcess', `${p}.educationCourse`)),
      'basicInfo.educationCourse'
    )
    pushReason(
      reasons,
      isEmptyText(basicText('ipOwned', `${p}.ipOwned`)),
      'basicInfo.ipOwned'
    )
    pushReason(
      reasons,
      isEmptyText(basicText('courseDeliveredBy', `${p}.courseDeliveredBy`)),
      'basicInfo.courseDeliveredBy'
    )
    pushReason(
      reasons,
      !useTypedBasic || basicInfo.partnerInvolvement == null,
      'basicInfo.partnerInvolvement'
    )
    pushReason(
      reasons,
      isEmptyText(basicText('ipsCategory', `${p}.ipsCategory`)),
      'basicInfo.ipsCategory'
    )

    const kpiValue = (rhfKey: keyof UjatBasicInfoFormValues): unknown =>
      useTypedBasic ? basicInfo[rhfKey] : undefined
    pushReason(reasons, isEmptyNumber(kpiValue('kpiFinalParticipants')), 'kpi.participantCount')
    const volunteerSelected = participantTypes ? participantTypes.has('volunteer') : false
    if (volunteerSelected) {
      pushReason(reasons, isEmptyNumber(kpiValue('kpiVolunteerCount')), 'kpi.volunteer')
    }
    pushReason(reasons, isEmptyNumber(kpiValue('kpiFinalSchools')), 'kpi.dispatchedSchool')
    pushReason(reasons, isEmptyNumber(kpiValue('kpiFinalClasses')), 'kpi.dispatchedClass')

    if (
      useTypedBasic &&
      basicInfo.wagePaymentItemIds != null &&
      !Array.isArray(basicInfo.wagePaymentItemIds)
    ) {
      pushReason(reasons, true, 'wage.paymentItemValues')
    }

    for (const half of ['h1', 'h2'] as const) {
      if (typedDetail != null) {
        const preRows = typedStageRows(typedDetail, half, 'PRE_EDUCATION')
        const eventRows = typedStageRows(typedDetail, half, 'MAIN_EDUCATION')
        const closingRows = typedStageRows(typedDetail, half, 'POST_EDUCATION')
        pushReason(
          reasons,
          isEmptyText(preRows[0]?.educationName ?? '사전교육(발대식)'),
          `${half}.pre.name`
        )
        pushReason(reasons, isTypedScheduleRowsIncomplete(preRows), `${half}.pre.schedule`)
        pushReason(reasons, isEmptyText(eventRows[0]?.educationName), `${half}.event.name`)
        pushReason(
          reasons,
          eventRows.length === 0 ||
            eventRows.some(row => isEmptyText(row.startDate) || isEmptyText(row.endDate)),
          `${half}.event.range`
        )
        pushReason(reasons, isTypedScheduleRowsIncomplete(closingRows), `${half}.closing.multi`)
        continue
      }
      pushReason(reasons, true, `${half}.pre.name`)
      pushReason(reasons, true, `${half}.pre.schedule`)
      pushReason(reasons, true, `${half}.event.name`)
      pushReason(reasons, true, `${half}.event.range`)
      pushReason(reasons, true, `${half}.closing.multi`)
    }

    const capacity: UjatRegionCapacityBySemesterState = cloneUjatRegionCapacityState(
      basicInfo?.ujatRegionCapacity
    )
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
  basicInfo?: UjatBasicInfoValidationValues,
  typedDetail?: UjatTypedDetail
): string | null {
  return (
    listIncompleteUjatProgramRegistrationRequiredFields(overlay, basicInfo, typedDetail)[0] ?? null
  )
}

export function hasIncompleteUjatProgramRegistrationRequiredFields(
  overlay: Record<string, unknown> = getUjatProgramRegistrationOverlayRecord(),
  basicInfo?: UjatBasicInfoValidationValues,
  typedDetail?: UjatTypedDetail
): boolean {
  return (
    describeIncompleteUjatProgramRegistrationRequiredFields(overlay, basicInfo, typedDetail) != null
  )
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
    templateCode == null ? undefined : peekGeneralRecruitOverlayRecord(templateCode)
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
  const published = read(overlay, INSTITUTION_KEYS.announcementPublished)
  pushReason(
    reasons,
    isAnnouncementPublishedChoiceMissing(published),
    `${p}.announcementPublished`
  )
  const skipSchedule = isAnnouncementUnpublished(published)
  if (!skipSchedule) {
    pushReason(
      reasons,
      isRangeSealIncomplete(read(overlay, INSTITUTION_KEYS.programRange)),
      `${p}.programRangeSeal`
    )
  }
  pushReason(
    reasons,
    isEmptyStringList(read(overlay, INSTITUTION_KEYS.targetLevels)),
    `${p}.targetLevels`
  )
  pushReason(
    reasons,
    isEmptyText(read(overlay, INSTITUTION_KEYS.district)),
    `${p}.targetLevelDetail`
  )
  if (!skipSchedule) {
    pushReason(
      reasons,
      isRangeSealIncomplete(read(overlay, INSTITUTION_KEYS.recruitRange)),
      `${p}.recruitRangeSeal`
    )
    const result = read(overlay, INSTITUTION_KEYS.resultAnnounce)
    const resultRow =
      result != null && typeof result === 'object'
        ? (result as { date?: unknown; method?: unknown })
        : null
    pushReason(reasons, resultRow == null || isEmptyText(resultRow.date), `${p}.finalAnnounceIso`)
    pushReason(
      reasons,
      resultRow == null || isEmptyText(resultRow.method),
      `${p}.finalAnnounceMethod`
    )
  }
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
  const published = read(resolved, VOLUNTEER_KEYS.announcementPublished)
  pushReason(
    reasons,
    isAnnouncementPublishedChoiceMissing(published),
    `${p}.announcementPublished`
  )
  const skipSchedule = isAnnouncementUnpublished(published)
  if (half === 'h2') {
    pushReason(
      reasons,
      isEmptyText(readText(resolved, VOLUNTEER_KEYS.noticeExposure)),
      `${p}.noticeExposure`
    )
  }
  if (!skipSchedule) {
    pushReason(
      reasons,
      isRangeSealIncomplete(read(resolved, VOLUNTEER_KEYS.programRange)),
      `${p}.programRangeSeal`
    )
  }
  pushReason(
    reasons,
    isEmptyStringList(read(resolved, VOLUNTEER_KEYS.volunteerTargets)),
    `${p}.volunteerTargets`
  )
  pushReason(
    reasons,
    isEmptyText(read(resolved, VOLUNTEER_KEYS.targetDetail)),
    `${p}.volunteerTargetDetail`
  )
  const recruitRangeKey =
    half === 'h1' ? VOLUNTEER_KEYS.recruitRangeH1 : VOLUNTEER_KEYS.recruitRangeH2
  const activityKey = half === 'h1' ? VOLUNTEER_KEYS.activityTermH1 : VOLUNTEER_KEYS.activityTermH2
  if (!skipSchedule) {
    pushReason(
      reasons,
      isRangeSealIncomplete(read(resolved, recruitRangeKey)),
      `${p}.recruitRangeSeal`
    )
  }
  pushReason(reasons, isEmptyText(read(resolved, activityKey)), `${p}.activityTerm`)
  const interviewMethod = readText(resolved, VOLUNTEER_KEYS.interviewMethod)
  pushReason(reasons, isEmptyText(interviewMethod), `${p}.interviewMethod`)
  if (!skipSchedule) {
    const docAnnounce = read(resolved, VOLUNTEER_KEYS.docAnnounce)
    const docRow =
      docAnnounce != null && typeof docAnnounce === 'object'
        ? (docAnnounce as { date?: unknown; method?: unknown })
        : null
    pushReason(
      reasons,
      docRow == null || isEmptyText(docRow.date) || isEmptyText(docRow.method),
      `${p}.docAnnounce`
    )
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
  }
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
    const resolved = resolveVolunteerOverlayForHalf(overlay, half)
    const published = read(resolved, VOLUNTEER_KEYS.announcementPublished)
    const interviewMethod = readText(resolved, VOLUNTEER_KEYS.interviewMethod)
    if (
      !isAnnouncementUnpublished(published) &&
      interviewMethod !== 'no' &&
      hasIncompleteUjatVolunteerInterviewSchedule(overlay, half)
    ) {
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

export type TypedRecruitmentValidationInput = {
  institution?: Partial<ProgramDetailEditFormValues>
  volunteerH1?: Partial<ProgramDetailEditFormValues>
  volunteerH2?: Partial<ProgramDetailEditFormValues>
}

function formVolunteerRecruitmentRange(
  values: Partial<ProgramDetailEditFormValues>,
  half: UjatVolunteerRecruitHalf
): { start?: unknown; end?: unknown } {
  const index = half === 'h1' ? 0 : 1
  const round = values.rounds?.[index]
  return {
    start: round?.startDate || values.volunteerApplicationStartDate,
    end: round?.endDate || values.volunteerApplicationEndDate,
  }
}

function listIncompleteTypedInstitutionRecruitment(
  values: Partial<ProgramDetailEditFormValues>
): string[] {
  const reasons: string[] = []
  const p = 'recruit.institution'
  const published = values.participantRecruitmentAnnouncementPublished
  pushReason(
    reasons,
    isAnnouncementPublishedChoiceMissing(published),
    `${p}.announcementPublished`
  )
  const skipSchedule = isAnnouncementUnpublished(published)
  if (!skipSchedule) {
    pushReason(
      reasons,
      isEmptyFormText(values.startDate) || isEmptyFormText(values.endDate),
      `${p}.programRangeSeal`
    )
  }
  pushReason(reasons, isEmptyFormStringList(values.targetLevels), `${p}.targetLevels`)
  pushReason(reasons, isEmptyFormText(values.district), `${p}.targetLevelDetail`)
  if (!skipSchedule) {
    pushReason(
      reasons,
      isEmptyFormText(values.applicationStartDate) || isEmptyFormText(values.applicationEndDate),
      `${p}.recruitRangeSeal`
    )
    pushReason(reasons, isEmptyFormText(values.resultAnnouncementDate), `${p}.finalAnnounceIso`)
    pushReason(reasons, isEmptyFormText(values.resultAnnouncementMethod), `${p}.finalAnnounceMethod`)
  }
  pushReason(
    reasons,
    isEmptyFormText(values.recruitmentContactOrganizationName),
    `${p}.inquiryContact`
  )
  pushReason(reasons, isEmptyFormText(values.contactPhone), `${p}.inquiryTel`)
  pushReason(reasons, isEmptyFormText(values.contactEmail), `${p}.inquiryEmail`)
  pushReason(
    reasons,
    values.participantRecruitmentNotesNotApplicable !== 'not_applicable' &&
      isEmptyFormText(values.oneLineIntroduction),
    `${p}.notes`
  )
  return reasons
}

function listIncompleteTypedVolunteerRecruitment(
  values: Partial<ProgramDetailEditFormValues>,
  half: UjatVolunteerRecruitHalf
): string[] {
  const reasons: string[] = []
  const p = `recruit.volunteer.${half}`
  const range = formVolunteerRecruitmentRange(values, half)
  const published = values.volunteerRecruitmentAnnouncementPublished
  pushReason(
    reasons,
    isAnnouncementPublishedChoiceMissing(published),
    `${p}.announcementPublished`
  )
  const skipSchedule = isAnnouncementUnpublished(published)
  if (half === 'h2') {
    pushReason(
      reasons,
      isEmptyFormText(values.volunteerRecruitmentNoticeExposure),
      `${p}.noticeExposure`
    )
  }
  if (!skipSchedule) {
    pushReason(
      reasons,
      isEmptyFormText(values.startDate) || isEmptyFormText(values.endDate),
      `${p}.programRangeSeal`
    )
  }
  pushReason(reasons, isEmptyFormStringList(values.volunteerTargets), `${p}.volunteerTargets`)
  pushReason(reasons, isEmptyFormText(values.volunteerTargetDetail), `${p}.volunteerTargetDetail`)
  if (!skipSchedule) {
    pushReason(
      reasons,
      isEmptyFormText(range.start) || isEmptyFormText(range.end),
      `${p}.recruitRangeSeal`
    )
  }
  pushReason(
    reasons,
    isEmptyFormText(values.rounds?.[half === 'h1' ? 0 : 1]?.curriculum),
    `${p}.activityTerm`
  )
  pushReason(reasons, isEmptyFormText(values.interviewMethod), `${p}.interviewMethod`)
  if (!skipSchedule) {
    pushReason(
      reasons,
      isEmptyFormText(values.documentPassAnnouncementDate) ||
        isEmptyFormText(values.documentPassAnnouncementMethod),
      `${p}.docAnnounce`
    )
    if (!isEmptyFormText(values.interviewMethod) && values.interviewMethod !== 'no') {
      pushReason(
        reasons,
        isEmptyFormText(values.interviewStartDate) || isEmptyFormText(values.interviewEndDate),
        `${p}.interviewRangeSeal`
      )
    }
    pushReason(reasons, isEmptyFormText(values.finalPassAnnouncementDate), `${p}.finalAnnounceIso`)
    pushReason(
      reasons,
      isEmptyFormText(values.finalPassAnnouncementMethod),
      `${p}.finalAnnounceMethod`
    )
  }
  pushReason(
    reasons,
    isEmptyFormText(values.volunteerRecruitmentContactOrganizationName),
    `${p}.inquiryContact`
  )
  pushReason(reasons, isEmptyFormText(values.contactPhone), `${p}.inquiryTel`)
  pushReason(reasons, isEmptyFormText(values.contactEmail), `${p}.inquiryEmail`)
  pushReason(
    reasons,
    values.volunteerRecruitmentNotesNotApplicable !== 'not_applicable' &&
      isEmptyFormText(values.otherNotes),
    `${p}.otherNotes`
  )
  if (
    !skipSchedule &&
    values.interviewMethod !== 'no' &&
    hasIncompleteTypedVolunteerInterviewSchedule(values)
  ) {
    reasons.push(`${p}.interviewSchedule`)
  }
  return reasons
}

function hasIncompleteTypedVolunteerInterviewSchedule(
  values: Partial<ProgramDetailEditFormValues>
): boolean {
  const config = parseRecruitmentInterviewConfig(values.volunteerInterviewConfig)
  if (config == null) return true
  if (isInterviewTimeRangeIncomplete(config.interviewTimeRange)) return true
  if (!interviewConfigHasSelectedSlots(config)) return true
  for (const exception of config.exceptions ?? []) {
    if (isEmptyText(exception.exceptionDate)) return true
    if (!Array.isArray(exception.selectedSlotKeys) || exception.selectedSlotKeys.length === 0) {
      return true
    }
  }
  return false
}

/** 활성 UJAT 모집 UI의 Typed RHF 필수값 검사. 모집 Overlay를 읽지 않는다. */
export function listIncompleteUjatProgramRecruitmentTypedRequiredFields(
  input: TypedRecruitmentValidationInput
): string[] {
  return [
    ...(input.institution ? listIncompleteTypedInstitutionRecruitment(input.institution) : []),
    ...(input.volunteerH1 ? listIncompleteTypedVolunteerRecruitment(input.volunteerH1, 'h1') : []),
    ...(input.volunteerH2 ? listIncompleteTypedVolunteerRecruitment(input.volunteerH2, 'h2') : []),
  ]
}

/** Template authoring 전용. 활성 등록 위저드는 Typed RHF volunteerInterviewConfig를 검사한다. */
export function listIncompleteUjatProgramRecruitmentInterviewScheduleRequiredFields(
  templateCodes?: UjatRecruitmentValidationTemplateCodes
): string[] {
  const overlay = getMergedUjatRecruitVolunteerOverlay(templateCodes?.volunteerTemplateCode)
  return (['h1', 'h2'] as const)
    .filter(half => hasIncompleteUjatVolunteerInterviewSchedule(overlay, half))
    .map(half => `recruit.volunteer.${half}.interviewSchedule`)
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
  basicInfo?: UjatBasicInfoValidationValues,
  typedDetail?: UjatTypedDetail,
  typedRecruitment?: TypedRecruitmentValidationInput
): boolean {
  return (
    listIncompleteUjatProgramRegistrationWizardRequiredFields(
      basicInfo,
      typedDetail,
      typedRecruitment
    ).length > 0
  )
}

export function listIncompleteUjatProgramRegistrationWizardRequiredFields(
  basicInfo?: UjatBasicInfoValidationValues,
  typedDetail?: UjatTypedDetail,
  typedRecruitment?: TypedRecruitmentValidationInput
): string[] {
  return [
    ...listIncompleteUjatProgramRegistrationRequiredFields({}, basicInfo, typedDetail),
    ...(typedRecruitment
      ? listIncompleteUjatProgramRecruitmentTypedRequiredFields(typedRecruitment)
      : listIncompleteUjatProgramRecruitmentRequiredFields(
          selectedUjatRecruitmentValidationTemplateCodes()
        )),
  ]
}

export function describeIncompleteUjatProgramRegistrationWizardRequiredFields(
  basicInfo?: UjatBasicInfoValidationValues,
  typedDetail?: UjatTypedDetail,
  typedRecruitment?: TypedRecruitmentValidationInput
): string | null {
  return (
    listIncompleteUjatProgramRegistrationWizardRequiredFields(
      basicInfo,
      typedDetail,
      typedRecruitment
    )[0] ?? null
  )
}

const UJAT_REQUIRED_FIELD_LABELS: Record<string, string> = {
  'basicInfo.repKo': '대표 프로그램명 (국문)',
  'basicInfo.repEn': '대표 프로그램명 (영문)',
  'basicInfo.programManagementName': '프로그램 관리명',
  'basicInfo.detailedProgramId': '세부 프로그램명',
  'basicInfo.operationRangeSeal': '사업 운영 기간',
  'basicInfo.audience': '참여자 유형',
  'basicInfo.businessField': '사업 분야',
  'basicInfo.sponsorId': '후원사',
  'basicInfo.sponsorContact': '후원사 담당자',
  'basicInfo.educationCourse': '교육 과정',
  'basicInfo.ipOwned': 'IP Owned',
  'basicInfo.courseDeliveredBy': 'Course Delivered By',
  'basicInfo.partnerInvolvement': '파트너 참여',
  'basicInfo.ipsCategory': 'IPS 유형',
  'kpi.participantCount': '참여 인원',
  'kpi.volunteer': '봉사자 수',
  'kpi.dispatchedSchool': '파견 학교 수',
  'kpi.dispatchedClass': '파견 학급 수',
  'wage.paymentItemValues': '지급 항목',
  announcementPublished: '공고 게시 여부',
  programRangeSeal: '프로그램 운영 기간',
  targetLevels: '교육 대상',
  targetLevelDetail: '교육 대상 상세',
  recruitRangeSeal: '모집 기간',
  finalAnnounceIso: '최종 합격자 발표일',
  finalAnnounceMethod: '최종 합격자 발표 방법',
  inquiryContact: '문의처',
  inquiryTel: '문의처 전화번호',
  inquiryEmail: '문의처 이메일',
  notes: '비고',
  noticeExposure: '모집 공고 노출 시점',
  volunteerTargets: '모집 대상',
  volunteerTargetDetail: '모집 대상 상세',
  activityTerm: '활동 기수',
  docAnnounce: '1차 서류 합격자 발표',
  interviewMethod: '면접 방법',
  interviewRangeSeal: '2차 면접 기간',
  otherNotes: '기타 안내',
  interviewSchedule: '면접 진행 가능 일정',
}

function volunteerHalfPrefix(key: string): string | null {
  if (key.startsWith('recruit.volunteer.h1.')) return '상반기 봉사자 모집'
  if (key.startsWith('recruit.volunteer.h2.')) return '하반기 봉사자 모집'
  if (key.startsWith('recruit.institution.')) return '참여 기관 모집'
  return null
}

/** 진단 키를 화면 라벨로 바꾼다. */
export function formatUjatRegistrationRequiredFieldReason(reason: string): string {
  const prefix = volunteerHalfPrefix(reason)
  const leaf = reason.includes('.') ? reason.slice(reason.lastIndexOf('.') + 1) : reason
  const label = UJAT_REQUIRED_FIELD_LABELS[reason] ?? UJAT_REQUIRED_FIELD_LABELS[leaf] ?? reason
  return prefix == null ? label : `${prefix} · ${label}`
}

export function formatUjatRegistrationRequiredFieldReasons(keys: readonly string[]): string[] {
  const seen = new Set<string>()
  const labels: string[] = []
  for (const key of keys) {
    const label = formatUjatRegistrationRequiredFieldReason(key)
    if (seen.has(label)) continue
    seen.add(label)
    labels.push(label)
  }
  return labels
}
