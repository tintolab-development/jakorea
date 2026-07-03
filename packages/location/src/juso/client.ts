import { JUSO_ADDR_LINK_API_URL } from './constants'
import type {
  JusoAddressItem,
  JusoAddressRow,
  SearchJusoAddressesOptions,
  SearchJusoAddressesResult,
} from './types'

const DEFAULT_MISSING_KEY_MESSAGE =
  '행안부 주소 API 승인키가 설정되지 않았습니다. VITE_ADDRESS_API_KEY 또는 VITE_JUSO_CONFM_KEY를 설정한 뒤 개발 서버를 재시작해 주세요.'

function mapRowToItem(row: JusoAddressRow): JusoAddressItem {
  const eng = row.engAddr?.trim()
  return {
    roadAddr: row.roadAddr ?? '',
    jibunAddr: row.jibunAddr ?? '',
    engAddr: eng || undefined,
    zipNo: row.zipNo ?? '',
    siNm: row.siNm ?? '',
    sggNm: row.sggNm ?? '',
    emdNm: row.emdNm ?? '',
    rn: row.rn,
  }
}

export async function searchJusoAddresses(
  options: SearchJusoAddressesOptions,
): Promise<SearchJusoAddressesResult> {
  const {
    confmKey,
    keyword,
    page = 1,
    countPerPage = 10,
    apiUrl = JUSO_ADDR_LINK_API_URL,
    missingKeyMessage = DEFAULT_MISSING_KEY_MESSAGE,
  } = options

  const trimmed = keyword.trim()
  if (!trimmed) {
    return { addresses: [], totalCount: 0 }
  }

  if (!confmKey) {
    throw new Error(missingKeyMessage)
  }

  const params = new URLSearchParams({
    confmKey,
    currentPage: String(page),
    countPerPage: String(Math.min(100, Math.max(1, countPerPage))),
    keyword: trimmed,
    resultType: 'json',
  })
  const res = await fetch(`${apiUrl}?${params.toString()}`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.message ?? `HTTP ${res.status}`)
  }

  const results = data?.results
  const common = results?.common
  const errCode = common?.errorCode
  const errMsg = common?.errorMessage ?? ''

  if (errCode && errCode !== '0') {
    throw new Error(errMsg || `오류 코드: ${errCode}`)
  }

  const total = Number(common?.totalCount) || 0
  const jusoList: JusoAddressRow[] = Array.isArray(results?.juso) ? results.juso : []
  const addresses = jusoList.map(mapRowToItem)

  return { addresses, totalCount: total }
}
