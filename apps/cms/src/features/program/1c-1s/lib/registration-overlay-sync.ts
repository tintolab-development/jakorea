/**
 * 1사1교 상세 수정 — Program → economyRegistration overlay 시드.
 * 등록 단락·키는 변경하지 않는다.
 */
import type { Program } from '@/types/domain'
import { parseCompanySchoolWageAmountFromPricing } from '@/features/program/shared/lib/company-school-wage-pricing'
import { normalizeProgramBusinessAreaValue } from '@/features/program/shared/lib/program-detail-info-constants'
import { initialProgramRegistrationSurveyItems } from '@/features/template/lib/program-registration-survey-items'
import { resolveProgramSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS,
  TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
  TEMPLATE_FORM_IP_OWNED_OPTIONS,
} from '@/features/template/lib/template-form-select-options'
import {
  getProgramRegistrationOverlayRecord,
  pickProgramRegistrationOverlayByPrefix,
  replaceProgramRegistrationOverlayPrefix,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'

export const ECONOMY_REGISTRATION_OVERLAY_PREFIX = 'economyRegistration.' as const

const BASIC = 'economyRegistration.basicInfo' as const
const KPI = 'economyRegistration.kpi' as const
const CURRICULUM = 'economyRegistration.educationCurriculum' as const
const SCHEDULE = 'economyRegistration.educationScheduleSettings' as const
const WAGE = 'economyRegistration.wageInfo' as const
const ALL_VALUE = '__all__'

function overlayFromProgram(program: Program): Record<string, unknown> {
  return pickProgramRegistrationOverlayByPrefix(
    ECONOMY_REGISTRATION_OVERLAY_PREFIX,
    program.registrationOverlay ?? {}
  )
}

function reverseBusinessField(value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return 'economy_finance'
  if (TEMPLATE_FORM_BUSINESS_AREA_OPTIONS.some(option => option.value === trimmed)) return trimmed
  const normalized = normalizeProgramBusinessAreaValue(trimmed)
  return (
    TEMPLATE_FORM_BUSINESS_AREA_OPTIONS.find(
      option => normalizeProgramBusinessAreaValue(option.label) === normalized
    )?.value ?? 'economy_finance'
  )
}

function reverseIpOwned(value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return 'ja'
  const lower = trimmed.toLowerCase()
  if (TEMPLATE_FORM_IP_OWNED_OPTIONS.some(option => option.value === lower)) return lower
  return (
    TEMPLATE_FORM_IP_OWNED_OPTIONS.find(option => option.label === trimmed)?.value ?? 'ja'
  )
}

function reverseCourseDelivered(value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return 'ja'
  const lower = trimmed.toLowerCase()
  if (TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS.some(option => option.value === lower)) {
    return lower
  }
  return (
    TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS.find(option => option.label === trimmed)?.value ??
    'ja'
  )
}

function reverseEducationCourse(value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed || trimmed === ALL_VALUE) return ALL_VALUE
  const byValue = TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS.find(option => option.value === trimmed)
  if (byValue) return byValue.value
  const byLabel = TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS.find(option => option.label === trimmed)
  return byLabel?.value ?? ALL_VALUE
}

function reverseIps(value: Program['ips']): string {
  if (value === 'Inspire') return 'inspire'
  if (value === 'Succeed') return 'succeed'
  return 'prepare'
}

function parseWageNumber(pricing: string | undefined, kind: 'regular' | 'longDistance'): number | null {
  const raw = parseCompanySchoolWageAmountFromPricing(pricing, kind)
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

function dateRangeSealFromProgram(
  program: Program
): { start: string; end: string } | null {
  const saved = program.registrationOverlay?.[`${SCHEDULE}.dateRangeSeal`]
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
    const start = (saved as { start?: unknown }).start
    const end = (saved as { end?: unknown }).end
    if (typeof start === 'string' && typeof end === 'string' && start && end) {
      return { start, end }
    }
  }
  const line = program.generalCommonInfo?.educationScheduleLines?.[0]
  if (line?.trim()) {
    const [startText, endText] = line.split('~').map(part => part.trim())
    const parse = (value: string | undefined) => {
      if (!value) return null
      const match = value.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/)
      if (!match) return null
      const [, year, month, day] = match
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`
    }
    const start = parse(startText)
    const end = parse(endText)
    if (start && end) return { start, end }
  }
  if (program.startDate && program.endDate) {
    return { start: String(program.startDate), end: String(program.endDate) }
  }
  return null
}

export function buildEconomyRegistrationOverlayFromProgram(
  program: Program
): Record<string, unknown> {
  const rows = program.generalCommonInfo?.wageGradeRows ?? []
  const grade = (index: number) => rows[index]?.pricing
  const sessions = program.generalCommonInfo?.curriculumSessions ?? []
  const sponsorId =
    program.sponsorId?.trim() ||
    program.generalCommonInfo?.sponsorManagementId?.trim() ||
    program.generalCommonInfo?.sponsorManagementIds?.[0]?.trim() ||
    ALL_VALUE
  const managerIds = program.generalCommonInfo?.sponsorManagerContactIds ?? []
  const kpi = program.generalCommonInfo?.kpi

  return {
    [`${BASIC}.repKo`]: program.mainTitle?.trim() || program.title?.trim() || '',
    [`${BASIC}.repEn`]: program.titleEn?.trim() || '',
    [`${BASIC}.publicProgramTitle`]:
      program.generalCommonInfo?.announcementTitle?.trim() || '',
    [`${BASIC}.detailedProgramId`]: program.detailedProgramId?.trim() || '',
    [`${BASIC}.detailedProgramName`]:
      program.generalCommonInfo?.detailedProgramName?.trim() || '',
    [`${BASIC}.businessField`]: reverseBusinessField(program.businessArea),
    [`${BASIC}.ipOwned`]: reverseIpOwned(program.ipOwned),
    [`${BASIC}.courseDeliveredBy`]: reverseCourseDelivered(program.courseDeliveredBy),
    [`${BASIC}.ipsCategory`]: reverseIps(program.ips),
    [`${BASIC}.partnerInvolvement`]: program.partnerInvolvement === false ? 'no' : 'yes',
    [`${BASIC}.educationCourse`]: reverseEducationCourse(program.educationProcess),
    [`${BASIC}.sponsorId`]: sponsorId,
    [`${BASIC}.managerContactId`]: managerIds[0] ?? ALL_VALUE,
    [`${BASIC}.managerContactIds`]: managerIds,
    [`${BASIC}.operationRangeSeal`]:
      program.startDate && program.endDate
        ? { start: String(program.startDate), end: String(program.endDate) }
        : null,
    [`${BASIC}.surveyItems`]: surveyItemsFromProgram(program),
    [`${KPI}.participantCount`]: kpi?.finalParticipants ?? null,
    [`${KPI}.instructor`]: kpi?.instructorCount ?? program.instructors ?? null,
    [`${KPI}.dispatchedSchool`]: kpi?.finalSchools ?? program.participatingSchoolCount ?? null,
    [`${KPI}.dispatchedClass`]: kpi?.finalClasses ?? null,
    [`${CURRICULUM}.session1.title`]: sessions[0]?.title ?? '',
    [`${CURRICULUM}.session1.description`]: sessions[0]?.description ?? '',
    [`${CURRICULUM}.session2.title`]: sessions[1]?.title ?? '',
    [`${CURRICULUM}.session2.description`]: sessions[1]?.description ?? '',
    [`${SCHEDULE}.dateRangeSeal`]: dateRangeSealFromProgram(program),
    [`${WAGE}.grade1Fee`]: parseWageNumber(grade(0), 'regular'),
    [`${WAGE}.grade1DistanceFee`]: parseWageNumber(grade(0), 'longDistance'),
    [`${WAGE}.grade2Fee`]: parseWageNumber(grade(1), 'regular'),
    [`${WAGE}.grade2DistanceFee`]: parseWageNumber(grade(1), 'longDistance'),
    [`${WAGE}.grade3Fee`]: parseWageNumber(grade(2), 'regular'),
    [`${WAGE}.grade3DistanceFee`]: parseWageNumber(grade(2), 'longDistance'),
    [`${WAGE}.paymentItemValues`]: Array.isArray(
      program.registrationOverlay?.[`${WAGE}.paymentItemValues`]
    )
      ? program.registrationOverlay?.[`${WAGE}.paymentItemValues`]
      : [],
  }
}

export function seedEconomyRegistrationOverlayFromProgram(program: Program): void {
  const fromProgram = buildEconomyRegistrationOverlayFromProgram(program)
  const saved = overlayFromProgram(program)
  const merged = { ...fromProgram, ...saved }
  const surveyKeys = resolveProgramSurveyMenuKeys({
    generalSurveyMenuKeys: program.generalSurveyMenuKeys,
    registrationOverlay: merged,
  })
  merged[`${BASIC}.surveyItems`] = {
    survey: surveyKeys.includes('survey'),
    satisfaction: surveyKeys.includes('satisfaction'),
    lecture_evaluation: surveyKeys.includes('lecture_evaluation'),
  }
  replaceProgramRegistrationOverlayPrefix(ECONOMY_REGISTRATION_OVERLAY_PREFIX, merged)
}

export function readEconomyRegistrationOverlayForSave(): Record<string, unknown> {
  return pickProgramRegistrationOverlayByPrefix(
    ECONOMY_REGISTRATION_OVERLAY_PREFIX,
    getProgramRegistrationOverlayRecord()
  )
}
