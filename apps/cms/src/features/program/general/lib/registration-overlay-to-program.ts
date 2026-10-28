/**
 * 일반 프로그램 등록 overlay(+ editor extras) → Program / generalCommonInfo.
 * create 스냅샷 하드코드를 등록 실입력으로 덮어쓴다.
 */

import dayjs from 'dayjs'
import { formatDateDotWithWeekday, formatNumberDisplay } from '@/shared/utils'
import type {
  GeneralProgramCurriculumSessionRow,
  GeneralProgramScheduleDetailKind,
  GeneralProgramScheduleDetailRow,
  GeneralProgramSurveyMenuKey,
  Program,
} from '@/types/domain'
import {
  generalParticipantTypesFromFlags,
  type GeneralParticipantRegistrationFlags,
} from '@/features/program/general/lib/participant-audience-selection'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
import { TRAINED_TEACHERS_REGISTRATION_ALL_VALUE } from '@/features/template/ui/form-set/registration-form/trained-teachers/paragraphs/basic-info-defaults'
import { isSponsorContactUnselected } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import {
  buildScheduleProgressTimeSummary,
  buildSessionIpsTypeSummary,
  normalizeSponsorManagerContactIds,
  participationMethodLabelFromValue,
} from '@/features/program/general/model/common-info-edit-schema'
import {
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
  programPaymentItemLabelsFromIds,
  resolveProgramWageDeductionLabel,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { resolveScheduleTypeDetailedProgramNameFromDetails } from '@/features/program/general/lib/detail-common-info-display'
import { omitMirroredDetailedProgramMasterIdFromCommonInfo } from '@/features/program/general/lib/detailed-program-request-id'
import type {
  ProgramRegistrationEducationScheduleMode,
  ProgramRegistrationSessionRoundType,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import type { ProgramRegistrationIpsCategory } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import {
  PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS,
  PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS,
  PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import type { ProgramRegistrationIpsTypeValue } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-type-fields'
import type { ProgramRegistrationMultiRoundAssignmentValue } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-multi-round-assignment-fields'
import {
  getProgramRegistrationEducationFormOptions,
  resolveGeneralRegistrationCommonEducationForm,
  resolveGeneralRegistrationCommonParticipation,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import { trimTrailingBlankRegularCurriculumSessions } from '@/features/program/general/lib/schedule-detail-form'
import {
  TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS,
  TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
  TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
  TEMPLATE_FORM_IP_OWNED_OPTIONS,
} from '@/features/template/lib/template-form-select-options'
import { normalizeProgramBusinessAreaValue } from '@/features/program/shared/lib/program-detail-info-constants'
import {
  GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY,
  GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY,
  GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_MANAGER_LINE_KEY,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-keys'

const BASIC = 'generalRegistration.basicInfo' as const
const KPI = 'generalRegistration.kpi' as const
const WAGE = 'generalRegistration.wageInfo' as const
const TYPE = 'generalRegistration.typeSettings' as const
const CURRICULUM = 'generalRegistration.educationCurriculum' as const
const SCHEDULE_CURRICULUM = 'generalRegistration.educationScheduleCurriculum' as const

const WAGE_GRADE_LABELS = ['1급 강사비', '2급 강사비', '3급 강사비'] as const

export type GeneralRegistrationEditorExtras = {
  programType: ProgramRegistrationType
  sessionRoundType: ProgramRegistrationSessionRoundType
  educationScheduleMode?: ProgramRegistrationEducationScheduleMode
  educationFormScheduleDetail?: GeneralProgramScheduleDetailKind
  participationScheduleDetail?: GeneralProgramScheduleDetailKind
  ipsScheduleDetail?: GeneralProgramScheduleDetailKind
  curriculumSessionCount?: number
  curriculumChartSessionCount?: number
  scheduleCurriculumDetailCount?: number
  scheduleCurriculumGroupCount?: number
  scheduleCurriculumPreEducation?: boolean
  participantOrganization?: boolean
  participantIndividual?: boolean
  participantTeacherInstructor?: boolean
  participantVolunteer?: boolean
  /** 교육받은 교사 — 교육 연수 ON/OFF (create 시 항상 명시) */
  teacherTrainingEnabled?: boolean
  /**
   * 교육받은 교사 등록 — 일정형(schedule)이어도 「세부 프로그램명」 select 잠금이 없다
   * (`lockDetailedProgramToNone`은 일반 일정형에만 적용). isSchedule만으로 세부
   * 프로그램명·id를 스케줄 상세명/undefined로 덮어쓰면 사용자가 고른 값이 사라진다.
   */
  isTrainedTeachers?: boolean
}

function overlayString(overlay: Record<string, unknown>, key: string): string {
  const raw = overlay[key]
  if (typeof raw === 'string') return raw.trim()
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  return ''
}

function overlayNullableNumber(overlay: Record<string, unknown>, key: string): number | undefined {
  const raw = overlay[key]
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw.replace(/,/g, ''))
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

function overlayRecord<T>(overlay: Record<string, unknown>, key: string): Record<number, T> {
  const raw = overlay[key]
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<number, T> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(k)
    if (!Number.isFinite(n)) continue
    out[n] = v as T
  }
  return out
}

function sessionOverlayValueFilled(value: unknown): boolean {
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
      if (!Number.isFinite(index) || index <= 0 || !sessionOverlayValueFilled(value)) continue
      if (index > max) max = index
    }
  }
  return max
}

function readOperationRangeSeal(
  overlay: Record<string, unknown>
): { start: string; end: string } | null {
  const raw = overlay[`${BASIC}.operationRangeSeal`]
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const start = (raw as { start?: unknown }).start
  const end = (raw as { end?: unknown }).end
  if (typeof start !== 'string' || typeof end !== 'string') return null
  if (!start.trim() || !end.trim()) return null
  return { start, end }
}

/** 공통정보 「사업 운영 기간」overlay → program.startDate/endDate */
export function resolveProgramDatesFromOperationRangeSeal(
  overlay: Record<string, unknown> | undefined
): { startDate: string; endDate: string } | null {
  if (overlay == null) return null
  const seal = readOperationRangeSeal(overlay)
  if (!seal) return null
  return {
    startDate: dayjs(seal.start).startOf('day').toISOString(),
    endDate: dayjs(seal.end).endOf('day').toISOString(),
  }
}

function businessAreaToProgramValue(formValue: string): string {
  return normalizeProgramBusinessAreaValue(formValue)
}

function educationProcessToProgramValue(formValue: string): string | undefined {
  if (!formValue) return undefined
  return (
    TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS.find(o => o.value === formValue)?.label ?? formValue
  )
}

function ipOwnedToProgramValue(formValue: string): string | undefined {
  if (!formValue) return undefined
  const label =
    TEMPLATE_FORM_IP_OWNED_OPTIONS.find(o => o.value === formValue)?.label ?? formValue
  if (label === 'Jointly') return 'Jointly'
  if (label === 'Partner') return 'Partner'
  return 'JA'
}

function courseDeliveredToProgramValue(
  formValue: string
): 'JA' | 'Jointly' | 'Partner' | undefined {
  if (!formValue) return undefined
  const label =
    TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS.find(o => o.value === formValue)?.label ?? formValue
  if (label === 'Jointly') return 'Jointly'
  if (label === 'Partner') return 'Partner'
  return 'JA'
}

function educationFormLabelFromValue(value: string | undefined): string {
  const options = getProgramRegistrationEducationFormOptions(true)
  return options.find(o => o.value === value)?.label ?? value ?? '-'
}

function buildWageGradePricing(amount: number | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return '1시간 당 | 기본 : -'
  return `1시간 당 | 기본 : ${formatNumberDisplay(amount)}원`
}

function resolveDetailedProgramName(
  overlay: Record<string, unknown>,
  detailedProgramId: string
): string | undefined {
  const fromOverlay = overlayString(overlay, `${BASIC}.detailedProgramName`)
  if (fromOverlay) return fromOverlay
  if (!detailedProgramId || detailedProgramId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE) {
    return undefined
  }
  return undefined
}

const TRAINED_TEACHERS_REGISTRATION_PREFIX = 'trainedTeachersRegistration' as const

/** 교육받은 교사 등록 overlay 키 → generalRegistration 키 (applyGeneralRegistrationOverlayToProgram 재사용) */
export function normalizeRegistrationOverlayForApply(
  overlay: Record<string, unknown>,
  variant: ProgramRegistrationFormVariant
): Record<string, unknown> {
  if (variant !== 'trainedTeachers') return overlay

  const normalized: Record<string, unknown> = { ...overlay }
  const ttBasic = `${TRAINED_TEACHERS_REGISTRATION_PREFIX}.basicInfo`
  const genBasic = `${BASIC}`

  const copyWhenMissing = (fromKey: string, toKey: string) => {
    if (overlay[fromKey] === undefined) return
    if (normalized[toKey] !== undefined) return
    normalized[toKey] = overlay[fromKey]
  }

  copyWhenMissing(`${ttBasic}.sponsorId`, GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY)
  copyWhenMissing(`${ttBasic}.sponsorIds`, GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY)
  copyWhenMissing(`${ttBasic}.managerContactId`, GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY)
  copyWhenMissing(`${ttBasic}.managerContactIds`, GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY)
  copyWhenMissing(`${ttBasic}.sponsorManagerLine`, GENERAL_REGISTRATION_OVERLAY_SPONSOR_MANAGER_LINE_KEY)
  copyWhenMissing(`${ttBasic}.programTitleKo`, GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY)
  copyWhenMissing(
    `${TRAINED_TEACHERS_REGISTRATION_PREFIX}.typeSettings.educationForm`,
    `${TYPE}.singleEducationForm`
  )

  for (const [key, value] of Object.entries(overlay)) {
    if (!key.startsWith(`${TRAINED_TEACHERS_REGISTRATION_PREFIX}.`)) continue
    const suffix = key.slice(TRAINED_TEACHERS_REGISTRATION_PREFIX.length)
    const targetKey = `generalRegistration${suffix}`
    if (normalized[targetKey] === undefined) {
      normalized[targetKey] = value
    }
  }

  for (const [key] of Object.entries(overlay)) {
    if (!key.startsWith(`${ttBasic}.`)) continue
    const field = key.slice(ttBasic.length + 1)
    if (
      ['sponsorId', 'sponsorIds', 'managerContactId', 'managerContactIds', 'programTitleKo', 'sponsorManagerLine'].includes(
        field
      )
    ) {
      continue
    }
    copyWhenMissing(key, `${genBasic}.${field}`)
  }

  const sponsorId = overlayString(normalized, GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY)
  if (
    sponsorId &&
    sponsorId !== TRAINED_TEACHERS_REGISTRATION_ALL_VALUE &&
    normalized[GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY] === undefined
  ) {
    normalized[GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY] = [sponsorId]
  }

  const contactId = overlayString(normalized, GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY)
  if (
    contactId &&
    contactId !== TRAINED_TEACHERS_REGISTRATION_ALL_VALUE &&
    normalized[GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY] === undefined
  ) {
    normalized[GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY] = [contactId]
  }

  return normalized
}

function buildIpsTypeSummaryFull(
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

function surveyKeysFromOverlay(overlay: Record<string, unknown>): GeneralProgramSurveyMenuKey[] {
  const raw = overlay[`${BASIC}.surveyItems`]
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return []
  }
  const items = raw as Record<string, unknown>
  const keys: GeneralProgramSurveyMenuKey[] = []
  if (items.survey === true) keys.push('survey')
  if (items.satisfaction === true) keys.push('satisfaction')
  if (items.lecture_evaluation === true) keys.push('lecture_evaluation')
  return keys
}

export function buildCurriculumSessionsFromRegistrationOverlay(
  overlay: Record<string, unknown>,
  extras: GeneralRegistrationEditorExtras
): GeneralProgramCurriculumSessionRow[] {
  const isMulti = extras.sessionRoundType === 'multi'
  const unitNameBySession = overlayRecord<string>(overlay, `${CURRICULUM}.unitNameBySession`)
  const unitContentBySession = overlayRecord<string>(overlay, `${CURRICULUM}.unitContentBySession`)
  const progressSessionByRound = overlayRecord<string>(
    overlay,
    `${CURRICULUM}.progressSessionByRound`
  )
  const roundContentByRound = overlayRecord<string>(overlay, `${CURRICULUM}.roundContentByRound`)
  const educationFormBySession = overlayRecord<string>(
    overlay,
    `${CURRICULUM}.educationFormBySession`
  )
  const participationBySession = overlayRecord<string>(
    overlay,
    `${CURRICULUM}.participationBySession`
  )
  const ipsBySession = overlayRecord<ProgramRegistrationIpsTypeValue>(
    overlay,
    `${CURRICULUM}.ipsBySession`
  )
  const assignmentByRound = overlayRecord<ProgramRegistrationMultiRoundAssignmentValue>(
    overlay,
    `${CURRICULUM}.assignmentByRound`
  )

  const eduDetail = extras.educationFormScheduleDetail ?? 'common'
  const partDetail = extras.participationScheduleDetail ?? 'common'
  const ipsDetail = extras.ipsScheduleDetail ?? 'common'
  const hideAssignment = extras.participantOrganization === true || !isMulti
  const hideParticipation = extras.participantOrganization === true

  const sessions: GeneralProgramCurriculumSessionRow[] = []
  const isTeacherTraining = extras.teacherTrainingEnabled === true

  if (extras.scheduleCurriculumPreEducation && !isTeacherTraining) {
    const preName =
      overlayString(overlay, `${CURRICULUM}.preEducationScheduleName`) || '사전 교육'
    const preLine = overlayString(overlay, `${CURRICULUM}.preEducationScheduleLine`)
    sessions.push({
      sessionLabel: '사전 교육',
      title: preName,
      description: '',
      isPreEducation: true,
      scheduleDateLabel: preLine || undefined,
      assignmentEnabled: false,
      educationFormLabel:
        eduDetail === 'perSchedule'
          ? educationFormLabelFromValue(educationFormBySession[0] ?? 'online')
          : undefined,
      ipsTypeSummary:
        ipsDetail === 'perSchedule'
          ? buildSessionIpsTypeSummary('prepare', 'none')
          : undefined,
    })
  }

  const unitMax = maxFilledSessionIndex([unitNameBySession, unitContentBySession])
  const roundMax = maxFilledSessionIndex([progressSessionByRound, roundContentByRound])
  const overlayCount = maxFilledSessionIndex([
    unitNameBySession,
    unitContentBySession,
    progressSessionByRound,
    roundContentByRound,
    ipsBySession,
    assignmentByRound,
  ])
  const count = Math.max(
    1,
    isMulti ? (extras.curriculumSessionCount ?? 1) : (extras.curriculumChartSessionCount ?? 1),
    overlayCount
  )
  /**
   * 복수 회차 extras여도 수정 UI가 단원 맵(차트 차시)을 쓰면 unitMax > roundMax.
   * 그때는 단원 맵을 교육 진행 본문으로 쓴다.
   */
  const preferUnitMaps = !isMulti || unitMax > roundMax

  for (let i = 1; i <= count; i += 1) {
    const unitName = unitNameBySession[i]?.trim() ?? ''
    const unitContent = unitContentBySession[i]?.trim() ?? ''
    const progress = progressSessionByRound[i]?.trim() ?? ''
    const roundContent = roundContentByRound[i]?.trim() ?? ''
    const useUnit = preferUnitMaps && Boolean(unitName || unitContent)
    const title = useUnit
      ? unitName || (progress ? `${progress}차시` : `${i}차시`)
      : progress
        ? `${progress}차시`
        : unitName || `${i}차시`
    const description = useUnit ? unitContent || roundContent : roundContent || unitContent
    const assignment = assignmentByRound[i]
    const ips = ipsBySession[i]
    const replaceFirstTraining = isTeacherTraining && i === 1
    sessions.push({
      sessionLabel: replaceFirstTraining ? '교육 연수' : isMulti ? `${i}회차` : `${i}차시`,
      title,
      description,
      assignmentEnabled: hideAssignment ? false : Boolean(assignment?.enabled),
      assignmentPeriod: hideAssignment ? undefined : assignment?.period?.trim() || undefined,
      educationFormLabel:
        eduDetail === 'perSchedule'
          ? educationFormLabelFromValue(educationFormBySession[i] ?? 'online')
          : undefined,
      participationMethodLabel:
        !hideParticipation && partDetail === 'perSchedule'
          ? participationMethodLabelFromValue(
              (participationBySession[i] as 'individual' | 'team' | undefined) ?? 'individual'
            )
          : undefined,
      ipsTypeSummary: replaceFirstTraining
        ? buildSessionIpsTypeSummary('prepare', 'none')
        : ipsDetail === 'perSchedule'
          ? buildSessionIpsTypeSummary(
              (ips?.category as ProgramRegistrationIpsCategory | '') ?? 'prepare',
              ips?.detail ?? 'none'
            )
          : undefined,
    })
  }
  return trimTrailingBlankRegularCurriculumSessions(sessions)
}

function formatScheduleDateLabel(iso: string | null | undefined): string | undefined {
  if (!iso?.trim()) return undefined
  const d = dayjs(iso)
  if (!d.isValid()) return iso.trim()
  const label = formatDateDotWithWeekday(d)
  return label === '-' ? iso.trim() : label
}

/** 상세 조회 — registration overlay → 일정형 scheduleDetails (저장본이 비어 있을 때) */
export function buildEnrichedScheduleDetails(
  overlay: Record<string, unknown>,
  extras: GeneralRegistrationEditorExtras
): GeneralProgramScheduleDetailRow[] {
  const detailCount = Math.max(1, extras.scheduleCurriculumDetailCount ?? 1)
  const rawNames = overlay[`${SCHEDULE_CURRICULUM}.eventNameByDetail`]
  const names =
    rawNames != null && typeof rawNames === 'object' && !Array.isArray(rawNames)
      ? (rawNames as Record<number, unknown>)
      : {}
  const base: GeneralProgramScheduleDetailRow[] = Array.from({ length: detailCount }, (_, index) => {
    const n = index + 1
    const nameRaw = names[n]
    const name = typeof nameRaw === 'string' ? nameRaw.trim() : ''
    return {
      scheduleLabel: `세부 일정 ${String(n).padStart(2, '0')}`,
      name,
    }
  })
  const dates = overlayRecord<string | null>(
    overlay,
    `${SCHEDULE_CURRICULUM}.scheduleDateByDetailIso`
  )
  const educationFormByDetail = overlayRecord<string>(
    overlay,
    `${SCHEDULE_CURRICULUM}.educationFormByDetail`
  )
  const participationByDetail = overlayRecord<string>(
    overlay,
    `${SCHEDULE_CURRICULUM}.participationByDetail`
  )
  const ipsByDetail = overlayRecord<ProgramRegistrationIpsTypeValue>(
    overlay,
    `${SCHEDULE_CURRICULUM}.ipsByDetailIndex`
  )
  const assignmentByDetail = overlayRecord<{ enabled?: boolean; period?: string }>(
    overlay,
    `${SCHEDULE_CURRICULUM}.assignmentByDetail`
  )
  const groupTimes = overlayRecord<Array<{ startTime?: string; endTime?: string } | null>>(
    overlay,
    GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY
  )

  const eduDetail = extras.educationFormScheduleDetail ?? 'common'
  const partDetail = extras.participationScheduleDetail ?? 'common'
  const ipsDetailKind = extras.ipsScheduleDetail ?? 'common'
  const hideAssignment = extras.participantOrganization === true || extras.sessionRoundType === 'single'
  const hideParticipation = extras.participantOrganization === true

  const rows: GeneralProgramScheduleDetailRow[] = base.map((row, index) => {
    const n = index + 1
    const slots = (groupTimes[n] ?? []).filter(
      (s): s is { startTime?: string; endTime?: string } => s != null
    )
    const assignment = assignmentByDetail[n]
    const ips = ipsByDetail[n]
    return {
      ...row,
      scheduleDateLabel: formatScheduleDateLabel(dates[n]),
      progressTimeSummary: slots.length > 0 ? buildScheduleProgressTimeSummary(slots) : undefined,
      assignmentEnabled: hideAssignment ? false : Boolean(assignment?.enabled),
      assignmentPeriod: hideAssignment ? undefined : assignment?.period?.trim() || undefined,
      educationFormLabel:
        eduDetail === 'perSchedule'
          ? educationFormLabelFromValue(educationFormByDetail[n] ?? 'online')
          : undefined,
      participationMethodLabel:
        !hideParticipation && partDetail === 'perSchedule'
          ? participationMethodLabelFromValue(
              (participationByDetail[n] as 'individual' | 'team' | undefined) ?? 'individual'
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
    if (isTeacherTraining) {
      if (rows[0]) {
        rows[0] = {
          ...rows[0],
          scheduleLabel: '교육 연수',
          name: rows[0].name?.trim() || '교육 연수',
          assignmentEnabled: false,
          assignmentPeriod: undefined,
          ipsTypeSummary: buildSessionIpsTypeSummary('prepare', 'none'),
        }
      }
    } else {
      const preName =
        overlayString(overlay, `${SCHEDULE_CURRICULUM}.preEducationName`) || '사전 교육'
      const preEducationForm = educationFormByDetail[0]
      rows.unshift({
        scheduleLabel: '사전 교육',
        name: preName,
        blockKind: 'preEducation',
        assignmentEnabled: false,
        scheduleDateLabel: formatScheduleDateLabel(dates[0]),
        educationFormLabel: preEducationForm
          ? educationFormLabelFromValue(preEducationForm)
          : eduDetail === 'perSchedule'
            ? educationFormLabelFromValue('online')
            : undefined,
        ipsTypeSummary:
          ipsDetailKind === 'perSchedule'
            ? buildSessionIpsTypeSummary('prepare', 'none')
            : undefined,
      })
    }
  }

  return rows
}

function participantFlagsFromCompleteExtras(
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

function audienceFromParticipantFlags(
  flags: GeneralParticipantRegistrationFlags
): Program['generalProgramAudience'] {
  if (flags.individual && !flags.organization) return 'individual'
  if (flags.organization && !flags.individual) return 'organization'
  return undefined
}

/**
 * 등록 overlay·editor extras로 Program create/상세용 필드를 채운다.
 * economy / trainedTeachers 스냅샷에는 적용하지 않는다.
 */
export function applyGeneralRegistrationOverlayToProgram(
  program: Program,
  overlay: Record<string, unknown>,
  extras: GeneralRegistrationEditorExtras
): Program {
  const titleKo =
    overlayString(overlay, GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY) ||
    program.mainTitle ||
    program.title
  const titleEn = overlayString(overlay, `${BASIC}.programTitleEn`) || program.titleEn
  const publicTitleKey = `${BASIC}.publicProgramTitle`
  const announcementTitle = Object.prototype.hasOwnProperty.call(overlay, publicTitleKey)
    ? overlayString(overlay, publicTitleKey)
    : program.generalCommonInfo?.announcementTitle

  const sealDates = resolveProgramDatesFromOperationRangeSeal(overlay)
  const startDate = sealDates?.startDate ?? program.startDate
  const endDate = sealDates?.endDate ?? program.endDate
  const seal = sealDates != null

  const businessField = overlayString(overlay, `${BASIC}.businessField`)
  const businessArea = businessAreaToProgramValue(businessField) || program.businessArea

  const partnerKey = `${BASIC}.partnerInvolvement`
  const partnerRaw = overlayString(overlay, partnerKey)
  // 등록 기본값은 Yes. 수정 저장에서 키가 없으면 저장된 값을 유지한다.
  const partnerInvolvement = Object.prototype.hasOwnProperty.call(overlay, partnerKey)
    ? partnerRaw !== 'no'
    : (program.partnerInvolvement ?? true)

  const rawVenueKind = overlayString(overlay, `${BASIC}.educationVenueKind`)
  const venueKind =
    rawVenueKind === 'outside' || rawVenueKind === 'other' || rawVenueKind === 'inside'
      ? rawVenueKind
      : 'inside'
  const venueDetail = overlayString(overlay, `${BASIC}.educationVenueDetail`)
  const institutionType =
    venueKind === 'inside'
      ? ('inside_school' as const)
      : venueKind === 'outside'
        ? ('outside_school' as const)
        : undefined
  const venue = venueKind === 'other' ? venueDetail || program.venue : undefined

  const educationProcess =
    educationProcessToProgramValue(overlayString(overlay, `${BASIC}.educationCourse`)) ??
    program.educationProcess
  const ipOwned =
    ipOwnedToProgramValue(overlayString(overlay, `${BASIC}.ipOwned`)) ?? program.ipOwned
  const courseDeliveredBy =
    courseDeliveredToProgramValue(overlayString(overlay, `${BASIC}.courseDeliveredBy`)) ??
    program.courseDeliveredBy

  const sponsorIdsRaw = overlay[GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY]
  const sponsorManagementIds = Array.isArray(sponsorIdsRaw)
    ? sponsorIdsRaw.map(String).map(s => s.trim()).filter(Boolean)
    : (() => {
        const one = overlayString(overlay, GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY)
        return one ? [one] : program.generalCommonInfo?.sponsorManagementIds
      })()
  const sponsorId =
    sponsorManagementIds?.[0] ||
    overlayString(overlay, GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY) ||
    program.sponsorId

  const contactRefs = normalizeSponsorManagerContactIds({
    ids: Array.isArray(overlay[GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY])
      ? (overlay[GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY] as unknown[]).map(String)
      : undefined,
    id: overlayString(overlay, GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY) || undefined,
  }).filter(
    ref => ref !== TRAINED_TEACHERS_REGISTRATION_ALL_VALUE && !isSponsorContactUnselected(ref)
  )
  const contactRef = contactRefs[0] ?? ''
  const sponsorManagerLine =
    overlayString(overlay, GENERAL_REGISTRATION_OVERLAY_SPONSOR_MANAGER_LINE_KEY) ||
    // 레거시: ref가 아닌 표시 문구가 contact 키에 들어온 경우만 사용
    (contactRef.includes('::') ? '' : contactRef) ||
    program.generalCommonInfo?.sponsorManagerLine

  const prevKpi = program.generalCommonInfo?.kpi
  const kpiNumber = (key: string, fallback: number | undefined) => {
    if (!Object.prototype.hasOwnProperty.call(overlay, key)) return fallback ?? 0
    return overlayNullableNumber(overlay, key) ?? 0
  }
  const kpi = {
    finalParticipants: kpiNumber(
      `${KPI}.participantCount`,
      prevKpi?.finalParticipants ?? program.approvedStudentCount
    ),
    instructorCount: kpiNumber(
      `${KPI}.instructor`,
      prevKpi?.instructorCount ?? program.instructors
    ),
    volunteerCount: kpiNumber(
      `${KPI}.volunteer`,
      prevKpi?.volunteerCount ?? program.generalVolunteers
    ),
    finalSchools: kpiNumber(
      `${KPI}.dispatchedSchool`,
      prevKpi?.finalSchools ?? program.participatingSchoolCount
    ),
    finalClasses: kpiNumber(`${KPI}.dispatchedClass`, prevKpi?.finalClasses),
  }

  const gradeFees = [
    overlayNullableNumber(overlay, `${WAGE}.grade1Fee`),
    overlayNullableNumber(overlay, `${WAGE}.grade2Fee`),
    overlayNullableNumber(overlay, `${WAGE}.grade3Fee`),
  ]
  const wageGradeRows = WAGE_GRADE_LABELS.map((grade, index) => ({
    grade,
    pricing: buildWageGradePricing(gradeFees[index]),
  }))
  const paymentItemIdsRaw = overlay[`${WAGE}.paymentItemValues`]
  const paymentItemIds = Array.isArray(paymentItemIdsRaw)
    ? paymentItemIdsRaw.map(String)
    : undefined
  const paymentItemLabelsOverlay = overlayString(overlay, `${WAGE}.paymentItemLabels`)
  const paymentItemsFromIds = programPaymentItemLabelsFromIds(paymentItemIds)
  const paymentItems =
    paymentItemLabelsOverlay ||
    paymentItemsFromIds ||
    PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
  const deductionItems = resolveProgramWageDeductionLabel(paymentItemIds)

  const ipsTypeRaw = overlay[`${TYPE}.ipsType`]
  const ipsType =
    ipsTypeRaw != null && typeof ipsTypeRaw === 'object' && !Array.isArray(ipsTypeRaw)
      ? (ipsTypeRaw as ProgramRegistrationIpsTypeValue)
      : { category: '' as const, detail: '' }
  const ipsCategory = (ipsType.category || '') as ProgramRegistrationIpsCategory | ''
  const ipsCapitalized =
    ipsCategory === 'inspire'
      ? ('Inspire' as const)
      : ipsCategory === 'prepare'
        ? ('Prepare' as const)
        : ipsCategory === 'succeed'
          ? ('Succeed' as const)
          : program.ips
  const programCategory =
    ipsCategory === 'succeed'
      ? (PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS.find(o => o.value === ipsType.detail)
          ?.label ?? program.programCategory)
      : program.programCategory
  const programChannel =
    ipsCategory === 'inspire'
      ? (PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS.find(
          o => o.value === ipsType.detail
        )?.label ?? program.programChannel)
      : program.programChannel

  const eduDetail = extras.educationFormScheduleDetail ?? 'common'
  const partDetail = extras.participationScheduleDetail ?? 'common'
  const ipsDetailKind = extras.ipsScheduleDetail ?? 'common'

  const commonEducationForm =
    resolveGeneralRegistrationCommonEducationForm(overlay) ||
    overlayString(overlay, `${TYPE}.educationForm`) ||
    'online'
  const participantFlags = participantFlagsFromCompleteExtras(extras)
  const hideParticipation = extras.participantOrganization === true
  const commonParticipation = hideParticipation
    ? undefined
    : (resolveGeneralRegistrationCommonParticipation(overlay) as 'individual' | 'team')

  const programTypeFromForm =
    commonEducationForm === 'online'
      ? ('online' as const)
      : commonEducationForm === 'offline'
        ? ('offline' as const)
        : commonEducationForm === 'hybrid'
          ? ('hybrid' as const)
          : program.type

  const isSchedule = extras.programType === 'schedule'
  const scheduleDetails = isSchedule ? buildEnrichedScheduleDetails(overlay, extras) : []
  const curriculumSessions = isSchedule
    ? []
    : buildCurriculumSessionsFromRegistrationOverlay(overlay, extras)

  // 버그 수정: 일반 일정형은 「세부 프로그램명」select가 잠겨 있어(해당없음) 일정 상세명으로
  // 대체해도 되지만, 교육받은 교사는 일정형이어도 select 잠금이 없어 사용자가 실제로
  // 세부 프로그램명을 고를 수 있다 — isSchedule만으로 무조건 덮어쓰면 그 선택값이
  // 스케줄 상세명(또는 undefined)으로 사라진다.
  const lockDetailedProgramToSchedule = isSchedule && !extras.isTrainedTeachers

  const detailedProgramId = overlayString(overlay, `${BASIC}.detailedProgramId`)
  const detailedProgramNameFromOverlay = overlayString(overlay, `${BASIC}.detailedProgramName`)
  const detailedProgramName = lockDetailedProgramToSchedule
    ? resolveScheduleTypeDetailedProgramNameFromDetails(scheduleDetails) ?? '해당없음'
    : detailedProgramNameFromOverlay ||
      (detailedProgramId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
        ? '해당없음'
        : resolveDetailedProgramName(overlay, detailedProgramId))

  const scheduleLinesRaw = overlay[GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY]
  const overlayScheduleLines = Array.isArray(scheduleLinesRaw)
    ? scheduleLinesRaw
        .filter((line): line is string => typeof line === 'string')
        .map(s => s.trim())
        .filter(Boolean)
    : []
  const educationScheduleLines =
    overlayScheduleLines.length > 0
      ? overlayScheduleLines
      : program.generalCommonInfo?.educationScheduleLines

  const rounds =
    seal && program.rounds?.length
      ? program.rounds.map((round, index) =>
          index === 0
            ? {
                ...round,
                startDate,
                endDate,
                curriculum: `${titleKo} 커리큘럼`,
              }
            : round
        )
      : program.rounds

  return {
    ...program,
    title: titleKo,
    mainTitle: titleKo,
    titleEn: titleEn || undefined,
    description: titleKo,
    startDate,
    endDate,
    businessArea,
    partnerInvolvement,
    institutionType: institutionType ?? program.institutionType,
    venue,
    educationProcess,
    ipOwned,
    courseDeliveredBy,
    sponsorId,
    type: programTypeFromForm,
    ips: ipsCapitalized,
    programCategory,
    programChannel,
    detailedProgramId:
      lockDetailedProgramToSchedule ||
      !detailedProgramId ||
      detailedProgramId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
        ? undefined
        : detailedProgramId,
    approvedStudentCount: kpi.finalParticipants,
    instructors: kpi.instructorCount,
    instructorCapacity: kpi.instructorCount,
    generalVolunteers: kpi.volunteerCount,
    participatingSchoolCount: kpi.finalSchools,
    generalSurveyMenuKeys: surveyKeysFromOverlay(overlay),
    ...(participantFlags
      ? {
          generalParticipantTypes: generalParticipantTypesFromFlags(participantFlags),
          generalProgramAudience: audienceFromParticipantFlags(participantFlags),
        }
      : {}),
    rounds,
    generalCommonInfo: {
      ...(lockDetailedProgramToSchedule
        ? omitMirroredDetailedProgramMasterIdFromCommonInfo(program.generalCommonInfo)
        : program.generalCommonInfo),
      announcementTitle,
      detailedProgramName,
      venueKind,
      venueDetail: venueDetail || program.generalCommonInfo?.venueDetail,
      sponsorManagementId: sponsorManagementIds?.[0] ?? program.generalCommonInfo?.sponsorManagementId,
      sponsorManagementIds: sponsorManagementIds ?? program.generalCommonInfo?.sponsorManagementIds,
      sponsorManagerContactIds:
        contactRefs.length > 0
          ? contactRefs
          : program.generalCommonInfo?.sponsorManagerContactIds,
      sponsorManagerContactId:
        contactRefs[0] ?? program.generalCommonInfo?.sponsorManagerContactId,
      sponsorManagerLine: sponsorManagerLine || undefined,
      educationScheduleMode:
        extras.educationScheduleMode ?? program.generalCommonInfo?.educationScheduleMode ?? 'date',
      educationScheduleLines,
      educationFormScheduleDetail: eduDetail,
      participationScheduleDetail: partDetail,
      ipsScheduleDetail: ipsDetailKind,
      educationFormLabel:
        eduDetail === 'common' ? educationFormLabelFromValue(commonEducationForm) : undefined,
      /** 기관(학교/기관) 대상 — BE `GENERAL_ORGANIZATION_PARTICIPATION_METHOD_NOT_ALLOWED` */
      participationMethod:
        hideParticipation || partDetail !== 'common' ? undefined : commonParticipation,
      ipsTypeSummary: buildIpsTypeSummaryFull(ipsDetailKind, ipsCategory, ipsType.detail),
      scheduleCurriculumPreEducation: extras.scheduleCurriculumPreEducation ?? false,
      ...(typeof extras.teacherTrainingEnabled === 'boolean'
        ? { teacherTrainingEnabled: extras.teacherTrainingEnabled }
        : {}),
      curriculumSessions,
      scheduleDetails,
      wageGradeRows,
      paymentItems,
      deductionItems,
      kpi,
    },
  }
}
