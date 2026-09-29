/**
 * 일반 프로그램 상세 수정 — Program → generalRegistration overlay 시드.
 * 등록 단락·키는 변경하지 않는다.
 */
import type {
  GeneralProgramCurriculumSessionRow,
  GeneralProgramScheduleDetailRow,
  Program,
} from '@/types/domain'
import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import { participantFlagsFromGeneralProgram } from '@/features/program/general/lib/participant-audience-selection'
import {
  isPreEducationCurriculumSession,
  isPreEducationScheduleBlock,
  PRE_EDUCATION_SCHEDULE_LABEL,
} from '@/features/program/general/lib/schedule-detail-form'
import {
  resolveWageGradeFee,
  resolveWagePaymentItemIds,
  WAGE_GRADE_FIELDS,
} from '@/features/program/general/lib/wage-display'
import { programPaymentItemLabelsFromIds } from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { normalizeProgramBusinessAreaValue } from '@/features/program/shared/lib/program-detail-info-constants'
import { initialProgramRegistrationSurveyItems } from '@/features/template/lib/program-registration-survey-items'
import { resolveProgramSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
  TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
  TEMPLATE_FORM_IP_OWNED_OPTIONS,
} from '@/features/template/lib/template-form-select-options'
import type { GeneralRegistrationEditorExtras } from '@/features/program/general/lib/registration-overlay-to-program'
import {
  hasIncompleteGeneralProgramRegistrationRequiredFields,
  type GeneralProgramRegistrationRequiredFieldContext,
} from '@/features/program/general/lib/registration-required-fields'
import { isSponsorContactUnselected } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import {
  GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY,
  GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_MANAGER_LINE_KEY,
  getProgramRegistrationOverlayRecord,
  pickProgramRegistrationOverlayByPrefix,
  replaceProgramRegistrationOverlayPrefix,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'

export const GENERAL_REGISTRATION_OVERLAY_PREFIX = 'generalRegistration.' as const

const BASIC = 'generalRegistration.basicInfo' as const
const KPI = 'generalRegistration.kpi' as const
const WAGE = 'generalRegistration.wageInfo' as const
const TYPE = 'generalRegistration.typeSettings' as const
const CURRICULUM = 'generalRegistration.educationCurriculum' as const
const SCHEDULE_CURRICULUM = 'generalRegistration.educationScheduleCurriculum' as const

/** 등록 단락 블록 수 — 사전 교육 행은 별도 토글 블록이므로 제외 */
export function countRegularCurriculumSessions(
  sessions: GeneralProgramCurriculumSessionRow[] | undefined
): number {
  return (sessions ?? []).filter(session => !isPreEducationCurriculumSession(session)).length
}

export function countRegularScheduleDetails(
  details: GeneralProgramScheduleDetailRow[] | undefined
): number {
  return (details ?? []).filter(detail => !isPreEducationScheduleBlock(detail)).length
}

export function countScheduleCurriculumGroups(
  details: GeneralProgramScheduleDetailRow[] | undefined
): number {
  const first = (details ?? []).find(detail => !isPreEducationScheduleBlock(detail))
  const parts = first?.progressTimeSummary
    ?.split(/\s*\|\s*/)
    .map(part => part.trim())
    .filter(Boolean)
  return Math.max(1, parts?.length ?? 1)
}

function readOverlayText(overlay: Record<string, unknown>, key: string): string {
  const raw = overlay[key]
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  return ''
}

function readOverlayIdList(overlay: Record<string, unknown>, key: string): string[] {
  const raw = overlay[key]
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.map(String).map(id => id.trim()).filter(Boolean))]
}

export function generalRegistrationRequiredFieldContextFromDetailEdit(
  overlay: Record<string, unknown>,
  extras: GeneralRegistrationEditorExtras
): GeneralProgramRegistrationRequiredFieldContext {
  const sponsorIds = readOverlayIdList(overlay, GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY)
  const contactIds = readOverlayIdList(overlay, GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY)
  const sponsorId =
    readOverlayText(overlay, GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY) || sponsorIds[0] || ''
  const contactId =
    readOverlayText(overlay, GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY) ||
    contactIds[0] ||
    ''
  return {
    participant: {
      individual: extras.participantIndividual === true,
      organization: extras.participantOrganization === true,
      teacherInstructor: extras.participantTeacherInstructor === true,
      volunteer: extras.participantVolunteer === true,
    },
    programType: extras.programType,
    sessionRoundType: extras.sessionRoundType,
    educationFormScheduleDetail: extras.educationFormScheduleDetail ?? 'common',
    participationScheduleDetail: extras.participationScheduleDetail ?? 'common',
    ipsScheduleDetail: extras.ipsScheduleDetail ?? 'common',
    curriculumSessionCount: extras.curriculumSessionCount ?? 1,
    curriculumChartSessionCount: extras.curriculumChartSessionCount ?? 1,
    scheduleCurriculumDetailCount: extras.scheduleCurriculumDetailCount ?? 1,
    scheduleCurriculumGroupCount: extras.scheduleCurriculumGroupCount ?? 1,
    scheduleCurriculumPreEducation: extras.scheduleCurriculumPreEducation === true,
    educationScheduleMode: extras.educationScheduleMode ?? 'date',
    sponsorId,
    sponsorContactId: isSponsorContactUnselected(contactId) ? '' : contactId,
    programTitleKo: readOverlayText(overlay, GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY),
  }
}

export function hasIncompleteGeneralProgramDetailEditRequiredFields(
  overlay: Record<string, unknown>,
  extras: GeneralRegistrationEditorExtras
): boolean {
  return hasIncompleteGeneralProgramRegistrationRequiredFields(
    overlay,
    generalRegistrationRequiredFieldContextFromDetailEdit(overlay, extras)
  )
}

function progressSessionFromTitle(title: string): string {
  const trimmed = title.trim()
  const named = trimmed.match(/^(\d+)\s*차시$/)
  if (named) return named[1]
  return trimmed.replace(/차시\s*$/, '').trim()
}

function educationProgressOverlayFromProgram(program: Program): Record<string, unknown> {
  const common = program.generalCommonInfo
  const sessions = common?.curriculumSessions ?? []
  const regularSessions = sessions.filter(session => !isPreEducationCurriculumSession(session))
  const preSession = sessions.find(session => isPreEducationCurriculumSession(session))
  const details = common?.scheduleDetails ?? []
  const regularDetails = details.filter(detail => !isPreEducationScheduleBlock(detail))
  const preDetail = details.find(detail => isPreEducationScheduleBlock(detail))

  const unitNameBySession: Record<number, string> = {}
  const unitContentBySession: Record<number, string> = {}
  const progressSessionByRound: Record<number, string> = {}
  const roundContentByRound: Record<number, string> = {}
  regularSessions.forEach((session, index) => {
    const n = index + 1
    unitNameBySession[n] = session.title?.trim() ?? ''
    unitContentBySession[n] = session.description?.trim() ?? ''
    progressSessionByRound[n] = progressSessionFromTitle(session.title ?? '')
    roundContentByRound[n] = session.description?.trim() ?? ''
  })

  const eventNameByDetail: Record<number, string> = {}
  regularDetails.forEach((detail, index) => {
    eventNameByDetail[index + 1] = detail.name?.trim() ?? ''
  })

  const overlay: Record<string, unknown> = {
    [GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY]: common?.educationScheduleLines ?? [],
    [`${CURRICULUM}.unitNameBySession`]: unitNameBySession,
    [`${CURRICULUM}.unitContentBySession`]: unitContentBySession,
    [`${CURRICULUM}.progressSessionByRound`]: progressSessionByRound,
    [`${CURRICULUM}.roundContentByRound`]: roundContentByRound,
    [`${SCHEDULE_CURRICULUM}.eventNameByDetail`]: eventNameByDetail,
  }

  if (preSession) {
    overlay[`${CURRICULUM}.preEducationScheduleName`] =
      preSession.title?.trim() || PRE_EDUCATION_SCHEDULE_LABEL
    overlay[`${CURRICULUM}.preEducationScheduleLine`] = preSession.scheduleDateLabel?.trim() ?? ''
  }
  if (preDetail) {
    overlay[`${SCHEDULE_CURRICULUM}.preEducationName`] =
      preDetail.name?.trim() || PRE_EDUCATION_SCHEDULE_LABEL
  }

  return overlay
}

function overlayFromProgram(program: Program): Record<string, unknown> {
  return pickProgramRegistrationOverlayByPrefix(
    GENERAL_REGISTRATION_OVERLAY_PREFIX,
    program.registrationOverlay ?? {}
  )
}

function reverseBusinessField(value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return ''
  if (TEMPLATE_FORM_BUSINESS_AREA_OPTIONS.some(option => option.value === trimmed)) return trimmed
  const normalized = normalizeProgramBusinessAreaValue(trimmed)
  return (
    TEMPLATE_FORM_BUSINESS_AREA_OPTIONS.find(
      option => normalizeProgramBusinessAreaValue(option.label) === normalized
    )?.value ?? ''
  )
}

function reverseIpOwned(value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return ''
  const lower = trimmed.toLowerCase()
  if (TEMPLATE_FORM_IP_OWNED_OPTIONS.some(option => option.value === lower)) return lower
  return TEMPLATE_FORM_IP_OWNED_OPTIONS.find(option => option.label === trimmed)?.value ?? ''
}

function reverseEducationCourse(value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return ''
  const byValue = TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS.find(option => option.value === trimmed)
  if (byValue) return byValue.value
  return TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS.find(option => option.label === trimmed)?.value ?? ''
}

function reverseIpsCategory(value: Program['ips']): string {
  if (value === 'Inspire') return 'inspire'
  if (value === 'Succeed') return 'succeed'
  if (value === 'Prepare') return 'prepare'
  return ''
}

function overlayString(overlay: Record<string, unknown>, key: string): string {
  const value = overlay[key]
  return typeof value === 'string' ? value : ''
}

function isEmptyWageFee(value: unknown): boolean {
  return value == null || value === ''
}

function isEmptyPaymentItemValues(value: unknown): boolean {
  return !Array.isArray(value) || value.length === 0
}

function isEmptyOverlayText(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === ''
}

function preferFilled<T>(saved: T | undefined, fallback: T, isEmpty: (value: T) => boolean): T {
  if (saved !== undefined && !isEmpty(saved)) return saved
  return fallback
}

function wageOverlayFromProgram(program: Program): Record<string, unknown> {
  const common = program.generalCommonInfo
  const overlay = overlayFromProgram(program)
  const overlayIds = overlay[`${WAGE}.paymentItemValues`]
  const paymentItemValues =
    Array.isArray(overlayIds) && overlayIds.length > 0
      ? overlayIds.map(String)
      : resolveWagePaymentItemIds(
          overlayString(overlay, `${WAGE}.paymentItemLabels`) || common?.paymentItems
        )
  const paymentItemLabels =
    overlayString(overlay, `${WAGE}.paymentItemLabels`) ||
    programPaymentItemLabelsFromIds(paymentItemValues) ||
    common?.paymentItems?.trim() ||
    ''

  return {
    [`${WAGE}.grade1Fee`]: resolveWageGradeFee(overlay, common?.wageGradeRows, WAGE_GRADE_FIELDS[0]),
    [`${WAGE}.grade2Fee`]: resolveWageGradeFee(overlay, common?.wageGradeRows, WAGE_GRADE_FIELDS[1]),
    [`${WAGE}.grade3Fee`]: resolveWageGradeFee(overlay, common?.wageGradeRows, WAGE_GRADE_FIELDS[2]),
    [`${WAGE}.paymentItemValues`]: paymentItemValues,
    [`${WAGE}.paymentItemLabels`]: paymentItemLabels,
  }
}

function surveyItemsFromProgram(program: Program): Record<string, boolean> {
  const keys = new Set<string>(program.generalSurveyMenuKeys ?? [])
  const base = initialProgramRegistrationSurveyItems(false)
  return {
    ...base,
    survey: keys.has('survey'),
    satisfaction:
      keys.has('satisfaction') ||
      keys.has('student_satisfaction') ||
      keys.has('teacher_satisfaction'),
    lecture_evaluation: keys.has('lecture_evaluation'),
  }
}

export function extrasFromGeneralProgram(program: Program): GeneralRegistrationEditorExtras {
  const common = program.generalCommonInfo
  const typeFields = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: common?.curriculumSessions,
  })
  const participant = participantFlagsFromGeneralProgram(program)
  return {
    programType: typeFields.educationStructure,
    sessionRoundType: typeFields.sessionRound,
    educationScheduleMode: common?.educationScheduleMode === 'period' ? 'period' : 'date',
    educationFormScheduleDetail: common?.educationFormScheduleDetail ?? 'common',
    participationScheduleDetail: common?.participationScheduleDetail ?? 'common',
    ipsScheduleDetail: common?.ipsScheduleDetail ?? 'common',
    curriculumSessionCount: Math.max(1, countRegularCurriculumSessions(common?.curriculumSessions)),
    curriculumChartSessionCount: Math.max(
      1,
      countRegularCurriculumSessions(common?.curriculumSessions)
    ),
    scheduleCurriculumDetailCount: Math.max(1, countRegularScheduleDetails(common?.scheduleDetails)),
    scheduleCurriculumGroupCount: countScheduleCurriculumGroups(common?.scheduleDetails),
    scheduleCurriculumPreEducation: common?.scheduleCurriculumPreEducation === true,
    participantOrganization: participant.organization,
    participantIndividual: participant.individual,
    participantTeacherInstructor: participant.teacherInstructor,
    participantVolunteer: participant.volunteer,
  }
}

export function buildGeneralRegistrationOverlayFromProgram(
  program: Program
): Record<string, unknown> {
  const extras = extrasFromGeneralProgram(program)
  const common = program.generalCommonInfo
  const kpi = common?.kpi
  const sponsorIds =
    common?.sponsorManagementIds?.length
      ? common.sponsorManagementIds
      : program.sponsorId
        ? [program.sponsorId]
        : []
  const contactIds = common?.sponsorManagerContactIds ?? []
  const detailedId =
    extras.programType === 'schedule'
      ? TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
      : program.detailedProgramId?.trim() || ''

  return {
    [GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY]:
      program.mainTitle?.trim() || program.title?.trim() || '',
    [`${BASIC}.programTitleEn`]: program.titleEn?.trim() || '',
    [`${BASIC}.publicProgramTitle`]: common?.announcementTitle?.trim() || '',
    [`${BASIC}.detailedProgramId`]: detailedId,
    [`${BASIC}.detailedProgramName`]:
      extras.programType === 'schedule'
        ? '해당없음'
        : common?.detailedProgramName?.trim() || '',
    [`${BASIC}.businessField`]: reverseBusinessField(program.businessArea),
    [`${BASIC}.partnerInvolvement`]: program.partnerInvolvement === false ? 'no' : 'yes',
    [`${BASIC}.educationVenueKind`]: common?.venueKind ?? 'inside',
    [`${BASIC}.educationVenueDetail`]: common?.venueDetail ?? '',
    [`${BASIC}.educationCourse`]: reverseEducationCourse(program.educationProcess),
    [`${BASIC}.ipOwned`]: reverseIpOwned(program.ipOwned),
    [`${BASIC}.courseDeliveredBy`]: reverseIpOwned(program.courseDeliveredBy),
    [`${BASIC}.operationRangeSeal`]:
      program.startDate && program.endDate
        ? { start: String(program.startDate), end: String(program.endDate) }
        : null,
    [`${BASIC}.surveyItems`]: surveyItemsFromProgram(program),
    [GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY]: sponsorIds[0] ?? '',
    [GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY]: sponsorIds,
    [GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY]: contactIds[0] ?? '',
    [GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY]: contactIds,
    [GENERAL_REGISTRATION_OVERLAY_SPONSOR_MANAGER_LINE_KEY]:
      common?.sponsorManagerLine ?? program.managerName ?? '',
    [`${KPI}.participantCount`]: kpi?.finalParticipants ?? null,
    [`${KPI}.instructor`]: kpi?.instructorCount ?? null,
    [`${KPI}.volunteer`]: kpi?.volunteerCount ?? null,
    [`${KPI}.dispatchedSchool`]: null,
    [`${KPI}.dispatchedClass`]: null,
    ...wageOverlayFromProgram(program),
    [`${TYPE}.ipsType`]: {
      category: reverseIpsCategory(program.ips),
      detail: '',
    },
    ...educationProgressOverlayFromProgram(program),
  }
}

export function seedGeneralRegistrationOverlayFromProgram(program: Program): void {
  const fromProgram = buildGeneralRegistrationOverlayFromProgram(program)
  const saved = overlayFromProgram(program)
  const merged = { ...fromProgram, ...saved }
  merged[`${WAGE}.grade1Fee`] = preferFilled(
    saved[`${WAGE}.grade1Fee`] as number | null | undefined,
    fromProgram[`${WAGE}.grade1Fee`] as number | null,
    isEmptyWageFee
  )
  merged[`${WAGE}.grade2Fee`] = preferFilled(
    saved[`${WAGE}.grade2Fee`] as number | null | undefined,
    fromProgram[`${WAGE}.grade2Fee`] as number | null,
    isEmptyWageFee
  )
  merged[`${WAGE}.grade3Fee`] = preferFilled(
    saved[`${WAGE}.grade3Fee`] as number | null | undefined,
    fromProgram[`${WAGE}.grade3Fee`] as number | null,
    isEmptyWageFee
  )
  merged[`${WAGE}.paymentItemValues`] = preferFilled(
    saved[`${WAGE}.paymentItemValues`] as unknown[] | undefined,
    fromProgram[`${WAGE}.paymentItemValues`] as unknown[],
    isEmptyPaymentItemValues
  )
  merged[`${WAGE}.paymentItemLabels`] = preferFilled(
    saved[`${WAGE}.paymentItemLabels`] as string | undefined,
    String(fromProgram[`${WAGE}.paymentItemLabels`] ?? ''),
    isEmptyOverlayText
  )
  merged[`${KPI}.dispatchedSchool`] = null
  merged[`${KPI}.dispatchedClass`] = null
  Object.assign(merged, educationProgressOverlayFromProgram(program))
  const surveyKeys = resolveProgramSurveyMenuKeys({
    generalSurveyMenuKeys: program.generalSurveyMenuKeys,
    registrationOverlay: merged,
  })
  merged[`${BASIC}.surveyItems`] = {
    survey: surveyKeys.includes('survey'),
    satisfaction: surveyKeys.includes('satisfaction'),
    lecture_evaluation: surveyKeys.includes('lecture_evaluation'),
  }
  replaceProgramRegistrationOverlayPrefix(GENERAL_REGISTRATION_OVERLAY_PREFIX, merged)
  setGeneralRegistrationDetailEditExtras(extrasFromGeneralProgram(program))
}

export function readGeneralRegistrationOverlayForSave(): Record<string, unknown> {
  return pickProgramRegistrationOverlayByPrefix(
    GENERAL_REGISTRATION_OVERLAY_PREFIX,
    getProgramRegistrationOverlayRecord()
  )
}

let detailEditExtras: GeneralRegistrationEditorExtras | null = null

export function setGeneralRegistrationDetailEditExtras(
  extras: GeneralRegistrationEditorExtras
): void {
  detailEditExtras = extras
}

export function getGeneralRegistrationDetailEditExtras(): GeneralRegistrationEditorExtras {
  return (
    detailEditExtras ?? {
      programType: 'curriculum',
      sessionRoundType: 'single',
    }
  )
}
