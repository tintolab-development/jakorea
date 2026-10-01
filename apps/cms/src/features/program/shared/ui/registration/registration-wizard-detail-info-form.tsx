import { DetailInfoForm, type DetailInfoFormProps } from '@/shared/components/detail-info-form'
import { useRegistrationWizardValidationHighlight } from '@/features/program/shared/ui/registration/registration-wizard-validation-highlight'

/** 등록 위저드 — Provider 밖이면 epoch 0·강조 no-op */
function RegistrationWizardDetailInfoFormRoot(props: DetailInfoFormProps) {
  const { attemptId, isFieldIncomplete } = useRegistrationWizardValidationHighlight()
  return (
    <DetailInfoForm
      {...props}
      fieldHighlightEpoch={attemptId}
      fieldIncompleteHighlight={isFieldIncomplete}
    />
  )
}

type RegistrationWizardDetailInfoFormCompound = typeof RegistrationWizardDetailInfoFormRoot & {
  Row: typeof DetailInfoForm.Row
  Field: typeof DetailInfoForm.Field
  NameBlock: typeof DetailInfoForm.NameBlock
  TdDivider: typeof DetailInfoForm.TdDivider
  InputsSeparator: typeof DetailInfoForm.InputsSeparator
  Separator: typeof DetailInfoForm.Separator
}

export const RegistrationWizardDetailInfoForm =
  RegistrationWizardDetailInfoFormRoot as RegistrationWizardDetailInfoFormCompound

RegistrationWizardDetailInfoForm.Row = DetailInfoForm.Row
RegistrationWizardDetailInfoForm.Field = DetailInfoForm.Field
RegistrationWizardDetailInfoForm.NameBlock = DetailInfoForm.NameBlock
RegistrationWizardDetailInfoForm.TdDivider = DetailInfoForm.TdDivider
RegistrationWizardDetailInfoForm.InputsSeparator = DetailInfoForm.InputsSeparator
RegistrationWizardDetailInfoForm.Separator = DetailInfoForm.Separator
