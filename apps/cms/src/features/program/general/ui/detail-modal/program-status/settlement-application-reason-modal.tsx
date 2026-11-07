/**
 * 확정 전 정산 신청서 반려·보정 요청 사유 입력 (reason 필수 · 1000자)
 */
import { useCallback, useEffect, useState } from 'react'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import './settlement-application-reason-modal.css'

const REASON_MAX_LENGTH = 1000
const MODAL_Z_INDEX = 1100

export type SettlementApplicationReasonKind = 'reject' | 'requestCorrection'

const COPY: Record<
  SettlementApplicationReasonKind,
  { title: string; label: string; placeholder: string; confirm: string }
> = {
  reject: {
    title: '정산 신청서 반려',
    label: '반려 사유',
    placeholder: '반려 사유를 입력해 주세요.',
    confirm: '반려',
  },
  requestCorrection: {
    title: '정산 신청서 보정 요청',
    label: '보정 요청 사유',
    placeholder: '보정 요청 사유를 입력해 주세요.',
    confirm: '보정 요청',
  },
}

export function SettlementApplicationReasonModal({
  kind,
  open,
  confirming = false,
  onCancel,
  onConfirm,
}: {
  kind: SettlementApplicationReasonKind
  open: boolean
  confirming?: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void | Promise<void>
}) {
  const copy = COPY[kind]
  const [reason, setReason] = useState('')

  /* eslint-disable react-hooks/set-state-in-effect -- 모달을 열 때마다 사유 초기화 */
  useEffect(() => {
    if (open) setReason('')
  }, [open])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleCancel = useCallback(() => {
    if (confirming) return
    onCancel()
  }, [confirming, onCancel])

  const trimmed = reason.trim()
  const canConfirm = trimmed.length > 0 && !confirming

  const footer = (
    <div className="settlement-application-reason-modal__footer">
      <CmsButton
        variant="secondary"
        size="large"
        type="button"
        disabled={confirming}
        onClick={handleCancel}
      >
        취소
      </CmsButton>
      <CmsButton
        variant="primary"
        size="large"
        type="button"
        disabled={!canConfirm}
        loading={confirming}
        onClick={() => void onConfirm(trimmed)}
      >
        {copy.confirm}
      </CmsButton>
    </div>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title={copy.title}
      width={600}
      zIndex={MODAL_Z_INDEX}
      className="settlement-application-reason-modal"
      footer={footer}
    >
      <CmsTextArea
        label={copy.label}
        required
        value={reason}
        onChange={event => setReason(event.target.value)}
        maxLength={REASON_MAX_LENGTH}
        placeholder={copy.placeholder}
        message={`${REASON_MAX_LENGTH}자 이내`}
        rows={4}
        width="100%"
      />
    </ContentModal>
  )
}
