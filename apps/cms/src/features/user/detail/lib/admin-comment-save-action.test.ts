import { describe, expect, it } from 'vitest'
import { resolveAdminCommentSaveAction } from './admin-comment-save-action'

describe('resolveAdminCommentSaveAction', () => {
  it('내용이 있으면 등록·수정한다', () => {
    expect(resolveAdminCommentSaveAction({ nextComment: '메모', existingComment: '' })).toBe('upsert')
    expect(resolveAdminCommentSaveAction({ nextComment: ' 새 메모 ', existingComment: '메모' })).toBe(
      'upsert'
    )
  })

  it('기존 코멘트가 있는데 비워 저장하면 삭제한다', () => {
    expect(resolveAdminCommentSaveAction({ nextComment: '', existingComment: '메모' })).toBe('delete')
    expect(resolveAdminCommentSaveAction({ nextComment: '   ', existingComment: '메모' })).toBe(
      'delete'
    )
  })

  it('기존 코멘트도 없고 비어 있으면 편집만 닫는다', () => {
    expect(resolveAdminCommentSaveAction({ nextComment: '', existingComment: '' })).toBe('close')
    expect(resolveAdminCommentSaveAction({ nextComment: null, existingComment: undefined })).toBe(
      'close'
    )
  })
})
