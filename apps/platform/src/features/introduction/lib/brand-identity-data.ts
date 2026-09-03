import symbol01Url from '../image/symbol-01.svg?url'
import symbol02Url from '../image/symbol-02.svg?url'
import symbol03Url from '../image/symbol-03.svg?url'

export const BRAND_IDENTITY_TITLE = '브랜드 아이덴티티'

export const BRAND_IDENTITY_LEAD =
  'JA Korea의 심볼과 로고는 JA 교육을 통해 청소년들이 함께 성장하고 나아가는 모습을 담고 있습니다.'

export const BRAND_IDENTITY_DESCRIPTION =
  "브랜드의 초기 모델인 '새'의 형상을 바탕으로, 청소년들이 교육을 통해 얻은 지식과 기술, 유연한 사고방식을 세상과 나누며 글로벌 사회에 긍정적인 영향력을 펼쳐가는 모습을 '날개'라는 시각적 상징으로 표현했습니다."

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
