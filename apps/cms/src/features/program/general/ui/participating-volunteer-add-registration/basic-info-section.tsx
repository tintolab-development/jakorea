import { useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { CmsInput } from '@/shared/ui/cms-input'
import { resolveParticipatingVolunteerBasicInfoDescription } from '@/features/program/general/lib/participating-volunteer-add-registration-draft'

export function ParticipatingVolunteerAddRegistrationBasicInfoSection() {
  const [id1365, setId1365] = useState('')

  return (
    <section className="participating-volunteer-add-registration-modal__section participating-volunteer-add-registration-modal__section--basic-info">
      <FormParagraphSectionHeader
        title="기본 정보"
        description={resolveParticipatingVolunteerBasicInfoDescription()}
        required
        surface="responseEntry"
        titleAligned
      />
      <div className="participating-volunteer-add-registration-modal__basic-info-form-stack">
        <DetailInfoForm title="1365 ID" hideHeader mode="edit">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="1365 ID"
              fullRow
              edit={
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  placeholder="1365 ID"
                  value={id1365}
                  onChange={e => setId1365(e.target.value)}
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </section>
  )
}
