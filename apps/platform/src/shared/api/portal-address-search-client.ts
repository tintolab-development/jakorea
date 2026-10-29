import type { JusoAddressItem } from '@jakorea/location/juso'
import { axiosClient } from '@/shared/api/axios-instance'

const PORTAL_PUBLIC_ADDRESS_SEARCH_PATH = '/api/portal/public/addresses/search'

export type PortalAddressSearchItem = {
  zipcode?: string
  roadAddress?: string
  jibunAddress?: string
  englishAddress?: string
  buildingName?: string
  sido?: string
  sigungu?: string
}

export type PortalAddressSearchResponse = {
  content?: PortalAddressSearchItem[]
  page?: number
  size?: number
  totalElements?: number
  source?: string
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === true && 'data' in o) {
      return unwrapEnvelope<T>(o.data)
    }
  }
  return payload as T
}

export function mapPortalAddressSearchItemToJuso(item: PortalAddressSearchItem): JusoAddressItem {
  const eng = item.englishAddress?.trim()
  return {
    roadAddr: item.roadAddress ?? '',
    jibunAddr: item.jibunAddress ?? '',
    engAddr: eng || undefined,
    zipNo: item.zipcode ?? '',
    siNm: item.sido ?? '',
    sggNm: item.sigungu ?? '',
    emdNm: '',
  }
}

export type SearchPortalAddressesOptions = {
  keyword: string
  /** 1-based page (AddressSearchModal / Juso hook convention) */
  page?: number
  size?: number
  signal?: AbortSignal
}

export async function searchPortalAddresses(
  options: SearchPortalAddressesOptions,
): Promise<{ addresses: JusoAddressItem[]; totalCount: number }> {
  const trimmed = options.keyword.trim()
  if (!trimmed) {
    return { addresses: [], totalCount: 0 }
  }

  const page1 = Math.max(1, options.page ?? 1)
  const size = Math.min(100, Math.max(1, options.size ?? 10))
  const page0 = page1 - 1

  const { data } = await axiosClient.get<unknown>(PORTAL_PUBLIC_ADDRESS_SEARCH_PATH, {
    params: { keyword: trimmed, page: page0, size },
    signal: options.signal,
  })

  const body = unwrapEnvelope<PortalAddressSearchResponse>(data)
  const content = Array.isArray(body?.content) ? body.content : []
  const totalCount =
    typeof body?.totalElements === 'number' && Number.isFinite(body.totalElements)
      ? body.totalElements
      : content.length

  return {
    addresses: content.map(mapPortalAddressSearchItemToJuso),
    totalCount,
  }
}

export { PORTAL_PUBLIC_ADDRESS_SEARCH_PATH }
