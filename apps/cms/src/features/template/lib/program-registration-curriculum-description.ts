import { PROGRAM_REGISTRATION_GENERAL_SECTION_META } from '@/features/template/ui/form-set/registration-form/general/program-registration-general-section-meta'
import type {
  ProgramRegistrationScheduleDetailKind,
  ProgramRegistrationSessionRoundType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { shouldUseScheduleEventBlockLayout } from '@/features/program/general/lib/schedule-detail-form'

export function resolveProgramRegistrationCurriculumEditDescription(
  sessionRoundType: ProgramRegistrationSessionRoundType
): string {
  return sessionRoundType === 'multi'
    ? PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationCurriculum.editDescriptionMultiRound
    : PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationCurriculum.editDescription
}

/** 일반 프로그램 등록 위저드(커리큘럼형) 카드 설명 — 시안 문구(마침표 포함). 상세 수정은 위 함수 유지 */
export function resolveProgramRegistrationCurriculumRegistrationDescription(
  sessionRoundType: ProgramRegistrationSessionRoundType
): string {
  return sessionRoundType === 'multi'
    ? PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationCurriculum.registrationDescriptionMultiRound
    : PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationCurriculum.registrationDescription
}

export function resolveProgramRegistrationScheduleCurriculumEditDescription(input: {
  sessionRoundType: ProgramRegistrationSessionRoundType
  participantOrganization: boolean
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
}): string {
  const meta = PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationScheduleCurriculum
  if (
    shouldUseScheduleEventBlockLayout({
      sessionRound: input.sessionRoundType,
      participantOrganization: input.participantOrganization,
      educationFormScheduleDetail: input.educationFormScheduleDetail,
      participationScheduleDetail: input.participationScheduleDetail,
      ipsScheduleDetail: input.ipsScheduleDetail,
    })
  ) {
    return meta.editDescriptionMultiRoundEvent
  }
  if (input.sessionRoundType === 'multi') return meta.editDescriptionMultiRound
  return meta.editDescription
}
