import {
  getInstitutionApplicationFormHiddenParagraphIds,
  resolveInstitutionApplicationProgramBridge,
  shouldShowInstitutionApplicationScheduleParagraph,
  type InstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph } from '@/features/program/general/lib/institution-application-form-visibility'
import {
  buildInstructorAvailableScheduleSlotsFromProgram,
  buildVolunteerActivityAvailableScheduleSlots,
  type InstructorAvailableScheduleSlot,
} from '@/features/program/general/lib/instructor-application-available-schedule'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import { getVolunteerApplicationFormHiddenParagraphIds } from '@/features/program/general/lib/volunteer-application-form-visibility'
import {
  isGeneralProgramVolunteerInterviewScheduleVisible,
  resolveGeneralProgramVolunteerInterviewSchedulePreviewSeed,
} from '@/features/program/general/lib/volunteer-interview-schedule-display'
import type { ProgramParticipantApplicationEditorViewModel } from '@/features/template/hooks/use-program-participant-application-editor'
import type { ProgramParticipantApplicationEditorVariant } from '@/features/template/hooks/use-program-participant-application-editor'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@/features/template/model/program-application-form-individual-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@/features/template/model/program-application-form-economy-draft'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@/features/template/model/program-application-form-trained-teachers-draft'
import type { Program } from '@/types/domain'
import { isGeneralIndividualTeamParticipationProgram } from '@/features/program/general/lib/individual-application-visibility'

export function resolveGeneralApplicationFormHiddenParagraphIds(
  variant: ProgramParticipantApplicationEditorVariant,
  params: {
    program?: Program | null
    paragraphs: readonly WritingFormParagraph[]
    institutionBridge?: InstitutionApplicationProgramBridge
    /** 템플릿 작성 — 봉사자 이전 참여 단락 등 응답 조건부 단락 기본 노출 */
    isTemplateAuthoringMode?: boolean
  }
): ReadonlySet<string> | undefined {
  if (variant === 'institution' && params.institutionBridge) {
    return getInstitutionApplicationFormHiddenParagraphIds(params.institutionBridge)
  }
  if (variant === 'trained-teachers-application-institution' && params.institutionBridge) {
    const hidden = getInstitutionApplicationFormHiddenParagraphIds(params.institutionBridge)
    if (hidden == null) return undefined

    // 교육받은 교사 신청 폼은 일반 기관 신청 폼과 별도 seed id를 사용한다.
    // 공통 스키마의 scheduleChoice 판정을 전용 preferredSchedule id로 변환해
    // specialized body가 숨겨질 때 원본 horizontal table fallback도 함께 제거한다.
    if (!hidden.has(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice)) return hidden
    const next = new Set(hidden)
    next.delete(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice)
    next.add(PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule)
    return next
  }
  if (variant === 'volunteer') {
    return getVolunteerApplicationFormHiddenParagraphIds(params.paragraphs, {
      interviewEnabled:
        params.program == null
          ? undefined
          : isGeneralProgramVolunteerInterviewScheduleVisible(params.program),
      isTemplateAuthoringMode: params.isTemplateAuthoringMode === true,
    })
  }
  if (variant === 'individual') {
    const bridge =
      params.institutionBridge ??
      (params.program ? resolveInstitutionApplicationProgramBridge(params.program) : undefined)
    if (!bridge) return undefined
    const hidden = new Set<string>()
    if (!shouldShowInstitutionApplicationScheduleParagraph(bridge)) {
      hidden.add(PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice)
    }
    if (params.program && !isGeneralIndividualTeamParticipationProgram(params.program)) {
      hidden.add(PROGRAM_PARTICIPANT_APPLICATION_IDS.teamInfo)
    }
    return hidden.size > 0 ? hidden : undefined
  }
  if (variant === 'economy-application-institution') {
    if (shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph()) return undefined
    return new Set([PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentInquiryMethod])
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
    /** 프로그램 상세 양식 수정·미리보기 — 공통정보 교육 일정 연동 */
    programLinkedApplicationFormPreview?: boolean
    /**
     * 템플릿 카탈로그 등 — PUBLISHED schemaJson 객관식 items 그대로 표시.
     * 프로그램 상세 신청 정보 미리보기에는 쓰지 않는다(공통정보 일정 연동).
     */
    applicationFormPublishedSchemaSnapshotPreview?: boolean
  }
): RenderFormParagraphBodyOptions {
  const { program, paragraphs, institutionBridge, instructorScheduleSlots } = params
  const schemaSnapshotPreview = params.applicationFormPublishedSchemaSnapshotPreview === true
  const programLinkedPreview =
    !schemaSnapshotPreview && params.programLinkedApplicationFormPreview === true

  const programApplicationFormInstructor =
    variant === 'instructor'
      ? {
          ...vm.programApplicationFormInstructorOptions,
          ...(program
            ? {
                scheduleSlots:
                  instructorScheduleSlots ??
                  buildInstructorAvailableScheduleSlotsFromProgram(program),
                ...(isGeneralIndividualProgram(program)
                  ? { hideScheduleCalendar: true as const }
                  : {}),
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
                commonScheduleSeed:
                  resolveGeneralProgramVolunteerInterviewSchedulePreviewSeed(program),
                activityScheduleSlots:
                  instructorScheduleSlots ?? buildVolunteerActivityAvailableScheduleSlots(program),
                ...(isGeneralIndividualProgram(program)
                  ? { hideActivityScheduleCalendar: true as const }
                  : {}),
              }
            : {}),
          ...(programLinkedPreview ? { programLinkedPreview: true as const } : {}),
        }
      : vm.programApplicationFormVolunteerOptions

  const hiddenParagraphIds = schemaSnapshotPreview
    ? undefined
    : resolveGeneralApplicationFormHiddenParagraphIds(variant, {
        program,
        paragraphs,
        institutionBridge,
        isTemplateAuthoringMode: !programLinkedPreview,
      })

  const programApplicationFormEconomyInstitution =
    variant === 'economy-application-institution'
      ? {
          enabled: true as const,
          sponsorId: program?.sponsorId,
          sponsorDisplayName: program?.generalCommonInfo?.sponsorDisplayName,
          isTemplateAuthoringMode: !programLinkedPreview,
          choiceDisplayOnly: !programLinkedPreview,
        }
      : undefined

  return {
    structureLockedParagraphIds: vm.structureLockedParagraphIds,
    structureLockedAuthoringChoicePreview: false,
    structureLockedChoiceDisplayOnly: schemaSnapshotPreview ? true : undefined,
    programApplicationFormInstitution: variant === 'institution',
    programApplicationFormEconomyInstitution,
    programApplicationFormIndividual: variant === 'individual',
    programApplicationFormInstructor,
    programApplicationFormVolunteer,
    programLinkedInstitutionApplicationForm:
      (variant === 'institution' || variant === 'economy-application-institution') &&
      programLinkedPreview,
    programLinkedIndividualApplicationForm: variant === 'individual' && programLinkedPreview,
    applicationFormSchemaSnapshotPreview: schemaSnapshotPreview ? true : undefined,
    institutionApplicationProgramBridge: institutionBridge,
    hiddenParagraphIds,
  }
}
