import { ProgramRegistrationBusinessKpiParagraph } from '@/features/template/ui/form-set/registration-form/shared/program-registration-business-kpi-paragraph'

export function TrainedTeachersRegistrationBusinessKpiParagraph() {
  return (
    <ProgramRegistrationBusinessKpiParagraph
      overlayKeyPrefix="trainedTeachersRegistration.kpi"
      instructorDisabled
      volunteerDisabled
    />
  )
}
