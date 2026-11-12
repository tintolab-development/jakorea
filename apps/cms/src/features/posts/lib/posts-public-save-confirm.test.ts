import { describe, expect, it } from 'vitest'
import { POSTS_NEW_DEFAULT_VISIBILITY } from './posts-public-save-confirm'

describe('POSTS_NEW_DEFAULT_VISIBILITY', () => {
  it('공지·FAQ 신규 작성 시 공개 여부는 미선택', () => {
    expect(POSTS_NEW_DEFAULT_VISIBILITY).toBeUndefined()
  })
})
