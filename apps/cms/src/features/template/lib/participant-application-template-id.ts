import type { ProgramParticipantApplicationEditorVariant } from '@/features/template/hooks/use-program-participant-application-editor'
import { resolveWritingFormBaseTemplateCode } from '@/features/template/lib/form-template-delete-policy'

const VARIANT_BY_TEMPLATE_ID = {
  'application-participant-school': 'institution',
  'application-participant-individual': 'individual',
  'application-economy': 'economy-application-institution',
  'application-trained-teachers': 'trained-teachers-application-institution',
  'application-gemini-visiting-training-school': 'gemini-application-institution',
  'application-gemini-visiting-training-instructor': 'gemini-application-instructor',
  'application-ujat-school': 'ujat-application-institution',
  'application-ujat-volunteer': 'ujat-application-volunteer',
  'recruitment-participant-school': 'applicant-recruit-institution',
  'recruitment-economy': 'economy-recruit-institution',
  'recruitment-trained-teachers': 'trained-teachers-recruit-institution',
  'recruitment-ujat-school': 'ujat-recruit-institution',
  'recruitment-participant-individual': 'applicant-recruit-individual',
  'recruitment-instructor': 'recruit-instructor',
  'recruitment-volunteer': 'recruit-volunteer',
  'recruitment-ujat-volunteer': 'ujat-recruit-volunteer',
  'recruitment-gemini-visiting-training': 'gemini-recruit',
  'application-instructor': 'instructor',
  'application-volunteer': 'volunteer',
} as const satisfies Record<string, ProgramParticipantApplicationEditorVariant>

export function getParticipantApplicationEditorVariantForTemplateCode(
  templateCode: string | undefined | null,
  baseTemplateCode?: string | null
): ProgramParticipantApplicationEditorVariant | undefined {
  if (templateCode == null) return undefined
  const base = resolveWritingFormBaseTemplateCode(templateCode, baseTemplateCode)
  return VARIANT_BY_TEMPLATE_ID[base as keyof typeof VARIANT_BY_TEMPLATE_ID]
}

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
    case 'trained-teachers-application-institution':
      return 'application-trained-teachers'
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
    case 'economy-recruit-institution':
      return 'recruitment-economy'
    case 'trained-teachers-recruit-institution':
      return 'recruitment-trained-teachers'
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
    case 'gemini-recruit':
      return 'recruitment-gemini-visiting-training'
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