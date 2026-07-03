import { MOCK_SIDO_SIGUNGU } from './data'
import type { RegionSelectOption } from './types'

export function getSidoOptions(): RegionSelectOption[] {
  return MOCK_SIDO_SIGUNGU.map(sido => ({
    label: sido.name,
    value: sido.name,
  }))
}

export function getSigunguOptions(sido: string): RegionSelectOption[] {
  if (!sido.trim()) {
    return []
  }

  const selected = MOCK_SIDO_SIGUNGU.find(item => item.name === sido)

  return (
    selected?.sigungu.map(sigungu => ({
      label: sigungu.name,
      value: sigungu.name,
    })) ?? []
  )
}

/** `region`/`address` 문자열에서 ~시/~군/~구 토큰을 추출한다. */
export function parseRegionTokens(region?: string): {
  si: string
  gun: string
  gu: string
} {
  if (!region) return { si: '', gun: '', gu: '' }
  const tokens = region.trim().split(/\s+/)
  let si = ''
  let gun = ''
  let gu = ''
  for (const token of tokens) {
    if (token.endsWith('시') && !si) si = token
    else if (token.endsWith('군') && !gun) gun = token
    else if (token.endsWith('구') && !gu) gu = token
  }
  return { si, gun, gu }
}

/** 시/군/구 토큰이 속한 시/도(광역단체)를 `MOCK_SIDO_SIGUNGU`에서 역매핑한다. */
export function resolveSidoFromSigunguTokens(tokens: {
  si: string
  gun: string
  gu: string
}): string {
  return (
    MOCK_SIDO_SIGUNGU.find(sido =>
      sido.sigungu.some(
        sg => sg.name === tokens.si || sg.name === tokens.gun || sg.name === tokens.gu,
      ),
    )?.name ?? ''
  )
}
