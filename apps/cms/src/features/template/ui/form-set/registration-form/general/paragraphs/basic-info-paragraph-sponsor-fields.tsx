import { memo, useMemo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsSelect } from '@/shared/ui/cms-select'
import { useSponsorContactsQuery } from '@/features/sponsor/hooks/use-sponsor-contacts-query'
import { useSponsorSelectOptions } from '@/features/sponsor/hooks/use-sponsor-options-query'
import {
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY,
  useProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'

type ControlledSponsorProps = {
  sponsorId?: string
  onSponsorIdChange?: (sponsorId: string) => void
  sponsorContactId?: string
  onSponsorContactIdChange?: (contactId: string) => void
}

function ProgramRegistrationBasicInfoSponsorFieldsInner({
  sponsorId: sponsorIdProp,
  onSponsorIdChange,
  sponsorContactId: sponsorContactIdProp,
  onSponsorContactIdChange,
}: ControlledSponsorProps) {
  const [localSponsorId, setLocalSponsorId] = useProgramRegistrationOverlayKv(
    GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY,
    ''
  )
  const [localManagerContactId, setLocalManagerContactId] = useProgramRegistrationOverlayKv(
    GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY,
    ''
  )

  const isSponsorControlled = onSponsorIdChange != null
  const sponsorId = isSponsorControlled ? (sponsorIdProp ?? '') : localSponsorId
  const managerContactId = isSponsorControlled
    ? (sponsorContactIdProp ?? '')
    : localManagerContactId

  const setSponsorId = (next: string) => {
    setLocalSponsorId(next)
    if (isSponsorControlled) {
      onSponsorIdChange(next)
    }
  }
  const setManagerContactId = (next: string) => {
    setLocalManagerContactId(next)
    if (isSponsorControlled) {
      onSponsorContactIdChange?.(next)
    }
  }

  const { options: sponsorOptions } = useSponsorSelectOptions()
  const contactsQuery = useSponsorContactsQuery(sponsorId || null, Boolean(sponsorId))

  const managerOptions = useMemo(() => {
    if (!sponsorId) return []
    return (contactsQuery.data ?? []).map(c => ({
      value: c.id,
      label: c.name,
    }))
  }, [contactsQuery.data, sponsorId])

  return (
    <DetailInfoForm.Row type="double">
      <DetailInfoForm.Field
        label="후원사"
        edit={
          <div className="detail-info-form-inputs-wrapper-no-gap">
            <CmsSelect
              withAllOption={false}
              inputSize="medium"
              placeholder="후원사를 선택하세요"
              width={240}
              options={sponsorOptions}
              value={sponsorId}
              onChange={v => {
                const next = String(v ?? '')
                setSponsorId(next)
                setManagerContactId('')
              }}
            />
          </div>
        }
        view="-"
      />
      <DetailInfoForm.Field
        label="후원사 담당자"
        edit={
          <div className="detail-info-form-inputs-wrapper-no-gap">
            <CmsSelect
              inputSize="medium"
              placeholder="후원사 담당자를 선택하세요"
              width={240}
              options={managerOptions}
              value={managerContactId}
              disabled={!sponsorId || managerOptions.length === 0}
              onChange={v => setManagerContactId(String(v ?? ''))}
            />
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

export const ProgramRegistrationBasicInfoSponsorFields = memo(
  ProgramRegistrationBasicInfoSponsorFieldsInner
)
