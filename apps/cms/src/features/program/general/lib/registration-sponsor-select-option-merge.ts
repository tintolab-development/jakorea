import {
  encodeSponsorManagerContactRef,
  formatSponsorManagerSelectLabel,
} from '@/features/program/general/model/common-info-edit-schema'
import {
  isSponsorContactUnselected,
  SPONSOR_CONTACT_UNSELECTED_LABEL,
  withSponsorContactUnselectedIfSponsorsSelected,
} from '@/features/program/shared/lib/sponsor-contact-unselected-option'

/** 후원사 등록 셀렉트 — API 옵션 + 선택 id fallback 라벨 (테스트·UI 공유) */
export function mergeSponsorRegistrationSelectOptions(args: {
  sponsorIds: readonly string[]
  apiOptions: ReadonlyArray<{ value: string; label: string }>
  sponsors: ReadonlyArray<{ id: string | number; name?: string | null }>
}): Array<{ value: string; label: string }> {
  const byId = new Map(
    args.apiOptions.map(option => [String(option.value), { ...option, value: String(option.value) }])
  )
  for (const id of args.sponsorIds) {
    const key = String(id)
    if (byId.has(key)) continue
    const row = args.sponsors.find(sponsor => String(sponsor.id) === key)
    byId.set(key, { value: key, label: row?.name?.trim() || key })
  }
  return [...byId.values()]
}

export function sponsorSelectIdListsEqual(
  next: readonly string[] | undefined,
  previous: readonly string[] | undefined
): boolean {
  const left = (next ?? []).map(String)
  const right = (previous ?? []).map(String)
  if (left.length !== right.length) return false
  return left.every((id, index) => id === right[index])
}

/** 담당자 셀렉트 — 카탈로그에 아직 없는 GET 선택값을 옵션에서 지우지 않는다. */
export function mergeSponsorContactSelectOptions(args: {
  selectedIds: readonly string[]
  apiOptions: ReadonlyArray<{ value: string; label: string }>
}): Array<{ value: string; label: string }> {
  const byId = new Map(
    args.apiOptions.map(option => [String(option.value), { ...option, value: String(option.value) }])
  )
  for (const id of args.selectedIds) {
    const key = String(id)
    if (!key || byId.has(key)) continue
    byId.set(key, {
      value: key,
      label: isSponsorContactUnselected(key) ? SPONSOR_CONTACT_UNSELECTED_LABEL : key,
    })
  }
  return [...byId.values()]
}

/** 일반 상세 공통정보 — 선택된 후원사 담당자 옵션. 담당자 0명이어도 미선택 포함. */
export function buildGeneralProgramSponsorManagerSelectOptions(args: {
  isFormEdit: boolean
  selectedSponsorIds: readonly string[]
  sponsors: ReadonlyArray<{ id: string | number; name?: string | null }>
  sponsorSelectOptions?: ReadonlyArray<{ value: string; label: string }>
  contactsBySponsorId: Record<
    string,
    ReadonlyArray<{
      id: string | number
      name?: string | null
      position?: string | null
      phone?: string | null
    }>
  >
}): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = []
  for (const sponsorId of args.selectedSponsorIds) {
    const id = String(sponsorId)
    const sponsor = args.sponsors.find(row => String(row.id) === id)
    const contacts = args.contactsBySponsorId[id] ?? []
    const sponsorName =
      sponsor?.name?.trim() ||
      args.sponsorSelectOptions?.find(option => option.value === id)?.label?.trim() ||
      ''
    for (const contact of contacts) {
      options.push({
        value: encodeSponsorManagerContactRef(id, String(contact.id)),
        label: formatSponsorManagerSelectLabel({
          sponsorName,
          contactName: contact.name ?? '',
          position: contact.position,
          phone: contact.phone,
          multiSponsor: args.selectedSponsorIds.length > 1,
        }),
      })
    }
  }
  if (!args.isFormEdit) return options
  return withSponsorContactUnselectedIfSponsorsSelected(options, args.selectedSponsorIds.length > 0)
}
