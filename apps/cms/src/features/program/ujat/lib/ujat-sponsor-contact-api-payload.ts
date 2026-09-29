import {
  isSponsorContactUnselected,
  resolveSponsorContactIdsForEdit,
} from '@/features/program/shared/lib/sponsor-contact-unselected-option'

const OVERLAY_SPONSOR_CONTACT_IDS = 'ujat.basicInfo.sponsorContactIds'
const OVERLAY_SPONSOR_CONTACT_ID = 'ujat.basicInfo.sponsorContactId'

/** API·serviceDetailJson에 실리는 contact id — UI sentinel 제외 */
export function ujatSponsorManagerContactIdsForApi(input: {
  ids?: readonly string[] | null
  id?: string | null
  managerLine?: string | null
}): string[] {
  return resolveSponsorContactIdsForEdit(input).filter(id => !isSponsorContactUnselected(id))
}

/** 등록 overlay snapshot — BE에 sentinel 문자열을 보내지 않는다 */
export function stripUnselectedUjatSponsorContactsFromOverlay(
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...overlay }
  const apiIds = ujatSponsorManagerContactIdsForApi({
    ids: Array.isArray(next[OVERLAY_SPONSOR_CONTACT_IDS])
      ? (next[OVERLAY_SPONSOR_CONTACT_IDS] as unknown[]).map(String)
      : undefined,
    id: typeof next[OVERLAY_SPONSOR_CONTACT_ID] === 'string' ? next[OVERLAY_SPONSOR_CONTACT_ID] : undefined,
    managerLine:
      typeof next['ujat.basicInfo.sponsorManagerName'] === 'string'
        ? next['ujat.basicInfo.sponsorManagerName']
        : undefined,
  })
  next[OVERLAY_SPONSOR_CONTACT_IDS] = apiIds
  next[OVERLAY_SPONSOR_CONTACT_ID] = apiIds[0] ?? ''
  return next
}
