import { describe, expect, it } from 'vitest'
import { FILE_SELECT_MAX_FILE_BYTES } from '@/shared/ui/file-select-field-limits'
import {
  RECRUIT_DETAIL_ATTACHMENT_GUIDE_LINES,
  RECRUIT_DETAIL_FILE_MAX_BYTES,
  RECRUIT_DETAIL_FILE_SIZE_EXCEEDED_MESSAGE,
  RECRUIT_DETAIL_THUMBNAIL_GUIDE_LINES,
} from './recruit-detail-info-attachment'

describe('recruit-detail-info-attachment', () => {
  it('썸네일·첨부 안내가 20MB와 첨부 파일명 문구를 쓴다', () => {
    expect(RECRUIT_DETAIL_FILE_MAX_BYTES).toBe(FILE_SELECT_MAX_FILE_BYTES)
    expect(RECRUIT_DETAIL_FILE_SIZE_EXCEEDED_MESSAGE).toBe(
      '파일은 최대 20MB까지 업로드 가능합니다.'
    )
    expect(RECRUIT_DETAIL_THUMBNAIL_GUIDE_LINES).toEqual([
      '-\u00A0 파일은 최대 20MB까지 JPG, PNG 형식만 등록 가능합니다.',
      '-\u00A0 첨부 파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
    ])
    expect(RECRUIT_DETAIL_ATTACHMENT_GUIDE_LINES).toEqual([
      '-\u00A0 파일은 최대 20MB까지 JPG, PNG, Excel, PDF, Word 형식만 등록 가능합니다.',
      '-\u00A0 첨부 파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
    ])
  })
})
