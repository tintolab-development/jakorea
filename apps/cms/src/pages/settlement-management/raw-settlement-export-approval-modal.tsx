import { useRef, useState } from 'react'
import { Input, Modal } from 'antd'
import { isUnfilteredFullRawExportBody } from '@/features/settlement-management/api/account-payments/build-account-payment-export-request'
import { downloadIssuedSettlementExportFile } from '@/features/settlement-management/api/account-payments/download-issued-export-file'
import {
  approvePrivacyExportApprovalRemote,
  assertCanApproveRawExport,
  assertOwnApprovedRawExport,
  createPrivacyExportApprovalRemote,
  fetchPrivacyExportApprovalRemote,
  RAW_SETTLEMENT_EXPORT_DOMAIN,
} from '@/features/settlement-management/api/account-payments/privacy-export-approval'
import {
  assertUsableScopeToken,
  buildFullCorpusScopeRequest,
  buildRawExportBodyForScope,
  buildSelectedScopeRequest,
  expectedStatusLabel,
  exportTypeForKind,
  issueSettlementExportScopeRemote,
  type SettlementExportScope,
} from '@/features/settlement-management/api/account-payments/settlement-export-scope'
import { getSettlementApiErrorCode, getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import {
  assertSettlementServerExportReady,
  waitForSettlementExportDownload,
} from '@/features/settlement-management/api/settlement-api-client'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'
import type { SettlementExportHistoryResponse } from '@/shared/api/generated/settlement/schemas'
import { CmsButton } from '@/shared/ui/cms-button'

type RawExportKind = 'bulk-transfer' | 'tax-report'

const APPROVE_REASON = '정산 원본 양식 발급 승인'

function rawExportFailureMessage(error: unknown, fallback: string): string {
  const code = getSettlementApiErrorCode(error)
  if (code === 'SETTLEMENT_EXPORT_SCOPE_TOKEN_REQUIRED') {
    return '선택·필터 원본 발급은 서버 발급 범위 확인이 필요합니다.'
  }
  const status =
    error != null && typeof error === 'object' && 'response' in error
      ? (error as { response?: { status?: number } }).response?.status
      : undefined
  if (status === 400) {
    return getSettlementApiErrorMessage(error, '원본 발급 요청이 올바르지 않습니다.')
  }
  if (status === 403) return '원본 발급 권한이 없습니다.'
  if (status === 404) return '승인 또는 파일을 찾을 수 없습니다.'
  if (status === 409) {
    return '승인이 거부되었거나 만료·재사용되었거나, 대상 건수가 늘어 승인 범위를 벗어났습니다. 새 승인을 요청해 주세요.'
  }
  const message = error instanceof Error ? error.message : ''
  if (message.includes('원본 파일 생성에 실패') || message.includes('FAILED')) {
    return '원본 파일 생성에 실패했습니다. 준비되지 않은 파일은 받지 않습니다.'
  }
  return message || fallback
}

export function RawSettlementExportApprovalModal({
  open,
  mode,
  kind,
  sessionAdminAccountId,
  selectedRows = [],
  onRequestExport,
  onClose,
}: {
  open: boolean
  mode: 'request' | 'approve'
  kind: RawExportKind
  sessionAdminAccountId: number | null
  selectedRows?: ReadonlyArray<Pick<AccountPaymentRow, 'settlementId' | 'accountPaymentId'>>
  onRequestExport: (
    kind: RawExportKind,
    body: ReturnType<typeof buildRawExportBodyForScope>
  ) => Promise<SettlementExportHistoryResponse>
  onClose: () => void
}) {
  const [approvalIdText, setApprovalIdText] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [fullScopeConfirmed, setFullScopeConfirmed] = useState(false)
  const [requestedKind, setRequestedKind] = useState<RawExportKind | null>(null)
  const [scopeMode, setScopeMode] = useState<'full' | 'selected'>('full')
  const [scopeSummary, setScopeSummary] = useState<{
    fullCorpus: boolean
    rowCount: number
    effectiveStatus: string
  } | null>(null)
  const scopeTokenRef = useRef<string | null>(null)
  const label = kind === 'bulk-transfer' ? '대량이체' : '세금신고'
  const canSelectRows = selectedRows.length > 0
  const usingFullCorpus = scopeMode === 'full'

  const resetAndClose = () => {
    setApprovalIdText('')
    setMessage(null)
    setFullScopeConfirmed(false)
    setRequestedKind(null)
    setScopeSummary(null)
    scopeTokenRef.current = null
    setBusy(false)
    onClose()
  }

  const loadScope = async (): Promise<SettlementExportScope> => {
    const exportType = exportTypeForKind(kind)
    const body =
      usingFullCorpus
        ? buildFullCorpusScopeRequest(kind)
        : buildSelectedScopeRequest({ kind, rows: selectedRows })
    const issued = await issueSettlementExportScopeRemote(exportType, body)
    const token = assertUsableScopeToken(issued)
    scopeTokenRef.current = token
    setScopeSummary({
      fullCorpus: issued.fullCorpus === true,
      rowCount: issued.rowCount ?? 0,
      effectiveStatus: expectedStatusLabel(kind, issued.effectiveStatus),
    })
    return issued
  }

  const requestApproval = async () => {
    if (sessionAdminAccountId == null) {
      setMessage('요청 계정이 있어야 승인 요청을 할 수 있습니다.')
      return
    }
    if (!fullScopeConfirmed || scopeSummary == null) {
      setMessage('서버가 확인한 발급 범위와 건수를 확인해 주세요.')
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const issued = await loadScope()
      if (usingFullCorpus && issued.fullCorpus !== true) {
        setMessage('서버가 전체 범위로 확인하지 않았습니다. 화면 필터를 원본 전체에 넣지 않습니다.')
        return
      }
      if (!usingFullCorpus && issued.fullCorpus === true) {
        setMessage('선택 건 발급인데 서버가 전체 범위로 응답했습니다. 발급하지 않습니다.')
        return
      }
      const created = await createPrivacyExportApprovalRemote({
        exportDomain: RAW_SETTLEMENT_EXPORT_DOMAIN[kind],
        reason: `${label} 원본 양식 발급 승인 요청`,
        businessPurpose: '정산 관리 대량이체·세금신고 원본 양식',
        scopeToken: assertUsableScopeToken(issued),
      })
      setRequestedKind(kind)
      setApprovalIdText(created.approvalId != null ? String(created.approvalId) : '')
      setMessage(
        created.approvalId != null
          ? `승인 요청 번호 ${created.approvalId}. ${issued.rowCount ?? 0}건. 다른 마스터 승인 후 원본을 받습니다.`
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
    if (!fullScopeConfirmed || scopeSummary == null) {
      setMessage('서버가 확인한 발급 범위와 건수를 확인해 주세요.')
      return
    }
    if (requestedKind != null && requestedKind !== kind) {
      setMessage('승인 요청 이후 발급 종류가 바뀌었습니다. 새 승인을 요청해 주세요.')
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
      const body = buildRawExportBodyForScope({
        kind,
        approvalReference,
        fullCorpus: usingFullCorpus,
        selectedRows: usingFullCorpus ? undefined : selectedRows,
      })
      if (usingFullCorpus && !isUnfilteredFullRawExportBody(body)) {
        throw new Error('무필터 전체 원본 요청 body가 아닙니다.')
      }
      const requested = await onRequestExport(kind, body)
      const ready = assertSettlementServerExportReady(
        await waitForSettlementExportDownload(requested),
        '서버 파일이 준비되지 않았습니다. 클라이언트 파일로 대체하지 않습니다.'
      )
      await downloadIssuedSettlementExportFile({
        serverExport: ready,
        kind,
      })
      downloaded = true
    } catch (error) {
      setMessage(rawExportFailureMessage(error, '원본 발급에 실패했습니다.'))
    } finally {
      scopeTokenRef.current = null
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
          : '원본 발급 범위는 서버 scope 응답의 건수·상태를 따릅니다. 화면 필터를 임의로 넣지 않습니다.'}
      </p>
      {mode === 'request' ? (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <label>
              <input
                type="radio"
                name="raw-export-scope"
                checked={scopeMode === 'full'}
                onChange={() => {
                  setScopeMode('full')
                  setScopeSummary(null)
                  scopeTokenRef.current = null
                }}
              />
              전체 범위
            </label>
            <label>
              <input
                type="radio"
                name="raw-export-scope"
                disabled={!canSelectRows}
                checked={scopeMode === 'selected'}
                onChange={() => {
                  if (!canSelectRows) return
                  setScopeMode('selected')
                  setScopeSummary(null)
                  scopeTokenRef.current = null
                }}
              />
              선택 건{canSelectRows ? ` (${selectedRows.length})` : ' (행 선택 필요)'}
            </label>
          </div>
          <CmsButton
            type="button"
            disabled={busy || (scopeMode === 'selected' && !canSelectRows)}
            onClick={() => {
              setBusy(true)
              setMessage(null)
              void loadScope()
                .then(issued => {
                  setMessage(`서버 확인 ${issued.rowCount ?? 0}건, ${expectedStatusLabel(kind, issued.effectiveStatus)}.`)
                })
                .catch(error => {
                  setMessage(rawExportFailureMessage(error, '발급 범위 확인에 실패했습니다.'))
                })
                .finally(() => setBusy(false))
            }} >
            발급 범위 확인
          </CmsButton>
          {scopeSummary ? (
            <p>
              {scopeSummary.fullCorpus ? '전체 범위' : '선택 범위'} · {scopeSummary.effectiveStatus} ·{' '}
              {scopeSummary.rowCount}건
            </p>
          ) : null}
          <label>
            <input
              type="checkbox"
              checked={fullScopeConfirmed}
              onChange={event => setFullScopeConfirmed(event.target.checked)}
            />
            위에 표시된 서버 확인 범위와 건수로 원본을 발급함을 확인했습니다.
          </label>
        </>
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
