import { describe, expect, it } from 'vitest'
import { getCategoryNameByPath } from './menu-config'

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
