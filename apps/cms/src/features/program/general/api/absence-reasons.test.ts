import { describe, expect, it } from 'vitest'
import { resolveProgramAbsenceReasonEvidence } from './absence-reasons'

describe('resolveProgramAbsenceReasonEvidence', () => {
  it('uses fileObjectIds when present', () => {
    expect(
      resolveProgramAbsenceReasonEvidence({
        fileObjectIds: [2056505],
        originalFileNames: ['증빙.pdf'],
      })
    ).toEqual({
      fileObjectIds: [2056505],
      originalFileNames: ['증빙.pdf'],
    })
  })

  it('falls back to attachments when fileObjectIds is empty', () => {
    expect(
      resolveProgramAbsenceReasonEvidence({
        attachments: [
          { attachmentId: 1, fileObjectId: 99, originalFileName: '병원확인서.pdf' },
        ],
      })
    ).toEqual({
      fileObjectIds: [99],
      originalFileNames: ['병원확인서.pdf'],
    })
  })
})
