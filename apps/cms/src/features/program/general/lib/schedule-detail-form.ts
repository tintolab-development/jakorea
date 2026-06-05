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

export type ScheduleDetailBlockKind = 'sub' | 'event'

export function padEventScheduleLabel(index: number): string {
  return `행사 일정 ${String(index + 1).padStart(2, '0')}`
}

export function inferScheduleDetailBlockKind(scheduleLabel: string): ScheduleDetailBlockKind {
  return scheduleLabel.includes('행사 일정') ? 'event' : 'sub'
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
      blockKind === 'event' ? padEventScheduleLabel(index) : padScheduleDetailLabel(index),
    blockKind,
    name: '',
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
}): GeneralProgramScheduleDetailFormValues[] {
  const blockKind: ScheduleDetailBlockKind = isScheduleMultiAllPerSchedule(
    input.sessionRound,
    input.educationFormScheduleDetail,
    input.participationScheduleDetail,
    input.ipsScheduleDetail
  )
    ? 'event'
    : 'sub'
  const groupCount =
    input.sessionRound === 'multi' ? 1 : Math.max(1, input.scheduleGroupCount)
  return [0, 1].map(i => createEmptyScheduleDetailBlock(i, { blockKind, groupCount }))
}

export function relabelScheduleDetailFormRowsByKind(
  details: GeneralProgramScheduleDetailFormValues[]
): GeneralProgramScheduleDetailFormValues[] {
  const blockKind = details[0]?.blockKind ?? inferScheduleDetailBlockKind(details[0]?.scheduleLabel ?? '')
  return details.map((d, i) => ({
    ...d,
    blockKind,
    scheduleLabel: blockKind === 'event' ? padEventScheduleLabel(i) : padScheduleDetailLabel(i),
  }))
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
    return [1, 2].map(n => ({
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
  return [1, 2].map(n => ({
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
