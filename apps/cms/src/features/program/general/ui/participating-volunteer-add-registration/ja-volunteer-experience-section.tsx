import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'

export type JaVolunteerExperience = 'yes' | 'no' | undefined

export type ParticipatingVolunteerAddRegistrationJaExperienceSectionProps = {
  value: JaVolunteerExperience
  onChange: (next: JaVolunteerExperience) => void
}

export function ParticipatingVolunteerAddRegistrationJaExperienceSection({
  value,
  onChange,
}: ParticipatingVolunteerAddRegistrationJaExperienceSectionProps) {
  return (
    <section className="participating-volunteer-add-registration-modal__section">
      <FormParagraphSectionHeader
        title="JA 봉사 프로그램 진행 경험 여부"
        description="JA 봉사 프로그램 진행 여부를 선택해 주세요."
        required
        surface="responseEntry"
        titleAligned
      />
      <DetailInfoForm title="JA 봉사 프로그램 진행 경험" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="JA 봉사 프로그램 진행 경험"
            fullRow
            edit={
              <CmsRadioGroup
                size="large"
                value={value}
                onChange={e => onChange(e.target.value as JaVolunteerExperience)}
                style={{ display: 'flex', gap: 20 }}
              >
                <CmsRadio value="yes">있음</CmsRadio>
                <CmsRadio value="no">없음</CmsRadio>
              </CmsRadioGroup>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
}
