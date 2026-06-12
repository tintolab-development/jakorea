import { buildInstructorAvailableScheduleSlots } from '@/features/program/general/lib/instructor-application-available-schedule'
import type { ProgramParticipantApplicationEditorViewModel } from '@/features/template/hooks/use-program-participant-application-editor'
import type { ProgramParticipantApplicationEditorVariant } from '@/features/template/hooks/use-program-participant-application-editor'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import type { InstructorAvailableScheduleSlot } from '@/features/program/general/lib/instructor-application-available-schedule'
import type { Program } from '@/types/domain'

export function buildGeneralApplicationFormPreviewParagraphBodyOptions(
  variant: ProgramParticipantApplicationEditorVariant,
  vm: Pick<
    ProgramParticipantApplicationEditorViewModel,
    | 'structureLockedParagraphIds'
    | 'programApplicationFormInstructorOptions'
    | 'programApplicationFormVolunteerOptions'
  >,
  hiddenParagraphIds?: ReadonlySet<string>,
  program?: Program | null,
  instructorScheduleSlots?: readonly InstructorAvailableScheduleSlot[]
): RenderFormParagraphBodyOptions {
  const programApplicationFormInstructor =
    variant === 'instructor' && program
      ? {
          ...vm.programApplicationFormInstructorOptions,
          scheduleSlots:
            instructorScheduleSlots ?? buildInstructorAvailableScheduleSlots(program.id),
        }
      : vm.programApplicationFormInstructorOptions

  return {
    structureLockedParagraphIds: vm.structureLockedParagraphIds,
    structureLockedAuthoringChoicePreview: false,
    programApplicationFormInstitution: variant === 'institution',
    programApplicationFormIndividual: variant === 'individual',
    programApplicationFormInstructor,
    programApplicationFormVolunteer: vm.programApplicationFormVolunteerOptions,
    programLinkedInstitutionApplicationForm: variant === 'institution',
    hiddenParagraphIds,
  }
}
