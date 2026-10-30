import { useRef } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import {
  buildUjatTemporaryActionCopy,
  type UjatTemporaryActionKind,
} from './temporary-action-copy'
import './temporary-action-modal.css'

export type TemporaryActionModalProps = {
  open: boolean
  kind: UjatTemporaryActionKind
  institutionNames: string[]
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void | Promise<void>
}

export function TemporaryActionModal({
  open,
  kind,
  institutionNames,
  loading = false,
  onCancel,
  onConfirm,
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
      footer={
        <>
          <CmsButton
            type="button"
            variant="secondary"
            size="medium"
            width={120}
            disabled={loading}
            onClick={handleCancel}
          >
            취소
          </CmsButton>
          <CmsButton
            type="button"
            variant={danger ? 'secondary' : 'primary'}
            size="medium"
            width={120}
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
