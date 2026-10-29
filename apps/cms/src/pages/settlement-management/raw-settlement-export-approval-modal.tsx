import { useState } from 'react'
import { Input, Modal } from 'antd'
import { buildRawAccountPaymentExportRequest } from '@/features/settlement-management/api/account-payments/build-account-payment-export-request'
import { downloadIssuedSettlementExportFile } from '@/features/settlement-management/api/account-payments/download-issued-export-file'
import {
  approvePrivacyExportApprovalRemote,
  assertCanApproveRawExport,
  assertOwnApprovedRawExport,
  createPrivacyExportApprovalRemote,
  fetchPrivacyExportApprovalRemote,
  RAW_SETTLEMENT_EXPORT_DOMAIN,
} from '@/features/settlement-management/api/account-payments/privacy-export-approval'
import { waitForSettlementExportDownload } from '@/features/settlement-management/api/settlement-api-client'
import type { SettlementExportHistoryResponse } from '@/shared/api/generated/settlement/schemas'
import { CmsButton } from '@/shared/ui/cms-button'

type RawExportKind = 'bulk-transfer' | 'tax-report'

const APPROVE_REASON = '정산 원본 양식 발급 승인'

function rawExportFailureMessage(error: unknown, fallback: string): string {
  const status =
    error != null && typeof error === 'object' && 'response' in error
      ? (error as { response?: { status?: number } }).response?.status
      : undefined
  if (status === 403) return '원본 발급 권한이 없습니다.'
  if (status === 404) return '승인 또는 파일을 찾을 수 없습니다.'
  if (status === 409) return '승인이 거부되었거나 만료·재사용되어 발급할 수 없습니다.'
  return error instanceof Error && error.message ? error.message : fallback
}

export function RawSettlementExportApprovalModal({
  open,
  mode,
  kind,
  fromDate,
  toDate,
  sessionAdminAccountId,
  onRequestExport,
  onClose,
}: {
  open: boolean
  mode: 'request' | 'approve'
  kind: RawExportKind
  fromDate?: string
  toDate?: string
  sessionAdminAccountId: number | null
  onRequestExport: (
    kind: RawExportKind,
    body: ReturnType<typeof buildRawAccountPaymentExportRequest>
  ) => Promise<SettlementExportHistoryResponse>
  onClose: () => void
}) {
  const [approvalIdText, setApprovalIdText] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [fullScopeConfirmed, setFullScopeConfirmed] = useState(false)
  const label = kind === 'bulk-transfer' ? '대량이체' : '세금신고'

  const resetAndClose = () => {
    setApprovalIdText('')
    setMessage(null)
    setFullScopeConfirmed(false)
    setBusy(false)
    onClose()
  }

  const requestApproval = async () => {
    if (sessionAdminAccountId == null) {
      setMessage('요청 계정이 있어야 승인 요청을 할 수 있습니다.')
      return
    }
    if (!fullScopeConfirmed) {
      setMessage('전체 범위 원본 발급 확인이 필요합니다. 선택한 행만 발급되지 않습니다.')
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const created = await createPrivacyExportApprovalRemote({
        exportDomain: RAW_SETTLEMENT_EXPORT_DOMAIN[kind],
        reason: `${label} 원본 양식 발급 승인 요청`,
        businessPurpose: '정산 관리 대량이체·세금신고 원본 양식',
      })
      setApprovalIdText(created.approvalId != null ? String(created.approvalId) : '')
      setMessage(
        created.approvalId != null
          ? `승인 요청 번호 ${created.approvalId}. 다른 마스터 승인 후 원본을 받습니다.`
          : '승인 요청 번호를 받지 못했습니다.'
      )
    } catch (error) {
      setMessage(rawExportFailureMessage(error, '승인 요청에 실패했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  const approve = async () => {
    const approvalId = Number(approvalIdText)
    if (!Number.isSafeInteger(approvalId) || approvalId <= 0 || sessionAdminAccountId == null) {
      setMessage('승인 요청 번호를 확인해 주세요.')
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const current = await fetchPrivacyExportApprovalRemote(approvalId)
      assertCanApproveRawExport(current, sessionAdminAccountId)
      await approvePrivacyExportApprovalRemote(approvalId, { reason: APPROVE_REASON })
      setMessage('승인했습니다. 요청자가 원본 발급을 진행합니다.')
    } catch (error) {
      setMessage(rawExportFailureMessage(error, '승인에 실패했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  const downloadRaw = async () => {
    const approvalId = Number(approvalIdText)
    if (
      !Number.isSafeInteger(approvalId) ||
      approvalId <= 0 ||
      sessionAdminAccountId == null
    ) {
      setMessage('승인 요청 번호가 필요합니다.')
      return
    }
    if (!fullScopeConfirmed) {
      setMessage('전체 범위 원본 발급 확인이 필요합니다. 선택한 행만 발급되지 않습니다.')
      return
    }
    setBusy(true)
    setMessage(null)
    let downloaded = false
    try {
      const current = await fetchPrivacyExportApprovalRemote(approvalId)
      const approvalReference = assertOwnApprovedRawExport(
        current,
        sessionAdminAccountId,
        RAW_SETTLEMENT_EXPORT_DOMAIN[kind]
      )
      const body = buildRawAccountPaymentExportRequest({
        kind,
        approvalReference,
        fromDate,
        toDate,
      })
      const requested = await onRequestExport(kind, body)
      const ready = await waitForSettlementExportDownload(requested)
      if (ready.pollingStatus === 'FAILED' || ready.exportStatus === 'FAILED') {
        throw new Error(ready.failureReason || '원본 파일 생성에 실패했습니다.')
      }
      if (ready.deliveryMethod !== 'SERVER_FILE' || ready.fileObjectId == null) {
        throw new Error('서버 파일이 준비되지 않았습니다. 클라이언트 파일로 대체하지 않습니다.')
      }
      await downloadIssuedSettlementExportFile({
        serverExport: ready,
        filenamePrefix: label,
        reason: kind === 'bulk-transfer' ? '대량이체 양식 발급' : '세금신고 양식 발급',
      })
      downloaded = true
    } catch (error) {
      setMessage(rawExportFailureMessage(error, '원본 발급에 실패했습니다.'))
    } finally {
      setBusy(false)
      if (downloaded) resetAndClose()
    }
  }

  return (
    <Modal
      open={open}
      title={mode === 'approve' ? '원본 양식 승인' : `${label} 원본 승인`}
      onCancel={resetAndClose}
      footer={null}
      destroyOnHidden
    >
      <p>
        {mode === 'approve'
          ? '다른 회계 관리자가 요청한 번호만 승인합니다. 본인 요청은 승인할 수 없습니다.'
          : '전체 범위 원본 발급입니다. 화면에서 고른 행이 아니라 현재 조회 기간의 대량이체 또는 세금신고 전체 건이 대상입니다. 마스터 승인 없이 원본을 요청하지 않습니다.'}
      </p>
      {mode === 'request' ? (
        <label>
          <input
            type="checkbox"
            checked={fullScopeConfirmed}
            onChange={event => setFullScopeConfirmed(event.target.checked)}
          />
          선택한 행이 아닌 전체 범위 원본 발급임을 확인했습니다.
        </label>
      ) : null}
      <Input
        value={approvalIdText}
        onChange={event => setApprovalIdText(event.target.value)}
        placeholder="승인 요청 번호"
        disabled={busy}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {mode === 'request' ? (
          <CmsButton type="button" disabled={busy} onClick={() => void requestApproval()}>
            승인 요청
          </CmsButton>
        ) : null}
        {mode === 'approve' ? (
          <CmsButton type="button" disabled={busy} onClick={() => void approve()}>
            승인
          </CmsButton>
        ) : (
          <CmsButton type="button" disabled={busy} onClick={() => void downloadRaw()}>
            원본 받기
          </CmsButton>
        )}
      </div>
      {message ? <p>{message}</p> : null}
    </Modal>
  )
}
