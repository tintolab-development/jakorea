import type { GeneralProgramRegistrationParticipantFlags } from '@/features/program/general/model/registration-flow'
import type {
  ProgramRegistrationDevAutofillLayout,
  ProgramRegistrationDevAutofillTypeSettings,
} from '@/features/program/shared/lib/apply-dev-program-registration-autofill'

/**
 * 교육받은 교사 등록 DEV 자동입력 케이스.
 * 신규 등록은 커리큘럼형 + 기간 지정만 가능하므로(CMS-FUNC-0591·0277) 단일·복수 회차 2개만 둔다.
 * 일정형·날짜 지정 TT는 기존 데이터 확인용 Primary seed(186005~186008 등)로만 본다.
 */
export type TrainedTeachersRegistrationDevAutofillCaseId = 1 | 2

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
  1: '커리큘럼 · 단일 회차 · 기간 지정',
  2: '커리큘럼 · 복수 회차 · 기간 지정',
}

export const TRAINED_TEACHERS_REGISTRATION_DEV_AUTOFILL_CASE_IDS: readonly TrainedTeachersRegistrationDevAutofillCaseId[] =
  [1, 2]

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
    /** 신규 등록 정책 — 커리큘럼형 + 기간 지정만 */
    programType: 'curriculum'
    sessionRoundType: 'single' | 'multi'
    educationScheduleMode: 'period'
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
        educationScheduleMode: 'period',
        curriculumSessionCount: 1,
        curriculumChartSessionCount: 2,
        scheduleCurriculumDetailCount: 1,
        scheduleCurriculumGroupCount: 1,
      })
    case 2:
      return preset(2, {
        programType: 'curriculum',
        sessionRoundType: 'multi',
        educationScheduleMode: 'period',
        curriculumSessionCount: 2,
        curriculumChartSessionCount: 2,
        scheduleCurriculumDetailCount: 1,
        scheduleCurriculumGroupCount: 1,
      })
  }
}
