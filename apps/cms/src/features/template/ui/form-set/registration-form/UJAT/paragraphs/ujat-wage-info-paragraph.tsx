/**
 * UJAT 프로그램 등록 폼 — 임금 정보 (봉사시간 지급)
 */
import { UjatWageInfoFields } from '@/features/program/ujat/ui/detail-modal/info/ujat-wage-info-fields'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

export function UjatWageInfoParagraph() {
  return (
    <DetailInfoForm
      title="임금 정보"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <UjatWageInfoFields mode="edit" />
    </DetailInfoForm>
  )
}
