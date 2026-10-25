/**
 * UJAT 프로그램 등록 폼 — 임금 정보 (봉사시간 지급)
 */
import type { UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { UjatWageInfoFields } from '@/features/program/ujat/ui/detail-modal/info/ujat-wage-info-fields'
import { RegistrationWizardDetailInfoForm as DetailInfoForm } from '@/features/program/shared/ui/registration/registration-wizard-detail-info-form'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

export function UjatWageInfoParagraph({
  infoForm,
}: {
  infoForm?: UseFormReturn<ProgramDetailEditFormValues>
}) {
  return (
    <DetailInfoForm
      title="임금 정보"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <UjatWageInfoFields mode="edit" form={infoForm} />
    </DetailInfoForm>
  )
}
