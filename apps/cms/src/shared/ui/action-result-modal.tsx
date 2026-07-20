import type { ReactNode } from 'react'
import { CmsButton } from './cms-button'
import { ContentModal } from './content-modal'
import './action-result-modal.css'

export interface ActionResultModalProps {
  open: boolean
  onClose: () => void
  zIndex?: number
  /** 완료·결과 안내 제목 (예: 회원 삭제 완료) */
  title: string
  /** 본문 */
  body: ReactNode
  /** 기본값 확인 */
  confirmLabel?: string
}

/**
 * 등록·삭제 등 작업 완료 안내 공통 모달.
 * 제목·본문은 호출부에서 조합(`action-result-messages` 등).
 * 시안: 600 × hug · padding 24/30/32
 */
export function ActionResultModal({
  open,
  title,
  body,
  onClose,
  zIndex,
  confirmLabel = '확인',
}: ActionResultModalProps) {
  const renderedBody =
    typeof body === 'string' ? (
      (() => {
        const match = body.match(/^\[[^\]]+\]/)
        if (!match) return body
        const namePart = match[0]
        const rest = body.slice(namePart.length)
        return (
          <>
            <span className="action-result-modal__body-name">{namePart}</span>
            {rest}
          </>
        )
      })()
    ) : (
      body
    )

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title={title}
      width={600}
      zIndex={zIndex}
      className="action-result-modal"
      footer={
        <CmsButton variant="secondary" size="medium" type="button" onClick={onClose}>
          {confirmLabel}
        </CmsButton>
      }
    >
      <div className="action-result-modal__body">{renderedBody}</div>
    </ContentModal>
  )
}
