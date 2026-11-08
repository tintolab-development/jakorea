import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { useParticipatingVolunteerAddRegistrationPluginState } from '@/features/program/general/lib/participating-volunteer-add-registration-plugin-state'
import type { ParticipatingVolunteerAddRegistrationSectionContext } from './add-registration-form-types'

/** 참여 봉사자 추가 등록 — 기본 정보(1365 ID) plugin 본문 */
export function ParticipatingVolunteerAddRegistrationBasicInfoParagraph(
  _props: ParticipatingVolunteerAddRegistrationSectionContext
) {
  const { values, setId1365 } = useParticipatingVolunteerAddRegistrationPluginState()

  return (
    <div className="participating-volunteer-add-registration-modal__basic-info-form-stack">
      <DetailInfoForm title="1365 ID" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="1365 ID"
            required
            fullRow
            edit={
              <CmsInput
                inputSize="small"
                width="100%"
                placeholder="1365 ID"
                value={values.id1365}
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
