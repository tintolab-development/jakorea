import { isAxiosError } from 'axios'
import type { JusoAddressItem } from '@jakorea/location/juso'
import { axiosClient } from '@/shared/api/axios-instance'
import { PLATFORM_ADDRESS_SEARCH_UNAVAILABLE_MESSAGE } from '@/shared/lib/location-env'

const PORTAL_PUBLIC_ADDRESS_SEARCH_PATH = '/api/portal/public/addresses/search'

export type PortalAddressSearchItem = {
  zipcode?: string
  roadAddress?: string
  jibunAddress?: string
  englishAddress?: string
  buildingName?: string
  sido?: string
  sigungu?: string
  /** 읍면동명 → Juso `emdNm` */
  emdName?: string
  /** 도로명 → Juso `rn` */
  roadName?: string
}

export type PortalAddressSearchResponse = {
  content?: PortalAddressSearchItem[]
  page?: number
  size?: number
  totalElements?: number
  source?: string
  /**
   * 검색어 거절(E0005·E0006·E0008~E0013·E0015) — HTTP 200 + `content: []`와 함께 원본 코드가 온다.
   * 화면은 코드별 안내 없이 빈 결과로 처리한다.
   */
  inputErrorCode?: string | null
}

/** 상위 주소 API 장애(502)·시간 초과(504) */
const ADDRESS_SEARCH_UNAVAILABLE_CODES = new Set([
  'ADDRESS_SEARCH_UPSTREAM_FAILED',
  'ADDRESS_SEARCH_TIMEOUT',
])

function isAddressSearchUnavailableError(error: unknown): boolean {
  if (!isAxiosError(error)) return false
  const status = error.response?.status
  const data = error.response?.data as { error?: { code?: unknown } } | undefined
  const code = typeof data?.error?.code === 'string' ? data.error.code.trim().toUpperCase() : ''
  return ADDRESS_SEARCH_UNAVAILABLE_CODES.has(code) || status === 502 || status === 504
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
    emdNm: item.emdName ?? '',
    rn: item.roadName?.trim() || undefined,
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

  let data: unknown
  try {
    const response = await axiosClient.get<unknown>(PORTAL_PUBLIC_ADDRESS_SEARCH_PATH, {
      params: { keyword: trimmed, page: page0, size },
      signal: options.signal,
    })
    data = response.data
  } catch (error) {
    // 자동완성은 호출부가 조용히 목록을 비우고, [검색]은 기존 주소 검색 오류 문구를 보여 준다
    if (isAddressSearchUnavailableError(error)) {
      throw new Error(PLATFORM_ADDRESS_SEARCH_UNAVAILABLE_MESSAGE, { cause: error })
    }
    throw error
  }

  const body = unwrapEnvelope<PortalAddressSearchResponse>(data)
  if (typeof body?.inputErrorCode === 'string' && body.inputErrorCode.trim()) {
    return { addresses: [], totalCount: 0 }
  }
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
