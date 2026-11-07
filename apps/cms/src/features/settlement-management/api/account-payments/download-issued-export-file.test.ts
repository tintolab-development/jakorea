import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'

vi.mock('@/shared/api/orval-mutator', () => ({
  customInstance: vi.fn(),
}))

vi.mock('@/shared/utils/file-download', async () => {
  const actual = await vi.importActual<typeof import('@/shared/utils/file-download')>(
    '@/shared/utils/file-download'
  )
  return {
    ...actual,
    downloadBlob: vi.fn(),
    recordDownloadAccessLog: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock('@/shared/ui/cms-alert-modal-api', () => ({
  cmsAlertModal: { show: vi.fn(), close: vi.fn() },
}))

import { customInstance } from '@/shared/api/orval-mutator'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { downloadBlob, recordDownloadAccessLog } from '@/shared/utils/file-download'
import {
  FILE_DOWNLOAD_TOKEN_INVALID_MESSAGE,
  FILE_DOWNLOAD_TOKEN_INVALID_OR_EXPIRED,
  SETTLEMENT_EXPORT_ALREADY_DOWNLOADED_MESSAGE,
  SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED,
  SENSITIVE_FILE_RELAY_REQUIRED_MESSAGE,
  getSettlementApiErrorCode,
  getSettlementApiErrorMessage,
} from '@/features/settlement-management/api/get-settlement-api-error'
import { buildSettlementFormExcelFilename } from './settlement-form-download'
import {
  downloadIssuedSettlementExportFile,
  downloadIssuedSettlementExportFileOrReissue,
  notifySettlementExportDownloadError,
} from './download-issued-export-file'

const mockedInstance = vi.mocked(customInstance)
const mockedDownloadBlob = vi.mocked(downloadBlob)
const mockedRecordAccessLog = vi.mocked(recordDownloadAccessLog)

function axiosError(status: number, code: string) {
  return {
    response: {
      status,
      data: { error: { code } },
    },
  }
}

function axiosBlobError(status: number, code: string) {
  const error = new AxiosError('Request failed')
  error.response = {
    status,
    statusText: 'Conflict',
    headers: {},
    config: { headers: {} } as InternalAxiosRequestConfig,
    data: new Blob([JSON.stringify({ error: { code } })], { type: 'application/json' }),
  }
  return error
}

describe('downloadIssuedSettlementExportFile', () => {
  beforeEach(() => {
    mockedInstance.mockReset()
    mockedDownloadBlob.mockReset()
    mockedRecordAccessLog.mockReset()
    mockedRecordAccessLog.mockResolvedValue(undefined)
    vi.mocked(cmsAlertModal.show).mockReset()
  })

  it('접근 로그를 sensitive-downloads보다 먼저 남기고 skipAccessLog로 저장한다', async () => {
    const fileBlob = new Blob(['xlsx'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    mockedInstance
      .mockResolvedValueOnce({
        relayToken: 'relay-token-1',
        streamUrl: '/api/admin/files/91/sensitive-downloads/stream',
      })
      .mockResolvedValueOnce(fileBlob)

    await downloadIssuedSettlementExportFile({
      serverExport: {
        deliveryMethod: 'SERVER_FILE',
        fileObjectId: 91,
        downloadUrl: '/api/admin/files/91/download',
      },
      kind: 'bulk-transfer',
    })

    const filename = buildSettlementFormExcelFilename('bulk-transfer')
    expect(mockedRecordAccessLog).toHaveBeenCalledWith(filename)
    expect(mockedRecordAccessLog.mock.invocationCallOrder[0] ?? 0).toBeLessThan(
      mockedInstance.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY
    )
    expect(mockedInstance).toHaveBeenCalledTimes(2)
    expect(mockedInstance.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        url: '/api/admin/files/91/sensitive-downloads',
        method: 'POST',
        data: { reason: '대량이체 양식 발급' },
      })
    )
    expect(mockedInstance.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        url: '/api/admin/files/91/sensitive-downloads/stream',
        method: 'POST',
        data: { reason: '대량이체 양식 발급', relayToken: 'relay-token-1' },
        responseType: 'blob',
      })
    )
    expect(mockedDownloadBlob).toHaveBeenCalledWith(fileBlob, filename, { skipAccessLog: true })
  })

  it('접근 로그가 실패하면 1회용 stream을 호출하지 않는다', async () => {
    const logError = new Error('log failed')
    mockedRecordAccessLog.mockRejectedValueOnce(logError)

    await expect(
      downloadIssuedSettlementExportFile({
        serverExport: { deliveryMethod: 'SERVER_FILE', fileObjectId: 91 },
        kind: 'bulk-transfer',
      })
    ).rejects.toThrow('log failed')

    expect(mockedInstance).not.toHaveBeenCalled()
    expect(mockedDownloadBlob).not.toHaveBeenCalled()
  })

  it('stream JSON Blob 409 ALREADY_DOWNLOADED를 코드로 복원한다', async () => {
    const alreadyDownloaded = axiosBlobError(409, SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED)
    mockedInstance
      .mockResolvedValueOnce({
        relayToken: 'relay-token-1',
        streamUrl: '/api/admin/files/91/sensitive-downloads/stream',
      })
      .mockRejectedValueOnce(alreadyDownloaded)

    await expect(
      downloadIssuedSettlementExportFile({
        serverExport: { deliveryMethod: 'SERVER_FILE', fileObjectId: 91 },
        kind: 'bulk-transfer',
      })
    ).rejects.toSatisfy(error => {
      expect(getSettlementApiErrorCode(error)).toBe(SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED)
      return true
    })
    expect(mockedDownloadBlob).not.toHaveBeenCalled()
  })

  it('stream JSON Blob TOKEN_INVALID를 코드로 복원한다', async () => {
    const tokenInvalid = axiosBlobError(409, FILE_DOWNLOAD_TOKEN_INVALID_OR_EXPIRED)
    mockedInstance
      .mockResolvedValueOnce({
        relayToken: 'relay-token-1',
        streamUrl: '/api/admin/files/91/sensitive-downloads/stream',
      })
      .mockRejectedValueOnce(tokenInvalid)

    await expect(
      downloadIssuedSettlementExportFile({
        serverExport: { deliveryMethod: 'SERVER_FILE', fileObjectId: 91 },
        kind: 'bulk-transfer',
      })
    ).rejects.toSatisfy(error => {
      expect(getSettlementApiErrorCode(error)).toBe(FILE_DOWNLOAD_TOKEN_INVALID_OR_EXPIRED)
      return true
    })
    expect(mockedDownloadBlob).not.toHaveBeenCalled()
  })

  it('409 SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED면 재발급 안내만 하고 자동 발급하지 않는다', async () => {
    const alreadyDownloaded = axiosError(409, 'SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED')
    mockedInstance.mockRejectedValueOnce(alreadyDownloaded)
    const onAlreadyDownloaded = vi.fn()

    await expect(
      downloadIssuedSettlementExportFile({
        serverExport: { deliveryMethod: 'SERVER_FILE', fileObjectId: 91 },
        kind: 'bulk-transfer',
      })
    ).rejects.toEqual(alreadyDownloaded)

    notifySettlementExportDownloadError({
      error: alreadyDownloaded,
      fallback: '대량이체 파일 다운로드에 실패했습니다.',
      issueButtonLabel: '대량이체 양식 발급',
      onAlreadyDownloaded,
    })

    expect(onAlreadyDownloaded).toHaveBeenCalledTimes(1)
    expect(cmsAlertModal.show).toHaveBeenCalledWith({
      title: '다운로드 불가',
      content: `${SETTLEMENT_EXPORT_ALREADY_DOWNLOADED_MESSAGE}\n목록 위 「대량이체 양식 발급」 버튼을 눌러 새로 발급해 주세요.`,
    })
    expect(mockedDownloadBlob).not.toHaveBeenCalled()
    expect(mockedInstance).toHaveBeenCalledTimes(1)
  })

  it('세금신고는 reason을 세금신고 양식 발급으로 보낸다', async () => {
    const fileBlob = new Blob(['xlsx'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    mockedInstance
      .mockResolvedValueOnce({
        relayToken: 'relay-token-2',
        streamUrl: '/api/admin/files/92/sensitive-downloads/stream',
      })
      .mockResolvedValueOnce(fileBlob)

    await downloadIssuedSettlementExportFile({
      serverExport: { deliveryMethod: 'SERVER_FILE', fileObjectId: 92 },
      kind: 'tax-report',
    })

    expect(mockedInstance.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        data: { reason: '세금신고 양식 발급' },
      })
    )
    expect(mockedDownloadBlob).toHaveBeenCalledWith(
      fileBlob,
      buildSettlementFormExcelFilename('tax-report'),
      { skipAccessLog: true }
    )
  })

  it('세금신고 서버 파일은 입력한 암호를 claim과 stream에 전달한다', async () => {
    const fileBlob = new Blob(['encrypted-xlsx'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    mockedInstance
      .mockResolvedValueOnce({
        relayToken: 'relay-token-password',
        streamUrl: '/api/admin/files/92/sensitive-downloads/stream',
      })
      .mockResolvedValueOnce(fileBlob)

    await downloadIssuedSettlementExportFile({
      serverExport: { deliveryMethod: 'SERVER_FILE', fileObjectId: 92 },
      kind: 'tax-report',
      password: 'Jafile1!',
    })

    expect(mockedInstance.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        data: { reason: '세금신고 양식 발급', password: 'Jafile1!' },
      })
    )
    expect(mockedInstance.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        data: {
          reason: '세금신고 양식 발급',
          relayToken: 'relay-token-password',
          password: 'Jafile1!',
        },
      })
    )
  })

  it('409 ALREADY_DOWNLOADED면 재발급 후 새 fileObjectId로 받는다', async () => {
    const fileBlob = new Blob(['xlsx'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    mockedInstance
      .mockRejectedValueOnce(axiosError(409, SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED))
      .mockResolvedValueOnce({
        relayToken: 'relay-token-3',
        streamUrl: '/api/admin/files/99/sensitive-downloads/stream',
      })
      .mockResolvedValueOnce(fileBlob)
    const onReissue = vi.fn().mockResolvedValue({
      deliveryMethod: 'SERVER_FILE',
      fileObjectId: 99,
    })

    await downloadIssuedSettlementExportFileOrReissue({
      serverExport: { deliveryMethod: 'SERVER_FILE', fileObjectId: 91 },
      kind: 'bulk-transfer',
      onReissue,
    })

    expect(onReissue).toHaveBeenCalledTimes(1)
    expect(mockedInstance.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        url: '/api/admin/files/91/sensitive-downloads',
      })
    )
    expect(mockedInstance.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        url: '/api/admin/files/99/sensitive-downloads',
        data: { reason: '대량이체 양식 발급' },
      })
    )
    expect(mockedDownloadBlob).toHaveBeenCalledTimes(1)
  })
})

describe('notifySettlementExportDownloadError', () => {
  beforeEach(() => {
    vi.mocked(cmsAlertModal.show).mockReset()
  })

  it('SENSITIVE_FILE_RELAY_REQUIRED는 전용 문구를 보여준다', () => {
    notifySettlementExportDownloadError({
      error: axiosError(409, 'SENSITIVE_FILE_RELAY_REQUIRED'),
      fallback: '대량이체 파일 다운로드에 실패했습니다.',
      issueButtonLabel: '대량이체 양식 발급',
      onAlreadyDownloaded: vi.fn(),
    })

    expect(cmsAlertModal.show).toHaveBeenCalledWith({
      title: '다운로드 불가',
      content: SENSITIVE_FILE_RELAY_REQUIRED_MESSAGE,
    })
  })

  it('FILE_DOWNLOAD_TOKEN_INVALID_OR_EXPIRED면 미리보기를 닫고 재발급만 안내한다', () => {
    const onAlreadyDownloaded = vi.fn()
    notifySettlementExportDownloadError({
      error: axiosError(409, FILE_DOWNLOAD_TOKEN_INVALID_OR_EXPIRED),
      fallback: '대량이체 파일 다운로드에 실패했습니다.',
      issueButtonLabel: '대량이체 양식 발급',
      onAlreadyDownloaded,
    })

    expect(onAlreadyDownloaded).toHaveBeenCalledTimes(1)
    expect(cmsAlertModal.show).toHaveBeenCalledWith({
      title: '다운로드 불가',
      content: `${FILE_DOWNLOAD_TOKEN_INVALID_MESSAGE}\n목록 위 「대량이체 양식 발급」 버튼을 눌러 새로 발급해 주세요.`,
    })
  })
})

describe('getSettlementApiErrorMessage 정산 파일 다운로드', () => {
  it('409 ALREADY_DOWNLOADED는 FE 고정 문구를 쓴다', () => {
    expect(
      getSettlementApiErrorMessage(
        axiosError(409, 'SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED'),
        'fallback'
      )
    ).toBe(SETTLEMENT_EXPORT_ALREADY_DOWNLOADED_MESSAGE)
  })
})
