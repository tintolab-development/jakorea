import { describe, expect, it } from 'vitest'
import { programPostFileOwner } from '@/shared/lib/admin-file-upload/upload-maybe-mock'

describe('programPostFileOwner', () => {
  it('새 글 작성 중이면 PROGRAM_CONTENT / PROGRAM / programId', () => {
    expect(programPostFileOwner({ programId: 186046 })).toEqual({
      ownerDomain: 'PROGRAM_CONTENT',
      ownerType: 'PROGRAM',
      ownerId: 186046,
      filePurpose: 'PROGRAM_POST_ATTACHMENT',
    })
  })

  it('기존 글 수정이면 PROGRAM_CONTENT / PROGRAM_POST / postId', () => {
    expect(programPostFileOwner({ programId: 186046, postId: 1693309 })).toEqual({
      ownerDomain: 'PROGRAM_CONTENT',
      ownerType: 'PROGRAM_POST',
      ownerId: 1693309,
      filePurpose: 'PROGRAM_POST_ATTACHMENT',
    })
  })
})
