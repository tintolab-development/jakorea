import { memo, useEffect, useMemo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsSelect } from '@/shared/ui/cms-select'
import { useSponsorContactsQuery } from '@/features/sponsor/hooks/use-sponsor-contacts-query'
import {
  SPONSOR_SELECT_SEARCH_DEBOUNCE_MS,
  useSponsorSelectOptionsInfinite,
} from '@/features/sponsor/hooks/use-sponsor-select-options-infinite'
import { useRegistrationCatalogReady } from '@/features/template/ui/form-set/registration-form/shared/use-registration-catalog-ready'
import { useGeneralProgramSponsorEditContext } from '@/features/program/general/hooks/use-general-program-sponsor-edit-context'
import {
  encodeSponsorManagerContactRef,
  decodeSponsorManagerContactRef,
  formatSponsorManagerSelectLabel,
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
import { mergeSponsorRegistrationSelectOptions } from '@/features/program/general/lib/registration-sponsor-select-option-merge'
import {
  isSponsorContactUnselected,
  normalizeSponsorContactUnselectedSelection,
  SPONSOR_CONTACT_UNSELECTED_LABEL,
  SPONSOR_CONTACT_UNSELECTED_VALUE,
  withSponsorContactUnselectedOption,
} from '@/features/program/shared/lib/sponsor-contact-unselected-option'

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
    return value
      .map(String)
      .map(id => id.trim())
      .filter(Boolean)
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
    const unique = normalizeSponsorContactUnselectedSelection(
      normalizeSponsorManagerContactIds({ ids: next }),
      managerContactIds
    )
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
    // 선택 해제된 후원사의 담당자만 제거하고 기존 선택은 유지 (미선택 sentinel 유지)
    const kept = managerContactIds.filter(ref => {
      if (isSponsorContactUnselected(ref)) return true
      const decoded = decodeSponsorManagerContactRef(ref)
      return decoded != null && unique.includes(decoded.sponsorManagementId)
    })
    setManagerContactIds(
      unique.length > 0 && kept.length === 0 ? [SPONSOR_CONTACT_UNSELECTED_VALUE] : kept
    )
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

  const { catalogReady, onSelectOpenChange } = useRegistrationCatalogReady({
    overlayBasicInfoPrefix: trainedTeachersDefaults
      ? 'trainedTeachersRegistration.basicInfo'
      : 'generalRegistration.basicInfo',
  })
  const sponsorCatalogQuery = useSponsorSelectOptionsInfinite(catalogReady)
  const sponsorApiOptions = sponsorCatalogQuery.options
  const sponsorOptionsLoading =
    catalogReady && sponsorCatalogQuery.isLoading && sponsorApiOptions.length === 0
  const isAllSponsor =
    trainedTeachersDefaults && sponsorId === TRAINED_TEACHERS_REGISTRATION_ALL_VALUE

  // 후원사는 있는데 담당자가 비면 수정 진입·후원사 변경 모두 미선택을 고른다.
  useEffect(() => {
    if (isAllSponsor) return
    if (sponsorIds.length === 0) return
    if (managerContactIds.length > 0) return
    setManagerContactIds([SPONSOR_CONTACT_UNSELECTED_VALUE])
  }, [isAllSponsor, managerContactIds.length, setManagerContactIds, sponsorIds.length])

  const multiSponsorContext = useGeneralProgramSponsorEditContext(
    allowMultipleSponsors ? sponsorIds : [],
    catalogReady
  )
  const singleContactsQuery = useSponsorContactsQuery(
    !allowMultipleSponsors && !isAllSponsor ? sponsorId || null : null,
    !allowMultipleSponsors && !isAllSponsor && Boolean(sponsorId)
  )

  const sponsorOptions = useMemo(
    () =>
      mergeSponsorRegistrationSelectOptions({
        sponsorIds,
        apiOptions: sponsorApiOptions,
        sponsors: multiSponsorContext.sponsors,
      }),
    [multiSponsorContext.sponsors, sponsorApiOptions, sponsorIds]
  )

  const managerContactsReady = allowMultipleSponsors
    ? sponsorIds.length === 0 ||
      (sponsorIds.every(id =>
        multiSponsorContext.sponsors.some(row => String(row.id) === String(id))
      ) &&
        sponsorIds.every(id => multiSponsorContext.contactsBySponsorId[String(id)] != null))
    : isAllSponsor || singleContactsQuery.isSuccess || singleContactsQuery.isError

  const selectedSponsors = useMemo(() => {
    if (!allowMultipleSponsors) return [] as SponsorManagementRow[]
    return sponsorIds
      .map(id => multiSponsorContext.sponsors.find(row => String(row.id) === String(id)))
      .filter((row): row is SponsorManagementRow => row != null)
  }, [allowMultipleSponsors, multiSponsorContext.sponsors, sponsorIds])

  const managerOptions = useMemo(() => {
    if (isAllSponsor) {
      return [{ value: TRAINED_TEACHERS_REGISTRATION_ALL_VALUE, label: '전체' }]
    }
    if (allowMultipleSponsors) {
      const options: Array<{ value: string; label: string }> = []
      for (const sponsor of selectedSponsors) {
        const contacts = multiSponsorContext.contactsBySponsorId[String(sponsor.id)] ?? []
        for (const contact of contacts) {
          options.push({
            value: encodeSponsorManagerContactRef(String(sponsor.id), String(contact.id)),
            label: formatSponsorManagerSelectLabel({
              sponsorName: sponsor.name,
              contactName: contact.name,
              position: contact.position,
              phone: contact.phone,
              multiSponsor: selectedSponsors.length > 1,
            }),
          })
        }
      }
      return options
    }
    if (!sponsorId) return []
    return (singleContactsQuery.data ?? []).map(c => ({
      value: String(c.id),
      label: formatSponsorManagerSelectLabel({
        sponsorName: '',
        contactName: c.name,
        position: c.position,
        phone: c.phone,
        multiSponsor: false,
      }),
    }))
  }, [
    allowMultipleSponsors,
    isAllSponsor,
    multiSponsorContext.contactsBySponsorId,
    selectedSponsors,
    singleContactsQuery.data,
    sponsorId,
  ])

  const managerSelectOptions = useMemo(() => {
    const sponsorChosen =
      isAllSponsor || (allowMultipleSponsors ? sponsorIds.length > 0 : Boolean(sponsorId))
    const needsUnselectedOption =
      sponsorChosen || managerContactIds.some(id => isSponsorContactUnselected(id))
    // 후원사만 고르면 미선택 노출. autofill sentinel은 후원사 로드 전에도 라벨 매칭.
    if (!needsUnselectedOption) return managerOptions
    return withSponsorContactUnselectedOption(managerOptions)
  }, [
    allowMultipleSponsors,
    isAllSponsor,
    managerContactIds,
    managerOptions,
    sponsorId,
    sponsorIds.length,
  ])

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
    const optionValues = new Set(managerSelectOptions.map(option => option.value))
    const kept = managerContactIds.filter(
      id => optionValues.has(id) || isSponsorContactUnselected(id)
    )
    if (kept.length === managerContactIds.length) return
    setManagerContactIds(kept)
  }, [
    isAllSponsor,
    managerContactIds,
    managerContactsReady,
    managerSelectOptions,
    setManagerContactIds,
  ])

  // contact ref[] → 표시용 `이름 직책` (복수 후원사 `(후원사명)`, 복수 담당자 `, `)
  useEffect(() => {
    if (managerContactIds.length === 0) {
      patchProgramRegistrationOverlay({ [managerLineKey]: '' })
      return
    }
    if (managerContactIds.every(id => isSponsorContactUnselected(id))) {
      patchProgramRegistrationOverlay({ [managerLineKey]: SPONSOR_CONTACT_UNSELECTED_LABEL })
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

    const includeSponsorName = allowMultipleSponsors && selectedSponsors.length > 1
    const lines: string[] = []
    for (const ref of managerContactIds) {
      if (isSponsorContactUnselected(ref)) continue
      if (allowMultipleSponsors) {
        const decoded = decodeSponsorManagerContactRef(ref)
        if (!decoded) continue
        const sponsor = selectedSponsors.find(row => String(row.id) === decoded.sponsorManagementId)
        const contact = multiSponsorContext.contactsBySponsorId[decoded.sponsorManagementId]?.find(
          c => c.id === decoded.contactId
        )
        if (!contact) continue
        lines.push(
          formatSponsorManagerSelectLabel({
            sponsorName: sponsor?.name ?? '',
            contactName: contact.name,
            position: contact.position,
            multiSponsor: includeSponsorName,
          })
        )
        continue
      }
      const contact = (singleContactsQuery.data ?? []).find(c => c.id === ref)
      if (!contact) continue
      lines.push(
        formatSponsorManagerSelectLabel({
          sponsorName: '',
          contactName: contact.name,
          position: contact.position,
          multiSponsor: false,
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
    selectedSponsors,
    singleContactsQuery.data,
    trainedTeachersDefaults,
  ])

  return (
    <DetailInfoForm.Row type="double">
      <DetailInfoForm.Field
        label="후원사"
        validationKey="basicInfo.sponsorId"
        edit={
          <div className="detail-info-form-inputs-wrapper-no-gap">
            {allowMultipleSponsors ? (
              <CmsSelect
                mode="multiple"
                withAllOption={false}
                inputSize="small"
                placeholder="후원사를 선택해 주세요"
                width={240}
                options={sponsorOptions}
                value={sponsorIds}
                loading={sponsorOptionsLoading}
                filterLocally={false}
                searchDebounceMs={SPONSOR_SELECT_SEARCH_DEBOUNCE_MS}
                onSearchChange={sponsorCatalogQuery.setSearchDraft}
                hasMore={catalogReady ? (sponsorCatalogQuery.hasNextPage ?? false) : false}
                loadingMore={sponsorCatalogQuery.isFetchingNextPage}
                onLoadMore={() => {
                  void sponsorCatalogQuery.fetchNextPage()
                }}
                onChange={v => {
                  const next = Array.isArray(v) ? v.map(String) : []
                  setSponsorIds(next)
                }}
                onOpenChange={open => {
                  onSelectOpenChange(open)
                  if (!open) sponsorCatalogQuery.setSearchDraft('')
                }}
              />
            ) : (
              <CmsSelect
                withAllOption={trainedTeachersDefaults}
                inputSize="small"
                placeholder="후원사를 선택해 주세요"
                width={240}
                options={sponsorOptions}
                value={sponsorId}
                onOpenChange={onSelectOpenChange}
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
        validationKey="basicInfo.sponsorContactId"
        edit={
          <div className="detail-info-form-inputs-wrapper-no-gap">
            <CmsSelect
              mode="multiple"
              withAllOption={false}
              inputSize="small"
              placeholder="후원사 담당자를 선택해 주세요"
              width={240}
              showSearch
              optionFilterProp="label"
              options={managerSelectOptions}
              value={managerContactIds}
              loading={
                catalogReady &&
                allowMultipleSponsors &&
                sponsorIds.length > 0 &&
                !managerContactsReady
              }
              disabled={allowMultipleSponsors ? sponsorIds.length === 0 : !sponsorId}
              onChange={v => {
                const next = Array.isArray(v) ? v.map(String) : []
                setManagerContactIds(next)
              }}
              onOpenChange={onSelectOpenChange}
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
