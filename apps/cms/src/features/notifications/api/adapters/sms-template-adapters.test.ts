import { describe, expect, it } from 'vitest'
import { SMS_ROOT_CATEGORY_ID } from '@/features/notifications/model/sms-template/types'
import { mapSmsCategoryTreeResponse } from './sms-template-adapters'

describe('mapSmsCategoryTreeResponse', () => {
  it('maps nested category/template nodes and keeps templates under their category', () => {
    const mapped = mapSmsCategoryTreeResponse({
      channelType: 'SMS',
      roots: [
        {
          nodeType: 'CATEGORY',
          id: 10,
          name: '공지',
          children: [
            {
              nodeType: 'TEMPLATE',
              id: 21,
              displayName: '비밀번호 안내',
              categoryId: 10,
            },
          ],
        },
      ],
    })

    expect(mapped.categories).toEqual([
      expect.objectContaining({ id: '10', name: '공지', parentId: SMS_ROOT_CATEGORY_ID }),
    ])
    expect(mapped.templates).toEqual([
      expect.objectContaining({
        id: '21',
        templateName: '비밀번호 안내',
        categoryId: '10',
      }),
    ])
  })

  it('attaches templates with a missing category to the tree root', () => {
    const mapped = mapSmsCategoryTreeResponse({
      roots: [
        {
          nodeType: 'TEMPLATE',
          id: 33,
          displayName: '고아 템플릿',
          categoryId: 999,
        },
      ],
    })

    expect(mapped.categories).toEqual([])
    expect(mapped.templates).toEqual([
      expect.objectContaining({
        id: '33',
        templateName: '고아 템플릿',
        categoryId: SMS_ROOT_CATEGORY_ID,
      }),
    ])
  })
})
