import { useRef } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import {
  buildUjatTemporaryActionCopy,
  type UjatTemporaryActionKind,
} from './temporary-action-copy'
import './temporary-action-modal.css'

/** UJAT 프로그램 상세 풀페이지(~1100) · PermissionModal(2500)과 동일 계층 */
const TEMPORARY_ACTION_MODAL_Z_INDEX = 2500

export type TemporaryActionModalProps = {
  open: boolean
  kind: UjatTemporaryActionKind
  institutionNames: string[]
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void | Promise<void>
  zIndex?: number
}

export function TemporaryActionModal({
  open,
  kind,
  institutionNames,
  loading = false,
  onCancel,
  onConfirm,
  zIndex = TEMPORARY_ACTION_MODAL_Z_INDEX,
}: TemporaryActionModalProps) {
  const submittingRef = useRef(false)
  const copy = buildUjatTemporaryActionCopy(kind, institutionNames)
  const danger = copy.confirmTone === 'danger-outline'

  const handleCancel = () => {
    if (loading || submittingRef.current) return
    onCancel()
  }

  const handleConfirm = () => {
    if (loading || submittingRef.current) return
    submittingRef.current = true
    void Promise.resolve(onConfirm()).finally(() => {
      submittingRef.current = false
    })
  }

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title={copy.title}
      width={600}
      className="temporary-action-modal"
      titleBodyGap="always"
      zIndex={zIndex}
      footer={
        <>
          <CmsButton
            type="button"
            variant="secondary"
            size="medium"
            disabled={loading}
            onClick={handleCancel}
          >
            취소
          </CmsButton>
          <CmsButton
            type="button"
            variant={danger ? 'secondary' : 'primary'}
            size="medium"
            className={danger ? 'temporary-action-modal__confirm--danger' : undefined}
            loading={loading}
            disabled={loading}
            onClick={handleConfirm}
          >
            {copy.confirmLabel}
          </CmsButton>
        </>
      }
    >
      <div className="temporary-action-modal__body">
        <p className="temporary-action-modal__lead">
          <strong>{copy.lead}</strong>
          {copy.leadSuffix}
        </p>
        <p className="temporary-action-modal__note">{copy.note}</p>
      </div>
    </ContentModal>
  )
}
