import { describe, expect, it } from 'vitest'
import {
  appendGeminiAttachmentUploads,
  removeGeminiAttachmentAt,
  resolveGeminiAttachmentFileObjectIdsForSave,
} from './attachment-file-objects'

describe('Gemini 첨부 fileObjectId (QA C-23)', () => {
  it('업로드 id를 파일명 index에 맞춰 붙이고, 기존 파일명 칸은 null로 둔다', () => {
    const next = appendGeminiAttachmentUploads({ attachmentFileNames: ['old.pdf'] }, [
      { fileName: 'new.pdf', fileObjectId: 11 },
    ])
    expect(next).toEqual({
      attachmentFileNames: ['old.pdf', 'new.pdf'],
      attachmentFileObjectIds: [null, 11],
    })
  })

  it('삭제 시 파일명·id를 같은 index로 뺀다', () => {
    const next = removeGeminiAttachmentAt(
      { attachmentFileNames: ['a.pdf', 'b.pdf'], attachmentFileObjectIds: [1, 2] },
      0
    )
    expect(next).toEqual({ attachmentFileNames: ['b.pdf'], attachmentFileObjectIds: [2] })
  })

  it('첨부 변경이 없으면 PUT 하지 않는다', () => {
    expect(resolveGeminiAttachmentFileObjectIdsForSave({ attachmentFileNames: ['a.pdf'] })).toBeNull()
  })

  it('등록: 업로드 id만 보낸다', () => {
    expect(
      resolveGeminiAttachmentFileObjectIdsForSave({
        attachmentFileNames: ['a.pdf', 'b.pdf'],
        attachmentFileObjectIds: [1, 2],
      })
    ).toEqual([1, 2])
  })

  it('수정: 기존 연결 첨부는 파일명으로 유지하고, 지운 파일은 뺀다', () => {
    const existing = [
      { fileObjectId: 100, originalFileName: 'keep.pdf' },
      { fileObjectId: 101, originalFileName: 'removed.pdf' },
    ]
    expect(
      resolveGeminiAttachmentFileObjectIdsForSave(
        { attachmentFileNames: ['keep.pdf', 'new.pdf'], attachmentFileObjectIds: [null, 7] },
        existing
      )
    ).toEqual([100, 7])
  })

  it('수정: 연결된 첨부를 모두 지우면 빈 배열로 PUT', () => {
    expect(
      resolveGeminiAttachmentFileObjectIdsForSave(
        { attachmentFileNames: [], attachmentFileObjectIds: [] },
        [{ fileObjectId: 100, originalFileName: 'x.pdf' }]
      )
    ).toEqual([])
  })
})
