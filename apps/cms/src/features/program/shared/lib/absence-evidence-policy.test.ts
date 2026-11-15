import { describe, expect, it } from 'vitest'
import {
  ABSENCE_EVIDENCE_MAX_FILE_BYTES,
  ABSENCE_EVIDENCE_MAX_TOTAL_BYTES,
  ABSENCE_EVIDENCE_MESSAGES,
  isAllowedAbsenceEvidenceFileType,
  resolveAbsenceEvidenceSaveErrorMessage,
  screenAbsenceEvidenceFiles,
} from './absence-evidence-policy'

const MIB = 1024 * 1024

function file(name: string, type: string, size = 1024) {
  return { name, type, size }
}

describe('isAllowedAbsenceEvidenceFileType', () => {
  it.each([
    ['a.pdf', 'application/pdf'],
    ['a.JPG', 'image/jpeg'],
    ['a.jpeg', 'image/jpeg'],
    ['a.png', 'IMAGE/PNG'],
  ])('%s (%s) 허용', (name, type) => {
    expect(isAllowedAbsenceEvidenceFileType({ name, type })).toBe(true)
  })

  it.each([
    ['photo.jpg', 'image/png'],
    ['note.pdf', 'application/octet-stream'],
    ['note.pdf', ''],
    ['a.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['a.webp', 'image/webp'],
    ['a.heic', 'image/heic'],
    ['noext', 'application/pdf'],
  ])('%s (%s) 거절', (name, type) => {
    expect(isAllowedAbsenceEvidenceFileType({ name, type })).toBe(false)
  })
})

describe('screenAbsenceEvidenceFiles', () => {
  it('파일당 20MiB 포함 허용, 1바이트 초과 거절', () => {
    const result = screenAbsenceEvidenceFiles([], [
      file('ok.pdf', 'application/pdf', ABSENCE_EVIDENCE_MAX_FILE_BYTES),
      file('big.pdf', 'application/pdf', ABSENCE_EVIDENCE_MAX_FILE_BYTES + 1),
    ])
    expect(result.accepted.map(f => f.name)).toEqual(['ok.pdf'])
    expect(result.rejectionMessages).toEqual([ABSENCE_EVIDENCE_MESSAGES.fileTooLarge])
  })

  it('0바이트 거절', () => {
    const result = screenAbsenceEvidenceFiles([], [file('empty.png', 'image/png', 0)])
    expect(result.accepted).toEqual([])
    expect(result.rejectionMessages).toEqual([ABSENCE_EVIDENCE_MESSAGES.emptyFile])
  })

  it('형식 불일치는 서버 문구와 같은 문장으로 거절', () => {
    const result = screenAbsenceEvidenceFiles([], [file('photo.jpg', 'image/png')])
    expect(result.rejectionMessages).toEqual([
      '결석 증빙 파일은 PDF, JPG, PNG 형식만 첨부할 수 있습니다.',
    ])
  })

  it('10개까지 받고 11번째는 막는다', () => {
    const current = Array.from({ length: 9 }, () => ({ size: 1 }))
    const result = screenAbsenceEvidenceFiles(current, [
      file('10.png', 'image/png'),
      file('11.png', 'image/png'),
    ])
    expect(result.accepted.map(f => f.name)).toEqual(['10.png'])
    expect(result.rejectionMessages).toEqual(['결석 증빙 파일은 10개까지 첨부할 수 있습니다.'])
  })

  it('합계 100MiB 정확히는 허용, 초과 파일만 거절하고 나머지는 유지', () => {
    const current = Array.from({ length: 5 }, () => ({ size: 20 * MIB }))
    expect(current.reduce((s, f) => s + f.size, 0)).toBe(ABSENCE_EVIDENCE_MAX_TOTAL_BYTES)
    const exact = screenAbsenceEvidenceFiles(current.slice(0, 4), [
      file('fifth.pdf', 'application/pdf', 20 * MIB),
    ])
    expect(exact.accepted).toHaveLength(1)

    const over = screenAbsenceEvidenceFiles(current, [
      file('one-byte.pdf', 'application/pdf', 1),
    ])
    expect(over.accepted).toEqual([])
    expect(over.rejectionMessages).toEqual([
      '결석 증빙 파일은 합계 100MB까지 첨부할 수 있습니다.',
    ])
  })

  it('10개·합계 정확히 100MiB는 용량으로 거절하지 않는다', () => {
    const tenth = ABSENCE_EVIDENCE_MAX_TOTAL_BYTES - 9 * 10 * MIB
    const current = Array.from({ length: 9 }, () => ({ size: 10 * MIB }))
    const result = screenAbsenceEvidenceFiles(current, [file('10.pdf', 'application/pdf', tenth)])
    expect(result.accepted).toHaveLength(1)
    expect(result.rejectionMessages).toEqual([])
  })
})

describe('resolveAbsenceEvidenceSaveErrorMessage', () => {
  function apiError(code: string, message: string) {
    return { response: { status: 400, data: { success: false, error: { code, message, field: 'fileObjectIds' } } } }
  }

  it('문서 표 코드는 서버 error.message를 그대로 쓴다', () => {
    expect(
      resolveAbsenceEvidenceSaveErrorMessage(
        apiError('ABSENCE_EVIDENCE_TOO_MANY', '결석 증빙 파일은 5개까지 첨부할 수 있습니다.')
      )
    ).toBe('결석 증빙 파일은 5개까지 첨부할 수 있습니다.')
    expect(
      resolveAbsenceEvidenceSaveErrorMessage(
        apiError('ABSENCE_EVIDENCE_FILE_NOT_AVAILABLE', '결석 증빙 파일을 아직 사용할 수 없습니다.')
      )
    ).toBe('결석 증빙 파일을 아직 사용할 수 없습니다.')
  })

  it('목록 밖 코드는 null', () => {
    expect(
      resolveAbsenceEvidenceSaveErrorMessage(apiError('ATTENDANCE_RECORDING_NOT_OPEN', 'x'))
    ).toBeNull()
    expect(resolveAbsenceEvidenceSaveErrorMessage(new Error('network'))).toBeNull()
  })
})
