/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  downloadIssuedSettlementExportFile: vi.fn(),
  onRequestExport: vi.fn(),
}))

vi.mock('@/features/settlement-management/api/account-payments/download-issued-export-file', () => ({
  downloadIssuedSettlementExportFile: mocks.downloadIssuedSettlementExportFile,
}))

vi.mock('@/features/settlement-management/api/account-payments/privacy-export-approval', () => ({
  RAW_SETTLEMENT_EXPORT_DOMAIN: { 'bulk-transfer': 'BULK_TRANSFER', 'tax-report': 'TAX_REPORT' },
  fetchPrivacyExportApprovalRemote: vi.fn().mockResolvedValue({}),
  assertOwnApprovedRawExport: () => 'approval-ref',
  assertCanApproveRawExport: vi.fn(),
  approvePrivacyExportApprovalRemote: vi.fn(),
  createPrivacyExportApprovalRemote: vi.fn(),
}))

vi.mock('@/features/settlement-management/api/account-payments/settlement-export-scope', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/settlement-management/api/account-payments/settlement-export-scope')
  >('@/features/settlement-management/api/account-payments/settlement-export-scope')
  return {
    ...actual,
    issueSettlementExportScopeRemote: vi
      .fn()
      .mockResolvedValue({ scopeToken: 'scope-1', fullCorpus: true, rowCount: 3 }),
  }
})

vi.mock(
  '@/features/settlement-management/api/account-payments/build-account-payment-export-request',
  async importOriginal => ({
    ...(await importOriginal<object>()),
    isUnfilteredFullRawExportBody: () => true,
  })
)

vi.mock('@/features/settlement-management/api/settlement-api-client', () => ({
  waitForSettlementExportDownload: (value: unknown) => Promise.resolve(value),
  assertSettlementServerExportReady: (value: unknown) => value,
}))

import { RawSettlementExportApprovalModal } from './raw-settlement-export-approval-modal'

const READY = { deliveryMethod: 'SERVER_FILE', fileObjectId: 91 }

function passwordError() {
  return { response: { status: 400, data: { error: { code: 'DOWNLOAD_PASSWORD_INVALID', field: 'password' } } } }
}

async function prepareAndClickRawDownload() {
  render(
    <RawSettlementExportApprovalModal
      open
      mode="request"
      kind="bulk-transfer"
      sessionAdminAccountId={1}
      onRequestExport={mocks.onRequestExport}
      onClose={() => undefined}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: '발급 범위 확인' }))
  await screen.findByText(/서버 확인 3건/)
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.change(screen.getByPlaceholderText('승인 요청 번호'), { target: { value: '7' } })
  fireEvent.click(screen.getByRole('button', { name: '원본 받기' }))
}

function submitPassword() {
  fireEvent.change(screen.getByPlaceholderText('사용할 암호를 입력해 주세요'), {
    target: { value: 'Jafile1!' },
  })
  fireEvent.change(screen.getByPlaceholderText('암호를 한 번 더 입력해 주세요'), {
    target: { value: 'Jafile1!' },
  })
  fireEvent.click(screen.getByRole('button', { name: '다운로드' }))
}

describe('RawSettlementExportApprovalModal 원본 받기', () => {
  afterEach(() => {
    cleanup()
    mocks.downloadIssuedSettlementExportFile.mockReset()
    mocks.onRequestExport.mockReset()
  })

  it('암호 모달에서 받은 암호로 서버 원본 파일을 받는다', async () => {
    mocks.onRequestExport.mockResolvedValue(READY)
    mocks.downloadIssuedSettlementExportFile.mockResolvedValue(undefined)

    await prepareAndClickRawDownload()
    // 암호를 입력하기 전에는 발급 요청을 보내지 않는다
    expect(mocks.onRequestExport).not.toHaveBeenCalled()
    submitPassword()

    await waitFor(() => {
      expect(mocks.downloadIssuedSettlementExportFile).toHaveBeenCalledWith({
        serverExport: READY,
        kind: 'bulk-transfer',
        password: 'Jafile1!',
      })
    })
    expect(mocks.onRequestExport).toHaveBeenCalledTimes(1)
  })

  it('암호 오류 후 다시 받을 때 발급 요청을 반복하지 않는다', async () => {
    mocks.onRequestExport.mockResolvedValue(READY)
    mocks.downloadIssuedSettlementExportFile
      .mockRejectedValueOnce(passwordError())
      .mockResolvedValueOnce(undefined)

    await prepareAndClickRawDownload()
    submitPassword()
    await waitFor(() => expect(mocks.downloadIssuedSettlementExportFile).toHaveBeenCalledTimes(1))

    submitPassword()
    await waitFor(() => expect(mocks.downloadIssuedSettlementExportFile).toHaveBeenCalledTimes(2))
    expect(mocks.onRequestExport).toHaveBeenCalledTimes(1)
  })
})
