import { TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE } from '@/features/template/lib/template-form-select-options'
import { PRE_EDUCATION_SCHEDULE_LABEL } from '@/features/program/general/lib/schedule-detail-form'
import type { ProgramRegistrationType } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { emptyCurriculumMaps, emptyScheduleMaps } from './common-info-domain'
import type {
  CommonInfoCurriculumMaps,
  CommonInfoScheduleMaps,
  IndependentSessionAuthoring,
} from './common-info-form-values'
import type { RegistrationWizardUiValues } from './registration-wizard-ui-values'

export function trimIndexRecord<T>(
  record: Record<number, T>,
  maxKey: number,
  minKey = 1
): Record<number, T> {
  if (maxKey <= 0) return {}
  const next: Record<number, T> = {}
  for (const [raw, value] of Object.entries(record)) {
    const index = Number(raw)
    if (!Number.isInteger(index) || index < minKey || index > maxKey) continue
    next[index] = value as T
  }
  return next
}

export function trimCurriculumMaps(
  maps: CommonInfoCurriculumMaps,
  maxKey: number
): CommonInfoCurriculumMaps {
  return {
    ...maps,
    unitNameBySession: trimIndexRecord(maps.unitNameBySession, maxKey),
    unitContentBySession: trimIndexRecord(maps.unitContentBySession, maxKey),
    progressSessionByRound: trimIndexRecord(maps.progressSessionByRound, maxKey),
    roundContentByRound: trimIndexRecord(maps.roundContentByRound, maxKey),
    educationFormBySession: trimIndexRecord(maps.educationFormBySession, maxKey),
    participationBySession: trimIndexRecord(maps.participationBySession, maxKey),
    ipsBySession: trimIndexRecord(maps.ipsBySession, maxKey),
    assignmentByRound: trimIndexRecord(maps.assignmentByRound, maxKey),
  }
}

/** 일정형 maps — index 0(사전 교육) 보존 */
const PRE_EDUCATION_DETAIL_INDEX = 0

export function trimScheduleMaps(
  maps: CommonInfoScheduleMaps,
  maxKey: number
): CommonInfoScheduleMaps {
  const trim = <T>(record: Record<number, T>) =>
    trimIndexRecord(record, maxKey, PRE_EDUCATION_DETAIL_INDEX)
  return {
    ...maps,
    eventNameByDetail: trim(maps.eventNameByDetail),
    scheduleDateByDetailIso: trim(maps.scheduleDateByDetailIso),
    groupTimesByDetail: trim(maps.groupTimesByDetail),
    educationFormByDetail: trim(maps.educationFormByDetail),
    participationByDetail: trim(maps.participationByDetail),
    ipsByDetailIndex: trim(maps.ipsByDetailIndex),
    assignmentByDetail: trim(maps.assignmentByDetail),
  }
}

function emptyCurriculumMapsForWizard(): CommonInfoCurriculumMaps {
  return {
    ...emptyCurriculumMaps(),
    preEducationScheduleName: PRE_EDUCATION_SCHEDULE_LABEL,
  }
}

function emptyScheduleMapsForWizard(): CommonInfoScheduleMaps {
  return {
    ...emptyScheduleMaps(),
    preEducationName: PRE_EDUCATION_SCHEDULE_LABEL,
  }
}

/** 구조 전환 시 비활성 nested maps 를 명시적으로 비운다. 활성 구조 값은 보존. */
export function applyEducationStructureReset(
  values: RegistrationWizardUiValues,
  nextType: ProgramRegistrationType
): RegistrationWizardUiValues {
  if (nextType === values.extras.programType) {
    return {
      ...values,
      extras: { ...values.extras, programType: nextType },
    }
  }
  if (nextType === 'schedule') {
    return {
      ...values,
      detailedProgramId: TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
      detailedProgramName: '해당없음',
      extras: { ...values.extras, programType: nextType },
      curriculum: emptyCurriculumMapsForWizard(),
    }
  }
  return {
    ...values,
    extras: { ...values.extras, programType: nextType },
    schedule: emptyScheduleMapsForWizard(),
  }
}

export function applyCurriculumCountTrim(
  values: RegistrationWizardUiValues,
  nextCount: number,
  target: 'session' | 'chart' = 'session'
): RegistrationWizardUiValues {
  const count = Math.max(0, nextCount)
  return {
    ...values,
    extras: {
      ...values.extras,
      ...(target === 'session'
        ? { curriculumSessionCount: count }
        : { curriculumChartSessionCount: count }),
    },
    curriculum: trimCurriculumMaps(values.curriculum, count),
  }
}

export function applyScheduleDetailCountTrim(
  values: RegistrationWizardUiValues,
  nextCount: number
): RegistrationWizardUiValues {
  const count = Math.max(0, nextCount)
  return {
    ...values,
    extras: {
      ...values.extras,
      scheduleCurriculumDetailCount: count,
    },
    schedule: trimScheduleMaps(values.schedule, count),
  }
}

export function applyScheduleGroupCountTrim(
  values: RegistrationWizardUiValues,
  nextCount: number
): RegistrationWizardUiValues {
  const count = Math.max(0, nextCount)
  const groupTimesByDetail: CommonInfoScheduleMaps['groupTimesByDetail'] = {}
  for (const [raw, slots] of Object.entries(values.schedule.groupTimesByDetail)) {
    const index = Number(raw)
    if (!Number.isInteger(index)) continue
    groupTimesByDetail[index] = Array.isArray(slots) ? slots.slice(0, count) : slots
  }
  return {
    ...values,
    extras: {
      ...values.extras,
      scheduleCurriculumGroupCount: count,
    },
    schedule: {
      ...values.schedule,
      groupTimesByDetail,
    },
  }
}

export function createRegistrationCreateSessionAuthoring(
  programType: ProgramRegistrationType
): IndependentSessionAuthoring {
  if (programType === 'schedule') {
    return {
      curriculum: { kind: 'clear' },
      schedule: { kind: 'maps' },
    }
  }
  return {
    curriculum: { kind: 'maps' },
    schedule: { kind: 'clear' },
  }
}
