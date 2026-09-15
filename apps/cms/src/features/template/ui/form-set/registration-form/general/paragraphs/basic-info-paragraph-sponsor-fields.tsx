import { memo, useEffect, useMemo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsSelect } from '@/shared/ui/cms-select'
import { useSponsorContactsQuery } from '@/features/sponsor/hooks/use-sponsor-contacts-query'
import { useSponsorSelectOptions } from '@/features/sponsor/hooks/use-sponsor-options-query'
import { useGeneralProgramSponsorEditContext } from '@/features/program/general/hooks/use-general-program-sponsor-edit-context'
import {
  encodeSponsorManagerContactRef,
  decodeSponsorManagerContactRef,
  formatSponsorManagerSelectLabel,
  formatSponsorManagerDisplayLine,
} from '@/features/program/general/model/common-info-edit-schema'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import {
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_MANAGER_LINE_KEY,
  patchProgramRegistrationOverlay,
  useProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  TRAINED_TEACHERS_REGISTRATION_ALL_VALUE,
  TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX,
  normalizeTrainedTeachersAllSelectValue,
} from '@/features/template/ui/form-set/registration-form/trained-teachers/paragraphs/basic-info-defaults'

type ControlledSponsorProps = {
  sponsorId?: string
  onSponsorIdChange?: (sponsorId: string) => void
  sponsorContactId?: string
  onSponsorContactIdChange?: (contactId: string) => void
  /** 교육받은 교사 등록 폼 — 후원사/담당자 기본값 「전체」 */
  trainedTeachersDefaults?: boolean
}

function normalizeSponsorIds(value: unknown, fallbackPrimary = ''): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map(id => id.trim()).filter(Boolean)
  }
  const primary = fallbackPrimary.trim()
  return primary ? [primary] : []
}

function ProgramRegistrationBasicInfoSponsorFieldsInner({
  sponsorId: sponsorIdProp,
  onSponsorIdChange,
  sponsorContactId: sponsorContactIdProp,
  onSponsorContactIdChange,
  trainedTeachersDefaults = false,
}: ControlledSponsorProps) {
  const allowMultipleSponsors = !trainedTeachersDefaults
  const sponsorIdKey = trainedTeachersDefaults
    ? `${TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX}.sponsorId`
    : GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY
  const sponsorIdsKey = trainedTeachersDefaults
    ? `${TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX}.sponsorIds`
    : GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY
  const sponsorContactKey = trainedTeachersDefaults
    ? `${TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX}.managerContactId`
    : GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY
  const managerLineKey = trainedTeachersDefaults
    ? `${TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX}.sponsorManagerLine`
    : GENERAL_REGISTRATION_OVERLAY_SPONSOR_MANAGER_LINE_KEY
  const allValueDefault = trainedTeachersDefaults ? TRAINED_TEACHERS_REGISTRATION_ALL_VALUE : ''

  const [localSponsorId, setLocalSponsorId] = useProgramRegistrationOverlayKv(
    sponsorIdKey,
    allValueDefault
  )
  const [localSponsorIds, setLocalSponsorIds] = useProgramRegistrationOverlayKv<string[]>(
    sponsorIdsKey,
    []
  )
  const [localManagerContactId, setLocalManagerContactId] = useProgramRegistrationOverlayKv(
    sponsorContactKey,
    allValueDefault
  )

  const isSponsorControlled = onSponsorIdChange != null
  const rawSponsorId = isSponsorControlled ? (sponsorIdProp ?? '') : localSponsorId
  const rawManagerContactId = isSponsorControlled
    ? (sponsorContactIdProp ?? '')
    : localManagerContactId
  const sponsorId = trainedTeachersDefaults
    ? normalizeTrainedTeachersAllSelectValue(rawSponsorId)
    : rawSponsorId
  const managerContactId = trainedTeachersDefaults
    ? normalizeTrainedTeachersAllSelectValue(rawManagerContactId)
    : rawManagerContactId

  const sponsorIds = useMemo(() => {
    if (!allowMultipleSponsors) {
      return sponsorId ? [sponsorId] : []
    }
    const fromOverlay = normalizeSponsorIds(localSponsorIds, sponsorId)
    if (fromOverlay.length > 0) return fromOverlay
    return sponsorId ? [sponsorId] : []
  }, [allowMultipleSponsors, localSponsorIds, sponsorId])

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

  const setSponsorIds = (next: string[]) => {
    const unique = [...new Set(next.map(id => id.trim()).filter(Boolean))]
    setLocalSponsorIds(unique)
    const primary = unique[0] ?? ''
    setLocalSponsorId(primary)
    if (isSponsorControlled) {
      onSponsorIdChange(primary)
    }
    setManagerContactId('')
  }

  // 단일 후원사 레거시 → 다중 배열 동기화
  useEffect(() => {
    if (!allowMultipleSponsors) return
    if (localSponsorIds.length > 0) return
    if (!sponsorId) return
    setLocalSponsorIds([sponsorId])
  }, [allowMultipleSponsors, localSponsorIds.length, setLocalSponsorIds, sponsorId])

  const { options: sponsorApiOptions } = useSponsorSelectOptions()
  const isAllSponsor = trainedTeachersDefaults && sponsorId === TRAINED_TEACHERS_REGISTRATION_ALL_VALUE

  const multiSponsorContext = useGeneralProgramSponsorEditContext(
    allowMultipleSponsors ? sponsorIds : []
  )
  const singleContactsQuery = useSponsorContactsQuery(
    !allowMultipleSponsors && !isAllSponsor ? sponsorId || null : null,
    !allowMultipleSponsors && !isAllSponsor && Boolean(sponsorId)
  )

  const sponsorOptions = sponsorApiOptions

  const selectedSponsors = useMemo(() => {
    if (!allowMultipleSponsors) return [] as SponsorManagementRow[]
    return sponsorIds
      .map(id => multiSponsorContext.sponsors.find(row => row.id === id))
      .filter((row): row is SponsorManagementRow => row != null)
  }, [allowMultipleSponsors, multiSponsorContext.sponsors, sponsorIds])

  const managerOptions = useMemo(() => {
    if (isAllSponsor) {
      return [{ value: TRAINED_TEACHERS_REGISTRATION_ALL_VALUE, label: '전체' }]
    }
    if (allowMultipleSponsors) {
      const options: Array<{ value: string; label: string }> = []
      for (const sponsor of selectedSponsors) {
        const contacts = multiSponsorContext.contactsBySponsorId[sponsor.id] ?? []
        for (const contact of contacts) {
          options.push({
            value: encodeSponsorManagerContactRef(sponsor.id, contact.id),
            label: formatSponsorManagerSelectLabel({
              sponsorName: sponsor.name,
              contactName: contact.name,
              position: contact.position,
              multiSponsor: selectedSponsors.length > 1,
            }),
          })
        }
      }
      return options
    }
    if (!sponsorId) return []
    return (singleContactsQuery.data ?? []).map(c => ({
      value: c.id,
      label: c.name,
    }))
  }, [
    allowMultipleSponsors,
    isAllSponsor,
    multiSponsorContext.contactsBySponsorId,
    selectedSponsors,
    singleContactsQuery.data,
    sponsorId,
  ])

  // contact ref → 표시용 `이름 | 연락처` (create 시 id::id 노출 방지)
  useEffect(() => {
    if (
      !managerContactId ||
      (trainedTeachersDefaults && managerContactId === TRAINED_TEACHERS_REGISTRATION_ALL_VALUE)
    ) {
      patchProgramRegistrationOverlay({ [managerLineKey]: '' })
      return
    }

    if (allowMultipleSponsors) {
      const decoded = decodeSponsorManagerContactRef(managerContactId)
      if (!decoded) {
        patchProgramRegistrationOverlay({ [managerLineKey]: '' })
        return
      }
      const contact = multiSponsorContext.contactsBySponsorId[decoded.sponsorManagementId]?.find(
        c => c.id === decoded.contactId
      )
      patchProgramRegistrationOverlay({
        [managerLineKey]: contact
          ? formatSponsorManagerDisplayLine({
              contactName: contact.name,
              position: contact.position,
              phone: contact.phone,
            })
          : '',
      })
      return
    }

    const contact = (singleContactsQuery.data ?? []).find(c => c.id === managerContactId)
    patchProgramRegistrationOverlay({
      [managerLineKey]: contact
        ? formatSponsorManagerDisplayLine({
            contactName: contact.name,
            position: contact.position,
            phone: contact.phone,
          })
        : '',
    })
  }, [
    allowMultipleSponsors,
    managerContactId,
    managerLineKey,
    multiSponsorContext.contactsBySponsorId,
    singleContactsQuery.data,
    trainedTeachersDefaults,
  ])

  return (
    <DetailInfoForm.Row type="double">
      <DetailInfoForm.Field
        label="후원사"
        edit={
          <div className="detail-info-form-inputs-wrapper-no-gap">
            {allowMultipleSponsors ? (
              <CmsSelect
                mode="multiple"
                withAllOption={false}
                inputSize="medium"
                placeholder="후원사를 선택하세요"
                width={240}
                showSearch
                optionFilterProp="label"
                options={sponsorOptions}
                value={sponsorIds}
                onChange={v => {
                  const next = Array.isArray(v) ? v.map(String) : []
                  setSponsorIds(next)
                }}
              />
            ) : (
              <CmsSelect
                withAllOption={trainedTeachersDefaults}
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
            )}
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
                  : allowMultipleSponsors
                    ? sponsorIds.length === 0 || managerOptions.length === 0
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
