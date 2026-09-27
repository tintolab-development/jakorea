/**
 * 일반 프로그램 상세 수정 — Program → generalRegistration overlay 시드.
 * 등록 단락·키는 변경하지 않는다.
 */
import type { Program } from '@/types/domain'
import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import { parseCompanySchoolWageAmountFromPricing } from '@/features/program/shared/lib/company-school-wage-pricing'
import { normalizeProgramBusinessAreaValue } from '@/features/program/shared/lib/program-detail-info-constants'
import { initialProgramRegistrationSurveyItems } from '@/features/template/lib/program-registration-survey-items'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
  TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
  TEMPLATE_FORM_IP_OWNED_OPTIONS,
} from '@/features/template/lib/template-form-select-options'
import type { GeneralRegistrationEditorExtras } from '@/features/program/general/lib/registration-overlay-to-program'
import {
  GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY,
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

function parseWageNumber(pricing: string | undefined): number | null {
  const raw = parseCompanySchoolWageAmountFromPricing(pricing, 'regular')
  if (!raw) return null
  const n = Number(raw.replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
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
  const types = program.generalParticipantTypes ?? []
  const organization =
    program.generalProgramAudience === 'organization' || types.includes('school_institution')
  return {
    programType: typeFields.educationStructure,
    sessionRoundType: typeFields.sessionRound,
    educationScheduleMode: common?.educationScheduleMode === 'period' ? 'period' : 'date',
    educationFormScheduleDetail: common?.educationFormScheduleDetail ?? 'common',
    participationScheduleDetail: common?.participationScheduleDetail ?? 'common',
    ipsScheduleDetail: common?.ipsScheduleDetail ?? 'common',
    curriculumSessionCount: Math.max(1, common?.curriculumSessions?.length ?? 1),
    curriculumChartSessionCount: Math.max(1, common?.curriculumSessions?.length ?? 1),
    scheduleCurriculumDetailCount: Math.max(1, common?.scheduleDetails?.length ?? 1),
    scheduleCurriculumPreEducation: common?.scheduleCurriculumPreEducation === true,
    participantOrganization: organization,
  }
}

export function buildGeneralRegistrationOverlayFromProgram(
  program: Program
): Record<string, unknown> {
  const extras = extrasFromGeneralProgram(program)
  const common = program.generalCommonInfo
  const kpi = common?.kpi
  const rows = common?.wageGradeRows ?? []
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
    [`${KPI}.dispatchedSchool`]: kpi?.finalSchools ?? null,
    [`${KPI}.dispatchedClass`]: kpi?.finalClasses ?? null,
    [`${WAGE}.grade1Fee`]: parseWageNumber(rows[0]?.pricing),
    [`${WAGE}.grade2Fee`]: parseWageNumber(rows[1]?.pricing),
    [`${WAGE}.grade3Fee`]: parseWageNumber(rows[2]?.pricing),
    [`${WAGE}.paymentItemValues`]: Array.isArray(
      program.registrationOverlay?.[`${WAGE}.paymentItemValues`]
    )
      ? program.registrationOverlay?.[`${WAGE}.paymentItemValues`]
      : [],
    [`${TYPE}.ipsType`]: {
      category: reverseIpsCategory(program.ips),
      detail: '',
    },
  }
}

export function seedGeneralRegistrationOverlayFromProgram(program: Program): void {
  const fromProgram = buildGeneralRegistrationOverlayFromProgram(program)
  const saved = overlayFromProgram(program)
  replaceProgramRegistrationOverlayPrefix(GENERAL_REGISTRATION_OVERLAY_PREFIX, {
    ...fromProgram,
    ...saved,
  })
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
