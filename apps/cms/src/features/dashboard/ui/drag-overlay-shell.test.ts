import { describe, expect, it } from 'vitest'
import { getDashboardWidgetOverlayTitle } from './drag-overlay-shell'

describe('getDashboardWidgetOverlayTitle', () => {
  it('알려진 위젯 id는 타이틀을 반환한다', () => {
    expect(getDashboardWidgetOverlayTitle('menu-shortcut-widget')).toBe('메뉴 바로가기')
    expect(getDashboardWidgetOverlayTitle('recruitment-status-widget')).toBe('모집 신청 현황')
  })

  it('미등록 id는 기본 라벨', () => {
    expect(getDashboardWidgetOverlayTitle('unknown-widget')).toBe('위젯')
  })
})
