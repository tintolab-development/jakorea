import { describe, expect, it } from 'vitest'
import {
  GATED_INFINITE_SCROLL_MIN_TOP_PX,
  parseRootMarginPx,
  shouldArmInfiniteScroll,
  shouldLoadNextInfinitePage,
} from './use-gated-infinite-scroll'

describe('shouldArmInfiniteScroll', () => {
  it('레이아웃 scrollTo(0)·상단 jitter는 무시한다', () => {
    expect(shouldArmInfiniteScroll(0)).toBe(false)
    expect(shouldArmInfiniteScroll(GATED_INFINITE_SCROLL_MIN_TOP_PX - 1)).toBe(false)
  })

  it('사용자가 아래로 스크롤하면 arm 한다', () => {
    expect(shouldArmInfiniteScroll(GATED_INFINITE_SCROLL_MIN_TOP_PX)).toBe(true)
    expect(shouldArmInfiniteScroll(80)).toBe(true)
  })
})

describe('shouldLoadNextInfinitePage', () => {
  const nearSentinel = {
    armed: true,
    hasNextPage: true,
    isFetchingNextPage: false,
    scrollTop: 80,
    sentinelTop: 900,
    rootBottom: 800,
    marginPx: 200,
  }

  it('스크롤하지 않은 채 센티넬이 보여도 다음 페이지를 부르지 않는다', () => {
    expect(
      shouldLoadNextInfinitePage({
        ...nearSentinel,
        armed: false,
        scrollTop: 0,
        sentinelTop: 400,
      })
    ).toBe(false)
  })

  it('상단 scroll 이벤트만으로는 다음 페이지를 부르지 않는다', () => {
    expect(
      shouldLoadNextInfinitePage({
        ...nearSentinel,
        scrollTop: 0,
      })
    ).toBe(false)
  })

  it('스크롤 후 센티넬이 하단 근처이면 다음 페이지를 부른다', () => {
    expect(shouldLoadNextInfinitePage(nearSentinel)).toBe(true)
  })
})

describe('parseRootMarginPx', () => {
  it('px 문자열을 파싱한다', () => {
    expect(parseRootMarginPx('200px')).toBe(200)
    expect(parseRootMarginPx('invalid')).toBe(200)
  })
})
