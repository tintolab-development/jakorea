import type { ProgramRegistrationParticipantState } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { ProgramRegistrationBasicInfoParagraph } from '@/features/template/ui/form-set/registration-form/general/paragraphs/basic-info-paragraph'

type TrainedTeachersRegistrationBasicInfoParagraphProps = {
  participant: ProgramRegistrationParticipantState
  onIndividualChange: (checked: boolean) => void
  onOrganizationChange: (checked: boolean) => void
  onTeacherInstructorChange: (checked: boolean) => void
  onVolunteerChange: (checked: boolean) => void
}

export function TrainedTeachersRegistrationBasicInfoParagraph(
  props: TrainedTeachersRegistrationBasicInfoParagraphProps
) {
  return (
    <ProgramRegistrationBasicInfoParagraph
      {...props}
      hideEducationPlace
      includeFooterIpsType
    />
  )
}
