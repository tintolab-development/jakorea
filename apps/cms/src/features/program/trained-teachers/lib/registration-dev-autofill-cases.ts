import type { GeneralProgramRegistrationParticipantFlags } from '@/features/program/general/model/registration-flow'
import type {
  ProgramRegistrationDevAutofillLayout,
  ProgramRegistrationDevAutofillTypeSettings,
} from '@/features/program/shared/lib/apply-dev-program-registration-autofill'

/** 교육받은 교사 등록 DEV 자동입력 — 기획 기본 7개 케이스. */
export type TrainedTeachersRegistrationDevAutofillCaseId = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type TrainedTeachersRegistrationDevAutofillPreset = {
  id: TrainedTeachersRegistrationDevAutofillCaseId
  label: string
  programTitleKo: string
  publicProgramTitle: string
  participantFlags: GeneralProgramRegistrationParticipantFlags
  layout: ProgramRegistrationDevAutofillLayout
  typeSettings: ProgramRegistrationDevAutofillTypeSettings
  educationJournalEnabled: 'yes' | 'no'
}

export const TRAINED_TEACHERS_REGISTRATION_DEV_AUTOFILL_CASE_LABELS: Record<
  TrainedTeachersRegistrationDevAutofillCaseId,
  string
> = {
  1: 'TCH-01 · 커리큘럼 · 단일 · 날짜',
  2: 'TCH-02 · 커리큘럼 · 단일 · 기간',
  3: 'TCH-03 · 커리큘럼 · 복수 · 날짜',
  4: 'TCH-04 · 커리큘럼 · 복수 · 기간',
  5: 'TCH-05 · 일정 · 단일 · 날짜',
  6: 'TCH-06 · 일정 · 단일 · 기간',
  7: 'TCH-07 · 일정 · 복수 · 행사별 일시',
}

export const TRAINED_TEACHERS_REGISTRATION_DEV_AUTOFILL_CASE_IDS: readonly TrainedTeachersRegistrationDevAutofillCaseId[] =
  [1, 2, 3, 4, 5, 6, 7]

const PARTICIPANT: GeneralProgramRegistrationParticipantFlags = {
  individual: false,
  organization: true,
  teacherInstructor: false,
  volunteer: false,
}

const COMMON_TYPE_FIELDS = {
  educationFormScheduleDetail: 'common' as const,
  participationScheduleDetail: 'common' as const,
  ipsScheduleDetail: 'common' as const,
  educationForm: 'offline',
  participation: 'individual' as const,
}

function layout(input: {
  programType: 'curriculum' | 'schedule'
  sessionRoundType: 'single' | 'multi'
  curriculumSessionCount: number
  curriculumChartSessionCount: number
  scheduleCurriculumDetailCount: number
  scheduleCurriculumGroupCount: number
}): ProgramRegistrationDevAutofillLayout {
  return {
    ...input,
    participantOrganization: true,
    teacherTrainingEnabled: false,
    participant: { ...PARTICIPANT },
  }
}

function typeSettings(
  programType: 'curriculum' | 'schedule',
  sessionRoundType: 'single' | 'multi',
  educationScheduleMode: 'date' | 'period'
): ProgramRegistrationDevAutofillTypeSettings {
  return {
    ...COMMON_TYPE_FIELDS,
    programType,
    sessionRoundType,
    educationScheduleMode,
  }
}

function preset(
  id: TrainedTeachersRegistrationDevAutofillCaseId,
  input: {
    programType: 'curriculum' | 'schedule'
    sessionRoundType: 'single' | 'multi'
    educationScheduleMode: 'date' | 'period'
    curriculumSessionCount: number
    curriculumChartSessionCount: number
    scheduleCurriculumDetailCount: number
    scheduleCurriculumGroupCount: number
  }
): TrainedTeachersRegistrationDevAutofillPreset {
  const label = TRAINED_TEACHERS_REGISTRATION_DEV_AUTOFILL_CASE_LABELS[id]
  return {
    id,
    label,
    programTitleKo: `${label} [교육받은 교사]`,
    publicProgramTitle: `${label} 참가자 모집`,
    participantFlags: { ...PARTICIPANT },
    layout: layout(input),
    typeSettings: typeSettings(
      input.programType,
      input.sessionRoundType,
      input.educationScheduleMode
    ),
    educationJournalEnabled: 'yes',
  }
}

export function resolveTrainedTeachersRegistrationDevAutofillPreset(
  caseId: TrainedTeachersRegistrationDevAutofillCaseId
): TrainedTeachersRegistrationDevAutofillPreset {
  switch (caseId) {
    case 1:
      return preset(1, {
        programType: 'curriculum',
        sessionRoundType: 'single',
        educationScheduleMode: 'date',
        curriculumSessionCount: 1,
        curriculumChartSessionCount: 2,
        scheduleCurriculumDetailCount: 1,
        scheduleCurriculumGroupCount: 1,
      })
    case 2:
      return preset(2, {
        programType: 'curriculum',
        sessionRoundType: 'single',
        educationScheduleMode: 'period',
        curriculumSessionCount: 1,
        curriculumChartSessionCount: 2,
        scheduleCurriculumDetailCount: 1,
        scheduleCurriculumGroupCount: 1,
      })
    case 3:
      return preset(3, {
        programType: 'curriculum',
        sessionRoundType: 'multi',
        educationScheduleMode: 'date',
        curriculumSessionCount: 2,
        curriculumChartSessionCount: 2,
        scheduleCurriculumDetailCount: 1,
        scheduleCurriculumGroupCount: 1,
      })
    case 4:
      return preset(4, {
        programType: 'curriculum',
        sessionRoundType: 'multi',
        educationScheduleMode: 'period',
        curriculumSessionCount: 2,
        curriculumChartSessionCount: 2,
        scheduleCurriculumDetailCount: 1,
        scheduleCurriculumGroupCount: 1,
      })
    case 5:
      return preset(5, {
        programType: 'schedule',
        sessionRoundType: 'single',
        educationScheduleMode: 'date',
        curriculumSessionCount: 1,
        curriculumChartSessionCount: 1,
        scheduleCurriculumDetailCount: 1,
        scheduleCurriculumGroupCount: 2,
      })
    case 6:
      return preset(6, {
        programType: 'schedule',
        sessionRoundType: 'single',
        educationScheduleMode: 'period',
        curriculumSessionCount: 1,
        curriculumChartSessionCount: 1,
        scheduleCurriculumDetailCount: 1,
        scheduleCurriculumGroupCount: 1,
      })
    case 7:
      return preset(7, {
        programType: 'schedule',
        sessionRoundType: 'multi',
        educationScheduleMode: 'date',
        curriculumSessionCount: 1,
        curriculumChartSessionCount: 1,
        scheduleCurriculumDetailCount: 2,
        scheduleCurriculumGroupCount: 1,
      })
  }
}
