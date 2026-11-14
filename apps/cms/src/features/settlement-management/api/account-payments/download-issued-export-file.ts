import type { SettlementExportResponse } from './settlement-export-response'
import { loadSensitiveAdminFileBlob } from '@/shared/lib/admin-file-upload/attachments'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { downloadBlob } from '@/shared/utils/file-download'
import {
  getSettlementApiErrorMessage,
  isSettlementExportAlreadyDownloadedError,
  isSettlementExportReissueRequiredError,
} from '@/features/settlement-management/api/get-settlement-api-error'
import {
  buildSettlementFormExcelFilename,
  SETTLEMENT_FORM_DOWNLOAD_REASON,
  type SettlementFormExportKind,
} from '@/features/settlement-management/api/account-payments/settlement-form-download'
import { networkAwareAlertTitle } from '@/shared/lib/extract-api-error-message'

export async function downloadIssuedSettlementExportFile(input: {
  serverExport: SettlementExportResponse
  kind: SettlementFormExportKind
  password?: string
}): Promise<void> {
  const fileObjectId = input.serverExport.fileObjectId
  if (fileObjectId == null) {
    throw new Error('서버에서 정산 파일을 생성 중입니다. export 이력을 확인해 주세요.')
  }
  const filename = buildSettlementFormExcelFilename(input.kind)
  const reason = SETTLEMENT_FORM_DOWNLOAD_REASON[input.kind]
  // sensitive-downloads/stream 이 file-access 이력을 남긴다 — client 로그를 따로 남기지 않는다
  const blob = await loadSensitiveAdminFileBlob({
    fileObjectId,
    reason,
    password: input.password,
  })
  await downloadBlob(blob, filename, { skipAccessLog: true })
}

/** 409 SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED면 한 번만 재발급 후 다시 받는다. */
export async function downloadIssuedSettlementExportFileOrReissue(input: {
  serverExport: SettlementExportResponse
  kind: SettlementFormExportKind
  password?: string
  onReissue: () => Promise<SettlementExportResponse | null>
}): Promise<void> {
  try {
    await downloadIssuedSettlementExportFile(input)
  } catch (error) {
    if (!isSettlementExportAlreadyDownloadedError(error)) throw error
    const next = await input.onReissue()
    if (next?.fileObjectId == null) return
    await downloadIssuedSettlementExportFile({
      serverExport: next,
      kind: input.kind,
      password: input.password,
    })
  }
}

export function notifySettlementExportDownloadError(input: {
  error: unknown
  fallback: string
  issueButtonLabel: string
  onAlreadyDownloaded: () => void
}): void {
  if (isSettlementExportReissueRequiredError(input.error)) {
    input.onAlreadyDownloaded()
    cmsAlertModal.show({
      title: '다운로드 불가',
      content: `${getSettlementApiErrorMessage(input.error, input.fallback)}\n목록 위 「${input.issueButtonLabel}」 버튼을 눌러 새로 발급해 주세요.`,
    })
    return
  }
  cmsAlertModal.show({
    title: networkAwareAlertTitle(input.error, '다운로드 불가'),
    content: getSettlementApiErrorMessage(input.error, input.fallback),
  })
}
