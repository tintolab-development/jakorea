/**
 * 일반 프로그램 상세 수정 — Program → generalRegistration overlay 계산(순수 함수).
 * 스토어를 읽거나 쓰지 않는다. 스토어 시드·저장은 `registration-overlay-sync.ts`.
 */
import type {
  GeneralProgramCurriculumSessionRow,
  GeneralProgramScheduleDetailRow,
  Program,
} from '@/types/domain'
import {
  countGeneralCurriculumOverlaySessions,
  countGeneralCurriculumUnitSessionsFromOverlay,
  curriculumSessionHasRoundLabel,
  resolveEffectiveGeneralProgramTypeFields,
} from '@/features/program/general/lib/curriculum-display'
import { participantFlagsFromGeneralProgram } from '@/features/program/general/lib/participant-audience-selection'
import {
  isPreEducationCurriculumSession,
  isPreEducationScheduleBlock,
  trimTrailingBlankRegularCurriculumSessions,
} from '@/features/program/general/lib/schedule-detail-form'
import {
  resolveWageGradeFee,
  resolveWagePaymentItemIds,
  WAGE_GRADE_FIELDS,
} from '@/features/program/general/lib/wage-display'
import {
  coerceProgramPaymentItemsText,
  programPaymentItemLabelsFromIds,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { normalizeProgramBusinessAreaValue } from '@/features/program/shared/lib/program-detail-info-constants'
import { initialProgramRegistrationSurveyItems } from '@/features/template/lib/program-registration-survey-items'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
  TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
  TEMPLATE_FORM_IP_OWNED_OPTIONS,
} from '@/features/template/lib/template-form-select-options'
import type { GeneralRegistrationEditorExtras } from '@/features/program/general/lib/registration-overlay-to-program'
import { parseScheduleProgressTimeSummary } from '@/features/program/general/model/common-info-edit-schema'
import {
  describeIncompleteGeneralProgramRegistrationRequiredFields,
  type GeneralProgramRegistrationRequiredFieldContext,
} from '@/features/program/general/lib/registration-required-fields'
import { resolveSponsorContactIdsFromProgram } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import {
  GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY,
  GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY,
  GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_MANAGER_LINE_KEY,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-keys'

export const GENERAL_REGISTRATION_OVERLAY_PREFIX = 'generalRegistration.' as const

/** `record`에서 prefix로 시작하는 키만 고른다(스토어 없음). */
export function pickOverlayRecordByPrefix(
  prefix: string,
  record: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([key]) => key.startsWith(prefix)))
}

export const BASIC = 'generalRegistration.basicInfo' as const
export const KPI = 'generalRegistration.kpi' as const
export const WAGE = 'generalRegistration.wageInfo' as const
const TYPE = 'generalRegistration.typeSettings' as const
const CURRICULUM = 'generalRegistration.educationCurriculum' as const
const CURRICULUM_EDUCATION_FORM_BY_SESSION_KEY =
  'generalRegistration.educationCurriculum.educationFormBySession' as const
const SCHEDULE_EDUCATION_FORM_BY_DETAIL_KEY =
  'generalRegistration.educationScheduleCurriculum.educationFormByDetail' as const

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
  return [
    ...new Set(
      raw
        .map(String)
        .map(id => id.trim())
        .filter(Boolean)
    ),
  ]
}

export function generalRegistrationRequiredFieldContextFromDetailEdit(
  overlay: Record<string, unknown>,
  extras: GeneralRegistrationEditorExtras
): GeneralProgramRegistrationRequiredFieldContext {
  const sponsorIds = readOverlayIdList(overlay, GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY)
  const contactIds = readOverlayIdList(
    overlay,
    GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY
  )
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
    // 미선택은 명시 선택이다. 빈 문자열로 바꾸면 상세 수정 필수검사에서 담당자 미입력으로 막힌다.
    sponsorContactId: contactId,
    programTitleKo: readOverlayText(overlay, GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY),
  }
}

export function describeIncompleteGeneralProgramDetailEditRequiredFields(
  overlay: Record<string, unknown>,
  extras: GeneralRegistrationEditorExtras
): string | null {
  return describeIncompleteGeneralProgramRegistrationRequiredFields(
    overlay,
    generalRegistrationRequiredFieldContextFromDetailEdit(overlay, extras)
  )
}

export function hasIncompleteGeneralProgramDetailEditRequiredFields(
  overlay: Record<string, unknown>,
  extras: GeneralRegistrationEditorExtras
): boolean {
  return describeIncompleteGeneralProgramDetailEditRequiredFields(overlay, extras) != null
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

function overlayIndexFromRowLabel(label: string | undefined, fallback: number): number {
  if (!label) return fallback
  if (label.includes('사전') || label.includes('연수')) return 0
  const match = label.match(/(\d+)/)
  return match ? Number(match[1]) : fallback
}

function isEmptyEducationFormMap(value: unknown): boolean {
  return (
    value == null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length === 0
  )
}

/** GET에 남은 행 라벨로 일정별 교육 형태를 되돌린다. 현재 유형 쪽 맵만 채운다. */
export function fillPerScheduleEducationFormMaps(
  merged: Record<string, unknown>,
  program: Program
): void {
  const common = program.generalCommonInfo
  if ((common?.educationFormScheduleDetail ?? 'common') !== 'perSchedule') return
  const structure = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: common?.curriculumSessions,
    registrationOverlay: merged,
  }).educationStructure

  if (structure === 'curriculum') {
    if (isEmptyEducationFormMap(merged[CURRICULUM_EDUCATION_FORM_BY_SESSION_KEY])) {
      const map: Record<number, string> = {}
      ;(common?.curriculumSessions ?? []).forEach((row, index) => {
        const value = educationFormValueFromLabel(row.educationFormLabel)
        if (!value) return
        map[overlayIndexFromRowLabel(row.sessionLabel, index + 1)] = value
      })
      if (Object.keys(map).length > 0) merged[CURRICULUM_EDUCATION_FORM_BY_SESSION_KEY] = map
    }
    return
  }

  if (isEmptyEducationFormMap(merged[SCHEDULE_EDUCATION_FORM_BY_DETAIL_KEY])) {
    const map: Record<number, string> = {}
    ;(common?.scheduleDetails ?? []).forEach((row, index) => {
      const value = educationFormValueFromLabel(row.educationFormLabel)
      if (!value) return
      map[overlayIndexFromRowLabel(row.scheduleLabel, index + 1)] = value
    })
    if (Object.keys(map).length > 0) merged[SCHEDULE_EDUCATION_FORM_BY_DETAIL_KEY] = map
  }
}

export function overlayFromProgram(program: Program): Record<string, unknown> {
  return pickOverlayRecordByPrefix(
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
  return (
    TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS.find(option => option.label === trimmed)?.value ?? ''
  )
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

export function isEmptyWageFee(value: unknown): boolean {
  return value == null || value === ''
}

export function isEmptyPaymentItemValues(value: unknown): boolean {
  return !Array.isArray(value) || value.length === 0
}

export function isEmptyOverlayText(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === ''
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
    const index = isPre ? 0 : dataIndex + 1
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
    [`${CURRICULUM}.unitNameBySession`]: unitNameBySession,
    [`${CURRICULUM}.unitContentBySession`]: unitContentBySession,
    [`${CURRICULUM}.progressSessionByRound`]: progressSessionByRound,
    [`${CURRICULUM}.roundContentByRound`]: roundContentByRound,
    [`${CURRICULUM}.educationFormBySession`]: educationFormBySession,
    [`${CURRICULUM}.participationBySession`]: participationBySession,
    [`${CURRICULUM}.ipsBySession`]: ipsBySession,
    [`${CURRICULUM}.assignmentByRound`]: assignmentByRound,
    [`${CURRICULUM}.preEducationScheduleName`]: preEducationScheduleName,
    [`${CURRICULUM}.preEducationScheduleLine`]: preEducationScheduleLine,
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
    const isPre = isPreEducationScheduleBlock(row)
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
    'generalRegistration.educationScheduleCurriculum.eventNameByDetail': eventNameByDetail,
    'generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso':
      scheduleDateByDetailIso,
    [GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY]: groupTimesByDetail,
    [SCHEDULE_EDUCATION_FORM_BY_DETAIL_KEY]: educationFormByDetail,
    'generalRegistration.educationScheduleCurriculum.participationByDetail': participationByDetail,
    'generalRegistration.educationScheduleCurriculum.ipsByDetailIndex': ipsByDetailIndex,
    'generalRegistration.educationScheduleCurriculum.assignmentByDetail': assignmentByDetail,
  }
}

export function preferFilled<T>(
  saved: T | undefined,
  fallback: T,
  isEmpty: (value: T) => boolean
): T {
  if (saved !== undefined && !isEmpty(saved)) return saved
  return fallback
}

function emptyCurriculumProgressOverlay(): Record<string, unknown> {
  return {
    [`${CURRICULUM}.unitNameBySession`]: {},
    [`${CURRICULUM}.unitContentBySession`]: {},
    [`${CURRICULUM}.progressSessionByRound`]: {},
    [`${CURRICULUM}.roundContentByRound`]: {},
    [`${CURRICULUM}.educationFormBySession`]: {},
    [`${CURRICULUM}.participationBySession`]: {},
    [`${CURRICULUM}.ipsBySession`]: {},
    [`${CURRICULUM}.assignmentByRound`]: {},
    [`${CURRICULUM}.preEducationScheduleName`]: '',
    [`${CURRICULUM}.preEducationScheduleLine`]: null,
  }
}

function emptyScheduleProgressOverlay(): Record<string, unknown> {
  return {
    'generalRegistration.educationScheduleCurriculum.eventNameByDetail': {},
    'generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso': {},
    [GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY]: {},
    [SCHEDULE_EDUCATION_FORM_BY_DETAIL_KEY]: {},
    'generalRegistration.educationScheduleCurriculum.participationByDetail': {},
    'generalRegistration.educationScheduleCurriculum.ipsByDetailIndex': {},
    'generalRegistration.educationScheduleCurriculum.assignmentByDetail': {},
  }
}

function wageOverlayFromProgram(program: Program): Record<string, unknown> {
  const common = program.generalCommonInfo
  const overlay = overlayFromProgram(program)
  const fromNestedIds = resolveWagePaymentItemIds(common?.paymentItems)
  const overlayIds = overlay[`${WAGE}.paymentItemValues`]
  const paymentItemValues =
    fromNestedIds.length > 0
      ? fromNestedIds
      : Array.isArray(overlayIds) && overlayIds.length > 0
        ? overlayIds.map(String)
        : resolveWagePaymentItemIds(overlayString(overlay, `${WAGE}.paymentItemLabels`))
  const paymentItemLabels =
    coerceProgramPaymentItemsText(common?.paymentItems).trim() ||
    overlayString(overlay, `${WAGE}.paymentItemLabels`) ||
    programPaymentItemLabelsFromIds(paymentItemValues) ||
    ''

  return {
    [`${WAGE}.grade1Fee`]: resolveWageGradeFee(
      overlay,
      common?.wageGradeRows,
      WAGE_GRADE_FIELDS[0]
    ),
    [`${WAGE}.grade2Fee`]: resolveWageGradeFee(
      overlay,
      common?.wageGradeRows,
      WAGE_GRADE_FIELDS[1]
    ),
    [`${WAGE}.grade3Fee`]: resolveWageGradeFee(
      overlay,
      common?.wageGradeRows,
      WAGE_GRADE_FIELDS[2]
    ),
    [`${WAGE}.paymentItemValues`]: paymentItemValues,
    [`${WAGE}.paymentItemLabels`]: paymentItemLabels,
  }
}

function surveyItemsFromProgram(program: Program): Record<string, boolean> {
  const keys = new Set<string>(program.generalSurveyMenuKeys ?? [])
  const base = initialProgramRegistrationSurveyItems(false)
  const satisfactionEnabled =
    keys.has('satisfaction') || keys.has('student_satisfaction') || keys.has('teacher_satisfaction')
  return {
    ...base,
    survey: keys.has('survey'),
    satisfaction: satisfactionEnabled,
    lecture_evaluation: keys.has('lecture_evaluation'),
  }
}

export function extrasFromGeneralProgram(program: Program): GeneralRegistrationEditorExtras {
  const common = program.generalCommonInfo
  const overlay =
    program.registrationOverlay != null && typeof program.registrationOverlay === 'object'
      ? (program.registrationOverlay as Record<string, unknown>)
      : undefined
  const typeFields = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: common?.curriculumSessions,
    registrationOverlay: overlay,
  })
  const participant = participantFlagsFromGeneralProgram(program)
  const regularSessionCount = countRegularCurriculumSessions(
    trimTrailingBlankRegularCurriculumSessions(common?.curriculumSessions ?? [])
  )
  const overlaySessionCount = countGeneralCurriculumOverlaySessions(overlay)
  const overlayUnitCount = countGeneralCurriculumUnitSessionsFromOverlay(overlay)
  const labeledRoundCount = (common?.curriculumSessions ?? []).filter(
    session =>
      !session.sessionLabel.includes('사전') &&
      !session.sessionLabel.includes('연수') &&
      curriculumSessionHasRoundLabel(session)
  ).length
  const curriculumSessionCount =
    typeFields.sessionRound === 'multi'
      ? labeledRoundCount > 0
        ? Math.max(labeledRoundCount, overlayUnitCount)
        : overlaySessionCount > 0
          ? overlaySessionCount
          : Math.max(1, regularSessionCount)
      : Math.max(1, regularSessionCount, overlayUnitCount)
  return {
    programType: typeFields.educationStructure,
    sessionRoundType: typeFields.sessionRound,
    educationScheduleMode: common?.educationScheduleMode === 'period' ? 'period' : 'date',
    educationFormScheduleDetail: common?.educationFormScheduleDetail ?? 'common',
    participationScheduleDetail: common?.participationScheduleDetail ?? 'common',
    ipsScheduleDetail: common?.ipsScheduleDetail ?? 'common',
    curriculumSessionCount,
    curriculumChartSessionCount: Math.max(1, regularSessionCount, overlayUnitCount),
    scheduleCurriculumDetailCount: Math.max(
      1,
      countRegularScheduleDetails(common?.scheduleDetails)
    ),
    scheduleCurriculumGroupCount: countScheduleCurriculumGroups(common?.scheduleDetails),
    scheduleCurriculumPreEducation: common?.scheduleCurriculumPreEducation === true,
    participantOrganization: participant.organization,
    participantIndividual: participant.individual,
    participantTeacherInstructor: participant.teacherInstructor,
    participantVolunteer: participant.volunteer,
  }
}

function stripCurriculumAndScheduleOverlayMaps(
  overlay: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!overlay) return overlay
  const out = { ...overlay }
  for (const key of Object.keys({
    ...emptyCurriculumProgressOverlay(),
    ...emptyScheduleProgressOverlay(),
  })) {
    delete out[key]
  }
  return out
}

function isOverlayRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/** BE overlay JSON deep-merge 대비 — nested에 없는 회차 키는 null 로 명시 삭제한다. */
function overlayMapsWithDeletedKeysNulled(
  nextMaps: Record<string, unknown>,
  existingOverlay: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!existingOverlay) return nextMaps
  const out: Record<string, unknown> = { ...nextMaps }
  for (const [key, nextValue] of Object.entries(nextMaps)) {
    if (!isOverlayRecord(nextValue)) continue
    const previous = existingOverlay[key]
    if (!isOverlayRecord(previous)) continue
    const merged: Record<string, unknown> = { ...nextValue }
    for (const previousKey of Object.keys(previous)) {
      if (Object.prototype.hasOwnProperty.call(nextValue, previousKey)) continue
      merged[previousKey] = null
    }
    out[key] = merged
  }
  return out
}

function overlayValueIsGeneratedEmpty(value: unknown): boolean {
  if (value == null) return true
  if (value === '') return true
  return Array.isArray(value) && value.length === 0
}

function overlayValueIsMeaningful(value: unknown): boolean {
  return !overlayValueIsGeneratedEmpty(value)
}

const GENERATED_ENUM_OVERLAY_DEFAULTS: Record<string, unknown> = {
  [`${TYPE}.singleEducationForm`]: 'online',
  [`${TYPE}.multiCommonEducationForm`]: 'online',
  [`${TYPE}.singleParticipation`]: 'individual',
  [`${TYPE}.multiCommonParticipation`]: 'individual',
}

const OVERLAY_KEY_NESTED_SOURCE: Record<string, string> = {
  [`${BASIC}.detailedProgramName`]: 'detailedProgramName',
  [`${BASIC}.educationVenueDetail`]: 'venueDetail',
  [`${BASIC}.educationVenueKind`]: 'venueKind',
  [GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY]: 'sponsorManagementIds',
  [GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY]: 'sponsorManagementIds',
  [GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY]: 'sponsorManagerContactIds',
  [GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY]: 'sponsorManagerContactIds',
  [GENERAL_REGISTRATION_OVERLAY_SPONSOR_MANAGER_LINE_KEY]: 'sponsorManagerLine',
  [`${KPI}.participantCount`]: 'kpi',
  [`${KPI}.instructor`]: 'kpi',
  [`${KPI}.volunteer`]: 'kpi',
  [`${TYPE}.singleEducationForm`]: 'educationFormLabel',
  [`${TYPE}.multiCommonEducationForm`]: 'educationFormLabel',
  [`${TYPE}.educationForm`]: 'educationFormLabel',
  [`${TYPE}.singleParticipation`]: 'participationMethod',
  [`${TYPE}.multiCommonParticipation`]: 'participationMethod',
  [GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY]: 'educationScheduleLines',
}

function nestedSourcePresent(
  overlayKey: string,
  nestedCommonKeys: ReadonlySet<string> | undefined
): boolean {
  if (nestedCommonKeys == null) return true
  const source = OVERLAY_KEY_NESTED_SOURCE[overlayKey]
  if (!source) return true
  return nestedCommonKeys.has(source)
}

/**
 * Independent overlay 미러. nested 에 없는 키의 `""`/`[]`/`null`/기본 enum 으로
 * GET overlay 를 덮지 않는다. 커리큘럼·일정 맵은 아래에서 nested만 다시 쓴다.
 */
export function mergeGeneralRegistrationOverlayPreferExisting(
  existing: Record<string, unknown>,
  fromNested: Record<string, unknown>,
  nestedCommonKeys?: ReadonlySet<string>
): Record<string, unknown> {
  const merged = { ...existing }
  for (const [key, next] of Object.entries(fromNested)) {
    const prev = existing[key]
    const source = OVERLAY_KEY_NESTED_SOURCE[key]
    if (nestedCommonKeys != null && source && !nestedCommonKeys.has(source)) {
      continue
    }
    const sourcePresent = nestedSourcePresent(key, nestedCommonKeys)
    if (!sourcePresent && overlayValueIsMeaningful(prev) && overlayValueIsGeneratedEmpty(next)) {
      continue
    }
    if (
      !sourcePresent &&
      overlayValueIsMeaningful(prev) &&
      GENERATED_ENUM_OVERLAY_DEFAULTS[key] === next &&
      prev !== next
    ) {
      continue
    }
    merged[key] = next
  }
  return merged
}

/**
 * Independent nested SSOT overlay.
 * recruit 등 비세션 키는 유지하고, 커리큘럼·일정 맵은 nested만 미러한다.
 * 빈 nested 는 명시적 {} 로 stale unit map 을 덮어 삭제 회차 복원을 막는다.
 */
export function mergeRegistrationOverlayNestedSsot(
  program: Program,
  existingOverlay?: Record<string, unknown>,
  explicitCommonInfoKeys?: ReadonlySet<string>
): Record<string, unknown> {
  const fromNested = buildGeneralRegistrationOverlayFromProgram({
    ...program,
    registrationOverlay: stripCurriculumAndScheduleOverlayMaps(existingOverlay),
  })
  const nestedCommonKeys =
    explicitCommonInfoKeys ?? new Set(Object.keys(program.generalCommonInfo ?? {}))
  const merged = mergeGeneralRegistrationOverlayPreferExisting(
    existingOverlay ?? {},
    fromNested,
    nestedCommonKeys
  )
  const rebuilt = {
    ...emptyCurriculumProgressOverlay(),
    ...emptyScheduleProgressOverlay(),
    ...(program.generalProgramEducationStructure === 'schedule'
      ? scheduleOverlayFromProgram(program)
      : curriculumOverlayFromProgram(program)),
  }
  Object.assign(merged, overlayMapsWithDeletedKeysNulled(rebuilt, existingOverlay))
  return merged
}

export function buildGeneralRegistrationOverlayFromProgram(
  program: Program
): Record<string, unknown> {
  const extras = extrasFromGeneralProgram(program)
  const common = program.generalCommonInfo
  const kpi = common?.kpi
  const sponsorIds = common?.sponsorManagementIds?.length
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

  return {
    [GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY]:
      program.mainTitle?.trim() || program.title?.trim() || '',
    [`${BASIC}.programTitleEn`]: program.titleEn?.trim() || '',
    [`${BASIC}.publicProgramTitle`]: (() => {
      const fromCommon = common?.announcementTitle?.trim() || ''
      if (fromCommon) return fromCommon
      if (common?.announcementTitle != null) return ''
      const stored = program.registrationOverlay?.[`${BASIC}.publicProgramTitle`]
      return typeof stored === 'string' ? stored.trim() : ''
    })(),
    [`${BASIC}.detailedProgramId`]: detailedId,
    [`${BASIC}.detailedProgramName`]:
      extras.programType === 'schedule' ? '해당없음' : common?.detailedProgramName?.trim() || '',
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
    // dispatched 학교/학급 수는 별도 KPI 조회로 채우므로 stale kpi 값을 시드하지 않는다.
    [`${KPI}.dispatchedSchool`]: null,
    [`${KPI}.dispatchedClass`]: null,
    ...wageOverlayFromProgram(program),
    ...(extras.sessionRoundType === 'multi'
      ? {
          [`${TYPE}.multiCommonEducationForm`]:
            educationFormValueFromLabel(common?.educationFormLabel) ?? 'online',
          [`${TYPE}.multiCommonParticipation`]: common?.participationMethod ?? 'individual',
        }
      : {
          [`${TYPE}.singleEducationForm`]:
            educationFormValueFromLabel(common?.educationFormLabel) ?? 'online',
          [`${TYPE}.singleParticipation`]: common?.participationMethod ?? 'individual',
        }),
    [`${TYPE}.ipsType`]: {
      category: commonIps.category || reverseIpsCategory(program.ips),
      detail: commonIps.detail,
    },
    [GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY]: [...(common?.educationScheduleLines ?? [])],
    ...(extras.programType === 'schedule'
      ? { ...emptyCurriculumProgressOverlay(), ...scheduleOverlayFromProgram(program) }
      : { ...emptyScheduleProgressOverlay(), ...curriculumOverlayFromProgram(program) }),
  }
}

/** 저장 — 중첩 행에서 overlay를 다시 만들고, 편집 overlay의 중첩에 없는 키만 남긴다. */
export function resyncGeneralRegistrationOverlayFromProgram(
  program: Program,
  editOverlay?: Record<string, unknown>
): Record<string, unknown> {
  const fromNested = buildGeneralRegistrationOverlayFromProgram(program)
  const extra = editOverlay ?? overlayFromProgram(program)
  const merged = { ...extra, ...fromNested }
  if (!editOverlay) return merged
  for (const key of [`${KPI}.participantCount`, `${KPI}.instructor`, `${KPI}.volunteer`] as const) {
    if (Object.prototype.hasOwnProperty.call(editOverlay, key) && editOverlay[key] == null) {
      merged[key] = editOverlay[key]
    }
  }
  return merged
}
