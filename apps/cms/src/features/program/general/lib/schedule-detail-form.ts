/**
 * 일반 프로그램 상세 — 일정형 세부/행사 일정 폼 (등록 양식 동작 정렬)
 */

import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form'
import type { GeneralProgramScheduleDetailKind } from '@/types/domain'
import type { GeneralProgramCurriculumSessionRow } from '@/types/domain'
import type { GeneralProgramEducationStructure, GeneralProgramSessionRoundKind } from '@/types/domain'
import { isGeneralProgramMultiRoundCurriculum } from '@/features/program/general/lib/curriculum-display'
import type {
  GeneralProgramCommonInfoEditFormValues,
  GeneralProgramScheduleDetailFormValues,
} from '@/features/program/general/model/common-info-edit-schema'
import { padScheduleDetailLabel } from '@/features/program/general/model/common-info-edit-schema'

type CommonInfoSetValue = UseFormSetValue<GeneralProgramCommonInfoEditFormValues>
type CommonInfoGetValues = UseFormGetValues<GeneralProgramCommonInfoEditFormValues>

export type ScheduleDetailBlockKind = 'sub' | 'event' | 'preEducation'

export const PRE_EDUCATION_SCHEDULE_LABEL = '사전 교육'

/** 일반(개인) — 교육 진행 일정 유형에서 기간 지정 불가 (학교/기관만 허용) */
export function shouldDisableEducationSchedulePeriodMode(input: {
  participantOrganization: boolean
  /** 호환용. 기간 지정은 회차와 무관하게 개인 대상이면 비활성 */
  sessionRound?: 'single' | 'multi'
}): boolean {
  return !input.participantOrganization
}

/** 일정형 — 진행 그룹 구분 추가는 단일 회차 + 날짜 지정만 */
export function shouldAllowScheduleProgressGroupAdd(input: {
  sessionRound: 'single' | 'multi'
  educationScheduleMode: 'date' | 'period'
}): boolean {
  return input.sessionRound === 'single' && input.educationScheduleMode === 'date'
}

/** 일반 커리큘럼형 — 일정 유형에 맞춰 캘린더 기간/시간 토글 ON 고정 (개인·기관 공통) */
export function shouldLockEducationScheduleCalendarToggles(input: {
  participantOrganization: boolean
  educationStructure: 'curriculum' | 'schedule'
}): boolean {
  return input.educationStructure === 'curriculum'
}

export function padEventScheduleLabel(index: number): string {
  return `행사 일정 ${String(index + 1).padStart(2, '0')}`
}

export function inferScheduleDetailBlockKind(scheduleLabel: string): ScheduleDetailBlockKind {
  if (scheduleLabel.includes('사전 교육')) return 'preEducation'
  return scheduleLabel.includes('행사 일정') ? 'event' : 'sub'
}

export function isPreEducationScheduleBlock(detail: {
  blockKind?: ScheduleDetailBlockKind
  scheduleLabel?: string
}): boolean {
  if (detail.blockKind === 'preEducation') return true
  return inferScheduleDetailBlockKind(detail.scheduleLabel ?? '') === 'preEducation'
}

export function isScheduleMultiAllPerSchedule(
  sessionRound: GeneralProgramSessionRoundKind,
  educationFormScheduleDetail: GeneralProgramScheduleDetailKind,
  participationScheduleDetail: GeneralProgramScheduleDetailKind,
  ipsScheduleDetail: GeneralProgramScheduleDetailKind
): boolean {
  return (
    sessionRound === 'multi' &&
    educationFormScheduleDetail === 'perSchedule' &&
    participationScheduleDetail === 'perSchedule' &&
    ipsScheduleDetail === 'perSchedule'
  )
}

/** 개인 + 교육 형태·참여 방식·IPS 유형 모두 일정 별 상이 — 커리큘럼 회차: 수업 → 교육|IPS → 과제|참여 */
export function isIndividualAllPerScheduleLayout(input: {
  participantOrganization: boolean
  educationFormScheduleDetail: GeneralProgramScheduleDetailKind
  participationScheduleDetail: GeneralProgramScheduleDetailKind
  ipsScheduleDetail: GeneralProgramScheduleDetailKind
}): boolean {
  return (
    !input.participantOrganization &&
    input.educationFormScheduleDetail === 'perSchedule' &&
    input.participationScheduleDetail === 'perSchedule' &&
    input.ipsScheduleDetail === 'perSchedule'
  )
}

export type ScheduleEventBlockLayoutInput = {
  sessionRound: GeneralProgramSessionRoundKind
  participantOrganization: boolean
  educationFormScheduleDetail: GeneralProgramScheduleDetailKind
  participationScheduleDetail: GeneralProgramScheduleDetailKind
  ipsScheduleDetail: GeneralProgramScheduleDetailKind
}

/** 일정형 행사 일정 블록 — 복수 회차(개인·기관)는 유형 설정과 무관 */
export function shouldUseScheduleEventBlockLayout(
  input: ScheduleEventBlockLayoutInput
): boolean {
  return input.sessionRound === 'multi'
}

/** 행사 일정 블록 — 일정 별 상이 필드 배치 (교육·IPS 다음 과제·참여). 과제는 개인만 */
export type ScheduleEventPerScheduleExtraPlan = {
  showEducation: boolean
  showParticipation: boolean
  showIps: boolean
  showAssignment: boolean
  /** 교육 형태·참여 방식 모두 상이면 한 줄(double) */
  educationWithParticipation: boolean
}

export function getScheduleEventPerScheduleExtraPlan(input: {
  educationFormScheduleDetail: GeneralProgramScheduleDetailKind
  participationScheduleDetail: GeneralProgramScheduleDetailKind
  ipsScheduleDetail: GeneralProgramScheduleDetailKind
  participantOrganization: boolean
}): ScheduleEventPerScheduleExtraPlan {
  const showEducation = input.educationFormScheduleDetail === 'perSchedule'
  const showParticipation =
    input.participationScheduleDetail === 'perSchedule' && !input.participantOrganization
  const showIps = input.ipsScheduleDetail === 'perSchedule'
  const showAssignment = !input.participantOrganization
  return {
    showEducation,
    showParticipation,
    showIps,
    showAssignment,
    educationWithParticipation: showEducation && showParticipation,
  }
}

export function hasScheduleEventPerScheduleExtraRows(
  plan: ScheduleEventPerScheduleExtraPlan
): boolean {
  return plan.showEducation || plan.showParticipation || plan.showIps || plan.showAssignment
}

/** 일정형 — 교육·IPS 모두 일정 별 상이면 세부 일정 블록에 교육 형태+IPS를 같은 행에 노출 */
export function isScheduleEducationAndIpsBothPerSchedule(
  educationFormScheduleDetail: GeneralProgramScheduleDetailKind,
  ipsScheduleDetail: GeneralProgramScheduleDetailKind
): boolean {
  return (
    educationFormScheduleDetail === 'perSchedule' && ipsScheduleDetail === 'perSchedule'
  )
}

/** 일정형 복수 — 세부 일정 블록 내 과제·교육·IPS 배치 플랜 */
export type ScheduleDetailPerBlockLayoutPlan =
  | 'none'
  | 'assignment_with_education'
  | 'assignment_with_ips'
  | 'assignment_education_then_ips'

export function getScheduleDetailPerBlockLayoutPlan(
  sessionRound: GeneralProgramSessionRoundKind,
  educationFormScheduleDetail: GeneralProgramScheduleDetailKind,
  ipsScheduleDetail: GeneralProgramScheduleDetailKind
): ScheduleDetailPerBlockLayoutPlan {
  if (sessionRound !== 'multi') return 'none'
  const eduPer = educationFormScheduleDetail === 'perSchedule'
  const ipsPer = ipsScheduleDetail === 'perSchedule'
  if (eduPer && ipsPer) return 'assignment_education_then_ips'
  if (eduPer) return 'assignment_with_education'
  if (ipsPer) return 'assignment_with_ips'
  return 'none'
}

/** 유형 설정 — 단일/복수 분기 (커리큘럼·일정형 공통) */
export function isGeneralProgramMultiRoundForTypeSettings(input: {
  educationStructure: GeneralProgramEducationStructure
  sessionRound: GeneralProgramSessionRoundKind
  curriculumSessions?: GeneralProgramCurriculumSessionRow[] | null
}): boolean {
  if (input.educationStructure === 'schedule') {
    return input.sessionRound === 'multi'
  }
  return isGeneralProgramMultiRoundCurriculum({
    educationStructure: input.educationStructure,
    sessionRound: input.sessionRound,
    curriculumSessions: input.curriculumSessions,
  })
}

function emptyScheduleGroupTimes(count: number) {
  return Array.from({ length: count }, () => ({ startTime: '', endTime: '' }))
}

export function createEmptyScheduleDetailBlock(
  index: number,
  options: { blockKind: ScheduleDetailBlockKind; groupCount: number }
): GeneralProgramScheduleDetailFormValues {
  const { blockKind, groupCount } = options
  return {
    scheduleLabel:
      blockKind === 'preEducation'
        ? PRE_EDUCATION_SCHEDULE_LABEL
        : blockKind === 'event'
          ? padEventScheduleLabel(index)
          : padScheduleDetailLabel(index),
    blockKind,
    name: blockKind === 'preEducation' ? PRE_EDUCATION_SCHEDULE_LABEL : '',
    groupTimes: emptyScheduleGroupTimes(groupCount),
    scheduleDate: '',
    assignmentEnabled: false,
    assignmentPeriod: '',
    educationForm: 'online',
    participationMethod: 'individual',
    ipsCategory: 'prepare',
    ipsDetail: 'none',
  }
}

export function buildDefaultScheduleDetailsForEdit(input: {
  sessionRound: GeneralProgramSessionRoundKind
  scheduleGroupCount: number
  educationFormScheduleDetail: GeneralProgramScheduleDetailKind
  participationScheduleDetail: GeneralProgramScheduleDetailKind
  ipsScheduleDetail: GeneralProgramScheduleDetailKind
  participantOrganization: boolean
}): GeneralProgramScheduleDetailFormValues[] {
  const blockKind: ScheduleDetailBlockKind = shouldUseScheduleEventBlockLayout({
    sessionRound: input.sessionRound,
    participantOrganization: input.participantOrganization,
    educationFormScheduleDetail: input.educationFormScheduleDetail,
    participationScheduleDetail: input.participationScheduleDetail,
    ipsScheduleDetail: input.ipsScheduleDetail,
  })
    ? 'event'
    : 'sub'
  const groupCount =
    input.sessionRound === 'multi' ? 1 : Math.max(1, input.scheduleGroupCount)
  return [0].map(i => createEmptyScheduleDetailBlock(i, { blockKind, groupCount }))
}

export function relabelScheduleDetailFormRowsByKind(
  details: GeneralProgramScheduleDetailFormValues[]
): GeneralProgramScheduleDetailFormValues[] {
  let eventIndex = 0
  let subIndex = 0
  return details.map(d => {
    const blockKind = d.blockKind ?? inferScheduleDetailBlockKind(d.scheduleLabel)
    if (blockKind === 'preEducation') {
      return {
        ...d,
        blockKind,
        scheduleLabel: PRE_EDUCATION_SCHEDULE_LABEL,
        name: d.name.trim() || PRE_EDUCATION_SCHEDULE_LABEL,
        ipsCategory: 'prepare' as const,
        ipsDetail: 'none',
      }
    }
    if (blockKind === 'event') {
      return {
        ...d,
        blockKind,
        scheduleLabel: padEventScheduleLabel(eventIndex++),
      }
    }
    return {
      ...d,
      blockKind,
      scheduleLabel: padScheduleDetailLabel(subIndex++),
    }
  })
}

/** 복수 회차 행사 일정 레이아웃 — 기존 세부 일정을 행사 일정으로 승격 */
export function coerceScheduleDetailsToEventLayout(
  details: GeneralProgramScheduleDetailFormValues[]
): GeneralProgramScheduleDetailFormValues[] {
  return relabelScheduleDetailFormRowsByKind(
    details.map(d =>
      isPreEducationScheduleBlock(d) ? d : { ...d, blockKind: 'event' as const }
    )
  )
}

export function applySchedulePreEducationBlock(
  details: GeneralProgramScheduleDetailFormValues[],
  enabled: boolean,
  options: { groupCount: number }
): GeneralProgramScheduleDetailFormValues[] {
  const withoutPre = details.filter(d => !isPreEducationScheduleBlock(d))
  if (!enabled) {
    return relabelScheduleDetailFormRowsByKind(withoutPre)
  }

  const existingPre = details.find(d => isPreEducationScheduleBlock(d))
  const convertedFirst =
    !existingPre && withoutPre[0]?.name?.trim() === PRE_EDUCATION_SCHEDULE_LABEL
      ? withoutPre[0]
      : undefined
  const rest = convertedFirst ? withoutPre.slice(1) : withoutPre
  const preSource =
    existingPre ??
    convertedFirst ??
    createEmptyScheduleDetailBlock(0, {
      blockKind: 'preEducation',
      groupCount: options.groupCount,
    })

  return relabelScheduleDetailFormRowsByKind([
    {
      ...preSource,
      blockKind: 'preEducation',
      scheduleLabel: PRE_EDUCATION_SCHEDULE_LABEL,
      name: preSource.name.trim() || PRE_EDUCATION_SCHEDULE_LABEL,
      ipsCategory: 'prepare',
      ipsDetail: 'none',
    },
    ...rest,
  ])
}

export function scheduleDetailsPreEducationSyncEqual(
  a: GeneralProgramScheduleDetailFormValues[],
  b: GeneralProgramScheduleDetailFormValues[]
): boolean {
  if (a.length !== b.length) return false
  return a.every((d, i) => {
    const other = b[i]
    return (
      other != null &&
      d.blockKind === other.blockKind &&
      d.scheduleLabel === other.scheduleLabel &&
      d.name === other.name &&
      d.ipsCategory === other.ipsCategory &&
      d.ipsDetail === other.ipsDetail
    )
  })
}

export type CurriculumSessionFormRow = {
  sessionLabel: string
  title: string
  description: string
  assignmentEnabled?: boolean
  assignmentPeriod?: string
  educationForm?: string
  participationMethod?: 'individual' | 'team'
  ipsCategory?: 'inspire' | 'prepare' | 'succeed' | ''
  ipsDetail?: string
  /** 개인 커리큘럼 사전 교육 — 진행 일정 */
  scheduleDate?: string
}

export function isPreEducationCurriculumSession(session: { sessionLabel?: string }): boolean {
  return (session.sessionLabel ?? '').includes(PRE_EDUCATION_SCHEDULE_LABEL)
}

export function padCurriculumSessionLabel(
  index: number,
  sessionRound: GeneralProgramSessionRoundKind
): string {
  return sessionRound === 'multi' ? `${index + 1}회차` : `${index + 1}차시`
}

export function createEmptyCurriculumPreEducationSession(
  _sessionRound: GeneralProgramSessionRoundKind
): CurriculumSessionFormRow {
  return {
    sessionLabel: PRE_EDUCATION_SCHEDULE_LABEL,
    title: PRE_EDUCATION_SCHEDULE_LABEL,
    description: '',
    assignmentEnabled: false,
    assignmentPeriod: '',
    educationForm: 'online',
    ipsCategory: 'prepare',
    ipsDetail: 'none',
    scheduleDate: '',
  }
}

export function relabelCurriculumSessionsByKind(
  sessions: CurriculumSessionFormRow[],
  sessionRound: GeneralProgramSessionRoundKind
): CurriculumSessionFormRow[] {
  let regularIndex = 0
  return sessions.map(session => {
    if (isPreEducationCurriculumSession(session)) {
      return {
        ...session,
        sessionLabel: PRE_EDUCATION_SCHEDULE_LABEL,
        assignmentEnabled: false,
        assignmentPeriod: '',
        ipsCategory: 'prepare' as const,
        ipsDetail: 'none',
      }
    }
    return {
      ...session,
      sessionLabel: padCurriculumSessionLabel(regularIndex++, sessionRound),
    }
  })
}

export function applyCurriculumPreEducationBlock(
  sessions: CurriculumSessionFormRow[],
  enabled: boolean,
  sessionRound: GeneralProgramSessionRoundKind
): CurriculumSessionFormRow[] {
  const withoutPre = sessions.filter(session => !isPreEducationCurriculumSession(session))
  if (!enabled) {
    return relabelCurriculumSessionsByKind(withoutPre, sessionRound)
  }

  const existingPre = sessions.find(session => isPreEducationCurriculumSession(session))
  return relabelCurriculumSessionsByKind(
    [
      existingPre
        ? {
            ...existingPre,
            sessionLabel: PRE_EDUCATION_SCHEDULE_LABEL,
            title: existingPre.title.trim() || PRE_EDUCATION_SCHEDULE_LABEL,
            assignmentEnabled: false,
            assignmentPeriod: '',
            ipsCategory: 'prepare',
            ipsDetail: 'none',
          }
        : createEmptyCurriculumPreEducationSession(sessionRound),
      ...withoutPre,
    ],
    sessionRound
  )
}

export function curriculumSessionsPreEducationSyncEqual(
  a: CurriculumSessionFormRow[],
  b: CurriculumSessionFormRow[]
): boolean {
  if (a.length !== b.length) return false
  return a.every((session, index) => {
    const other = b[index]
    return (
      other != null &&
      session.sessionLabel === other.sessionLabel &&
      session.ipsCategory === other.ipsCategory &&
      session.ipsDetail === other.ipsDetail
    )
  })
}

export function buildDefaultCurriculumSessionsForEdit(
  sessionRound: GeneralProgramSessionRoundKind
): CurriculumSessionFormRow[] {
  if (sessionRound === 'multi') {
    return [1].map(n => ({
      sessionLabel: `${n}회차`,
      title: '1',
      description: '',
      assignmentEnabled: false,
      assignmentPeriod: '',
      educationForm: 'online',
      participationMethod: 'individual' as const,
      ipsCategory: 'prepare' as const,
      ipsDetail: 'none',
    }))
  }
  return [1].map(n => ({
    sessionLabel: `${n}차시`,
    title: '',
    description: '',
    assignmentEnabled: false,
    assignmentPeriod: '',
    educationForm: 'online',
    participationMethod: 'individual' as const,
    ipsCategory: 'prepare' as const,
    ipsDetail: 'none',
  }))
}

export function applyEducationStructureChangeToForm(
  setValue: CommonInfoSetValue,
  getValues: CommonInfoGetValues,
  nextStructure: 'curriculum' | 'schedule'
) {
  if (nextStructure === 'schedule') {
    const values = getValues()
    const scheduleGroupCount =
      values.sessionRound === 'multi' ? 1 : (values.scheduleGroupCount ?? 1)
    if (values.sessionRound === 'multi') {
      setValue('scheduleGroupCount', 1, { shouldDirty: true })
    }
    setValue('scheduleDetails', buildDefaultScheduleDetailsForEdit({
      sessionRound: values.sessionRound,
      scheduleGroupCount,
      educationFormScheduleDetail: values.educationFormScheduleDetail ?? 'common',
      participationScheduleDetail: values.participationScheduleDetail ?? 'common',
      ipsScheduleDetail: values.ipsScheduleDetail ?? 'common',
      participantOrganization: values.participantOrganization,
    }), { shouldDirty: true })
    setValue('curriculumSessions', [], { shouldDirty: true })
    return
  }
  setValue('scheduleDetails', [], { shouldDirty: true })
  setValue('curriculumSessions', buildDefaultCurriculumSessionsForEdit(getValues().sessionRound), {
    shouldDirty: true,
  })
}

export function applySessionRoundChangeToForm(
  setValue: CommonInfoSetValue,
  getValues: CommonInfoGetValues,
  nextRound: GeneralProgramSessionRoundKind
) {
  const values = getValues()
  if (values.educationStructure === 'schedule') {
    const scheduleGroupCount = nextRound === 'multi' ? 1 : (values.scheduleGroupCount ?? 1)
    if (nextRound === 'multi') {
      setValue('scheduleGroupCount', 1, { shouldDirty: true })
    }
    setValue('scheduleDetails', buildDefaultScheduleDetailsForEdit({
      sessionRound: nextRound,
      scheduleGroupCount,
      educationFormScheduleDetail: values.educationFormScheduleDetail ?? 'common',
      participationScheduleDetail: values.participationScheduleDetail ?? 'common',
      ipsScheduleDetail: values.ipsScheduleDetail ?? 'common',
      participantOrganization: values.participantOrganization,
    }), { shouldDirty: true })
    return
  }
  setValue('curriculumSessions', buildDefaultCurriculumSessionsForEdit(nextRound), { shouldDirty: true })
}

export function applyScheduleTypeSettingsDetailChangeToForm(
  setValue: CommonInfoSetValue,
  getValues: CommonInfoGetValues
) {
  const values = getValues()
  if (values.educationStructure !== 'schedule' || values.sessionRound !== 'multi') return
  setValue('scheduleGroupCount', 1, { shouldDirty: true })
  setValue('scheduleDetails', buildDefaultScheduleDetailsForEdit({
    sessionRound: values.sessionRound,
    scheduleGroupCount: 1,
    educationFormScheduleDetail: values.educationFormScheduleDetail ?? 'common',
    participationScheduleDetail: values.participationScheduleDetail ?? 'common',
    ipsScheduleDetail: values.ipsScheduleDetail ?? 'common',
    participantOrganization: values.participantOrganization,
  }), { shouldDirty: true })
}

/** 커리큘럼형 — IPS·교육 형태 일정 설정 변경 시 차시/회차별 필드 시드 (등록 양식과 동일) */
export function applyCurriculumTypeSettingsDetailChangeToForm(
  setValue: CommonInfoSetValue,
  getValues: CommonInfoGetValues
) {
  const values = getValues()
  if (values.educationStructure !== 'curriculum') return

  const topIpsCategory = values.ipsCategory || 'prepare'
  const topIpsDetail = values.ipsDetail || (topIpsCategory === 'prepare' ? 'none' : '')
  const topEducationForm = values.educationForm ?? 'online'

  const sessions = (values.curriculumSessions ?? []).map(session => ({
    ...session,
    educationForm:
      values.educationFormScheduleDetail === 'perSchedule'
        ? session.educationForm || topEducationForm
        : session.educationForm,
    ipsCategory:
      values.ipsScheduleDetail === 'perSchedule'
        ? session.ipsCategory || topIpsCategory
        : session.ipsCategory,
    ipsDetail:
      values.ipsScheduleDetail === 'perSchedule'
        ? session.ipsDetail || topIpsDetail
        : session.ipsDetail,
  }))

  setValue('curriculumSessions', sessions, { shouldDirty: true })
}
