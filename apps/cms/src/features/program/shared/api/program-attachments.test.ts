import { describe, expect, it } from 'vitest'
import { ADMIN_FILE_PURPOSE } from '@/shared/lib/admin-file-upload'
import {
  programContentFileOwner,
  programDetailAttachmentOwner,
  programThumbnailOwner,
} from '@/features/program/shared/api/program-attachments'

describe('programContentFileOwner', () => {
  it('등록 전 썸네일·첨부는 가짜 programId 대신 ownerId null을 쓴다', () => {
    expect(programThumbnailOwner(null)).toEqual({
      ownerDomain: 'PROGRAM_CONTENT',
      ownerType: 'PROGRAM',
      ownerId: null,
      filePurpose: ADMIN_FILE_PURPOSE.PROGRAM_THUMBNAIL,
    })
    expect(programDetailAttachmentOwner(null)).toEqual({
      ownerDomain: 'PROGRAM_CONTENT',
      ownerType: 'PROGRAM',
      ownerId: null,
      filePurpose: ADMIN_FILE_PURPOSE.PROGRAM_DETAIL_ATTACHMENT,
    })
  })

  it('생성된 프로그램은 실제 id를 그대로 넣는다', () => {
    expect(programContentFileOwner(88, ADMIN_FILE_PURPOSE.PROGRAM_THUMBNAIL).ownerId).toBe(88)
  })
})
