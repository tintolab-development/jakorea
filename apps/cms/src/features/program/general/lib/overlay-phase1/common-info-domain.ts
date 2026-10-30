/**
 * 공통정보 순수 도메인 계산.
 * overlay store / apply / resync / seed 함수를 호출하지 않는다.
 */
import dayjs from 'dayjs'
import { formatDateDotWithWeekday } from '@/shared/utils/date'
import type {
  GeneralProgramCurriculumSessionRow,
  GeneralProgramScheduleDetailKind,
  GeneralProgramScheduleDetailRow,
  GeneralProgramSurveyMenuKey,
  Program,
} from '@/types/domain'
import {
  generalParticipantTypesFromFlags,
  participantFlagsFromGeneralProgram,
  type GeneralParticipantRegistrationFlags,
} from '@/features/program/general/lib/participant-audience-selection'
import {
  isSponsorContactUnselected,
  resolveSponsorContactIdsFromProgram,
} from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import { TRAINED_TEACHERS_REGISTRATION_ALL_VALUE } from '@/features/template/ui/form-set/registration-form/trained-teachers/paragraphs/basic-info-defaults'
import {
  buildScheduleProgressTimeSummary,
  buildSessionIpsTypeSummary,
  normalizeSponsorManagerContactIds,
  parseScheduleProgressTimeSummary,
  participationMethodLabelFromValue,
} from '@/features/program/general/model/common-info-edit-schema'
import {
  coerceProgramPaymentItemsText,
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
  programPaymentItemLabelsFromIds,
  resolveProgramWageDeductionLabel,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { resolveScheduleTypeDetailedProgramNameFromDetails } from '@/features/program/general/lib/detail-common-info-display'
import { omitMirroredDetailedProgramMasterIdFromCommonInfo } from '@/features/program/general/lib/detailed-program-request-id'
import type { ProgramRegistrationIpsCategory } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import {
  PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS,
  PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS,
  PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import {
  DEFAULT_REGISTRATION_EDUCATION_FORM,
  DEFAULT_REGISTRATION_PARTICIPATION,
  getProgramRegistrationEducationFormOptions,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import {
  isPreEducationCurriculumSession,
  isPreEducationScheduleBlock,
  trimTrailingBlankRegularCurriculumSessions,
} from '@/features/program/general/lib/schedule-detail-form'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS,
  TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
  TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
  TEMPLATE_FORM_IP_OWNED_OPTIONS,
} from '@/features/template/lib/template-form-select-options'
import { normalizeProgramBusinessAreaValue } from '@/features/program/shared/lib/program-detail-info-constants'
import { curriculumSessionHasRoundLabel } from '@/features/program/general/lib/curriculum-display'
import { parseWageGradeAmount, resolveWagePaymentItemIds } from '@/features/program/general/lib/wage-display'
import { initialProgramRegistrationSurveyItems } from '@/features/template/lib/program-registration-survey-items'
import type { GeneralRegistrationEditorExtras } from '@/features/program/general/lib/registration-overlay-to-program'
import type {
  CommonInfoAssignmentValue,
  CommonInfoCurriculumMaps,
  CommonInfoFormValues,
  CommonInfoIpsValue,
  CommonInfoScheduleMaps,
  CommonInfoSurveyItems,
  IndependentNestedArrayIntent,
  OptionalField,
} from './common-info-form-values'
import { COMMON_INFO_PERSIST_KEYS as K } from './common-info-persist-keys'
import {
  nestedCurriculumSessionNos,
  resolveCurriculumSessionNos,
  resolveScheduleDetailNos,
} from './independent-session-authoring'

export const WAGE_GRADE_LABELS = ['1급 강사비', '2급 강사비', '3급 강사비'] as const

export function emptyCurriculumMaps(): CommonInfoCurriculumMaps {
  return {
    unitNameBySession: {},
    unitContentBySession: {},
    progressSessionByRound: {},
    roundContentByRound: {},
    educationFormBySession: {},
    participationBySession: {},
    ipsBySession: {},
    assignmentByRound: {},
    preEducationScheduleName: '',
    preEducationScheduleLine: '',
    teacherTrainingEducationForm: '',
  }
}

export function emptyScheduleMaps(): CommonInfoScheduleMaps {
  return {
    eventNameByDetail: {},
    scheduleDateByDetailIso: {},
    groupTimesByDetail: {},
    educationFormByDetail: {},
    participationByDetail: {},
    ipsByDetailIndex: {},
    assignmentByDetail: {},
    preEducationName: '',
  }
}

export function readOptionalText(field: OptionalField<string>): string {
  if (!field.present) return ''
  const raw = field.value
  if (typeof raw === 'string') return raw.trim()
  return ''
}

export function readOptionalNumber(field: OptionalField<number | null | undefined>): number | undefined {
  if (!field.present) return undefined
  const raw = field.persist
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw.replace(/,/g, ''))
    return Number.isFinite(n) ? n : undefined
  }
  if (typeof field.value === 'number' && Number.isFinite(field.value)) return field.value
  return undefined
}

export function programDatesFromOperationRange(
  seal: { start: string; end: string } | null | undefined
): { startDate: string; endDate: string } | null {
  if (seal == null) return null
  if (!seal.start?.trim() || !seal.end?.trim()) return null
  return {
    startDate: dayjs(seal.start).startOf('day').toISOString(),
    endDate: dayjs(seal.end).endOf('day').toISOString(),
  }
}

export function businessAreaToProgramValue(formValue: string): string {
  return normalizeProgramBusinessAreaValue(formValue)
}

export function educationProcessToProgramValue(formValue: string): string | undefined {
  if (!formValue) return undefined
  return (
    TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS.find(o => o.value === formValue)?.label ?? formValue
  )
}

export function ipOwnedToProgramValue(formValue: string): string | undefined {
  if (!formValue) return undefined
  const label =
    TEMPLATE_FORM_IP_OWNED_OPTIONS.find(o => o.value === formValue)?.label ?? formValue
  if (label === 'Jointly') return 'Jointly'
  if (label === 'Partner') return 'Partner'
  return 'JA'
}

export function courseDeliveredToProgramValue(
  formValue: string
): 'JA' | 'Jointly' | 'Partner' | undefined {
  if (!formValue) return undefined
  const label =
    TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS.find(o => o.value === formValue)?.label ?? formValue
  if (label === 'Jointly') return 'Jointly'
  if (label === 'Partner') return 'Partner'
  return 'JA'
}

export function educationFormLabelFromValue(value: string | undefined): string {
  const options = getProgramRegistrationEducationFormOptions(true)
  return options.find(o => o.value === value)?.label ?? value ?? '-'
}

export function buildWageGradePricing(amount: number | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return '1시간 당 | 기본 : -'
  return `1시간 당 | 기본 : ${amount.toLocaleString('ko-KR')}원`
}

function sessionValueFilled(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() !== ''
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return false
  const row = value as { enabled?: boolean; period?: string; category?: string }
  return row.enabled === true || Boolean(row.period?.trim()) || Boolean(row.category?.trim())
}

function maxFilledSessionIndex(records: Array<Record<number, unknown>>): number {
  let max = 0
  for (const record of records) {
    for (const [key, value] of Object.entries(record)) {
      const index = Number(key)
      if (!Number.isFinite(index) || index <= 0 || !sessionValueFilled(value)) continue
      if (index > max) max = index
    }
  }
  return max
}

export function formatScheduleDateLabel(iso: string | null | undefined): string | undefined {
  if (!iso?.trim()) return undefined
  const d = dayjs(iso)
  if (!d.isValid()) return iso.trim()
  const label = formatDateDotWithWeekday(d)
  return label === '-' ? iso.trim() : label
}

export function buildIpsTypeSummaryFull(
  ipsScheduleDetail: GeneralProgramScheduleDetailKind,
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
  }
  return `${scheduleLabel} | ${categoryLabel} | ${detailLabel}`
}

export function surveyKeysFromItems(items: CommonInfoSurveyItems | undefined): GeneralProgramSurveyMenuKey[] {
  if (items == null) return []
  const keys: GeneralProgramSurveyMenuKey[] = []
  if (items.survey === true) keys.push('survey')
  if (items.satisfaction === true) keys.push('satisfaction')
  if (items.lecture_evaluation === true) keys.push('lecture_evaluation')
  return keys
}

export function resolveCommonEducationForm(values: CommonInfoFormValues): string {
  return (
    readOptionalText(values.multiCommonEducationForm) ||
    readOptionalText(values.singleEducationForm) ||
    DEFAULT_REGISTRATION_EDUCATION_FORM
  )
}

export function resolveCommonParticipation(values: CommonInfoFormValues): string {
  return (
    readOptionalText(values.multiCommonParticipation) ||
    readOptionalText(values.singleParticipation) ||
    DEFAULT_REGISTRATION_PARTICIPATION
  )
}

export function participantFlagsFromCompleteExtras(
  extras: GeneralRegistrationEditorExtras
): GeneralParticipantRegistrationFlags | null {
  if (
    extras.participantIndividual == null ||
    extras.participantOrganization == null ||
    extras.participantTeacherInstructor == null ||
    extras.participantVolunteer == null
  ) {
    return null
  }
  return {
    individual: extras.participantIndividual,
    organization: extras.participantOrganization,
    teacherInstructor: extras.participantTeacherInstructor,
    volunteer: extras.participantVolunteer,
  }
}

export function audienceFromParticipantFlags(
  flags: GeneralParticipantRegistrationFlags
): Program['generalProgramAudience'] {
  if (flags.individual && !flags.organization) return 'individual'
  if (flags.organization && !flags.individual) return 'organization'
  return undefined
}

export function buildCurriculumSessionsFromMaps(
  maps: CommonInfoCurriculumMaps,
  extras: GeneralRegistrationEditorExtras,
  options?: {
    baseline?: Program
    authoring?: IndependentNestedArrayIntent<GeneralProgramCurriculumSessionRow>
    explicitSessionNos?: number[]
  }
): GeneralProgramCurriculumSessionRow[] {
  const isMulti = extras.sessionRoundType === 'multi'
  const eduDetail = extras.educationFormScheduleDetail ?? 'common'
  const partDetail = extras.participationScheduleDetail ?? 'common'
  const ipsDetail = extras.ipsScheduleDetail ?? 'common'
  const hideAssignment = extras.participantOrganization === true || !isMulti
  const hideParticipation = extras.participantOrganization === true
  const sessions: GeneralProgramCurriculumSessionRow[] = []

  if (extras.scheduleCurriculumPreEducation) {
    const isTeacherTraining = extras.teacherTrainingEnabled === true
    const preName =
      maps.preEducationScheduleName.trim() || (isTeacherTraining ? '교육 연수' : '사전 교육')
    const preLine = maps.preEducationScheduleLine.trim()
    const teacherTrainingForm = maps.teacherTrainingEducationForm.trim()
    sessions.push({
      sessionLabel: isTeacherTraining ? '교육 연수' : '사전 교육',
      title: preName,
      description: '',
      ...(isTeacherTraining ? {} : { isPreEducation: true }),
      scheduleDateLabel: preLine || undefined,
      assignmentEnabled: false,
      educationFormLabel: isTeacherTraining
        ? educationFormLabelFromValue(teacherTrainingForm || 'online')
        : /** 사전 교육 교육형태 — common/perSchedule 무관 (상세 수정 폼과 동일 규칙) */
          educationFormLabelFromValue(maps.educationFormBySession[0] ?? 'online'),
      ipsTypeSummary:
        isTeacherTraining || ipsDetail === 'perSchedule'
          ? buildSessionIpsTypeSummary('prepare', 'none')
          : undefined,
    })
  }

  const unitMax = maxFilledSessionIndex([maps.unitNameBySession, maps.unitContentBySession])
  const roundMax = maxFilledSessionIndex([maps.progressSessionByRound, maps.roundContentByRound])
  const preferUnitMaps = !isMulti || unitMax > roundMax
  const baseline = options?.baseline ?? ({ generalCommonInfo: {} } as Program)
  const sessionNos = resolveCurriculumSessionNos({
    maps,
    extras,
    baseline,
    explicitSessionNos: options?.explicitSessionNos,
    intent: options?.authoring,
  })
  const baselineByNo = new Map<number, GeneralProgramCurriculumSessionRow>()
  const baselineRegular = (baseline.generalCommonInfo?.curriculumSessions ?? []).filter(
    session => !isPreEducationCurriculumSession(session)
  )
  const baselineNos = nestedCurriculumSessionNos(baseline.generalCommonInfo?.curriculumSessions)
  baselineRegular.forEach((row, index) => {
    const no = baselineNos[index]
    if (no != null) baselineByNo.set(no, row)
  })

  for (const sessionNo of sessionNos) {
    const unitName = maps.unitNameBySession[sessionNo]?.trim() ?? ''
    const unitContent = maps.unitContentBySession[sessionNo]?.trim() ?? ''
    const progress = maps.progressSessionByRound[sessionNo]?.trim() ?? ''
    const roundContent = maps.roundContentByRound[sessionNo]?.trim() ?? ''
    const baselineRow = baselineByNo.get(sessionNo)
    const useUnit = preferUnitMaps && Boolean(unitName || unitContent || baselineRow?.title)
    const title = useUnit
      ? unitName || baselineRow?.title || (progress ? `${progress}차시` : `${sessionNo}차시`)
      : progress
        ? `${progress}차시`
        : unitName || baselineRow?.title || `${sessionNo}차시`
    const description = useUnit
      ? unitContent || roundContent || baselineRow?.description || ''
      : roundContent || unitContent || baselineRow?.description || ''
    const assignment = maps.assignmentByRound[sessionNo]
    const ips = maps.ipsBySession[sessionNo]
    sessions.push({
      sessionNo,
      sessionLabel: isMulti ? `${sessionNo}회차` : `${sessionNo}차시`,
      title,
      description,
      assignmentEnabled: hideAssignment ? false : Boolean(assignment?.enabled),
      assignmentPeriod: hideAssignment ? undefined : assignment?.period?.trim() || undefined,
      educationFormLabel:
        eduDetail === 'perSchedule'
          ? educationFormLabelFromValue(maps.educationFormBySession[sessionNo] ?? 'online')
          : undefined,
      participationMethodLabel:
        !hideParticipation && partDetail === 'perSchedule'
          ? participationMethodLabelFromValue(
              (maps.participationBySession[sessionNo] as 'individual' | 'team' | undefined) ??
                'individual'
            )
          : undefined,
      ipsTypeSummary:
        ipsDetail === 'perSchedule'
          ? buildSessionIpsTypeSummary(
              (ips?.category as ProgramRegistrationIpsCategory | '') ?? 'prepare',
              ips?.detail ?? 'none'
            )
          : undefined,
    })
  }
  return sessionNos.length === 0 && !extras.scheduleCurriculumPreEducation
    ? []
    : trimTrailingBlankRegularCurriculumSessions(sessions)
}

export function buildScheduleDetailsFromMaps(
  maps: CommonInfoScheduleMaps,
  extras: GeneralRegistrationEditorExtras,
  options?: {
    baseline?: Program
    authoring?: IndependentNestedArrayIntent<GeneralProgramScheduleDetailRow>
  }
): GeneralProgramScheduleDetailRow[] {
  const detailNos = resolveScheduleDetailNos({
    maps,
    extras,
    baseline: options?.baseline ?? ({ generalCommonInfo: {} } as Program),
    intent: options?.authoring,
  })
  const base: GeneralProgramScheduleDetailRow[] = detailNos.map(n => {
    const nameRaw = maps.eventNameByDetail[n]
    const name = typeof nameRaw === 'string' ? nameRaw.trim() : ''
    return {
      scheduleLabel: `세부 일정 ${String(n).padStart(2, '0')}`,
      name,
    }
  })

  const eduDetail = extras.educationFormScheduleDetail ?? 'common'
  const partDetail = extras.participationScheduleDetail ?? 'common'
  const ipsDetailKind = extras.ipsScheduleDetail ?? 'common'
  const hideAssignment =
    extras.participantOrganization === true || extras.sessionRoundType === 'single'
  const hideParticipation = extras.participantOrganization === true

  const rows: GeneralProgramScheduleDetailRow[] = base.map((row, index) => {
    const n = detailNos[index] ?? index + 1
    const slots = (maps.groupTimesByDetail[n] ?? []).filter(
      (s): s is { startTime?: string; endTime?: string } => s != null
    )
    const assignment = maps.assignmentByDetail[n]
    const ips = maps.ipsByDetailIndex[n]
    return {
      ...row,
      scheduleDateLabel: formatScheduleDateLabel(maps.scheduleDateByDetailIso[n]),
      progressTimeSummary: slots.length > 0 ? buildScheduleProgressTimeSummary(slots) : undefined,
      assignmentEnabled: hideAssignment ? false : Boolean(assignment?.enabled),
      assignmentPeriod: hideAssignment ? undefined : assignment?.period?.trim() || undefined,
      educationFormLabel:
        eduDetail === 'perSchedule'
          ? educationFormLabelFromValue(maps.educationFormByDetail[n] ?? 'online')
          : undefined,
      participationMethodLabel:
        !hideParticipation && partDetail === 'perSchedule'
          ? participationMethodLabelFromValue(
              (maps.participationByDetail[n] as 'individual' | 'team' | undefined) ?? 'individual'
            )
          : undefined,
      ipsTypeSummary:
        ipsDetailKind === 'perSchedule'
          ? buildSessionIpsTypeSummary(
              (ips?.category as ProgramRegistrationIpsCategory | '') ?? 'prepare',
              ips?.detail ?? 'none'
            )
          : undefined,
    }
  })

  if (extras.scheduleCurriculumPreEducation) {
    const isTeacherTraining = extras.teacherTrainingEnabled === true
    const preName = maps.preEducationName.trim() || (isTeacherTraining ? '교육 연수' : '사전 교육')
    const preEducationForm = maps.educationFormByDetail[0]
    rows.unshift({
      scheduleLabel: isTeacherTraining ? '교육 연수' : '사전 교육',
      name: preName,
      ...(isTeacherTraining ? {} : { blockKind: 'preEducation' as const }),
      assignmentEnabled: false,
      scheduleDateLabel: formatScheduleDateLabel(maps.scheduleDateByDetailIso[0]),
      /** 사전 교육 교육형태 — common/perSchedule 무관 (커리큘럼형과 동일 규칙) */
      educationFormLabel: educationFormLabelFromValue(preEducationForm || 'online'),
      ipsTypeSummary:
        isTeacherTraining || ipsDetailKind === 'perSchedule'
          ? buildSessionIpsTypeSummary('prepare', 'none')
          : undefined,
    })
  }

  return rows
}

export function lockDetailedProgramToSchedule(extras: GeneralRegistrationEditorExtras): boolean {
  return extras.programType === 'schedule' && !extras.isTrainedTeachers
}

function countRegularCurriculumSessions(
  sessions: GeneralProgramCurriculumSessionRow[] | undefined
): number {
  return (sessions ?? []).filter(session => !isPreEducationCurriculumSession(session)).length
}

function countRegularScheduleDetails(
  details: GeneralProgramScheduleDetailRow[] | undefined
): number {
  return (details ?? []).filter(detail => !isPreEducationScheduleBlock(detail)).length
}

function countScheduleCurriculumGroups(
  details: GeneralProgramScheduleDetailRow[] | undefined
): number {
  const first = (details ?? []).find(detail => !isPreEducationScheduleBlock(detail))
  const parts = first?.progressTimeSummary
    ?.split(/\s*\|\s*/)
    .map(part => part.trim())
    .filter(Boolean)
  return Math.max(1, parts?.length ?? 1)
}

export function deriveIndependentEditorExtrasFromProgram(
  program: Program
): GeneralRegistrationEditorExtras {
  const common = program.generalCommonInfo
  const participant = participantFlagsFromGeneralProgram(program)
  const structure = program.generalProgramEducationStructure === 'schedule' ? 'schedule' : 'curriculum'
  const sessionRound = program.generalProgramSessionRound === 'multi' ? 'multi' : 'single'
  const regularSessionCount = countRegularCurriculumSessions(
    trimTrailingBlankRegularCurriculumSessions(common?.curriculumSessions ?? [])
  )
  const labeledRoundCount = (common?.curriculumSessions ?? []).filter(
    session =>
      !session.sessionLabel.includes('사전') &&
      !session.sessionLabel.includes('연수') &&
      curriculumSessionHasRoundLabel(session)
  ).length
  const curriculumSessionCount =
    sessionRound === 'multi'
      ? labeledRoundCount > 0
        ? labeledRoundCount
        : regularSessionCount
      : regularSessionCount
  return {
    programType: structure,
    sessionRoundType: sessionRound,
    educationScheduleMode: common?.educationScheduleMode === 'period' ? 'period' : 'date',
    educationFormScheduleDetail: common?.educationFormScheduleDetail ?? 'common',
    participationScheduleDetail: common?.participationScheduleDetail ?? 'common',
    ipsScheduleDetail: common?.ipsScheduleDetail ?? 'common',
    curriculumSessionCount,
    curriculumChartSessionCount: regularSessionCount,
    scheduleCurriculumDetailCount: countRegularScheduleDetails(common?.scheduleDetails),
    scheduleCurriculumGroupCount: countScheduleCurriculumGroups(common?.scheduleDetails),
    scheduleCurriculumPreEducation: common?.scheduleCurriculumPreEducation === true,
    participantOrganization: participant.organization,
    participantIndividual: participant.individual,
    participantTeacherInstructor: participant.teacherInstructor,
    participantVolunteer: participant.volunteer,
  }
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

function educationFormValueFromLabel(label: string | undefined): string | undefined {
  const text = label?.trim() ?? ''
  if (!text) return undefined
  if (text.includes('참여자')) return 'participant_selection'
  if (text.includes('온/오프') || text.includes('하이브리드')) return 'hybrid'
  if (text.includes('오프라인')) return 'offline'
  if (text.includes('온라인')) return 'online'
  return undefined
}

function participationValueFromLabel(label: string | undefined): 'individual' | 'team' {
  return label?.trim() === '팀' ? 'team' : 'individual'
}

function ipsValueFromSummary(summary: string | undefined): { category: string; detail: string } {
  const text = summary?.trim() ?? ''
  const parts = text.split(/\s*\|\s*/)
  const categoryText = parts.find(part => /inspire|prepare|succeed/i.test(part)) ?? ''
  const detailText = parts[parts.length - 1]?.trim() ?? ''
  const category = /inspire/i.test(categoryText)
    ? 'inspire'
    : /succeed/i.test(categoryText)
      ? 'succeed'
      : /prepare/i.test(categoryText)
        ? 'prepare'
        : ''
  return {
    category,
    detail: category === 'prepare' || detailText.includes('해당') ? 'none' : detailText,
  }
}

function surveyItemsFromProgram(program: Program): Record<string, boolean> {
  const keys = new Set<string>(program.generalSurveyMenuKeys ?? [])
  const base = initialProgramRegistrationSurveyItems(false)
  const satisfactionEnabled =
    keys.has('satisfaction') ||
    keys.has('student_satisfaction') ||
    keys.has('teacher_satisfaction')
  return {
    ...base,
    survey: keys.has('survey'),
    satisfaction: satisfactionEnabled,
    lecture_evaluation: keys.has('lecture_evaluation'),
  }
}

function curriculumOverlayFromProgram(program: Program): Record<string, unknown> {
  const rows = trimTrailingBlankRegularCurriculumSessions(
    program.generalCommonInfo?.curriculumSessions ?? []
  )
  if (rows.length === 0) return {}
  const unitNameBySession: Record<number, string> = {}
  const unitContentBySession: Record<number, string> = {}
  const progressSessionByRound: Record<number, string> = {}
  const roundContentByRound: Record<number, string> = {}
  const educationFormBySession: Record<number, string> = {}
  const participationBySession: Record<number, string> = {}
  const ipsBySession: Record<number, { category: string; detail: string }> = {}
  const assignmentByRound: Record<number, { enabled: boolean; period: string }> = {}
  let preEducationScheduleName = ''
  let preEducationScheduleLine: string | null = null
  let dataIndex = 0

  rows.forEach(row => {
    const isPre = row.sessionLabel.includes('사전') || row.sessionLabel.includes('연수')
    const index = isPre
      ? 0
      : typeof row.sessionNo === 'number' && row.sessionNo > 0
        ? row.sessionNo
        : dataIndex + 1
    if (!isPre) dataIndex += 1
    if (isPre) {
      preEducationScheduleName = row.title
      preEducationScheduleLine = row.scheduleDateLabel ?? null
    } else {
      const title = row.title?.trim() ?? ''
      const description = row.description?.trim() ?? ''
      unitNameBySession[index] = title
      unitContentBySession[index] = description
      progressSessionByRound[index] = title.replace(/\s*차시\s*$/, '').trim() || String(index)
      roundContentByRound[index] = description
      assignmentByRound[index] = {
        enabled: row.assignmentEnabled === true,
        period: row.assignmentPeriod ?? '',
      }
    }
    const educationForm = educationFormValueFromLabel(row.educationFormLabel)
    if (educationForm) educationFormBySession[index] = educationForm
    if (!isPre && row.participationMethodLabel) {
      participationBySession[index] = participationValueFromLabel(row.participationMethodLabel)
    }
    if (row.ipsTypeSummary) {
      ipsBySession[index] = ipsValueFromSummary(row.ipsTypeSummary)
    }
  })

  return {
    [K.unitNameBySession]: unitNameBySession,
    [K.unitContentBySession]: unitContentBySession,
    [K.progressSessionByRound]: progressSessionByRound,
    [K.roundContentByRound]: roundContentByRound,
    [K.educationFormBySession]: educationFormBySession,
    [K.participationBySession]: participationBySession,
    [K.ipsBySession]: ipsBySession,
    [K.assignmentByRound]: assignmentByRound,
    [K.preEducationScheduleName]: preEducationScheduleName,
    [K.preEducationScheduleLine]: preEducationScheduleLine,
  }
}

function scheduleOverlayFromProgram(program: Program): Record<string, unknown> {
  const rows = program.generalCommonInfo?.scheduleDetails ?? []
  if (rows.length === 0) return {}
  const eventNameByDetail: Record<number, string> = {}
  const scheduleDateByDetailIso: Record<number, string | null> = {}
  const groupTimesByDetail: Record<number, Array<{ startTime?: string; endTime?: string }>> = {}
  const educationFormByDetail: Record<number, string> = {}
  const participationByDetail: Record<number, string> = {}
  const ipsByDetailIndex: Record<number, { category: string; detail: string }> = {}
  const assignmentByDetail: Record<number, { enabled: boolean; period: string }> = {}
  let dataIndex = 0

  rows.forEach(row => {
    const isPre = row.scheduleLabel.includes('사전') || row.scheduleLabel.includes('연수')
    const index = isPre ? 0 : dataIndex + 1
    if (!isPre) dataIndex += 1
    eventNameByDetail[index] = row.name
    scheduleDateByDetailIso[index] = row.scheduleDateLabel ?? null
    if (row.progressTimeSummary) {
      groupTimesByDetail[index] = parseScheduleProgressTimeSummary(row.progressTimeSummary)
    }
    const educationForm = educationFormValueFromLabel(row.educationFormLabel)
    if (educationForm) educationFormByDetail[index] = educationForm
    if (!isPre && row.participationMethodLabel) {
      participationByDetail[index] = participationValueFromLabel(row.participationMethodLabel)
    }
    if (row.ipsTypeSummary) ipsByDetailIndex[index] = ipsValueFromSummary(row.ipsTypeSummary)
    if (!isPre) {
      assignmentByDetail[index] = {
        enabled: row.assignmentEnabled === true,
        period: row.assignmentPeriod ?? '',
      }
    }
  })

  return {
    [K.eventNameByDetail]: eventNameByDetail,
    [K.scheduleDateByDetailIso]: scheduleDateByDetailIso,
    [K.groupTimesByDetail]: groupTimesByDetail,
    [K.educationFormByDetail]: educationFormByDetail,
    [K.participationByDetail]: participationByDetail,
    [K.ipsByDetailIndex]: ipsByDetailIndex,
    [K.assignmentByDetail]: assignmentByDetail,
  }
}

function emptyCurriculumProgressOverlay(): Record<string, unknown> {
  return {
    [K.unitNameBySession]: {},
    [K.unitContentBySession]: {},
    [K.progressSessionByRound]: {},
    [K.roundContentByRound]: {},
    [K.educationFormBySession]: {},
    [K.participationBySession]: {},
    [K.ipsBySession]: {},
    [K.assignmentByRound]: {},
    [K.preEducationScheduleName]: '',
    [K.preEducationScheduleLine]: null,
  }
}

function emptyScheduleProgressOverlay(): Record<string, unknown> {
  return {
    [K.eventNameByDetail]: {},
    [K.scheduleDateByDetailIso]: {},
    [K.groupTimesByDetail]: {},
    [K.educationFormByDetail]: {},
    [K.participationByDetail]: {},
    [K.ipsByDetailIndex]: {},
    [K.assignmentByDetail]: {},
  }
}

function wageOverlayFromNested(program: Program, values: CommonInfoFormValues): Record<string, unknown> {
  const common = program.generalCommonInfo
  const fromNestedIds = resolveWagePaymentItemIds(common?.paymentItems)
  const formIds = values.paymentItemValues.present ? values.paymentItemValues.value : undefined
  const paymentItemValues =
    fromNestedIds.length > 0
      ? fromNestedIds
      : Array.isArray(formIds) && formIds.length > 0
        ? formIds.map(String)
        : resolveWagePaymentItemIds(readOptionalText(values.paymentItemLabels))
  const paymentItemLabels =
    coerceProgramPaymentItemsText(common?.paymentItems).trim() ||
    readOptionalText(values.paymentItemLabels) ||
    programPaymentItemLabelsFromIds(paymentItemValues) ||
    ''

  const feeFromRow = (label: string, field: OptionalField<number | undefined>) => {
    const fromRow = parseWageGradeAmount(
      (common?.wageGradeRows ?? []).find(row => row.grade === label)?.pricing
    )
    if (fromRow != null) return fromRow
    return readOptionalNumber(field) ?? null
  }

  return {
    [K.wageGrade1Fee]: feeFromRow('1급 강사비', values.wageGrade1Fee),
    [K.wageGrade2Fee]: feeFromRow('2급 강사비', values.wageGrade2Fee),
    [K.wageGrade3Fee]: feeFromRow('3급 강사비', values.wageGrade3Fee),
    [K.paymentItemValues]: paymentItemValues,
    [K.paymentItemLabels]: paymentItemLabels,
  }
}

/**
 * Program nested → persist overlay. seed/resync fromNested와 동일 의미.
 * overlay store·기존 seed/resync 변환 함수를 호출하지 않는다.
 */
export function serializeIndependentCommonInfoOverlayFromProgram(
  program: Program,
  extras: GeneralRegistrationEditorExtras,
  values: CommonInfoFormValues
): Record<string, unknown> {
  const common = program.generalCommonInfo
  const kpi = common?.kpi
  const sponsorIds =
    common?.sponsorManagementIds?.length
      ? common.sponsorManagementIds
      : program.sponsorId
        ? [program.sponsorId]
        : []
  const contactIds = resolveSponsorContactIdsFromProgram(program)
  const commonIps = ipsValueFromSummary(common?.ipsTypeSummary)
  const detailedId =
    extras.programType === 'schedule'
      ? TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
      : program.detailedProgramId?.trim() || ''

  const publicTitle = (() => {
    const fromCommon = common?.announcementTitle?.trim() || ''
    if (fromCommon) return fromCommon
    if (common?.announcementTitle != null) return ''
    return readOptionalText(values.publicProgramTitle)
  })()

  return {
    [K.programTitleKo]: program.mainTitle?.trim() || program.title?.trim() || '',
    [K.programTitleEn]: program.titleEn?.trim() || '',
    [K.publicProgramTitle]: publicTitle,
    [K.detailedProgramId]: detailedId,
    [K.detailedProgramName]:
      extras.programType === 'schedule'
        ? '해당없음'
        : common?.detailedProgramName?.trim() || '',
    [K.businessField]: reverseBusinessField(program.businessArea),
    [K.partnerInvolvement]: program.partnerInvolvement === false ? 'no' : 'yes',
    [K.educationVenueKind]: common?.venueKind ?? 'inside',
    [K.educationVenueDetail]: common?.venueDetail ?? '',
    [K.educationCourse]: reverseEducationCourse(program.educationProcess),
    [K.ipOwned]: reverseIpOwned(program.ipOwned),
    [K.courseDeliveredBy]: reverseIpOwned(program.courseDeliveredBy),
    [K.operationRangeSeal]:
      program.startDate && program.endDate
        ? { start: String(program.startDate), end: String(program.endDate) }
        : null,
    [K.surveyItems]: surveyItemsFromProgram(program),
    [K.sponsorId]: sponsorIds[0] ?? '',
    [K.sponsorIds]: sponsorIds,
    [K.managerContactId]: contactIds[0] ?? '',
    [K.managerContactIds]: contactIds,
    [K.sponsorManagerLine]: common?.sponsorManagerLine ?? program.managerName ?? '',
    [K.kpiParticipantCount]: kpi?.finalParticipants ?? null,
    [K.kpiInstructor]: kpi?.instructorCount ?? null,
    [K.kpiVolunteer]: kpi?.volunteerCount ?? null,
    [K.kpiDispatchedSchool]: null,
    [K.kpiDispatchedClass]: null,
    ...wageOverlayFromNested(program, values),
    [K.singleEducationForm]: educationFormValueFromLabel(common?.educationFormLabel) ?? 'online',
    [K.multiCommonEducationForm]:
      educationFormValueFromLabel(common?.educationFormLabel) ?? 'online',
    [K.singleParticipation]: common?.participationMethod ?? 'individual',
    [K.multiCommonParticipation]: common?.participationMethod ?? 'individual',
    [K.ipsType]: {
      category: commonIps.category || reverseIpsCategory(program.ips),
      detail: commonIps.detail,
    },
    [K.scheduleLines]: [...(common?.educationScheduleLines ?? [])],
    ...emptyCurriculumProgressOverlay(),
    ...emptyScheduleProgressOverlay(),
    ...curriculumOverlayFromProgram(program),
    ...scheduleOverlayFromProgram(program),
  }
}

export function orderOverlayKeys(
  record: Record<string, unknown>,
  keyOrder: readonly string[] | undefined
): Record<string, unknown> {
  if (keyOrder == null || keyOrder.length === 0) return record
  const out: Record<string, unknown> = {}
  for (const key of keyOrder) {
    if (Object.prototype.hasOwnProperty.call(record, key)) out[key] = record[key]
  }
  for (const [key, value] of Object.entries(record)) {
    if (!Object.prototype.hasOwnProperty.call(out, key)) out[key] = value
  }
  return out
}

export function serializeCreatePersistOverlay(
  values: CommonInfoFormValues,
  unownedOverlay: Record<string, unknown> | undefined,
  keyOrder?: readonly string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(unownedOverlay ?? {}) }
  const write = (key: string, field: OptionalField<unknown>) => {
    if (!field.present) return
    out[key] = field.persist
  }
  write(K.programTitleKo, values.programTitleKo)
  write(K.programTitleEn, values.programTitleEn)
  write(K.publicProgramTitle, values.publicProgramTitle)
  write(K.detailedProgramId, values.detailedProgramId)
  write(K.detailedProgramName, values.detailedProgramName)
  write(K.businessField, values.businessField)
  write(K.partnerInvolvement, values.partnerInvolvement)
  write(K.educationVenueKind, values.educationVenueKind)
  write(K.educationVenueDetail, values.educationVenueDetail)
  write(K.educationCourse, values.educationCourse)
  write(K.ipOwned, values.ipOwned)
  write(K.courseDeliveredBy, values.courseDeliveredBy)
  write(K.operationRangeSeal, values.operationRangeSeal)
  write(K.surveyItems, values.surveyItems)
  write(K.sponsorId, values.sponsorId)
  write(K.sponsorIds, values.sponsorIds)
  write(K.managerContactId, values.managerContactId)
  write(K.managerContactIds, values.managerContactIds)
  write(K.sponsorManagerLine, values.sponsorManagerLine)
  write(K.kpiParticipantCount, values.kpiParticipantCount)
  write(K.kpiInstructor, values.kpiInstructor)
  write(K.kpiVolunteer, values.kpiVolunteer)
  write(K.kpiDispatchedSchool, values.kpiDispatchedSchool)
  write(K.kpiDispatchedClass, values.kpiDispatchedClass)
  write(K.wageGrade1Fee, values.wageGrade1Fee)
  write(K.wageGrade2Fee, values.wageGrade2Fee)
  write(K.wageGrade3Fee, values.wageGrade3Fee)
  write(K.paymentItemValues, values.paymentItemValues)
  write(K.paymentItemLabels, values.paymentItemLabels)
  write(K.singleEducationForm, values.singleEducationForm)
  write(K.multiCommonEducationForm, values.multiCommonEducationForm)
  write(K.legacyEducationForm, values.legacyEducationForm)
  write(K.singleParticipation, values.singleParticipation)
  write(K.multiCommonParticipation, values.multiCommonParticipation)
  write(K.ipsType, values.ipsType)
  write(K.scheduleLines, values.scheduleLines)
  Object.assign(out, serializeCurriculumMaps(values.curriculum))
  Object.assign(out, serializeScheduleMaps(values.schedule))
  return orderOverlayKeys(out, keyOrder)
}

function serializeCurriculumMaps(maps: CommonInfoCurriculumMaps): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const maybe = (key: string, value: unknown, empty: unknown) => {
    if (value == null) return
    if (typeof value === 'string' && value === '' && empty === '') return
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0) {
      return
    }
    out[key] = value
  }
  maybe(K.unitNameBySession, maps.unitNameBySession, {})
  maybe(K.unitContentBySession, maps.unitContentBySession, {})
  maybe(K.progressSessionByRound, maps.progressSessionByRound, {})
  maybe(K.roundContentByRound, maps.roundContentByRound, {})
  maybe(K.educationFormBySession, maps.educationFormBySession, {})
  maybe(K.participationBySession, maps.participationBySession, {})
  maybe(K.ipsBySession, maps.ipsBySession, {})
  maybe(K.assignmentByRound, maps.assignmentByRound, {})
  maybe(K.preEducationScheduleName, maps.preEducationScheduleName, '')
  maybe(K.preEducationScheduleLine, maps.preEducationScheduleLine, '')
  maybe(K.teacherTrainingEducationForm, maps.teacherTrainingEducationForm, '')
  return out
}

function serializeScheduleMaps(maps: CommonInfoScheduleMaps): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const maybe = (key: string, value: unknown) => {
    if (value == null) return
    if (typeof value === 'string' && value === '') return
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0) {
      return
    }
    out[key] = value
  }
  maybe(K.eventNameByDetail, maps.eventNameByDetail)
  maybe(K.scheduleDateByDetailIso, maps.scheduleDateByDetailIso)
  maybe(K.groupTimesByDetail, maps.groupTimesByDetail)
  maybe(K.educationFormByDetail, maps.educationFormByDetail)
  maybe(K.participationByDetail, maps.participationByDetail)
  maybe(K.ipsByDetailIndex, maps.ipsByDetailIndex)
  maybe(K.assignmentByDetail, maps.assignmentByDetail)
  maybe(K.preEducationName, maps.preEducationName)
  return out
}

export function mergeResyncPersistOverlay(
  fromNested: Record<string, unknown>,
  editOverlay: Record<string, unknown>,
  values: CommonInfoFormValues,
  keyOrder?: readonly string[]
): Record<string, unknown> {
  const merged = { ...orderOverlayKeys(editOverlay, keyOrder), ...fromNested }
  const restoreNull = (key: string, field: OptionalField<number | null>) => {
    if (field.present && field.persist == null) merged[key] = field.persist
  }
  restoreNull(K.kpiParticipantCount, values.kpiParticipantCount)
  restoreNull(K.kpiInstructor, values.kpiInstructor)
  restoreNull(K.kpiVolunteer, values.kpiVolunteer)
  return merged
}

export {
  generalParticipantTypesFromFlags,
  isSponsorContactUnselected,
  normalizeSponsorManagerContactIds,
  omitMirroredDetailedProgramMasterIdFromCommonInfo,
  programPaymentItemLabelsFromIds,
  resolveProgramWageDeductionLabel,
  resolveScheduleTypeDetailedProgramNameFromDetails,
  TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
  TRAINED_TEACHERS_REGISTRATION_ALL_VALUE,
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
}

export type { CommonInfoAssignmentValue, CommonInfoIpsValue }
