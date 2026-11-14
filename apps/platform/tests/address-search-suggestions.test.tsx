import type { JusoAddressItem } from '@jakorea/location/juso'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  buildAddressSuggestions,
  isAddressSuggestKeywordEligible,
} from '../src/features/auth/sign-up/ui/address-search-modal/address-suggestions'
import {
  highlightKeywordTokens,
  splitKeywordTokens,
} from '../src/shared/lib/highlight-keyword'

function juso(roadAddr: string, jibunAddr = ''): JusoAddressItem {
  return { roadAddr, jibunAddr, zipNo: '', siNm: '', sggNm: '', emdNm: '' }
}

describe('주소 자동완성 호출 조건', () => {
  it('공백을 뺀 2자 이상일 때만 호출한다', () => {
    expect(isAddressSuggestKeywordEligible('')).toBe(false)
    expect(isAddressSuggestKeywordEligible('마')).toBe(false)
    expect(isAddressSuggestKeywordEligible(' 마 ')).toBe(false)
    expect(isAddressSuggestKeywordEligible('마 곡')).toBe(true)
    expect(isAddressSuggestKeywordEligible('마곡')).toBe(true)
  })
})

describe('주소 자동완성 목록', () => {
  it('도로명 주소(없으면 지번)를 표시 줄로 쓰고 표시 문자열 기준으로 중복을 없앤다', () => {
    const suggestions = buildAddressSuggestions(
      [
        juso('서울특별시 강서구 마곡중앙로 171'),
        juso('서울특별시 강서구 마곡중앙로 171', '서울특별시 강서구 마곡동 1'),
        juso('', '서울특별시 강서구 마곡동 760'),
      ],
      '마곡',
    )

    expect(suggestions.map(s => s.line)).toEqual([
      '서울특별시 강서구 마곡중앙로 171',
      '서울특별시 강서구 마곡동 760',
    ])
  })

  it('검색어를 공백 단위로 나눠 모든 토큰이 들어 있는 결과만 남긴다', () => {
    const suggestions = buildAddressSuggestions(
      [
        juso('서울특별시 강서구 마곡중앙로 171'),
        juso('서울특별시 강서구 마곡서로 152'),
        juso('제주특별자치도 제주시 첨단로 242'),
      ],
      '마곡 171',
    )

    expect(suggestions.map(s => s.line)).toEqual(['서울특별시 강서구 마곡중앙로 171'])
  })
})

describe('검색어 토큰 강조', () => {
  it('공백 단위 토큰으로 나누고 빈 토큰·중복을 뺀다', () => {
    expect(splitKeywordTokens('  마곡  171 마곡 ')).toEqual(['마곡', '171'])
  })

  it('일치하는 토큰마다 강조한다', () => {
    const html = renderToStaticMarkup(
      <>{highlightKeywordTokens('서울특별시 강서구 마곡중앙로 171', '171 마곡', 'hit')}</>,
    )

    expect(html).toBe(
      '서울특별시 강서구 <span class="hit">마곡</span>중앙로 <span class="hit">171</span>',
    )
  })

  it('검색어가 비어 있으면 원문을 그대로 돌려준다', () => {
    expect(highlightKeywordTokens('서울특별시', '   ', 'hit')).toBe('서울특별시')
  })
})
