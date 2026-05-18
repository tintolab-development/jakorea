import type { ProgramParticipantApplicationEditorVariant } from '@/features/template/hooks/use-program-participant-application-editor'
/** `useProgramParticipantApplicationEditor` variant → `template.schema` 정의 id */
export function getTemplateIdForParticipantApplicationVariant(
  variant: ProgramParticipantApplicationEditorVariant
): string {
  switch (variant) {
    case 'institution':
      return 'application-participant-school'
    case 'individual':
      return 'application-participant-individual'
    case 'economy-application-institution':
      return 'application-economy'
    case 'gemini-application-institution':
      return 'application-gemini-visiting-training-school'
    case 'gemini-application-instructor':
      return 'application-gemini-visiting-training-instructor'
    case 'ujat-application-institution':
      return 'application-ujat-school'
    case 'ujat-application-volunteer':
      return 'application-ujat-volunteer'
    case 'applicant-recruit-institution':
      return 'recruitment-participant-school'
    case 'ujat-recruit-institution':
      return 'recruitment-ujat-school'
    case 'applicant-recruit-individual':
      return 'recruitment-participant-individual'
    case 'recruit-instructor':
      return 'recruitment-instructor'
    case 'recruit-volunteer':
      return 'recruitment-volunteer'
    case 'ujat-recruit-volunteer':
      return 'recruitment-ujat-volunteer'
    case 'instructor':
      return 'application-instructor'
    case 'volunteer':
      return 'application-volunteer'
    default: {
      const _exhaustive: never = variant
      return _exhaustive
    }
  }
}