import { describe, expect, it } from 'vitest'
import {
  mapNoticeListResponse,
  mapNoticeResponse,
  toNoticeRequestFromForm,
} from './notice-adapters'

describe('notice-adapters', () => {
  it('maps numeric id to string', () => {
    const row = mapNoticeResponse({
      id: 12 as unknown as string,
      title: '공지',
      status: 'published',
    })
    expect(row.id).toBe('12')
    expect(row.status).toBe('published')
  })

  it('maps list items envelope', () => {
    const rows = mapNoticeListResponse({
      items: [{ id: '1', title: 'A' }],
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.title).toBe('A')
  })

  it('maps list content envelope and skips empty ids', () => {
    const rows = mapNoticeListResponse({
      content: [{ id: '2', title: 'B' }, { title: '없음' }],
    })
    expect(rows.map(row => row.id)).toEqual(['2'])
  })

  it('maps a raw array list payload', () => {
    const rows = mapNoticeListResponse([{ id: '3', title: 'C' }])
    expect(rows[0]?.id).toBe('3')
  })

  it('maps public visibility to published status', () => {
    expect(
      toNoticeRequestFromForm({
        title: '제목',
        contentMarkdown: '본문',
        category: '일반',
        visibility: 'public',
        pinToTop: false,
        attachmentNames: [],
        author: '관리자',
      }).status
    ).toBe('published')
  })
})
