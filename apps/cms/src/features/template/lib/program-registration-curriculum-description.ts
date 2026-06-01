import { PROGRAM_REGISTRATION_GENERAL_SECTION_META } from '@/features/template/ui/form-set/registration-form/general/program-registration-general-section-meta'
import type { ProgramRegistrationSessionRoundType } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'

export function resolveProgramRegistrationCurriculumEditDescription(
  sessionRoundType: ProgramRegistrationSessionRoundType
): string {
  return sessionRoundType === 'multi'
    ? PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationCurriculum.editDescriptionMultiRound
    : PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationCurriculum.editDescription
}
