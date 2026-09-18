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
  normalizeSponsorManagerContactIds,
} from '@/features/program/general/model/common-info-edit-schema'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import {
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY,
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
  // 일반·교육받은 교사 모두 Multi Select (기획: 후원사/담당자 Multi)
  const allowMultipleSponsors = true
  const sponsorIdKey = trainedTeachersDefaults
    ? `${TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX}.sponsorId`
    : GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY
  const sponsorIdsKey = trainedTeachersDefaults
    ? `${TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX}.sponsorIds`
    : GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY
  const sponsorContactKey = trainedTeachersDefaults
    ? `${TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX}.managerContactId`
    : GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY
  const sponsorContactIdsKey = trainedTeachersDefaults
    ? `${TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX}.managerContactIds`
    : GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY
  const managerLineKey = trainedTeachersDefaults
    ? `${TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX}.sponsorManagerLine`
    : GENERAL_REGISTRATION_OVERLAY_SPONSOR_MANAGER_LINE_KEY
  // Multi Select에서는 「전체」 싱글 기본값을 쓰지 않음
  const allValueDefault = ''

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
  const [localManagerContactIds, setLocalManagerContactIds] = useProgramRegistrationOverlayKv<
    string[]
  >(sponsorContactIdsKey, [])

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

  const managerContactIds = useMemo(() => {
    const fromOverlay = normalizeSponsorManagerContactIds({
      ids: localManagerContactIds,
      id: managerContactId,
    })
    if (fromOverlay.length > 0) return fromOverlay
    return managerContactId ? [managerContactId] : []
  }, [localManagerContactIds, managerContactId])

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

  const setManagerContactIds = (next: string[]) => {
    const unique = normalizeSponsorManagerContactIds({ ids: next })
    setLocalManagerContactIds(unique)
    const primary = unique[0] ?? ''
    setManagerContactId(primary)
  }

  const setSponsorIds = (next: string[]) => {
    const unique = [...new Set(next.map(id => id.trim()).filter(Boolean))]
    setLocalSponsorIds(unique)
    const primary = unique[0] ?? ''
    setLocalSponsorId(primary)
    if (isSponsorControlled) {
      onSponsorIdChange(primary)
    }
    // 선택 해제된 후원사의 담당자만 제거하고 기존 선택은 유지
    const kept = managerContactIds.filter(ref => {
      const decoded = decodeSponsorManagerContactRef(ref)
      return decoded != null && unique.includes(decoded.sponsorManagementId)
    })
    setManagerContactIds(kept)
  }

  // 단일 후원사 레거시 → 다중 배열 동기화
  useEffect(() => {
    if (!allowMultipleSponsors) return
    if (localSponsorIds.length > 0) return
    if (!sponsorId) return
    setLocalSponsorIds([sponsorId])
  }, [allowMultipleSponsors, localSponsorIds.length, setLocalSponsorIds, sponsorId])

  // 단일 담당자 레거시 → 다중 배열 동기화
  useEffect(() => {
    if (localManagerContactIds.length > 0) return
    if (!managerContactId) return
    if (trainedTeachersDefaults && managerContactId === TRAINED_TEACHERS_REGISTRATION_ALL_VALUE) {
      return
    }
    setLocalManagerContactIds([managerContactId])
  }, [
    localManagerContactIds.length,
    managerContactId,
    setLocalManagerContactIds,
    trainedTeachersDefaults,
  ])

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

  const managerContactsReady = allowMultipleSponsors
    ? sponsorIds.length === 0 ||
      sponsorIds.every(id => multiSponsorContext.contactsBySponsorId[id] != null)
    : isAllSponsor || singleContactsQuery.isSuccess

  // 담당자 API 로드 후 옵션에 없는 overlay 값(이전 mock id 등)만 선택 해제
  useEffect(() => {
    if (!managerContactsReady || managerContactIds.length === 0) return
    if (
      isAllSponsor &&
      managerContactIds.length === 1 &&
      managerContactIds[0] === TRAINED_TEACHERS_REGISTRATION_ALL_VALUE
    ) {
      return
    }
    const optionValues = new Set(managerOptions.map(option => option.value))
    const kept = managerContactIds.filter(id => optionValues.has(id))
    if (kept.length === managerContactIds.length) return
    setManagerContactIds(kept)
  }, [
    isAllSponsor,
    managerContactIds,
    managerContactsReady,
    managerOptions,
    setManagerContactIds,
  ])

  // contact ref[] → 표시용 `이름 | 연락처` (복수 시 `, ` 구분)
  useEffect(() => {
    if (managerContactIds.length === 0) {
      patchProgramRegistrationOverlay({ [managerLineKey]: '' })
      return
    }
    if (
      trainedTeachersDefaults &&
      managerContactIds.length === 1 &&
      managerContactIds[0] === TRAINED_TEACHERS_REGISTRATION_ALL_VALUE
    ) {
      patchProgramRegistrationOverlay({ [managerLineKey]: '' })
      return
    }

    const lines: string[] = []
    for (const ref of managerContactIds) {
      if (allowMultipleSponsors) {
        const decoded = decodeSponsorManagerContactRef(ref)
        if (!decoded) continue
        const contact = multiSponsorContext.contactsBySponsorId[decoded.sponsorManagementId]?.find(
          c => c.id === decoded.contactId
        )
        if (!contact) continue
        lines.push(
          formatSponsorManagerDisplayLine({
            contactName: contact.name,
            position: contact.position,
            phone: contact.phone,
          })
        )
        continue
      }
      const contact = (singleContactsQuery.data ?? []).find(c => c.id === ref)
      if (!contact) continue
      lines.push(
        formatSponsorManagerDisplayLine({
          contactName: contact.name,
          position: contact.position,
          phone: contact.phone,
        })
      )
    }
    patchProgramRegistrationOverlay({
      [managerLineKey]: lines.filter(Boolean).join(', '),
    })
  }, [
    allowMultipleSponsors,
    managerContactIds,
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
                  setManagerContactIds(
                    trainedTeachersDefaults && next === TRAINED_TEACHERS_REGISTRATION_ALL_VALUE
                      ? [TRAINED_TEACHERS_REGISTRATION_ALL_VALUE]
                      : []
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
              mode="multiple"
              withAllOption={false}
              inputSize="medium"
              placeholder="후원사 담당자를 선택하세요"
              width={240}
              showSearch
              optionFilterProp="label"
              options={managerOptions}
              value={managerContactIds}
              disabled={
                allowMultipleSponsors
                  ? sponsorIds.length === 0 || managerOptions.length === 0
                  : trainedTeachersDefaults
                    ? !isAllSponsor && managerOptions.length === 0
                    : !sponsorId || managerOptions.length === 0
              }
              onChange={v => {
                const next = Array.isArray(v) ? v.map(String) : []
                setManagerContactIds(next)
              }}
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
