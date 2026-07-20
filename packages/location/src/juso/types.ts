/** API 응답의 juso 항목 */
export interface JusoAddressRow {
  roadAddr: string
  roadAddrPart1: string
  jibunAddr: string
  engAddr?: string
  zipNo: string
  admCd: string
  siNm?: string
  sggNm?: string
  emdNm?: string
  rn?: string
  buldMnnm?: string
  buldSlno?: string
  [key: string]: string | undefined
}

/** 검색 결과로 노출할 주소 정보 */
export interface JusoAddressItem {
  roadAddr: string
  jibunAddr: string
  engAddr?: string
  zipNo: string
  siNm: string
  sggNm: string
  emdNm: string
  rn?: string
}

export interface SearchJusoAddressesOptions {
  confmKey: string
  keyword: string
  page?: number
  countPerPage?: number
  apiUrl?: string
  missingKeyMessage?: string
}

export interface SearchJusoAddressesResult {
  addresses: JusoAddressItem[]
  totalCount: number
}

export interface UseJusoAddressSearchOptions {
  confmKey: string
  countPerPage?: number
  apiUrl?: string
  missingKeyMessage?: string
}

export interface UseJusoAddressSearchReturn {
  addresses: JusoAddressItem[]
  totalCount: number
  loading: boolean
  error: Error | null
  search: (
    keyword: string,
    page?: number,
    pageSize?: number,
  ) => Promise<{ addresses: JusoAddressItem[]; totalCount: number }>
  reset: () => void
}
