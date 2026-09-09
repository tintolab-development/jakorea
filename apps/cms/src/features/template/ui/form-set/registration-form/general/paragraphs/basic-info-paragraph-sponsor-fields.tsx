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
import {
  TRAINED_TEACHERS_REGISTRATION_ALL_VALUE,
  TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX,
} from '@/features/template/ui/form-set/registration-form/trained-teachers/paragraphs/basic-info-defaults'

type ControlledSponsorProps = {
  sponsorId?: string
  onSponsorIdChange?: (sponsorId: string) => void
  sponsorContactId?: string
  onSponsorContactIdChange?: (contactId: string) => void
  /** 교육받은 교사 등록 폼 — 후원사/담당자 기본값 「전체」 */
  trainedTeachersDefaults?: boolean
}

function ProgramRegistrationBasicInfoSponsorFieldsInner({
  sponsorId: sponsorIdProp,
  onSponsorIdChange,
  sponsorContactId: sponsorContactIdProp,
  onSponsorContactIdChange,
  trainedTeachersDefaults = false,
}: ControlledSponsorProps) {
  const sponsorIdKey = trainedTeachersDefaults
    ? `${TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX}.sponsorId`
    : GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY
  const sponsorContactKey = trainedTeachersDefaults
    ? `${TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX}.managerContactId`
    : GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY
  const allValueDefault = trainedTeachersDefaults ? TRAINED_TEACHERS_REGISTRATION_ALL_VALUE : ''

  const [localSponsorId, setLocalSponsorId] = useProgramRegistrationOverlayKv(
    sponsorIdKey,
    allValueDefault
  )
  const [localManagerContactId, setLocalManagerContactId] = useProgramRegistrationOverlayKv(
    sponsorContactKey,
    allValueDefault
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

  const { options: sponsorApiOptions } = useSponsorSelectOptions()
  const isAllSponsor = trainedTeachersDefaults && sponsorId === TRAINED_TEACHERS_REGISTRATION_ALL_VALUE
  const contactsQuery = useSponsorContactsQuery(
    isAllSponsor ? null : sponsorId || null,
    !isAllSponsor && Boolean(sponsorId)
  )

  const sponsorOptions = useMemo(
    () =>
      trainedTeachersDefaults
        ? [{ value: TRAINED_TEACHERS_REGISTRATION_ALL_VALUE, label: '전체' }, ...sponsorApiOptions]
        : sponsorApiOptions,
    [sponsorApiOptions, trainedTeachersDefaults]
  )

  const managerOptions = useMemo(() => {
    if (isAllSponsor) {
      return [{ value: TRAINED_TEACHERS_REGISTRATION_ALL_VALUE, label: '전체' }]
    }
    if (!sponsorId) return []
    return (contactsQuery.data ?? []).map(c => ({
      value: c.id,
      label: c.name,
    }))
  }, [contactsQuery.data, isAllSponsor, sponsorId])

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
                setManagerContactId(
                  trainedTeachersDefaults && next === TRAINED_TEACHERS_REGISTRATION_ALL_VALUE
                    ? TRAINED_TEACHERS_REGISTRATION_ALL_VALUE
                    : ''
                )
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
              disabled={
                trainedTeachersDefaults
                  ? !isAllSponsor && managerOptions.length === 0
                  : !sponsorId || managerOptions.length === 0
              }
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
