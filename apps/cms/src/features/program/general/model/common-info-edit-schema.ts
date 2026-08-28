/**
 * 일반 프로그램 상세 — 공통 정보 「정보 수정」 전용 스키마·변환
 */

import { z } from 'zod'
import type {
  GeneralProgramParticipantType,
  GeneralProgramSessionRoundKind,
  GeneralProgramSurveyMenuKey,
  InstitutionType,
  Program,
} from '@/types/domain'
import { mockDetailedProgramManagementListRows } from '@/data/mock/detailed-program-management-list'
import type { SponsorContactRow, SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import {
  resolveGeneralProgramCommonInfo,
  resolveScheduleTypeDetailedProgramNameFromDetails,
} from '@/features/program/general/lib/detail-common-info-display'
import {
  programPaymentItemLabelsFromIds,
  resolveProgramPaymentItemIdsFromLabels,
  resolveProgramWageDeductionLabel,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { getGeneralParticipantTypes } from '@/features/program/general/lib/detail-meta'
import {
  isGeneralIndividualParticipantSelection,
  isGeneralIndividualProgram,
} from '@/features/program/general/lib/survey-audience'
import { normalizeGeneralSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'
import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import {
  buildDefaultScheduleDetailsForEdit,
  inferScheduleDetailBlockKind,
  isPreEducationCurriculumSession,
  relabelScheduleDetailFormRowsByKind,
  shouldDisableEducationSchedulePeriodMode,
} from '@/features/program/general/lib/schedule-detail-form'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
  withDetailedProgramNoneOption,
} from '@/features/template/lib/template-form-select-options'
import {
  PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS,
  PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS,
  PROGRAM_REGISTRATION_IP_OWNED_OPTIONS,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import {
  PROGRAM_REGISTRATION_SURVEY_ITEM_LABELS,
  type ProgramRegistrationSurveyItemId,
} from '@/features/template/lib/program-registration-survey-items'
import {
  PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS,
  PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS,
  PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS,
  type ProgramRegistrationIpsCategory,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import { getProgramRegistrationEducationFormOptions } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'

const curriculumSessionSchema = z.object({
  sessionLabel: z.string(),
  title: z.string(),
  description: z.string(),
  assignmentEnabled: z.boolean().optional(),
  assignmentPeriod: z.string().optional(),
  educationForm: z.string().optional(),
  participationMethod: z.enum(['individual', 'team']).optional(),
  ipsCategory: z.enum(['inspire', 'prepare', 'succeed', '']).optional(),
  ipsDetail: z.string().optional(),
  scheduleDate: z.string().optional(),
})

const scheduleGroupTimeSchema = z.object({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})

const scheduleDetailFormSchema = z.object({
  scheduleLabel: z.string(),
  blockKind: z.enum(['sub', 'event', 'preEducation']).optional(),
  name: z.string(),
  groupTimes: z.array(scheduleGroupTimeSchema),
  scheduleDate: z.string().optional(),
  assignmentEnabled: z.boolean().optional(),
  assignmentPeriod: z.string().optional(),
  educationForm: z.string().optional(),
  participationMethod: z.enum(['individual', 'team']).optional(),
  ipsCategory: z.enum(['inspire', 'prepare', 'succeed', '']).optional(),
  ipsDetail: z.string().optional(),
})

const participantTypeSchema = z.object({
  participantIndividual: z.boolean(),
  participantOrganization: z.boolean(),
  participantTeacherInstructor: z.boolean(),
  participantVolunteer: z.boolean(),
})

export const generalProgramCommonInfoEditSchema = z
  .object({
    mainTitle: z.string().trim().min(1, '대표 프로그램명(국문)을 입력해주세요'),
    titleEn: z.string().optional(),
    announcementTitle: z.string().trim().min(1, '공고용 프로그램명을 입력해주세요'),
    detailedProgramId: z.string().optional(),
    startDate: z.string().min(1, '사업 운영 기간을 선택해주세요'),
    endDate: z.string().min(1, '사업 운영 기간을 선택해주세요'),
    businessArea: z.string().min(1, '사업 분야를 선택해주세요'),
    sponsorManagementIds: z.array(z.string()).min(1, '후원사를 선택해주세요'),
    sponsorManagerContactId: z.string().min(1, '후원사 담당자를 선택해주세요'),
    venueKind: z.enum(['inside', 'outside', 'other']),
    venueDetail: z.string().optional(),
    surveySurvey: z.boolean(),
    surveySatisfaction: z.boolean(),
    surveyLectureEvaluation: z.boolean(),
    educationProcess: z.string().min(1, '교육 과정을 선택해주세요'),
    ipOwned: z.string().min(1, 'IP Owned를 선택해주세요'),
    courseDeliveredBy: z.string().min(1, 'Course Delivered By를 선택해주세요'),
    partnerInvolvement: z.enum(['yes', 'no']),
    kpiFinalParticipants: z.coerce.number().min(0).optional(),
    kpiInstructorCount: z.coerce.number().min(0).optional(),
    kpiVolunteerCount: z.coerce.number().min(0).optional(),
    kpiFinalSchools: z.coerce.number().min(0).optional(),
    kpiFinalClasses: z.coerce.number().min(0).optional(),
    wageGrade1Amount: z.string().optional(),
    wageGrade2Amount: z.string().optional(),
    wageGrade3Amount: z.string().optional(),
    wagePaymentItemIds: z.array(z.string()).optional(),
    wageDeductionItems: z.string().optional(),
    educationStructure: z.enum(['curriculum', 'schedule']),
    sessionRound: z.enum(['single', 'multi']),
    educationForm: z.string().optional(),
    educationFormScheduleDetail: z.enum(['common', 'perSchedule']).optional(),
    participationScheduleDetail: z.enum(['common', 'perSchedule']).optional(),
    ipsScheduleDetail: z.enum(['common', 'perSchedule']),
    ipsCategory: z.enum(['inspire', 'prepare', 'succeed', '']),
    ipsDetail: z.string().optional(),
    participationMethod: z.enum(['individual', 'team']).optional(),
    curriculumSessions: z.array(curriculumSessionSchema),
    scheduleGroupCount: z.coerce.number().min(1).max(4).default(2),
    scheduleDetails: z.array(scheduleDetailFormSchema),
    scheduleCurriculumPreEducation: z.boolean().optional(),
    educationScheduleMode: z.enum(['date', 'period']).default('date'),
    educationScheduleLines: z.array(z.string()),
  })
  .merge(participantTypeSchema)
  .superRefine((data, ctx) => {
    const hasParticipant =
      data.participantIndividual ||
      data.participantOrganization ||
      data.participantTeacherInstructor ||
      data.participantVolunteer
    if (!hasParticipant) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '참여자 유형을 선택해주세요',
        path: ['participantOrganization'],
      })
    }
  })

export type GeneralProgramCommonInfoEditFormValues = z.infer<
  typeof generalProgramCommonInfoEditSchema
>

export function getGeneralCommonInfoEditValidationMessage(
  values: GeneralProgramCommonInfoEditFormValues
): string | undefined {
  const result = generalProgramCommonInfoEditSchema.safeParse(values)
  if (result.success) return undefined
  return result.error.issues[0]?.message ?? '입력값을 확인해 주세요.'
}

export type GeneralProgramScheduleDetailFormValues = z.infer<typeof scheduleDetailFormSchema>

export function padScheduleDetailLabel(index: number): string {
  return `세부 일정 ${String(index + 1).padStart(2, '0')}`
}

function emptyScheduleGroupTimes(count: number) {
  return Array.from({ length: count }, () => ({ startTime: '', endTime: '' }))
}

export function parseScheduleProgressTimeSummary(
  summary: string | undefined
): Array<{ startTime: string; endTime: string }> {
  if (!summary?.trim()) return [{ startTime: '', endTime: '' }]
  return summary.split(/\s*\|\s*/).map(part => {
    const match = part
      .trim()
      .match(/그룹\s+[A-Z]\s*:\s*(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})/)
    return { startTime: match?.[1] ?? '', endTime: match?.[2] ?? '' }
  })
}

export function buildScheduleProgressTimeSummary(
  groupTimes: Array<{ startTime?: string; endTime?: string }>
): string {
  return groupTimes
    .map((gt, gi) => {
      const letter = String.fromCharCode('A'.charCodeAt(0) + gi)
      const start = gt.startTime?.trim() ?? ''
      const end = gt.endTime?.trim() ?? ''
      if (!start || !end) return `그룹 ${letter} : -`
      return `그룹 ${letter} : ${start} ~ ${end}`
    })
    .join(' | ')
}

export function resolveScheduleDetailsFormState(
  commonInfo: NonNullable<Program['generalCommonInfo']>,
  sessionRound: GeneralProgramSessionRoundKind = 'single',
  options?: { participantOrganization?: boolean }
): {
  scheduleGroupCount: number
  scheduleDetails: GeneralProgramScheduleDetailFormValues[]
  scheduleCurriculumPreEducation: boolean
} {
  const eduDetail = commonInfo.educationFormScheduleDetail ?? 'common'
  const partDetail = commonInfo.participationScheduleDetail ?? 'common'
  const ipsDetail =
    commonInfo.ipsScheduleDetail ??
    (commonInfo.ipsTypeSummary?.includes('별') ? 'perSchedule' : 'common')

  const raw = commonInfo.scheduleDetails ?? []
  if (raw.length === 0) {
    const groupCount = 2
    return {
      scheduleGroupCount: groupCount,
      scheduleCurriculumPreEducation: commonInfo.scheduleCurriculumPreEducation ?? false,
      scheduleDetails: buildDefaultScheduleDetailsForEdit({
        sessionRound,
        scheduleGroupCount: groupCount,
        educationFormScheduleDetail: eduDetail,
        participationScheduleDetail: partDetail,
        ipsScheduleDetail: ipsDetail,
        participantOrganization: options?.participantOrganization ?? true,
      }),
    }
  }

  const scheduleDetails = raw.map((d, i) => {
    const blockKind = inferScheduleDetailBlockKind(d.scheduleLabel ?? '')
    const groupTimes = d.progressTimeSummary
      ? parseScheduleProgressTimeSummary(d.progressTimeSummary)
      : emptyScheduleGroupTimes(1)
    const sessionIps = parseSessionIpsTypeSummary(d.ipsTypeSummary)
    return {
      scheduleLabel: d.scheduleLabel || padScheduleDetailLabel(i),
      blockKind,
      name: d.name ?? '',
      groupTimes: groupTimes.length > 0 ? groupTimes : emptyScheduleGroupTimes(1),
      scheduleDate: d.scheduleDateLabel ?? '',
      assignmentEnabled: d.assignmentEnabled ?? false,
      assignmentPeriod: d.assignmentPeriod ?? '',
      educationForm: educationFormValueFromLabel(d.educationFormLabel),
      participationMethod: participationMethodValueFromLabel(d.participationMethodLabel),
      ipsCategory: blockKind === 'preEducation' ? 'prepare' : sessionIps.ipsCategory,
      ipsDetail: blockKind === 'preEducation' ? 'none' : sessionIps.ipsDetail,
    }
  })

  const scheduleGroupCount = Math.max(1, ...scheduleDetails.map(d => d.groupTimes.length))
  return {
    scheduleCurriculumPreEducation: commonInfo.scheduleCurriculumPreEducation ?? false,
    scheduleGroupCount,
    scheduleDetails: scheduleDetails.map(d => ({
      ...d,
      groupTimes: [
        ...d.groupTimes,
        ...emptyScheduleGroupTimes(Math.max(0, scheduleGroupCount - d.groupTimes.length)),
      ].slice(0, scheduleGroupCount),
    })),
  }
}

export function relabelScheduleDetailFormRows(
  details: GeneralProgramScheduleDetailFormValues[]
): GeneralProgramScheduleDetailFormValues[] {
  return relabelScheduleDetailFormRowsByKind(details)
}

function toIso(d: string | Date | undefined): string {
  if (d == null) return ''
  return typeof d === 'string' ? d : (d.toISOString?.() ?? String(d))
}

function resolveBusinessAreaFormValue(businessArea: string | undefined): string {
  if (!businessArea?.trim()) return ''
  const byValue = TEMPLATE_FORM_BUSINESS_AREA_OPTIONS.find(o => o.value === businessArea)
  if (byValue) return byValue.value
  const byLabel = TEMPLATE_FORM_BUSINESS_AREA_OPTIONS.find(o => o.label === businessArea)
  return byLabel?.value ?? businessArea
}

function resolveEducationProcessFormValue(value: string | undefined): string {
  if (!value?.trim()) return ''
  const byValue = PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS.find(o => o.value === value)
  if (byValue) return byValue.value
  const byLabel = PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS.find(o => o.label === value)
  return byLabel?.value ?? value
}

function resolveIpOwnedFormValue(value: string | undefined): string {
  if (!value?.trim()) return ''
  const normalized = value.toLowerCase()
  const byValue = PROGRAM_REGISTRATION_IP_OWNED_OPTIONS.find(
    o => o.value === normalized || o.label.toLowerCase() === normalized
  )
  if (byValue) return byValue.value
  if (normalized === 'joint') return 'jointly'
  return normalized
}

function resolveCourseDeliveredFormValue(value: string | undefined): string {
  if (!value?.trim()) return ''
  const normalized = value.toLowerCase()
  const byValue = PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS.find(
    o => o.value === normalized || o.label.toLowerCase() === normalized
  )
  return byValue?.value ?? normalized
}

function educationProcessToProgramValue(formValue: string): string {
  return (
    PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS.find(o => o.value === formValue)?.label ??
    formValue
  )
}

function ipOwnedToProgramValue(formValue: string): string {
  const label =
    PROGRAM_REGISTRATION_IP_OWNED_OPTIONS.find(o => o.value === formValue)?.label ?? formValue
  if (label === 'Jointly') return 'Jointly'
  if (label === 'Partner') return 'Partner'
  return 'JA'
}

function courseDeliveredToProgramValue(formValue: string): 'JA' | 'Jointly' | 'Partner' {
  const label =
    PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS.find(o => o.value === formValue)?.label ??
    formValue
  if (label === 'Jointly') return 'Jointly'
  if (label === 'Partner') return 'Partner'
  return 'JA'
}

function businessAreaToProgramValue(formValue: string): string {
  return (
    TEMPLATE_FORM_BUSINESS_AREA_OPTIONS.find(o => o.value === formValue)?.label ?? formValue
  )
}

export function isGeneralProgramScheduleType(program: Program): boolean {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  return (
    resolveEffectiveGeneralProgramTypeFields({
      generalProgramAudience: program.generalProgramAudience,
      generalProgramEducationStructure: program.generalProgramEducationStructure,
      generalProgramSessionRound: program.generalProgramSessionRound,
      curriculumSessions: commonInfo.curriculumSessions,
    }).educationStructure === 'schedule'
  )
}

function resolveDetailedProgramId(program: Program): string {
  if (isGeneralProgramScheduleType(program)) {
    return TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
  }
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const name =
    commonInfo.detailedProgramName?.trim() ||
    program.textbookName?.trim() ||
    program.teamDivision?.trim()
  if (!name) return ''
  const matched = mockDetailedProgramManagementListRows.find(row => row.name === name)
  return matched?.id ?? ''
}

export type GeneralProgramVenueKind = 'inside' | 'outside' | 'other'

export const GENERAL_PROGRAM_VENUE_KIND_LABELS: Record<GeneralProgramVenueKind, string> = {
  inside: '기관 안',
  outside: '기관 밖',
  other: '기타(직접입력)',
}

export function resolveVenueKind(program: Program): GeneralProgramVenueKind {
  if (program.institutionType === 'inside_school') return 'inside'
  if (program.institutionType === 'outside_school') return 'outside'
  if (program.venue?.trim()) return 'other'
  return 'inside'
}

/** 조회 모드 — 라디오 선택 · 상세 입력 (`|` 구분) */
export function formatGeneralProgramVenueViewLine(
  program: Program,
  venueDetail?: string | null
): string {
  const kindLabel = GENERAL_PROGRAM_VENUE_KIND_LABELS[resolveVenueKind(program)]
  const detail = venueDetail?.trim() || program.venue?.trim() || '-'
  return `${kindLabel} | ${detail}`
}

const SPONSOR_MANAGER_CONTACT_REF_SEPARATOR = '::'

export function encodeSponsorManagerContactRef(
  sponsorManagementId: string,
  contactId: string
): string {
  return `${sponsorManagementId}${SPONSOR_MANAGER_CONTACT_REF_SEPARATOR}${contactId}`
}

export function decodeSponsorManagerContactRef(
  ref: string
): { sponsorManagementId: string; contactId: string } | null {
  const separatorIndex = ref.indexOf(SPONSOR_MANAGER_CONTACT_REF_SEPARATOR)
  if (separatorIndex <= 0) return null
  return {
    sponsorManagementId: ref.slice(0, separatorIndex),
    contactId: ref.slice(separatorIndex + SPONSOR_MANAGER_CONTACT_REF_SEPARATOR.length),
  }
}

export type GeneralProgramSponsorEditContext = {
  sponsors: SponsorManagementRow[]
  contactsBySponsorId: Record<string, SponsorContactRow[]>
}

const EMPTY_SPONSOR_CONTEXT: GeneralProgramSponsorEditContext = {
  sponsors: [],
  contactsBySponsorId: {},
}

function findSponsorByName(
  sponsors: readonly SponsorManagementRow[],
  name: string
): SponsorManagementRow | undefined {
  const trimmed = name.trim()
  if (!trimmed) return undefined
  return sponsors.find(row => row.name === trimmed)
}

export function resolveSponsorManagementIds(
  program: Program,
  context: GeneralProgramSponsorEditContext = EMPTY_SPONSOR_CONTEXT
): string[] {
  const { sponsors } = context
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  if (commonInfo.sponsorManagementIds?.length) return [...commonInfo.sponsorManagementIds]
  if (commonInfo.sponsorManagementId) return [commonInfo.sponsorManagementId]
  const displayName = commonInfo.sponsorDisplayName?.trim()
  if (displayName) {
    const names = displayName.split(',').map(name => name.trim()).filter(Boolean)
    const ids = names
      .map(name => findSponsorByName(sponsors, name)?.id)
      .filter((id): id is string => Boolean(id))
    if (ids.length > 0) return ids
  }
  if (program.sponsorId) {
    const byId = sponsors.find(row => row.id === program.sponsorId)
    if (byId) return [byId.id]
    const sponsorName = commonInfo.sponsorDisplayName?.trim() || program.title
    void sponsorName
  }
  return sponsors[0] ? [sponsors[0].id] : []
}

function resolveSponsorManagerContactId(
  program: Program,
  sponsorManagementIds: string[],
  context: GeneralProgramSponsorEditContext = EMPTY_SPONSOR_CONTEXT
): string {
  const primarySponsorId = sponsorManagementIds[0]
  if (!primarySponsorId) return ''
  const contacts = context.contactsBySponsorId[primarySponsorId] ?? []
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const line = commonInfo.sponsorManagerLine?.trim() || program.managerName?.trim() || ''
  if (!line) {
    const first = contacts[0]
    return first ? encodeSponsorManagerContactRef(primarySponsorId, first.id) : ''
  }
  const namePart = line.split('|')[0]?.trim() ?? line
  const matched = contacts.find(
    c => c.name === namePart || line.includes(c.name) || (c.phone && line.includes(c.phone))
  )
  const contact = matched ?? contacts[0]
  return contact ? encodeSponsorManagerContactRef(primarySponsorId, contact.id) : ''
}

function resolveManagerFromFormValues(
  values: GeneralProgramCommonInfoEditFormValues,
  context: GeneralProgramSponsorEditContext = EMPTY_SPONSOR_CONTEXT
) {
  const decoded = decodeSponsorManagerContactRef(values.sponsorManagerContactId)
  const sponsorManagementId = decoded?.sponsorManagementId ?? values.sponsorManagementIds[0]
  const contactId = decoded?.contactId ?? values.sponsorManagerContactId
  if (!sponsorManagementId || !contactId) {
    return { manager: undefined, sponsorManagementId }
  }
  const manager = context.contactsBySponsorId[sponsorManagementId]?.find(c => c.id === contactId)
  return { manager, sponsorManagementId }
}

function participantFlagsFromProgram(program: Program): Pick<
  GeneralProgramCommonInfoEditFormValues,
  | 'participantIndividual'
  | 'participantOrganization'
  | 'participantTeacherInstructor'
  | 'participantVolunteer'
> {
  const types = new Set(getGeneralParticipantTypes(program))
  let participantIndividual = types.has('individual')
  let participantOrganization = types.has('school_institution')

  // [개인]/[기관]은 상호 배타 — 양쪽 동시 true면 audience 기준으로 정규화
  if (participantIndividual && participantOrganization) {
    if (isGeneralIndividualProgram(program)) {
      participantOrganization = false
    } else {
      participantIndividual = false
    }
  }

  return {
    participantIndividual,
    participantOrganization,
    participantTeacherInstructor: types.has('teacher_instructor'),
    participantVolunteer: types.has('volunteer'),
  }
}

function surveyFlagsFromProgram(program: Program): Pick<
  GeneralProgramCommonInfoEditFormValues,
  'surveySurvey' | 'surveySatisfaction' | 'surveyLectureEvaluation'
> {
  const keys = new Set(normalizeGeneralSurveyMenuKeys(program.generalSurveyMenuKeys ?? []))
  return {
    surveySurvey: keys.has('survey'),
    surveySatisfaction: keys.has('satisfaction'),
    surveyLectureEvaluation: keys.has('lecture_evaluation'),
  }
}

const WAGE_GRADE_LABELS = ['1급 강사비', '2급 강사비', '3급 강사비'] as const

function parseWageGradeAmount(pricing: string | undefined): string {
  if (!pricing?.trim()) return ''
  const match = pricing.replace(/,/g, '').match(/(\d+)/)
  return match?.[1] ?? ''
}

function buildWageGradePricing(amount: string | undefined): string {
  const trimmed = amount?.trim()
  if (!trimmed) return '1시간 당 | 기본 : -'
  const num = Number(trimmed.replace(/,/g, ''))
  if (Number.isNaN(num)) return `1시간 당 | 기본 : ${trimmed}`
  return `1시간 당 | 기본 : ${num.toLocaleString('ko-KR')}원`
}

function resolvePaymentItemIds(paymentItems: string | undefined): string[] {
  return resolveProgramPaymentItemIdsFromLabels(paymentItems)
}

function paymentItemLabelsFromIds(ids: string[] | undefined): string {
  return programPaymentItemLabelsFromIds(ids)
}

function educationFormLabelFromValue(value: string | undefined): string {
  const options = getProgramRegistrationEducationFormOptions(true)
  return options.find(o => o.value === value)?.label ?? value ?? '-'
}

const PARTICIPATION_METHOD_LABEL_BY_VALUE = {
  individual: '개인',
  team: '팀',
} as const

export function participationMethodLabelFromValue(
  value: 'individual' | 'team' | undefined
): string {
  if (!value || value === 'individual') return PARTICIPATION_METHOD_LABEL_BY_VALUE.individual
  return PARTICIPATION_METHOD_LABEL_BY_VALUE.team
}

export function participationMethodValueFromLabel(
  label: string | undefined
): 'individual' | 'team' {
  const trimmed = label?.trim()
  if (trimmed === PARTICIPATION_METHOD_LABEL_BY_VALUE.team) return 'team'
  return 'individual'
}

function educationFormValueFromLabel(label: string | undefined): string {
  if (!label?.trim()) return 'online'
  const options = getProgramRegistrationEducationFormOptions(true)
  const matched = options.find(o => o.label === label.trim())
  if (matched) return matched.value
  if (label.includes('온라인')) return 'online'
  if (label.includes('오프라인') && !label.includes('온')) return 'offline'
  if (label.includes('온/오프') || label.includes('하이브리드')) return 'hybrid'
  if (label.includes('참여자')) return 'participant_selection'
  return 'online'
}

function parseSessionIpsTypeSummary(summary: string | undefined): {
  ipsCategory: ProgramRegistrationIpsCategory | ''
  ipsDetail: string
} {
  const trimmed = summary?.trim()
  if (!trimmed) return { ipsCategory: '', ipsDetail: '' }
  if (trimmed.includes('일정')) {
    const parsed = parseIpsTypeSummary(trimmed)
    return { ipsCategory: parsed.ipsCategory, ipsDetail: parsed.ipsDetail }
  }
  const parts = trimmed.split(/\s*\|\s*/)
  const categoryLabel = parts[0]?.trim() ?? ''
  const detailLabel = parts[1]?.trim() ?? ''
  const fakeSummary = `일정 공통 | ${categoryLabel} | ${detailLabel}`
  const parsed = parseIpsTypeSummary(fakeSummary)
  return { ipsCategory: parsed.ipsCategory, ipsDetail: parsed.ipsDetail }
}

export function buildSessionIpsTypeSummary(
  ipsCategory: ProgramRegistrationIpsCategory | '',
  ipsDetail: string | undefined
): string {
  const full = buildIpsTypeSummary('common', ipsCategory, ipsDetail)
  const parts = full.split(/\s*\|\s*/)
  return `${parts[1]?.trim() ?? '-'} | ${parts[2]?.trim() ?? '해당없음'}`
}

function parseIpsTypeSummary(summary: string | undefined): {
  ipsScheduleDetail: 'common' | 'perSchedule'
  ipsCategory: ProgramRegistrationIpsCategory | ''
  ipsDetail: string
} {
  const parts = summary?.split(/\s*\|\s*/) ?? []
  const scheduleLabel = parts[0]?.trim() ?? ''
  const categoryLabel = parts[1]?.trim() ?? ''
  const detailLabel = parts[2]?.trim() ?? ''

  const ipsScheduleDetail: 'common' | 'perSchedule' =
    scheduleLabel.includes('별') ? 'perSchedule' : 'common'

  let ipsCategory: ProgramRegistrationIpsCategory | '' = ''
  if (/inspire/i.test(categoryLabel)) ipsCategory = 'inspire'
  else if (/prepare/i.test(categoryLabel)) ipsCategory = 'prepare'
  else if (/succeed/i.test(categoryLabel)) ipsCategory = 'succeed'

  let ipsDetail = ''
  if (ipsCategory === 'succeed') {
    ipsDetail =
      PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS.find(o => o.label === detailLabel)
        ?.value ??
      (detailLabel.includes('해당') ? 'none' : '')
  } else if (ipsCategory === 'inspire') {
    ipsDetail =
      PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS.find(o => o.label === detailLabel)
        ?.value ??
      (detailLabel.includes('해당') ? 'none' : '')
  } else if (ipsCategory === 'prepare') {
    ipsDetail = 'none'
  }

  return { ipsScheduleDetail, ipsCategory, ipsDetail }
}

function parseIpsTypeSummaryFromProgram(
  program: Program,
  summary: string | undefined
): ReturnType<typeof parseIpsTypeSummary> {
  const parsed = parseIpsTypeSummary(summary)
  if (!parsed.ipsCategory && program.ips) {
    parsed.ipsCategory = program.ips.toLowerCase() as ProgramRegistrationIpsCategory
    if (parsed.ipsCategory === 'prepare') parsed.ipsDetail = 'none'
    else if (parsed.ipsCategory === 'succeed' && program.programCategory) {
      parsed.ipsDetail =
        PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS.find(
          o => o.label === program.programCategory
        )?.value ?? 'none'
    } else if (parsed.ipsCategory === 'inspire' && program.programChannel) {
      parsed.ipsDetail =
        PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS.find(
          o => o.label === program.programChannel
        )?.value ?? 'none'
    }
  }
  return parsed
}

function buildIpsTypeSummary(
  ipsScheduleDetail: 'common' | 'perSchedule',
  ipsCategory: ProgramRegistrationIpsCategory | '',
  ipsDetail: string | undefined
): string {
  const scheduleLabel = ipsScheduleDetail === 'perSchedule' ? '일정 별 상이' : '일정 공통'
  const categoryLabel =
    PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS.find(o => o.value === ipsCategory)?.label ?? '-'
  let detailLabel = '해당없음'
  if (ipsCategory === 'succeed') {
    detailLabel =
      PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS.find(o => o.value === ipsDetail)
        ?.label ?? '해당 없음'
  } else if (ipsCategory === 'inspire') {
    detailLabel =
      PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS.find(o => o.value === ipsDetail)
        ?.label ?? '해당 없음'
  } else if (ipsCategory === 'prepare') {
    detailLabel = '해당없음'
  }
  return `${scheduleLabel} | ${categoryLabel} | ${detailLabel}`
}

function resolveTypeSettingsFromProgram(program: Program): Pick<
  GeneralProgramCommonInfoEditFormValues,
  | 'educationStructure'
  | 'sessionRound'
  | 'educationForm'
  | 'educationFormScheduleDetail'
  | 'participationScheduleDetail'
  | 'ipsScheduleDetail'
  | 'ipsCategory'
  | 'ipsDetail'
  | 'participationMethod'
> {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const typeFields = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
  })
  const ips = parseIpsTypeSummaryFromProgram(program, commonInfo.ipsTypeSummary)

  return {
    educationStructure: typeFields.educationStructure,
    sessionRound: typeFields.sessionRound,
    educationForm: educationFormValueFromLabel(commonInfo.educationFormLabel ?? undefined),
    educationFormScheduleDetail:
      commonInfo.educationFormScheduleDetail ??
      (commonInfo.educationFormLabel && !commonInfo.curriculumSessions?.some(s => s.educationFormLabel)
        ? 'common'
        : commonInfo.curriculumSessions?.some(s => s.educationFormLabel)
          ? 'perSchedule'
          : 'common'),
    participationScheduleDetail: commonInfo.participationScheduleDetail ?? 'common',
    ipsScheduleDetail: commonInfo.ipsScheduleDetail ?? ips.ipsScheduleDetail,
    ipsCategory: ips.ipsCategory,
    ipsDetail: ips.ipsDetail,
    participationMethod: commonInfo.participationMethod ?? 'individual',
  }
}

function resolveKpiFromProgram(program: Program): Pick<
  GeneralProgramCommonInfoEditFormValues,
  | 'kpiFinalParticipants'
  | 'kpiInstructorCount'
  | 'kpiVolunteerCount'
  | 'kpiFinalSchools'
  | 'kpiFinalClasses'
> {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const kpi = commonInfo.kpi
  const isIndividual = isGeneralIndividualProgram(program)
  return {
    kpiFinalParticipants: kpi?.finalParticipants ?? program.approvedStudentCount ?? 0,
    kpiInstructorCount: kpi?.instructorCount ?? program.instructors ?? 0,
    kpiVolunteerCount: kpi?.volunteerCount ?? program.generalVolunteers ?? 0,
    kpiFinalSchools: isIndividual ? 0 : (kpi?.finalSchools ?? program.participatingSchoolCount ?? 0),
    kpiFinalClasses: isIndividual ? 0 : (kpi?.finalClasses ?? 0),
  }
}

function resolveWageFromProgram(program: Program): Pick<
  GeneralProgramCommonInfoEditFormValues,
  | 'wageGrade1Amount'
  | 'wageGrade2Amount'
  | 'wageGrade3Amount'
  | 'wagePaymentItemIds'
  | 'wageDeductionItems'
> {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const rows = commonInfo.wageGradeRows ?? []
  const byGrade = Object.fromEntries(rows.map(r => [r.grade, r.pricing]))
  return {
    wageGrade1Amount: parseWageGradeAmount(byGrade[WAGE_GRADE_LABELS[0]]),
    wageGrade2Amount: parseWageGradeAmount(byGrade[WAGE_GRADE_LABELS[1]]),
    wageGrade3Amount: parseWageGradeAmount(byGrade[WAGE_GRADE_LABELS[2]]),
    wagePaymentItemIds: resolvePaymentItemIds(commonInfo.paymentItems),
    wageDeductionItems: resolveProgramWageDeductionLabel(
      resolvePaymentItemIds(commonInfo.paymentItems)
    ),
  }
}

export function programToGeneralCommonInfoEditValues(
  program: Program,
  context: GeneralProgramSponsorEditContext = EMPTY_SPONSOR_CONTEXT
): GeneralProgramCommonInfoEditFormValues {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const sponsorManagementIds = resolveSponsorManagementIds(program, context)
  const typeSettings = resolveTypeSettingsFromProgram(program)
  const educationProcess =
    resolveEducationProcessFormValue(program.educationProcess) ||
    PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS[0]?.value ||
    'traditional_paper'
  const ipOwned =
    resolveIpOwnedFormValue(program.ipOwned) ||
    PROGRAM_REGISTRATION_IP_OWNED_OPTIONS[0]?.value ||
    'ja'
  const courseDeliveredBy =
    resolveCourseDeliveredFormValue(program.courseDeliveredBy) ||
    PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS[0]?.value ||
    'ja'
  const participantFlags = participantFlagsFromProgram(program)

  return {
    mainTitle: program.mainTitle?.trim() ?? '',
    titleEn: program.titleEn?.trim() ?? '',
    announcementTitle: commonInfo.announcementTitle?.trim() || program.title?.trim() || '',
    detailedProgramId: resolveDetailedProgramId(program),
    startDate: toIso(program.startDate),
    endDate: toIso(program.endDate),
    businessArea: resolveBusinessAreaFormValue(program.businessArea),
    sponsorManagementIds,
    sponsorManagerContactId: resolveSponsorManagerContactId(program, sponsorManagementIds, context),
    venueKind: resolveVenueKind(program),
    venueDetail: commonInfo.venueDetail?.trim() || program.venue?.trim() || '',
    ...participantFlags,
    ...surveyFlagsFromProgram(program),
    educationProcess,
    ipOwned,
    courseDeliveredBy,
    partnerInvolvement: program.partnerInvolvement ? 'yes' : 'no',
    ...resolveKpiFromProgram(program),
    ...resolveWageFromProgram(program),
    ...typeSettings,
    curriculumSessions: (commonInfo.curriculumSessions ?? []).map(s => {
      const sessionIps = parseSessionIpsTypeSummary(s.ipsTypeSummary)
      const isPreEducation = isPreEducationCurriculumSession(s)
      return {
        sessionLabel: s.sessionLabel,
        title: s.title,
        description: s.description,
        assignmentEnabled: isPreEducation ? false : (s.assignmentEnabled ?? false),
        assignmentPeriod: isPreEducation ? '' : (s.assignmentPeriod ?? ''),
        educationForm: educationFormValueFromLabel(s.educationFormLabel),
        participationMethod: isPreEducation
          ? undefined
          : participationMethodValueFromLabel(s.participationMethodLabel),
        ipsCategory: isPreEducation ? 'prepare' : sessionIps.ipsCategory,
        ipsDetail: isPreEducation ? 'none' : sessionIps.ipsDetail,
        scheduleDate: isPreEducation ? (s.scheduleDateLabel ?? '') : '',
      }
    }),
    ...resolveScheduleDetailsFormState(commonInfo, typeSettings.sessionRound, {
      participantOrganization: participantFlags.participantOrganization,
    }),
    educationScheduleMode: shouldDisableEducationSchedulePeriodMode({
      participantOrganization: participantFlags.participantOrganization,
      sessionRound: typeSettings.sessionRound,
    })
      ? 'date'
      : (commonInfo.educationScheduleMode ?? 'date'),
    educationScheduleLines: [...(commonInfo.educationScheduleLines ?? [])],
  }
}

function participantTypesFromFlags(
  values: GeneralProgramCommonInfoEditFormValues
): GeneralProgramParticipantType[] {
  const types: GeneralProgramParticipantType[] = []
  if (values.participantIndividual) types.push('individual')
  if (values.participantOrganization) types.push('school_institution')
  if (values.participantTeacherInstructor) types.push('teacher_instructor')
  if (values.participantVolunteer) types.push('volunteer')
  return types
}

function surveyKeysFromFlags(
  values: GeneralProgramCommonInfoEditFormValues
): GeneralProgramSurveyMenuKey[] {
  const keys: GeneralProgramSurveyMenuKey[] = []
  if (values.surveySurvey) keys.push('survey')
  if (values.surveySatisfaction) keys.push('satisfaction')
  if (values.surveyLectureEvaluation) keys.push('lecture_evaluation')
  return keys
}

function institutionTypeFromVenueKind(
  venueKind: GeneralProgramCommonInfoEditFormValues['venueKind']
): InstitutionType | undefined {
  if (venueKind === 'inside') return 'inside_school'
  if (venueKind === 'outside') return 'outside_school'
  return undefined
}

function resolveDetailedProgramName(detailedProgramId: string | undefined): string | undefined {
  if (!detailedProgramId || detailedProgramId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE) {
    return undefined
  }
  return mockDetailedProgramManagementListRows.find(row => row.id === detailedProgramId)?.name
}

export function generalCommonInfoEditValuesToProgramPatch(
  values: GeneralProgramCommonInfoEditFormValues,
  existing: Program,
  context: GeneralProgramSponsorEditContext = EMPTY_SPONSOR_CONTEXT
): Partial<Program> {
  const sponsorRows = values.sponsorManagementIds
    .map(id => context.sponsors.find(row => row.id === id))
    .filter((row): row is SponsorManagementRow => row != null)
  const { manager } = resolveManagerFromFormValues(values, context)
  const participantTypes = participantTypesFromFlags(values)
  const primaryCategory =
    participantTypes.includes('individual') && !participantTypes.includes('school_institution')
      ? 'individual'
      : 'school'

  const isScheduleType = values.educationStructure === 'schedule'
  const relabeledScheduleDetails = isScheduleType
    ? relabelScheduleDetailFormRows(values.scheduleDetails)
    : undefined
  const detailedProgramName = isScheduleType
    ? resolveScheduleTypeDetailedProgramNameFromDetails(relabeledScheduleDetails)
    : resolveDetailedProgramName(values.detailedProgramId)
  const existingCommon = resolveGeneralProgramCommonInfo(existing)

  const managerLine = manager
    ? [manager.position ? `${manager.position} ${manager.name}` : manager.name, manager.phone]
        .filter(Boolean)
        .join(' | ')
    : existingCommon.sponsorManagerLine

  const ipsCategory = values.ipsCategory as ProgramRegistrationIpsCategory | ''
  const ipsCapitalized =
    ipsCategory === 'inspire'
      ? ('Inspire' as const)
      : ipsCategory === 'prepare'
        ? ('Prepare' as const)
        : ipsCategory === 'succeed'
          ? ('Succeed' as const)
          : existing.ips

  const programCategory =
    ipsCategory === 'succeed'
      ? (PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS.find(o => o.value === values.ipsDetail)
          ?.label ?? existing.programCategory)
      : existing.programCategory

  const programChannel =
    ipsCategory === 'inspire'
      ? (PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS.find(
          o => o.value === values.ipsDetail
        )?.label ?? existing.programChannel)
      : existing.programChannel

  const educationForm = values.educationForm ?? 'online'
  const programType =
    educationForm === 'online'
      ? ('online' as const)
      : educationForm === 'offline'
        ? ('offline' as const)
        : educationForm === 'hybrid'
          ? ('hybrid' as const)
          : existing.type

  const audienceKind =
    values.participantOrganization && !values.participantIndividual
      ? ('organization' as const)
      : values.participantIndividual && !values.participantOrganization
        ? ('individual' as const)
        : (existing.generalProgramAudience ?? 'organization')

  const isIndividualTarget = isGeneralIndividualParticipantSelection(
    values.participantIndividual,
    values.participantOrganization
  )
  const kpiFinalSchools = isIndividualTarget
    ? 0
    : (values.kpiFinalSchools ?? existingCommon.kpi?.finalSchools ?? 0)
  const kpiFinalClasses = isIndividualTarget
    ? 0
    : (values.kpiFinalClasses ?? existingCommon.kpi?.finalClasses ?? 0)

  const wageGradeRows = WAGE_GRADE_LABELS.map((grade, index) => {
    const amountKey = ['wageGrade1Amount', 'wageGrade2Amount', 'wageGrade3Amount'] as const
    return {
      grade,
      pricing: buildWageGradePricing(values[amountKey[index]]),
    }
  })

  return {
    mainTitle: values.mainTitle.trim(),
    titleEn: values.titleEn?.trim() || undefined,
    startDate: values.startDate,
    endDate: values.endDate,
    businessArea: businessAreaToProgramValue(values.businessArea),
    category: primaryCategory,
    generalParticipantTypes: participantTypes,
    generalSurveyMenuKeys: surveyKeysFromFlags(values),
    institutionType: institutionTypeFromVenueKind(values.venueKind),
    venue: values.venueKind === 'other' ? values.venueDetail?.trim() || undefined : undefined,
    textbookName: detailedProgramName ?? existing.textbookName,
    teamDivision: detailedProgramName ?? existing.teamDivision,
    educationProcess: educationProcessToProgramValue(values.educationProcess),
    ipOwned: ipOwnedToProgramValue(values.ipOwned),
    courseDeliveredBy: courseDeliveredToProgramValue(values.courseDeliveredBy),
    partnerInvolvement: values.partnerInvolvement === 'yes',
    type: programType,
    ips: ipsCapitalized,
    programCategory,
    programChannel,
    approvedStudentCount: values.kpiFinalParticipants ?? existing.approvedStudentCount,
    instructors: values.kpiInstructorCount ?? existing.instructors,
    instructorCapacity: values.kpiInstructorCount ?? existing.instructorCapacity,
    generalVolunteers: values.kpiVolunteerCount ?? existing.generalVolunteers,
    participatingSchoolCount: kpiFinalSchools,
    generalProgramAudience: audienceKind,
    generalProgramEducationStructure: values.educationStructure,
    generalProgramSessionRound: values.sessionRound,
    /** 후원사 관리 id = Program.sponsorId (목록/상세 API 탑레벨) */
    sponsorId: values.sponsorManagementIds[0] ?? existing.sponsorId,
    managerName: manager?.name ?? existing.managerName,
    contactPhone: manager?.phone ?? existing.contactPhone,
    generalCommonInfo: {
      ...existing.generalCommonInfo,
      announcementTitle: values.announcementTitle.trim(),
      detailedProgramName: detailedProgramName ?? existingCommon.detailedProgramName,
      sponsorDisplayName:
        sponsorRows.map(row => row.name).join(', ') || existingCommon.sponsorDisplayName,
      sponsorManagementId: values.sponsorManagementIds[0] ?? existingCommon.sponsorManagementId,
      sponsorManagementIds: values.sponsorManagementIds,
      sponsorManagerLine: managerLine,
      venueDetail: values.venueDetail?.trim() || existingCommon.venueDetail,
      educationFormLabel:
        values.educationFormScheduleDetail === 'common'
          ? educationFormLabelFromValue(educationForm)
          : undefined,
      educationFormScheduleDetail: values.educationFormScheduleDetail ?? 'common',
      participationScheduleDetail: values.participationScheduleDetail ?? 'common',
      participationMethod:
        values.participationScheduleDetail === 'perSchedule'
          ? undefined
          : (values.participationMethod ?? existingCommon.participationMethod ?? 'individual'),
      ipsScheduleDetail: values.ipsScheduleDetail,
      ipsTypeSummary: buildIpsTypeSummary(
        values.ipsScheduleDetail,
        ipsCategory,
        values.ipsDetail
      ),
      curriculumSessions: values.curriculumSessions.map(s => {
        const isPreEducation = isPreEducationCurriculumSession(s)
        if (isPreEducation) {
          return {
            sessionLabel: '사전 교육',
            title: s.title.trim() || '사전 교육',
            description: '',
            scheduleDateLabel: s.scheduleDate?.trim() || undefined,
            assignmentEnabled: false,
            assignmentPeriod: undefined,
            educationFormLabel:
              values.educationFormScheduleDetail === 'perSchedule' && s.educationForm
                ? educationFormLabelFromValue(s.educationForm)
                : undefined,
            ipsTypeSummary:
              values.ipsScheduleDetail === 'perSchedule'
                ? buildSessionIpsTypeSummary('prepare', 'none')
                : undefined,
          }
        }
        return {
          sessionLabel: s.sessionLabel,
          title: s.title,
          description: s.description,
          assignmentEnabled:
            values.participantOrganization || values.sessionRound === 'single'
              ? false
              : (s.assignmentEnabled ?? false),
          assignmentPeriod:
            values.participantOrganization || values.sessionRound === 'single'
              ? undefined
              : s.assignmentPeriod,
          educationFormLabel:
            values.educationFormScheduleDetail === 'perSchedule' && s.educationForm
              ? educationFormLabelFromValue(s.educationForm)
              : undefined,
          participationMethodLabel:
            values.participationScheduleDetail === 'perSchedule' && s.participationMethod
              ? participationMethodLabelFromValue(s.participationMethod)
              : undefined,
          ipsTypeSummary:
            values.ipsScheduleDetail === 'perSchedule' && s.ipsCategory
              ? buildSessionIpsTypeSummary(
                  s.ipsCategory as ProgramRegistrationIpsCategory,
                  s.ipsDetail
                )
              : values.ipsScheduleDetail === 'perSchedule'
                ? buildSessionIpsTypeSummary('prepare', 'none')
                : undefined,
        }
      }),
      scheduleCurriculumPreEducation: values.scheduleCurriculumPreEducation ?? false,
      scheduleDetails:
        values.educationStructure === 'schedule'
          ? (relabeledScheduleDetails ?? []).map(d => {
              const row = {
                scheduleLabel: d.scheduleLabel,
                name: d.name.trim(),
              }
              if (
                d.blockKind === 'preEducation' ||
                inferScheduleDetailBlockKind(d.scheduleLabel) === 'preEducation'
              ) {
                return {
                  ...row,
                  scheduleLabel: '사전 교육',
                  name: d.name.trim() || '사전 교육',
                  scheduleDateLabel: d.scheduleDate?.trim() || undefined,
                  assignmentEnabled: false,
                  assignmentPeriod: undefined,
                  educationFormLabel:
                    values.educationFormScheduleDetail === 'perSchedule' && d.educationForm
                      ? educationFormLabelFromValue(d.educationForm)
                      : undefined,
                  ipsTypeSummary:
                    values.ipsScheduleDetail === 'perSchedule'
                      ? buildSessionIpsTypeSummary('prepare', 'none')
                      : undefined,
                }
              }
              if (d.blockKind === 'event' || inferScheduleDetailBlockKind(d.scheduleLabel) === 'event') {
                return {
                  ...row,
                  scheduleDateLabel: d.scheduleDate?.trim() || undefined,
                  assignmentEnabled:
                    values.participantOrganization || values.sessionRound === 'single'
                      ? false
                      : d.assignmentEnabled,
                  assignmentPeriod:
                    values.participantOrganization || values.sessionRound === 'single'
                      ? undefined
                      : d.assignmentPeriod?.trim() || undefined,
                  educationFormLabel:
                    values.educationFormScheduleDetail === 'perSchedule' && d.educationForm
                      ? educationFormLabelFromValue(d.educationForm)
                      : undefined,
                  participationMethodLabel:
                    values.participationScheduleDetail === 'perSchedule' && d.participationMethod
                      ? participationMethodLabelFromValue(d.participationMethod)
                      : undefined,
                  ipsTypeSummary:
                    values.ipsScheduleDetail === 'perSchedule' && d.ipsCategory
                      ? buildSessionIpsTypeSummary(
                          d.ipsCategory as ProgramRegistrationIpsCategory,
                          d.ipsDetail
                        )
                      : undefined,
                }
              }
              return {
                ...row,
                progressTimeSummary: buildScheduleProgressTimeSummary(d.groupTimes),
                educationFormLabel:
                  values.educationFormScheduleDetail === 'perSchedule' && d.educationForm
                    ? educationFormLabelFromValue(d.educationForm)
                    : undefined,
                participationMethodLabel:
                  values.participationScheduleDetail === 'perSchedule' && d.participationMethod
                    ? participationMethodLabelFromValue(d.participationMethod)
                    : undefined,
                ipsTypeSummary:
                  values.ipsScheduleDetail === 'perSchedule' && d.ipsCategory
                    ? buildSessionIpsTypeSummary(
                        d.ipsCategory as ProgramRegistrationIpsCategory,
                        d.ipsDetail
                      )
                    : undefined,
              }
            })
          : existingCommon.scheduleDetails,
      educationScheduleMode: shouldDisableEducationSchedulePeriodMode({
        participantOrganization: values.participantOrganization,
        sessionRound: values.sessionRound,
      })
        ? 'date'
        : values.educationScheduleMode,
      educationScheduleLines: [...values.educationScheduleLines],
      wageGradeRows,
      paymentItems: paymentItemLabelsFromIds(values.wagePaymentItemIds) || existingCommon.paymentItems,
      deductionItems: resolveProgramWageDeductionLabel(values.wagePaymentItemIds),
      kpi: {
        finalParticipants: values.kpiFinalParticipants ?? existingCommon.kpi?.finalParticipants ?? 0,
        instructorCount: values.kpiInstructorCount ?? existingCommon.kpi?.instructorCount ?? 0,
        volunteerCount: values.kpiVolunteerCount ?? existingCommon.kpi?.volunteerCount ?? 0,
        finalSchools: kpiFinalSchools,
        finalClasses: kpiFinalClasses,
      },
    },
  }
}

export function getGeneralDetailedProgramSelectOptions() {
  return withDetailedProgramNoneOption(
    mockDetailedProgramManagementListRows.map(row => ({ value: row.id, label: row.name }))
  )
}

export const GENERAL_SURVEY_EDIT_FIELDS: {
  id: ProgramRegistrationSurveyItemId
  formKey: keyof Pick<
    GeneralProgramCommonInfoEditFormValues,
    'surveySurvey' | 'surveySatisfaction' | 'surveyLectureEvaluation'
  >
}[] = [
  { id: 'survey', formKey: 'surveySurvey' },
  { id: 'satisfaction', formKey: 'surveySatisfaction' },
  { id: 'lecture_evaluation', formKey: 'surveyLectureEvaluation' },
]

export type GeneralSurveyEditFieldConfig = (typeof GENERAL_SURVEY_EDIT_FIELDS)[number] & {
  label: string
}

export function getGeneralSurveyEditFieldsForAudience(
  _isIndividualTarget: boolean
): GeneralSurveyEditFieldConfig[] {
  return GENERAL_SURVEY_EDIT_FIELDS.map(field => ({
    ...field,
    label: PROGRAM_REGISTRATION_SURVEY_ITEM_LABELS[field.id],
  }))
}
