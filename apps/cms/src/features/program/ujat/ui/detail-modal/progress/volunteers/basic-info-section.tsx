import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import {
  UjatProgramApplicationVolunteer1365IdForm,
  UjatProgramApplicationVolunteerBasicInfoDetailForm,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/paragraphs/ujat-program-application-volunteer-basic-info-paragraph'
import type { UjatProgramApplicationVolunteerType } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/paragraph-body'

export type UjatEducationProgressVolunteerBasicInfoSectionProps = {
  description?: string
  applicationType: UjatProgramApplicationVolunteerType
  onApplicationTypeChange: (next: UjatProgramApplicationVolunteerType) => void
}

/**
 * 관리자 대리 작성 — 기본 정보
 * 임시 배정 기관 확인 상세(`schedule-confirm-confirmed-detail`)와 동일:
 * 섹션 제목 + form-stack 안에 격자별 DetailInfoForm 분리(1365 ID / 나머지 필드)
 */
export function UjatEducationProgressVolunteerBasicInfoSection({
  description,
  applicationType,
  onApplicationTypeChange,
}: UjatEducationProgressVolunteerBasicInfoSectionProps) {
  return (
    <section
      className="ujat-volunteer-add-registration__section ujat-volunteer-add-registration__section--basic-info"
      aria-labelledby="ujat-volunteer-basic-info-heading"
    >
      <FormParagraphSectionHeader
        title="기본 정보"
        description={description}
        required
        headingId="ujat-volunteer-basic-info-heading"
        surface="responseEntry"
        titleAligned
      />

      <div className="ujat-volunteer-add-registration__basic-info-form-stack">
        <UjatProgramApplicationVolunteer1365IdForm />
        <UjatProgramApplicationVolunteerBasicInfoDetailForm
          applicationType={applicationType}
          onApplicationTypeChange={onApplicationTypeChange}
        />
      </div>
    </section>
  )
}
