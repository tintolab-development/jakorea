import { describe, expect, it } from 'vitest'
import { selectedPostRowKeysToBulkIds } from './posts-bulk-delete-ids'

describe('selectedPostRowKeysToBulkIds', () => {
  it('공개 UUID면 resourceId를 일괄삭제 id로 쓴다', () => {
    expect(
      selectedPostRowKeysToBulkIds(['faq-uuid'], [{ id: 'faq-uuid', resourceId: 41 }])
    ).toEqual(['41'])
  })

  it('resourceId가 없으면 선택 키를 그대로 둔다', () => {
    expect(selectedPostRowKeysToBulkIds(['12'], [{ id: '12' }])).toEqual(['12'])
  })
})
