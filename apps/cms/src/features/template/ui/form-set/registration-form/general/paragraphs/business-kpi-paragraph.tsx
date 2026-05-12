import {
  ProgramRegistrationBusinessKpiParagraph as SharedProgramRegistrationBusinessKpiParagraph,
  type ProgramRegistrationBusinessKpiParagraphProps,
} from '@/features/template/ui/form-set/registration-form/shared/program-registration-business-kpi-paragraph'

export type { ProgramRegistrationBusinessKpiParagraphProps }

export function ProgramRegistrationBusinessKpiParagraph(
  props: ProgramRegistrationBusinessKpiParagraphProps = {}
) {
  return (
    <SharedProgramRegistrationBusinessKpiParagraph
      {...props}
      dispatchedSchoolDisabled
      dispatchedSchoolPlaceholder="해당 없음"
      dispatchedClassDisabled
      dispatchedClassPlaceholder="해당 없음"
    />
  )
}
