import { useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import type { ParticipatingVolunteerAddRegistrationSectionContext } from './add-registration-form-types'

/** 참여 봉사자 추가 등록 — 기본 정보(1365 ID) plugin 본문 */
export function ParticipatingVolunteerAddRegistrationBasicInfoParagraph(
  _props: ParticipatingVolunteerAddRegistrationSectionContext
) {
  const [id1365, setId1365] = useState('')

  return (
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
  )
}
