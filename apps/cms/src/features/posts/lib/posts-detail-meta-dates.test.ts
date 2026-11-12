import { describe, expect, it } from 'vitest'
import { resolvePostsDetailMetaDates } from './posts-detail-meta-dates'

describe('resolvePostsDetailMetaDates', () => {
  it('작성일시와 최종 수정일시(updatedAt)를 함께 만든다', () => {
    expect(
      resolvePostsDetailMetaDates({
        createdAt: '2026-10-01T10:00:00',
        updatedAt: '2026-10-05T09:30:15',
      })
    ).toEqual([
      { key: 'created', text: '작성일시 2026.10.01 10:00:00' },
      { key: 'updated', text: '최종 수정일시 2026.10.05 09:30:15' },
    ])
  })

  it('updatedAt이 없으면 목록과 같이 createdAt을 최종 수정일시로 쓴다', () => {
    expect(resolvePostsDetailMetaDates({ createdAt: '2026-10-01T10:00:00' })[1]).toEqual({
      key: 'updated',
      text: '최종 수정일시 2026.10.01 10:00:00',
    })
  })
})
