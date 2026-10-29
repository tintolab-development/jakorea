/**
 * 1사1교 상세 수정 — Program → economyRegistration overlay 시드.
 * 등록 단락·키는 변경하지 않는다.
 */
import type { Program } from '@/types/domain'
import { applyEconomyRegistrationOverlayToProgram } from '@/features/program/general/lib/economy-registration-overlay-to-program'
import { parseCompanySchoolWageAmountFromPricing } from '@/features/program/shared/lib/company-school-wage-pricing'
import {
  programToDetailEditValues,
  type ProgramDetailEditFormValues,
} from '@/features/program/shared/model/program-detail-edit-schema'
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
import { resolveSponsorContactIdsFromProgram } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import { resolveProgramPaymentItemIdsFromLabels } from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { preserveCompanySchoolCompatibilityOverlay } from './serialize-registration-overlay-from-canonical'

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
  const managerIds = resolveSponsorContactIdsFromProgram(program)
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
    [`${WAGE}.paymentItemValues`]: resolveProgramPaymentItemIdsFromLabels(
      program.generalCommonInfo?.paymentItems
    ),
  }
}

function applySurveyItemsFromProgram(
  program: Program,
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const surveyKeys = resolveProgramSurveyMenuKeys({
    generalSurveyMenuKeys: program.generalSurveyMenuKeys,
    registrationOverlay: overlay,
  })
  return {
    ...overlay,
    [`${BASIC}.surveyItems`]: {
      survey: surveyKeys.includes('survey'),
      satisfaction: surveyKeys.includes('satisfaction'),
      lecture_evaluation: surveyKeys.includes('lecture_evaluation'),
    },
  }
}

/** Program 표시값 역변환은 제목·기간만 우선하고, ID/원숫자/KPI presence는 leftover를 유지한다. */
function mergeEconomyOverlayFromProgram(
  program: Program,
  leftover: Record<string, unknown>
): Record<string, unknown> {
  const fromProgram = buildEconomyRegistrationOverlayFromProgram(program)
  return preserveCompanySchoolCompatibilityOverlay({ ...leftover, ...fromProgram }, leftover)
}

/** 상세 편집 진입 시 seed 되는 economy overlay(순수 계산) */
export function buildSeededEconomyRegistrationOverlay(program: Program): Record<string, unknown> {
  const leftover = overlayFromProgram(program)
  return applySurveyItemsFromProgram(program, mergeEconomyOverlayFromProgram(program, leftover))
}

export function seedEconomyRegistrationOverlayFromProgram(program: Program): void {
  replaceProgramRegistrationOverlayPrefix(
    ECONOMY_REGISTRATION_OVERLAY_PREFIX,
    buildSeededEconomyRegistrationOverlay(program)
  )
}

export function resyncEconomyRegistrationOverlayFromProgram(
  program: Program,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  const leftover = pickProgramRegistrationOverlayByPrefix(
    ECONOMY_REGISTRATION_OVERLAY_PREFIX,
    extra ?? {}
  )
  return mergeEconomyOverlayFromProgram(program, leftover)
}

/** leftover(모집·강사 포함) + economy 재생성. 공통정보 PATCH가 무관 overlay를 지우지 않는다. */
const DETAIL_SAVE_FORM_OVERLAY_KEYS = [
  `${BASIC}.publicProgramTitle`,
  `${BASIC}.repKo`,
  `${BASIC}.repEn`,
] as const

export const ECONOMY_PUBLIC_PROGRAM_TITLE_KEY = `${BASIC}.publicProgramTitle` as const

/**
 * 상세 공통정보 저장 공고명.
 * overlay 단락이 현재 입력(등록 편집 UI)이면 overlay가 정본이고,
 * infoForm만 바뀐 저장(단위·폼 경로)이면 폼이 정본이다.
 * 빈 문자열은 명시적 입력이다.
 */
export function resolveCompanySchoolDetailSaveAnnouncementTitle(args: {
  formAnnouncement: unknown
  overlayAnnouncement: unknown
  programAnnouncement: unknown
}): string | undefined {
  const overlay =
    typeof args.overlayAnnouncement === 'string' ? args.overlayAnnouncement : undefined
  const form = typeof args.formAnnouncement === 'string' ? args.formAnnouncement : undefined
  const program =
    typeof args.programAnnouncement === 'string' ? args.programAnnouncement : undefined
  const overlayDirty = overlay !== undefined && overlay !== program
  const formDirty = form !== undefined && form !== program
  if (overlayDirty) return overlay
  if (formDirty) return form
  if (overlay !== undefined) return overlay
  return form
}

/**
 * 1사1교 상세 공통정보 저장 — 등록 단락(overlay)에서 바꾼 대표 프로그램명(국문·영문)을 폼 값으로 올린다.
 * overlay 값이 저장된 Program과 다를 때만 반환한다. title은 등록 계약(title = repKo)대로
 * 기존 title이 비었거나 이전 대표명과 같을 때만 함께 바꾼다.
 */
export function resolveCompanySchoolDetailSaveTitleFields(
  overlay: Record<string, unknown>,
  program: Pick<Program, 'title' | 'mainTitle' | 'titleEn'>
): { title?: string; mainTitle?: string; titleEn?: string } {
  const next: { title?: string; mainTitle?: string; titleEn?: string } = {}
  const repKo = overlay[`${BASIC}.repKo`]
  const baselineKo = program.mainTitle?.trim() || program.title?.trim() || ''
  if (typeof repKo === 'string' && repKo.trim() && repKo.trim() !== baselineKo) {
    next.mainTitle = repKo.trim()
    const currentTitle = program.title?.trim() || ''
    if (!currentTitle || currentTitle === baselineKo) next.title = repKo.trim()
  }
  const repEn = overlay[`${BASIC}.repEn`]
  if (typeof repEn === 'string' && repEn.trim() !== (program.titleEn?.trim() || '')) {
    next.titleEn = repEn.trim()
  }
  return next
}

export function applyLiveEconomyAnnouncementToProgram(
  program: Program,
  overlay: Record<string, unknown>,
  baselineAnnouncement?: unknown
): Program {
  const live = resolveCompanySchoolDetailSaveAnnouncementTitle({
    formAnnouncement: program.generalCommonInfo?.announcementTitle,
    overlayAnnouncement: overlay[ECONOMY_PUBLIC_PROGRAM_TITLE_KEY],
    programAnnouncement:
      baselineAnnouncement ?? program.generalCommonInfo?.announcementTitle,
  })
  if (live === undefined) return program
  if (live === program.generalCommonInfo?.announcementTitle) return program
  return {
    ...program,
    generalCommonInfo: {
      ...program.generalCommonInfo,
      announcementTitle: live,
    },
  }
}

export function mergeCompanySchoolDetailSaveOverlay(
  program: Program,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  const leftover = {
    ...(program.registrationOverlay ?? {}),
    ...extra,
  }
  const economy = resyncEconomyRegistrationOverlayFromProgram(program, leftover)
  const merged = preserveCompanySchoolCompatibilityOverlay({ ...leftover, ...economy }, leftover)
  if (extra == null) return merged
  for (const key of DETAIL_SAVE_FORM_OVERLAY_KEYS) {
    if (Object.prototype.hasOwnProperty.call(extra, key)) {
      merged[key] = extra[key]
    }
  }
  return merged
}

/** 1사1교 공통정보 RHF 저장 직전 — 폼이 반영한 Program으로 economy overlay 동기화 */
export function writeEconomyRegistrationOverlayFromProgramDraft(draftFromForm: Program): void {
  const leftover = {
    ...readEconomyRegistrationOverlayForSave(),
    ...overlayFromProgram(draftFromForm),
  }
  const merged = applySurveyItemsFromProgram(
    draftFromForm,
    mergeEconomyOverlayFromProgram(draftFromForm, leftover)
  )
  replaceProgramRegistrationOverlayPrefix(ECONOMY_REGISTRATION_OVERLAY_PREFIX, merged)
}

export function readEconomyRegistrationOverlayForSave(): Record<string, unknown> {
  return pickProgramRegistrationOverlayByPrefix(
    ECONOMY_REGISTRATION_OVERLAY_PREFIX,
    getProgramRegistrationOverlayRecord()
  )
}

function sameOverlayValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

/**
 * 1사1교 상세 공통정보 저장 직전 — 등록 단락(overlay)에서 바꾼 값을 infoForm 필드로 올린다.
 * 단락은 overlay에만 쓰고 저장은 infoForm 기준으로 overlay를 재작성하므로, 그대로 두면
 * 대표 프로그램명 외 모든 단락 입력이 이전 값으로 덮였다.
 * seed 대비 바뀐 overlay 키만 반영해, infoForm만 바뀐 저장 경로는 건드리지 않는다.
 */
export function resolveCompanySchoolDetailSaveLiveFormValues(
  liveOverlay: Record<string, unknown>,
  program: Program
): Partial<ProgramDetailEditFormValues> {
  const seeded = buildSeededEconomyRegistrationOverlay(program)
  const dirty: Record<string, unknown> = {}
  for (const key of Object.keys(liveOverlay)) {
    if (!sameOverlayValue(liveOverlay[key], seeded[key])) dirty[key] = liveOverlay[key]
  }
  if (Object.keys(dirty).length === 0) return {}
  const baseValues = programToDetailEditValues(
    applyEconomyRegistrationOverlayToProgram(program, seeded)
  ) as Record<string, unknown>
  const liveValues = programToDetailEditValues(
    applyEconomyRegistrationOverlayToProgram(program, { ...seeded, ...dirty })
  ) as Record<string, unknown>
  const changed: Record<string, unknown> = {}
  for (const key of Object.keys(liveValues)) {
    if (!sameOverlayValue(liveValues[key], baseValues[key])) changed[key] = liveValues[key]
  }
  return changed as Partial<ProgramDetailEditFormValues>
}
