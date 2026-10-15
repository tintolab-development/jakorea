import type { GeneralProgramRegistrationParticipantFlags } from '@/features/program/general/model/registration-flow'
import type {
  ProgramRegistrationDevAutofillLayout,
  ProgramRegistrationDevAutofillTypeSettings,
} from '@/features/program/shared/lib/apply-dev-program-registration-autofill'

/** 일반 프로그램 등록 DEV 자동입력 — 9개 기본 케이스 (강사·봉사자 제외) */
export type GeneralRegistrationDevAutofillCaseId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type GeneralRegistrationDevAutofillAssignmentPolicy =
  | 'none'
  | 'disabled'
  | 'enabledWithPeriod'

export type GeneralRegistrationDevAutofillOverlayBehavior = {
  assignmentPolicy: GeneralRegistrationDevAutofillAssignmentPolicy
  /** 일정형 단일 — groupTimesByDetail 시드 */
  scheduleSingleUsesGroupTimes: boolean
  /** 일정형 복수 — scheduleDateByDetailIso(시각 포함)만 사용 */
  scheduleMultiUsesDetailDates: boolean
}

export type GeneralRegistrationDevAutofillPreset = {
  id: GeneralRegistrationDevAutofillCaseId
  label: string
  /** 대표 프로그램명 (국문) */
  programTitleKo: string
  /** 공고용 프로그램명 */
  publicProgramTitle: string
  participantFlags: GeneralProgramRegistrationParticipantFlags
  layout: ProgramRegistrationDevAutofillLayout
  typeSettings: ProgramRegistrationDevAutofillTypeSettings
  overlayBehavior: GeneralRegistrationDevAutofillOverlayBehavior
}

function devAutofillCaseTitles(input: {
  structure: '커리큘럼형' | '일정형'
  round: '단일 회차' | '복수 회차'
  schedule: '날짜 지정' | '기간 지정' | '일정별 날짜·시간 지정'
  audience: '기관' | '개인'
}): { programTitleKo: string; publicProgramTitle: string } {
  const programTitleKo = `${input.structure} · ${input.round} · ${input.schedule} [ ${input.audience} ]`
  return {
    programTitleKo,
    publicProgramTitle: programTitleKo,
  }
}

const COMMON_TYPE_FIELDS = {
  educationFormScheduleDetail: 'common' as const,
  participationScheduleDetail: 'common' as const,
  ipsScheduleDetail: 'common' as const,
  educationForm: 'offline',
  participation: 'individual' as const,
}

function organizationParticipant(): GeneralProgramRegistrationParticipantFlags {
  return {
    individual: false,
    organization: true,
    teacherInstructor: false,
    volunteer: false,
  }
}

function individualParticipant(): GeneralProgramRegistrationParticipantFlags {
  return {
    individual: true,
    organization: false,
    teacherInstructor: false,
    volunteer: false,
  }
}

function layoutFromPreset(input: {
  organization: boolean
  programType: 'curriculum' | 'schedule'
  sessionRoundType: 'single' | 'multi'
  curriculumSessionCount: number
  curriculumChartSessionCount: number
  scheduleCurriculumDetailCount: number
  scheduleCurriculumGroupCount: number
  participant: GeneralProgramRegistrationParticipantFlags
}): ProgramRegistrationDevAutofillLayout {
  return {
    curriculumSessionCount: input.curriculumSessionCount,
    curriculumChartSessionCount: input.curriculumChartSessionCount,
    scheduleCurriculumDetailCount: input.scheduleCurriculumDetailCount,
    scheduleCurriculumGroupCount: input.scheduleCurriculumGroupCount,
    participantOrganization: input.organization,
    programType: input.programType,
    sessionRoundType: input.sessionRoundType,
    participant: input.participant,
  }
}

export const GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_LABELS: Record<
  GeneralRegistrationDevAutofillCaseId,
  string
> = {
  1: '1. 기관 · 커리큘럼 · 단일 · 날짜',
  2: '2. 기관 · 커리큘럼 · 복수 · 날짜',
  3: '3. 기관 · 커리큘럼 · 복수 · 기간',
  4: '4. 기관 · 일정 · 단일 · 날짜',
  5: '5. 기관 · 일정 · 복수 · 일정별 일시',
  6: '6. 개인 · 커리큘럼 · 단일 · 날짜',
  7: '7. 개인 · 커리큘럼 · 복수 · 날짜',
  8: '8. 개인 · 일정 · 단일 · 날짜',
  9: '9. 개인 · 일정 · 복수 · 일정별 일시',
}

export const GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_IDS: readonly GeneralRegistrationDevAutofillCaseId[] =
  [1, 2, 3, 4, 5, 6, 7, 8, 9]

/**
 * 9케이스 preset은 기관/개인만 고정한다. 화면에서 체크한 교사/봉사자는 에디터 값을 유지한다.
 */
export function mergeGeneralDevAutofillParticipant(
  caseParticipant: GeneralProgramRegistrationParticipantFlags,
  editorParticipant?: GeneralProgramRegistrationParticipantFlags | null
): GeneralProgramRegistrationParticipantFlags {
  const editor = editorParticipant ?? caseParticipant
  return {
    individual: caseParticipant.individual,
    organization: caseParticipant.organization,
    teacherInstructor: editor.teacherInstructor,
    volunteer: editor.volunteer,
  }
}

export function resolveGeneralRegistrationDevAutofillPreset(
  caseId: GeneralRegistrationDevAutofillCaseId
): GeneralRegistrationDevAutofillPreset {
  switch (caseId) {
    case 1:
      return {
        id: 1,
        label: GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_LABELS[1],
        ...devAutofillCaseTitles({
          structure: '커리큘럼형',
          round: '단일 회차',
          schedule: '날짜 지정',
          audience: '기관',
        }),
        participantFlags: organizationParticipant(),
        layout: layoutFromPreset({
          organization: true,
          programType: 'curriculum',
          sessionRoundType: 'single',
          curriculumSessionCount: 1,
          curriculumChartSessionCount: 2,
          scheduleCurriculumDetailCount: 1,
          scheduleCurriculumGroupCount: 1,
          participant: organizationParticipant(),
        }),
        typeSettings: {
          programType: 'curriculum',
          sessionRoundType: 'single',
          educationScheduleMode: 'date',
          ...COMMON_TYPE_FIELDS,
        },
        overlayBehavior: {
          assignmentPolicy: 'none',
          scheduleSingleUsesGroupTimes: false,
          scheduleMultiUsesDetailDates: false,
        },
      }
    case 2:
      return {
        id: 2,
        label: GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_LABELS[2],
        ...devAutofillCaseTitles({
          structure: '커리큘럼형',
          round: '복수 회차',
          schedule: '날짜 지정',
          audience: '기관',
        }),
        participantFlags: organizationParticipant(),
        layout: layoutFromPreset({
          organization: true,
          programType: 'curriculum',
          sessionRoundType: 'multi',
          curriculumSessionCount: 2,
          curriculumChartSessionCount: 2,
          scheduleCurriculumDetailCount: 1,
          scheduleCurriculumGroupCount: 1,
          participant: organizationParticipant(),
        }),
        typeSettings: {
          programType: 'curriculum',
          sessionRoundType: 'multi',
          educationScheduleMode: 'date',
          ...COMMON_TYPE_FIELDS,
        },
        overlayBehavior: {
          assignmentPolicy: 'none',
          scheduleSingleUsesGroupTimes: false,
          scheduleMultiUsesDetailDates: false,
        },
      }
    case 3:
      return {
        id: 3,
        label: GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_LABELS[3],
        ...devAutofillCaseTitles({
          structure: '커리큘럼형',
          round: '복수 회차',
          schedule: '기간 지정',
          audience: '기관',
        }),
        participantFlags: organizationParticipant(),
        layout: layoutFromPreset({
          organization: true,
          programType: 'curriculum',
          sessionRoundType: 'multi',
          curriculumSessionCount: 2,
          curriculumChartSessionCount: 2,
          scheduleCurriculumDetailCount: 1,
          scheduleCurriculumGroupCount: 1,
          participant: organizationParticipant(),
        }),
        typeSettings: {
          programType: 'curriculum',
          sessionRoundType: 'multi',
          educationScheduleMode: 'period',
          ...COMMON_TYPE_FIELDS,
        },
        overlayBehavior: {
          assignmentPolicy: 'none',
          scheduleSingleUsesGroupTimes: false,
          scheduleMultiUsesDetailDates: false,
        },
      }
    case 4:
      return {
        id: 4,
        label: GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_LABELS[4],
        ...devAutofillCaseTitles({
          structure: '일정형',
          round: '단일 회차',
          schedule: '날짜 지정',
          audience: '기관',
        }),
        participantFlags: organizationParticipant(),
        layout: layoutFromPreset({
          organization: true,
          programType: 'schedule',
          sessionRoundType: 'single',
          curriculumSessionCount: 1,
          curriculumChartSessionCount: 1,
          scheduleCurriculumDetailCount: 1,
          scheduleCurriculumGroupCount: 2,
          participant: organizationParticipant(),
        }),
        typeSettings: {
          programType: 'schedule',
          sessionRoundType: 'single',
          educationScheduleMode: 'date',
          ...COMMON_TYPE_FIELDS,
        },
        overlayBehavior: {
          assignmentPolicy: 'disabled',
          scheduleSingleUsesGroupTimes: true,
          scheduleMultiUsesDetailDates: false,
        },
      }
    case 5:
      return {
        id: 5,
        label: GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_LABELS[5],
        ...devAutofillCaseTitles({
          structure: '일정형',
          round: '복수 회차',
          schedule: '일정별 날짜·시간 지정',
          audience: '기관',
        }),
        participantFlags: organizationParticipant(),
        layout: layoutFromPreset({
          organization: true,
          programType: 'schedule',
          sessionRoundType: 'multi',
          curriculumSessionCount: 1,
          curriculumChartSessionCount: 1,
          scheduleCurriculumDetailCount: 2,
          scheduleCurriculumGroupCount: 1,
          participant: organizationParticipant(),
        }),
        typeSettings: {
          programType: 'schedule',
          sessionRoundType: 'multi',
          educationScheduleMode: 'date',
          ...COMMON_TYPE_FIELDS,
        },
        overlayBehavior: {
          assignmentPolicy: 'disabled',
          scheduleSingleUsesGroupTimes: false,
          scheduleMultiUsesDetailDates: true,
        },
      }
    case 6:
      return {
        id: 6,
        label: GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_LABELS[6],
        ...devAutofillCaseTitles({
          structure: '커리큘럼형',
          round: '단일 회차',
          schedule: '날짜 지정',
          audience: '개인',
        }),
        participantFlags: individualParticipant(),
        layout: layoutFromPreset({
          organization: false,
          programType: 'curriculum',
          sessionRoundType: 'single',
          curriculumSessionCount: 1,
          curriculumChartSessionCount: 2,
          scheduleCurriculumDetailCount: 1,
          scheduleCurriculumGroupCount: 1,
          participant: individualParticipant(),
        }),
        typeSettings: {
          programType: 'curriculum',
          sessionRoundType: 'single',
          educationScheduleMode: 'date',
          ...COMMON_TYPE_FIELDS,
        },
        overlayBehavior: {
          assignmentPolicy: 'none',
          scheduleSingleUsesGroupTimes: false,
          scheduleMultiUsesDetailDates: false,
        },
      }
    case 7:
      return {
        id: 7,
        label: GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_LABELS[7],
        ...devAutofillCaseTitles({
          structure: '커리큘럼형',
          round: '복수 회차',
          schedule: '날짜 지정',
          audience: '개인',
        }),
        participantFlags: individualParticipant(),
        layout: layoutFromPreset({
          organization: false,
          programType: 'curriculum',
          sessionRoundType: 'multi',
          curriculumSessionCount: 2,
          curriculumChartSessionCount: 2,
          scheduleCurriculumDetailCount: 1,
          scheduleCurriculumGroupCount: 1,
          participant: individualParticipant(),
        }),
        typeSettings: {
          programType: 'curriculum',
          sessionRoundType: 'multi',
          educationScheduleMode: 'date',
          ...COMMON_TYPE_FIELDS,
        },
        overlayBehavior: {
          assignmentPolicy: 'disabled',
          scheduleSingleUsesGroupTimes: false,
          scheduleMultiUsesDetailDates: false,
        },
      }
    case 8:
      return {
        id: 8,
        label: GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_LABELS[8],
        ...devAutofillCaseTitles({
          structure: '일정형',
          round: '단일 회차',
          schedule: '날짜 지정',
          audience: '개인',
        }),
        participantFlags: individualParticipant(),
        layout: layoutFromPreset({
          organization: false,
          programType: 'schedule',
          sessionRoundType: 'single',
          curriculumSessionCount: 1,
          curriculumChartSessionCount: 1,
          scheduleCurriculumDetailCount: 1,
          scheduleCurriculumGroupCount: 2,
          participant: individualParticipant(),
        }),
        typeSettings: {
          programType: 'schedule',
          sessionRoundType: 'single',
          educationScheduleMode: 'date',
          ...COMMON_TYPE_FIELDS,
        },
        overlayBehavior: {
          assignmentPolicy: 'disabled',
          scheduleSingleUsesGroupTimes: true,
          scheduleMultiUsesDetailDates: false,
        },
      }
    case 9:
      return {
        id: 9,
        label: GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_LABELS[9],
        ...devAutofillCaseTitles({
          structure: '일정형',
          round: '복수 회차',
          schedule: '일정별 날짜·시간 지정',
          audience: '개인',
        }),
        participantFlags: individualParticipant(),
        layout: layoutFromPreset({
          organization: false,
          programType: 'schedule',
          sessionRoundType: 'multi',
          curriculumSessionCount: 1,
          curriculumChartSessionCount: 1,
          scheduleCurriculumDetailCount: 2,
          scheduleCurriculumGroupCount: 1,
          participant: individualParticipant(),
        }),
        typeSettings: {
          programType: 'schedule',
          sessionRoundType: 'multi',
          educationScheduleMode: 'date',
          ...COMMON_TYPE_FIELDS,
        },
        overlayBehavior: {
          assignmentPolicy: 'disabled',
          scheduleSingleUsesGroupTimes: false,
          scheduleMultiUsesDetailDates: true,
        },
      }
    default: {
      const _exhaustive: never = caseId
      return _exhaustive
    }
  }
}
