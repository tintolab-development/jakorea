import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { PROGRAM_REGISTRATION_IDS } from '@/features/template/model/program-registration-draft'
import { ProgramRegistrationBasicInfoParagraph } from '@/features/template/ui/form-set/program-registration-form/paragraphs/basic-info-paragraph'
import { ProgramRegistrationBusinessKpiParagraph } from '@/features/template/ui/form-set/program-registration-form/paragraphs/business-kpi-paragraph'
import { ProgramRegistrationEducationCurriculumParagraph } from '@/features/template/ui/form-set/program-registration-form/paragraphs/education-curriculum-paragraph'
import { ProgramRegistrationEducationScheduleSettingsParagraph } from '@/features/template/ui/form-set/program-registration-form/paragraphs/education-schedule-settings-paragraph'
import { ProgramRegistrationTypeSettingsParagraph } from '@/features/template/ui/form-set/program-registration-form/paragraphs/type-settings-paragraph'
import { ProgramRegistrationWageInfoParagraph } from '@/features/template/ui/form-set/program-registration-form/paragraphs/wage-info-paragraph'

export type ProgramRegistrationType = 'curriculum' | 'schedule'

export interface ProgramRegistrationParticipantState {
  individual: boolean
  organization: boolean
}

export interface ProgramRegistrationParagraphBodyOptions {
  participant: ProgramRegistrationParticipantState
  programType: ProgramRegistrationType
  onIndividualChange: (checked: boolean) => void
  onOrganizationChange: (checked: boolean) => void
}

export function renderProgramRegistrationParagraphBody(
  paragraph: HorizontalTableParagraph,
  options?: ProgramRegistrationParagraphBodyOptions
) {
  switch (paragraph.id) {
    case PROGRAM_REGISTRATION_IDS.basicInfo:
      return options == null ? null : (
        <ProgramRegistrationBasicInfoParagraph
          participant={options.participant}
          onIndividualChange={options.onIndividualChange}
          onOrganizationChange={options.onOrganizationChange}
        />
      )
    case PROGRAM_REGISTRATION_IDS.businessKpi:
      return <ProgramRegistrationBusinessKpiParagraph />
    case PROGRAM_REGISTRATION_IDS.wageInfo:
      return <ProgramRegistrationWageInfoParagraph />
    case PROGRAM_REGISTRATION_IDS.typeSettings:
      return <ProgramRegistrationTypeSettingsParagraph programType={options?.programType ?? 'curriculum'} />
    case PROGRAM_REGISTRATION_IDS.educationCurriculum:
      return <ProgramRegistrationEducationCurriculumParagraph />
    case PROGRAM_REGISTRATION_IDS.educationScheduleSettings:
      return <ProgramRegistrationEducationScheduleSettingsParagraph />
    default:
      return null
  }
}
