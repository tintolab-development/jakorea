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

export type ScheduleEventBlockLayoutInput = {
  sessionRound: GeneralProgramSessionRoundKind
  participantOrganization: boolean
  educationFormScheduleDetail: GeneralProgramScheduleDetailKind
  participationScheduleDetail: GeneralProgramScheduleDetailKind
  ipsScheduleDetail: GeneralProgramScheduleDetailKind
}

/** 일정형 행사 일정 블록 — 개인+복수는 유형 설정과 무관, 기관은 교육·참여·IPS 모두 일정 별 상이 */
export function shouldUseScheduleEventBlockLayout(
  input: ScheduleEventBlockLayoutInput
): boolean {
  if (input.sessionRound !== 'multi') return false
  if (!input.participantOrganization) return true
  return isScheduleMultiAllPerSchedule(
    input.sessionRound,
    input.educationFormScheduleDetail,
    input.participationScheduleDetail,
    input.ipsScheduleDetail
  )
}

/** 행사 일정 블록 — 일정 별 상이 필드 배치 (교육·IPS 다음 과제·참여) */
export type ScheduleEventPerScheduleExtraPlan = {
  showEducation: boolean
  showParticipation: boolean
  showIps: boolean
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
  return {
    showEducation,
    showParticipation,
    showIps,
    educationWithParticipation: showEducation && showParticipation,
  }
}

export function hasScheduleEventPerScheduleExtraRows(
  plan: ScheduleEventPerScheduleExtraPlan
): boolean {
  return plan.showEducation || plan.showParticipation || plan.showIps
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
        name: PRE_EDUCATION_SCHEDULE_LABEL,
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
      name: PRE_EDUCATION_SCHEDULE_LABEL,
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

export function buildDefaultCurriculumSessionsForEdit(
  sessionRound: GeneralProgramSessionRoundKind
): Array<{
  sessionLabel: string
  title: string
  description: string
  assignmentEnabled: boolean
  assignmentPeriod: string
  educationForm: string
  ipsCategory: 'inspire' | 'prepare' | 'succeed' | ''
  ipsDetail: string
}> {
  if (sessionRound === 'multi') {
    return [1].map(n => ({
      sessionLabel: `${n}회차`,
      title: '1',
      description: '',
      assignmentEnabled: false,
      assignmentPeriod: '',
      educationForm: 'online',
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
      values.sessionRound === 'multi' ? 1 : (values.scheduleGroupCount ?? 2)
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
    const scheduleGroupCount = nextRound === 'multi' ? 1 : (values.scheduleGroupCount ?? 2)
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
