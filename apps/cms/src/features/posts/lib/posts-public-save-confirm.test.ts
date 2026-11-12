import { describe, expect, it } from 'vitest'
import { POSTS_NEW_DEFAULT_VISIBILITY } from './posts-public-save-confirm'

describe('POSTS_NEW_DEFAULT_VISIBILITY', () => {
  it('공지·FAQ 신규 작성 기본값은 비공개', () => {
    expect(POSTS_NEW_DEFAULT_VISIBILITY).toBe('private')
  })
})
