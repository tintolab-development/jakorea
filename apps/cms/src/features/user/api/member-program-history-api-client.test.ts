import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  downloadMemberApplicationAssignmentFilesZipRemote,
  formatAssignmentFilesDownloadErrorMessage,
} from './member-program-history-api-client'

const { request } = vi.hoisted(() => ({
  request: vi.fn(),
}))

vi.mock('@/shared/instance/axios-instance', () => ({
  axiosClient: { request },
}))

const input = { memberId: 7, applicationId: 1694714, applicationType: 'INDIVIDUAL' as const }

function conflictError(body: unknown, status = 409): AxiosError {
  const error = new AxiosError('Conflict')
  error.response = {
    data: body,
    status,
    statusText: 'Conflict',
    headers: {},
    config: { headers: {} } as InternalAxiosRequestConfig,
  }
  return error
}

describe('downloadMemberApplicationAssignmentFilesZipRemote', () => {
  beforeEach(() => {
    request.mockReset()
  })

  it('신청 건 ZIP과 Content-Disposition을 함께 돌려준다', async () => {
    const zip = new Blob(['PK'], { type: 'application/zip' })
    const disposition =
      "attachment; filename=\"assignment-files-7-1694714.zip\"; filename*=UTF-8''%EA%B3%BC%EC%A0%9C.zip"
    request.mockResolvedValue({ data: zip, headers: { 'Content-Disposition': disposition } })

    await expect(downloadMemberApplicationAssignmentFilesZipRemote(input)).resolves.toEqual({
      zip,
      contentDisposition: disposition,
    })
    expect(request).toHaveBeenCalledWith({
      url: '/api/admin/users/7/applications/1694714/assignment-files/download',
      method: 'POST',
      params: { applicationType: 'INDIVIDUAL' },
      headers: { Accept: 'application/zip, application/json' },
      responseType: 'blob',
      skipGlobalErrorAlert: true,
    })
  })

  it('Content-Disposition이 없으면 null', async () => {
    const zip = new Blob(['PK'], { type: 'application/zip' })
    request.mockResolvedValue({ data: zip, headers: {} })

    await expect(downloadMemberApplicationAssignmentFilesZipRemote(input)).resolves.toEqual({
      zip,
      contentDisposition: null,
    })
  })

  it('blob 오류 본문을 JSON으로 복원해 던진다', async () => {
    request.mockRejectedValue(
      conflictError(
        new Blob([JSON.stringify({ error: { code: 'NO_ASSIGNMENT_FILES' } })], {
          type: 'application/json',
        })
      )
    )

    await expect(downloadMemberApplicationAssignmentFilesZipRemote(input)).rejects.toMatchObject({
      response: { status: 409, data: { error: { code: 'NO_ASSIGNMENT_FILES' } } },
    })
  })

  it('JSON 본문이나 빈 응답은 ZIP으로 저장하지 않는다', async () => {
    request.mockResolvedValue({ data: new Blob(['{}'], { type: 'application/json' }), headers: {} })
    await expect(downloadMemberApplicationAssignmentFilesZipRemote(input)).rejects.toThrow(
      '과제 파일 ZIP을 받지 못했습니다.'
    )

    request.mockResolvedValue({ data: new Blob([], { type: 'application/zip' }), headers: {} })
    await expect(downloadMemberApplicationAssignmentFilesZipRemote(input)).rejects.toThrow(
      '과제 파일 ZIP을 받지 못했습니다.'
    )
  })
})

describe('formatAssignmentFilesDownloadErrorMessage', () => {
  const message = '현재 내려받을 수 없는 제출 파일입니다.'

  function body(details: Record<string, string> | null, code = 'ASSIGNMENT_FILE_NOT_DOWNLOADABLE') {
    return {
      success: false,
      data: null,
      message,
      error: { code, message, field: null, traceId: 't', details },
    }
  }

  it('회차·일정·파일명을 message 앞에 붙인다', () => {
    const error = conflictError(
      body({ sessionNo: '1', scheduleName: '진로 탐색', originalFileName: '과제_보고서.pdf' })
    )
    expect(formatAssignmentFilesDownloadErrorMessage(error)).toBe(
      `1회차 (진로 탐색) '과제_보고서.pdf' — ${message}`
    )
  })

  it('없는 키는 빈 괄호나 undefined 없이 생략한다', () => {
    expect(
      formatAssignmentFilesDownloadErrorMessage(
        conflictError(body({ scheduleName: '팀일정111', originalFileName: '주***.pdf' }))
      )
    ).toBe(`(팀일정111) '주***.pdf' — ${message}`)
    expect(
      formatAssignmentFilesDownloadErrorMessage(
        conflictError(body({ sessionNo: '3' }, 'ASSIGNMENT_SUBMISSION_EXPIRED'))
      )
    ).toBe(`3회차 — ${message}`)
    expect(
      formatAssignmentFilesDownloadErrorMessage(
        conflictError(body({ originalFileName: '과제.pdf' }))
      )
    ).toBe(`'과제.pdf' — ${message}`)
  })

  it('details가 null이면 message만 쓴다', () => {
    expect(
      formatAssignmentFilesDownloadErrorMessage(
        conflictError({
          success: false,
          message: '다운로드할 과제 파일이 없습니다.',
          error: { code: 'NO_ASSIGNMENT_FILES', message: '다운로드할 과제 파일이 없습니다.', details: null },
        })
      )
    ).toBe('다운로드할 과제 파일이 없습니다.')
  })

  it('응답 없는 오류는 Error message, 그 외는 기본 문구', () => {
    expect(formatAssignmentFilesDownloadErrorMessage(new Error('과제 파일 ZIP을 받지 못했습니다.'))).toBe(
      '과제 파일 ZIP을 받지 못했습니다.'
    )
    expect(formatAssignmentFilesDownloadErrorMessage(null)).toBe(
      '과제 일괄 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.'
    )
  })
})
