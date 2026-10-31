import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deletePostsByBulkIdsOrEach } from './posts-bulk-delete'

describe('deletePostsByBulkIdsOrEach', () => {
  const bulk = vi.fn()
  const each = vi.fn()

  beforeEach(() => {
    bulk.mockReset()
    each.mockReset()
    bulk.mockResolvedValue({ data: { failureCount: 0 } })
    each.mockResolvedValue(undefined)
  })

  it('숫자 id는 bulk API로 보낸다', async () => {
    await deletePostsByBulkIdsOrEach(['12', '13'], {
      bulk,
      each,
      failedMessage: '실패',
    })
    expect(bulk).toHaveBeenCalledWith([12, 13])
    expect(each).not.toHaveBeenCalled()
  })

  it('문자 id는 단건 삭제 API로 보낸다', async () => {
    await deletePostsByBulkIdsOrEach(['faq-uuid'], {
      bulk,
      each,
      failedMessage: '실패',
    })
    expect(bulk).not.toHaveBeenCalled()
    expect(each).toHaveBeenCalledWith('faq-uuid')
  })
})
