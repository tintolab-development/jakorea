import symbol01Url from '../image/symbol-01.svg?url'
import symbol02Url from '../image/symbol-02.svg?url'
import symbol03Url from '../image/symbol-03.svg?url'

/** 심볼 이미지는 프론트 고정. 문구는 API bi. */

export type BrandSymbolItem = {
  id: string
  src: string
  alt: string
}

export const BRAND_SYMBOLS: readonly BrandSymbolItem[] = [
  {
    id: 'symbol-01',
    src: symbol01Url,
    alt: 'JA Korea 심볼',
  },
  {
    id: 'symbol-02',
    src: symbol02Url,
    alt: 'JA Korea 로고 Member of JA Worldwide 가로형',
  },
  {
    id: 'symbol-03',
    src: symbol03Url,
    alt: 'JA Korea 로고 Member of JA Worldwide 조합형',
  },
] as const
