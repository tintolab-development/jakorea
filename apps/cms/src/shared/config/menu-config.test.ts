import { describe, expect, it } from 'vitest'
import { getCategoryNameByPath, getMenuItemsByRole } from './menu-config'

describe('getCategoryNameByPath — 게시글 상세 URL', () => {
  it('공지사항 목록은 공지사항', () => {
    expect(getCategoryNameByPath('/admin/posts/notices', 3, 'ADMIN')).toBe('공지사항')
  })

  it('공지사항 상세는 목록과 같은 헤더명', () => {
    expect(getCategoryNameByPath('/admin/posts/notices/notice-1', 3, 'ADMIN')).toBe('공지사항')
    expect(getCategoryNameByPath('/admin/posts/notices/notice-1', 2, 'ADMIN')).toBe('공지사항')
    expect(getCategoryNameByPath('/admin/posts/notices/notice-1', 1, 'ADMIN')).toBe('게시글 관리')
  })

  it('FAQ 상세는 목록과 같은 헤더명', () => {
    expect(getCategoryNameByPath('/admin/posts/faq/faq-1', 3, 'ADMIN')).toBe('FAQ')
  })
})

function collectMenuKeys(items: unknown): string[] {
  if (!Array.isArray(items)) return []
  return items.flatMap(item => {
    if (item == null || typeof item !== 'object') return []
    const record = item as { key?: unknown; children?: unknown }
    const own = typeof record.key === 'string' ? [record.key] : []
    return [...own, ...collectMenuKeys(record.children)]
  })
}

describe('권한 설정 V1.2 — 접근 불가 메뉴도 노출(클릭 시 안내)', () => {
  const user = (roleCode: string) =>
    ({ id: '1', role: 'ADMIN', roleCode, name: '관리자' }) as unknown as Parameters<
      typeof getMenuItemsByRole
    >[1]

  it('Program Viewer에게도 템플릿 관리·정산 항목 설정·계좌 지급 확인 메뉴가 보인다', () => {
    const keys = collectMenuKeys(getMenuItemsByRole('ADMIN', user('PROGRAM_VIEWER')))
    expect(keys.some(key => key.startsWith('/templates'))).toBe(true)
    expect(keys).toContain('/settlement-management/item-settings')
    expect(keys).toContain('/settlement-management/account-payments')
  })

  it('Program Manager에게도 계좌 지급 확인 메뉴가 보인다', () => {
    const keys = collectMenuKeys(getMenuItemsByRole('ADMIN', user('PROGRAM_MANAGER')))
    expect(keys).toContain('/settlement-management/account-payments')
  })
})
