import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  uploadMemberPortalFile,
  resolveMemberPortalUploadContentType,
  XLSX_MIME,
} from '../src/features/mypage/instructor-apply/api/member-file-upload'
import {
  STUDENT_ROSTER_ALLOWED_FILE_TYPES,
  STUDENT_ROSTER_UPLOAD_MAX_BYTES,
  validateStudentRosterUploadFile,
} from '../src/features/mypage/education/applications/lib/student-roster-upload-policy'

const { postMock, getMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  getMock: vi.fn(),
}))

vi.mock('@/shared/api/axios-instance', () => ({
  axiosClient: {
    post: postMock,
    get: getMock,
  },
}))

const createFile = (name: string, type = '') => new File(['xlsx-bytes'], name, { type })

describe('student roster upload MIME policy', () => {
  beforeEach(() => {
    postMock.mockReset()
    getMock.mockReset()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(''),
      })
    )
    postMock
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            fileObjectId: 101,
            uploadUrl: 'https://storage.example/upload',
            method: 'PUT',
            requiredHeaders: { 'x-upload-token': 'token' },
          },
        },
      })
      .mockResolvedValueOnce({ data: { success: true, data: {} } })
    getMock.mockResolvedValue({
      data: {
        success: true,
        data: { fileObjectId: 101, uploadStatus: 'AVAILABLE', scanStatus: 'CLEAN' },
      },
    })
  })

  it.each([
    XLSX_MIME,
    '',
    'application/octet-stream',
    'binary/octet-stream',
    'application/vnd.ms-excel',
    'application/haansoftxlsx',
  ])('.xlsx with %s is normalized to the canonical XLSX MIME', type => {
    expect(
      resolveMemberPortalUploadContentType(createFile('student_roster_8_sample.xlsx', type))
    ).toBe(XLSX_MIME)
  })

  it('allows the sample XLSX file and keeps upload-request/confirm contentType identical', async () => {
    const file = createFile('student_roster_8_sample.xlsx', 'application/octet-stream')
    expect(validateStudentRosterUploadFile(file)).toBeNull()

    const fileObjectId = await uploadMemberPortalFile({
      file,
      filePurpose: 'STUDENT_ROSTER',
      policy: {
        maxBytes: STUDENT_ROSTER_UPLOAD_MAX_BYTES,
        allowedFileTypes: STUDENT_ROSTER_ALLOWED_FILE_TYPES,
      },
    })

    expect(fileObjectId).toBe(101)
    expect(postMock).toHaveBeenNthCalledWith(
      1,
      '/api/portal/me/files/upload-requests',
      expect.objectContaining({
        filePurpose: 'STUDENT_ROSTER',
        originalFileName: 'student_roster_8_sample.xlsx',
        contentType: XLSX_MIME,
      }),
      expect.anything()
    )
    expect(postMock).toHaveBeenNthCalledWith(
      2,
      '/api/portal/me/files/101/confirm',
      expect.objectContaining({ contentType: XLSX_MIME })
    )
    expect(postMock.mock.calls[0]?.[1]?.contentType).toBe(postMock.mock.calls[1]?.[1]?.contentType)
    expect(fetch).toHaveBeenCalledWith(
      'https://storage.example/upload',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'x-upload-token': 'token' },
        body: file,
      })
    )
  })


  it('includes SHA-256 in prepare and confirm for criminal consent original PDF', async () => {
    const file = new File(['%PDF-1.4\ncontent'], 'crime-consent.pdf', {
      type: 'application/pdf',
    })
    const { createSha256 } = await import('../src/shared/lib/create-sha256')
    const expectedChecksum = await createSha256(file)

    const fileObjectId = await uploadMemberPortalFile({
      file,
      filePurpose: 'CRIMINAL_HISTORY_CONSENT_ORIGINAL',
    })

    expect(fileObjectId).toBe(101)
    expect(postMock).toHaveBeenNthCalledWith(
      1,
      '/api/portal/me/files/upload-requests',
      expect.objectContaining({
        filePurpose: 'CRIMINAL_HISTORY_CONSENT_ORIGINAL',
        checksumSha256: expectedChecksum,
      }),
      expect.anything()
    )
    expect(postMock).toHaveBeenNthCalledWith(
      2,
      '/api/portal/me/files/101/confirm',
      expect.objectContaining({ checksumSha256: expectedChecksum }),
      expect.anything()
    )
  })

  it('keeps CSV canonical and rejects unsupported, oversized, and empty files', () => {
    expect(resolveMemberPortalUploadContentType(createFile('students.csv', 'text/csv'))).toBe(
      'text/csv'
    )
    expect(validateStudentRosterUploadFile(createFile('students.csv', 'text/csv'))).toBeNull()
    expect(validateStudentRosterUploadFile(createFile('students.xls'))).toContain('.xls')
    expect(validateStudentRosterUploadFile(createFile('students'))).toContain('XLSX 또는 CSV')
    expect(
      validateStudentRosterUploadFile(
        new File([new Uint8Array(STUDENT_ROSTER_UPLOAD_MAX_BYTES + 1)], 'students.xlsx')
      )
    ).toContain('20MB')
    expect(validateStudentRosterUploadFile(new File([], 'students.xlsx'))).toContain('비어')
  })
})
