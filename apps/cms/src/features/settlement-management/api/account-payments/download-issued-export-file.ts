import type { SettlementExportHistoryResponse } from '@/shared/api/generated/settlement/schemas'
import { loadSensitiveAdminFileBlob } from '@/shared/lib/admin-file-upload/attachments'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import {
  downloadBlob,
  generateFilename,
  recordDownloadAccessLog,
} from '@/shared/utils/file-download'
import {
  getSettlementApiErrorMessage,
  isSettlementExportReissueRequiredError,
} from '@/features/settlement-management/api/get-settlement-api-error'

export async function downloadIssuedSettlementExportFile(input: {
  serverExport: SettlementExportHistoryResponse
  filenamePrefix: string
  reason: string
}): Promise<void> {
  const fileObjectId = input.serverExport.fileObjectId
  if (fileObjectId == null) {
    throw new Error('서버에서 정산 파일을 생성 중입니다. export 이력을 확인해 주세요.')
  }
  const filename = generateFilename(input.filenamePrefix, 'xlsx')
  await recordDownloadAccessLog(filename)
  const blob = await loadSensitiveAdminFileBlob({
    fileObjectId,
    reason: input.reason,
  })
  await downloadBlob(blob, filename, { skipAccessLog: true })
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
    title: '다운로드 불가',
    content: getSettlementApiErrorMessage(input.error, input.fallback),
  })
}
