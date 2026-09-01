import {
  getInstitutionApplicationFormHiddenParagraphIds,
  resolveInstitutionApplicationProgramBridge,
  shouldShowInstitutionApplicationScheduleParagraph,
  type InstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { getInstructorApplicationFormHiddenParagraphIds } from '@/features/program/general/lib/institution-application-form-visibility'
import {
  buildInstructorAvailableScheduleSlots,
  type InstructorAvailableScheduleSlot,
} from '@/features/program/general/lib/instructor-application-available-schedule'
import { getVolunteerApplicationFormHiddenParagraphIds } from '@/features/program/general/lib/volunteer-application-form-visibility'
import {
  isGeneralProgramVolunteerInterviewScheduleVisible,
  resolveGeneralProgramVolunteerInterviewScheduleEditSeed,
} from '@/features/program/general/lib/volunteer-interview-schedule-display'
import type { ProgramParticipantApplicationEditorViewModel } from '@/features/template/hooks/use-program-participant-application-editor'
import type { ProgramParticipantApplicationEditorVariant } from '@/features/template/hooks/use-program-participant-application-editor'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@/features/template/model/program-application-form-individual-draft'
import type { Program } from '@/types/domain'
import { isGeneralIndividualTeamParticipationProgram } from '@/features/program/general/lib/individual-application-visibility'

export function resolveGeneralApplicationFormHiddenParagraphIds(
  variant: ProgramParticipantApplicationEditorVariant,
  params: {
    program?: Program | null
    paragraphs: readonly WritingFormParagraph[]
    institutionBridge?: InstitutionApplicationProgramBridge
  }
): ReadonlySet<string> | undefined {
  if (variant === 'institution' && params.institutionBridge) {
    return getInstitutionApplicationFormHiddenParagraphIds(params.institutionBridge)
  }
  if (variant === 'instructor') {
    return getInstructorApplicationFormHiddenParagraphIds()
  }
  if (variant === 'volunteer') {
    return getVolunteerApplicationFormHiddenParagraphIds(params.paragraphs, {
      interviewEnabled:
        params.program == null
          ? undefined
          : isGeneralProgramVolunteerInterviewScheduleVisible(params.program),
    })
  }
  if (variant === 'individual' && params.program) {
    const bridge =
      params.institutionBridge ?? resolveInstitutionApplicationProgramBridge(params.program)
    const hidden = new Set<string>()
    if (!shouldShowInstitutionApplicationScheduleParagraph(bridge)) {
      hidden.add(PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice)
    }
    if (!isGeneralIndividualTeamParticipationProgram(params.program)) {
      hidden.add(PROGRAM_PARTICIPANT_APPLICATION_IDS.teamInfo)
    }
    return hidden.size > 0 ? hidden : undefined
  }
  return undefined
}

export function buildGeneralApplicationFormPreviewParagraphBodyOptions(
  variant: ProgramParticipantApplicationEditorVariant,
  vm: Pick<
    ProgramParticipantApplicationEditorViewModel,
    | 'structureLockedParagraphIds'
    | 'programApplicationFormInstructorOptions'
    | 'programApplicationFormVolunteerOptions'
  >,
  params: {
    program?: Program | null
    paragraphs: readonly WritingFormParagraph[]
    institutionBridge?: InstitutionApplicationProgramBridge
    instructorScheduleSlots?: readonly InstructorAvailableScheduleSlot[]
    /** 프로그램 상세 양식 수정 — 등록·모집 설정 연동 일정 UI */
    programLinkedApplicationFormPreview?: boolean
  }
): RenderFormParagraphBodyOptions {
  const { program, paragraphs, institutionBridge, instructorScheduleSlots } = params
  const programLinkedPreview = params.programLinkedApplicationFormPreview === true

  const programApplicationFormInstructor =
    variant === 'instructor'
      ? {
          ...vm.programApplicationFormInstructorOptions,
          ...(program
            ? {
                scheduleSlots:
                  instructorScheduleSlots ?? buildInstructorAvailableScheduleSlots(program.id),
              }
            : {}),
          ...(programLinkedPreview ? { programLinkedPreview: true as const } : {}),
        }
      : vm.programApplicationFormInstructorOptions

  const programApplicationFormVolunteer =
    variant === 'volunteer'
      ? {
          ...vm.programApplicationFormVolunteerOptions,
          ...(program
            ? {
                commonScheduleSeed: resolveGeneralProgramVolunteerInterviewScheduleEditSeed(program),
              }
            : {}),
          ...(programLinkedPreview ? { programLinkedPreview: true as const } : {}),
        }
      : vm.programApplicationFormVolunteerOptions

  const hiddenParagraphIds = resolveGeneralApplicationFormHiddenParagraphIds(variant, {
    program,
    paragraphs,
    institutionBridge,
  })

  return {
    structureLockedParagraphIds: vm.structureLockedParagraphIds,
    structureLockedAuthoringChoicePreview: false,
    programApplicationFormInstitution: variant === 'institution',
    programApplicationFormIndividual: variant === 'individual',
    programApplicationFormInstructor,
    programApplicationFormVolunteer,
    programLinkedInstitutionApplicationForm: variant === 'institution' && programLinkedPreview,
    programLinkedIndividualApplicationForm: variant === 'individual' && programLinkedPreview,
    hiddenParagraphIds,
  }
}
