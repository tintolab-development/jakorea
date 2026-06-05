import type { ProgramParticipantApplicationEditorViewModel } from '@/features/template/hooks/use-program-participant-application-editor'
import type { ProgramParticipantApplicationEditorVariant } from '@/features/template/hooks/use-program-participant-application-editor'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

export function buildGeneralApplicationFormPreviewParagraphBodyOptions(
  variant: ProgramParticipantApplicationEditorVariant,
  vm: Pick<
    ProgramParticipantApplicationEditorViewModel,
    | 'structureLockedParagraphIds'
    | 'programApplicationFormInstructorOptions'
    | 'programApplicationFormVolunteerOptions'
  >,
  hiddenParagraphIds?: ReadonlySet<string>
): RenderFormParagraphBodyOptions {
  return {
    structureLockedParagraphIds: vm.structureLockedParagraphIds,
    programApplicationFormInstitution: variant === 'institution',
    programApplicationFormIndividual: variant === 'individual',
    programApplicationFormInstructor: vm.programApplicationFormInstructorOptions,
    programApplicationFormVolunteer: vm.programApplicationFormVolunteerOptions,
    hiddenParagraphIds,
  }
}
