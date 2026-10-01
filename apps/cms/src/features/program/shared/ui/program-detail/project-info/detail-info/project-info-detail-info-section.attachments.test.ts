import { describe, expect, it } from 'vitest'
import { resolveAttachmentFileNamesForDisplay } from './project-info-detail-info-section'

describe('resolveAttachmentFileNamesForDisplay', () => {
  it('모집 행 첨부가 비면 프로그램 첨부 이름을 보여 주지 않는다', () => {
    expect(
      resolveAttachmentFileNamesForDisplay({
        rowScoped: true,
        isFormEdit: false,
        formFileNames: ['프로그램.pdf'],
        linkedAttachmentNames: [],
        programFallback: ['프로그램.pdf'],
      })
    ).toEqual([])
  })

  it('모집 행 첨부는 그 행 파일명만 보여 준다', () => {
    expect(
      resolveAttachmentFileNamesForDisplay({
        rowScoped: true,
        isFormEdit: true,
        formFileNames: ['프로그램.pdf'],
        linkedAttachmentNames: ['기관안내.pdf'],
        programFallback: ['프로그램.pdf'],
      })
    ).toEqual(['기관안내.pdf'])
  })

  it('프로그램 화면은 행 API가 비어 있으면 프로그램 첨부 이름을 유지한다', () => {
    expect(
      resolveAttachmentFileNamesForDisplay({
        rowScoped: false,
        isFormEdit: false,
        formFileNames: undefined,
        linkedAttachmentNames: [],
        programFallback: ['프로그램.pdf'],
      })
    ).toEqual(['프로그램.pdf'])
  })
})
