import type { GeneralRegistrationEditorExtras } from '@/features/program/general/lib/registration-overlay-to-program'

/**
 * Phase 0-B — editor extras 계약 fixture.
 * overlay KV가 아니라 React/editorState sidecar. apply/seed 우선순위 고정용.
 */

export const EDITOR_EXTRAS_CURRICULUM_SINGLE: GeneralRegistrationEditorExtras = {
  programType: 'curriculum',
  sessionRoundType: 'single',
  educationScheduleMode: 'date',
  educationFormScheduleDetail: 'common',
  participationScheduleDetail: 'common',
  ipsScheduleDetail: 'common',
  curriculumSessionCount: 1,
  curriculumChartSessionCount: 1,
  scheduleCurriculumDetailCount: 1,
  scheduleCurriculumGroupCount: 1,
  scheduleCurriculumPreEducation: false,
  participantOrganization: true,
  participantIndividual: false,
  participantTeacherInstructor: false,
  participantVolunteer: false,
}

export const EDITOR_EXTRAS_CURRICULUM_MULTI: GeneralRegistrationEditorExtras = {
  ...EDITOR_EXTRAS_CURRICULUM_SINGLE,
  sessionRoundType: 'multi',
  curriculumSessionCount: 2,
  curriculumChartSessionCount: 2,
  ipsScheduleDetail: 'perSchedule',
}

export const EDITOR_EXTRAS_SCHEDULE_SINGLE: GeneralRegistrationEditorExtras = {
  ...EDITOR_EXTRAS_CURRICULUM_SINGLE,
  programType: 'schedule',
  scheduleCurriculumDetailCount: 2,
  scheduleCurriculumGroupCount: 1,
}

export const EDITOR_EXTRAS_SCHEDULE_MULTI: GeneralRegistrationEditorExtras = {
  ...EDITOR_EXTRAS_SCHEDULE_SINGLE,
  sessionRoundType: 'multi',
  scheduleCurriculumDetailCount: 2,
  scheduleCurriculumGroupCount: 2,
}

export const EDITOR_EXTRAS_INDIVIDUAL_CURRICULUM: GeneralRegistrationEditorExtras = {
  ...EDITOR_EXTRAS_CURRICULUM_SINGLE,
  participantOrganization: false,
  participantIndividual: true,
}

export const EDITOR_EXTRAS_FALLBACK_WHEN_UNSET: GeneralRegistrationEditorExtras = {
  programType: 'curriculum',
  sessionRoundType: 'single',
}

/**
 * extras vs overlay 우선순위 (코드 확인).
 *
 * 1. 유형·회차·세션 수·참여자 플래그는 overlay 키가 아니다.
 *    등록: buildProgramRegistrationEditorState → wizard editorState JSON.
 *    상세: extrasFromGeneralProgram(GET) → setGeneralRegistrationDetailEditExtras.
 * 2. applyGeneralRegistrationOverlayToProgram 은 extras로 커리큘럼/일정 행을 만들고
 *    generalProgramEducationStructure 컬럼은 쓰지 않는다.
 *    컬럼은 호출부가 넣는다 (registration-local-save args.programType,
 *    useGeneralProgramCommonInfoSave withType).
 * 3. getGeneralRegistrationDetailEditExtras 미설정 시 curriculum+single.
 * 4. seed/resync 시 extrasFromGeneralProgram 이 nested+overlay 맵 길이로 세션 수를 재계산.
 */
export const EDITOR_EXTRAS_PRIORITY_NOTES = [
  'extras.programType wins session row builder (curriculum vs schedule maps)',
  'overlay maps still supply cell values; empty opposite-type maps are written on seed',
  'participant flags extras → generalParticipantTypes / audience',
  'unset detail extras fallback is curriculum + single',
] as const
