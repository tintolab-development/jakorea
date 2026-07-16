/**
 * 삭제(파괴적 작업) 재확인 안내 모달 — ContentModal(카드형) 셸
 * 본문은 `lines` 문자열 배열로 전달 (문구는 `delete-guide-messages` 등에서 조합)
 * - `[강조]` : 대괄호 포함·font-weight 700
 * - `**강조**` : 대괄호 없이 font-weight 700
 */

import { useEffect, useState } from 'react'
import { DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER } from '@/shared/constants'
import { CmsButton } from './cms-button'
import { CmsInput } from './cms-input'
import { ContentModal } from './content-modal'
import './delete-guide-modal.css'

export interface DeleteGuideModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
  lines: string[]
  confirmText?: string
  confirmVariant?: 'delete' | 'primary'
  requiredConfirmInput?: string
  confirmInputPlaceholder?: string
  zIndex?: number
}

function renderLineWithEmphasis(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*|\[[^\]]+\])/g)
  return parts.map((part, i) => {
    if (part === '') return null
    if (/^\*\*.+\*\*$/.test(part)) {
      return (
        <strong key={i} className="delete-guide-modal__bold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (/^\[.+\]$/.test(part)) {
      return (
        <strong key={i} className="delete-guide-modal__bold">
          {part}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export function DeleteGuideModal({
  open,
  onCancel,
  onConfirm,
  title,
  lines,
  confirmText = '삭제',
  confirmVariant = 'delete',
  requiredConfirmInput,
  confirmInputPlaceholder = DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  zIndex = 2500,
}: DeleteGuideModalProps) {
  const [confirmInput, setConfirmInput] = useState('')
  const needsTypedConfirm = Boolean(requiredConfirmInput)
  const canConfirm = !needsTypedConfirm || confirmInput.trim() === requiredConfirmInput

  useEffect(() => {
    if (open) setConfirmInput('')
  }, [open])

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={title}
      width={600}
      className="delete-guide-modal"
      zIndex={zIndex}
      footer={
        <>
          <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant={confirmVariant}
            size="medium"
            type="button"
            disabled={!canConfirm}
            onClick={() => {
              if (canConfirm) onConfirm()
            }}
          >
            {confirmText}
          </CmsButton>
        </>
      }
    >
      <div className="delete-guide-modal__body">
        {lines.map((line, i) => (
          <span key={i} className="delete-guide-modal__line">
            {renderLineWithEmphasis(line)}<br/>
          </span>
        ))}
      </div>

      {needsTypedConfirm && (
        <div className="delete-guide-modal__confirm-input-wrap">
          <CmsInput
            width={'100%'}
            inputSize="large"
            placeholder={confirmInputPlaceholder}
            value={confirmInput}
            onChange={e => setConfirmInput(e.target.value)}
            autoComplete="off"
          />
        </div>
      )}
    </ContentModal>
  )
}
