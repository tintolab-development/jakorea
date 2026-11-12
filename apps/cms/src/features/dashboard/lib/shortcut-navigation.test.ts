import { describe, expect, it } from 'vitest'
import {
  resolveShortcutNavigationPath,
  resolveShortcutRoutePath,
  shortcutBadgeScopeLabel,
} from './shortcut-navigation'

describe('resolveShortcutRoutePath', () => {
  it('세부 프로그램 관리는 /detailed-program 으로 연결한다 (QA-0083)', () => {
    expect(resolveShortcutRoutePath('programs-detail', '/programs')).toBe('/detailed-program')
  })

  it('다른 키는 카탈로그 경로를 그대로 쓴다', () => {
    expect(resolveShortcutRoutePath('programs-ujat', '/programs/ujat')).toBe('/programs/ujat')
  })
})

describe('resolveShortcutNavigationPath', () => {
  it('문의 대기 배지가 있으면 답변 대기 필터를 건다', () => {
    expect(resolveShortcutNavigationPath('inquiries', '/admin/posts/inquiries', true)).toBe(
      '/admin/posts/inquiries?inq_st=PENDING'
    )
  })

  it('기존 쿼리는 유지한다', () => {
    expect(resolveShortcutNavigationPath('inquiries', '/admin/posts/inquiries?x=1', true)).toBe(
      '/admin/posts/inquiries?x=1&inq_st=PENDING'
    )
  })

  it('배지가 없거나 신규 키면 경로를 바꾸지 않는다', () => {
    expect(resolveShortcutNavigationPath('inquiries', '/admin/posts/inquiries', false)).toBe(
      '/admin/posts/inquiries'
    )
    expect(resolveShortcutNavigationPath('notices', '/admin/posts/notices', true)).toBe(
      '/admin/posts/notices'
    )
  })
})

describe('shortcutBadgeScopeLabel', () => {
  it('대기 키와 신규 키의 집계 범위를 구분한다', () => {
    expect(shortcutBadgeScopeLabel('inquiries', 3)).toBe('처리 대기 3건 (현재 기준)')
    expect(shortcutBadgeScopeLabel('notices', 2)).toBe('마지막 확인 이후 신규 등록 2건')
    expect(shortcutBadgeScopeLabel('programs-detail', 5)).toBe(
      '마지막 확인 이후 신규 등록 프로그램(전체 유형) 5건'
    )
  })
})
