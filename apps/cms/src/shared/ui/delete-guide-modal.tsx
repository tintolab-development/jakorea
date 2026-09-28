/**
 * 삭제(파괴적 작업) 재확인 안내 모달 — ContentModal(카드형) 셸
 * 본문은 `lines` 문자열 배열로 전달 (문구는 `delete-guide-messages` 등에서 조합)
 * - `[강조]` : 대괄호 포함·font-weight 700
 * - `**강조**` : 대괄호 없이 font-weight 700
 */

import { useEffect, useState } from 'react'
import {
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  matchesDeleteGuideTypedConfirm,
} from '@/shared/constants'
import { CmsButton } from './cms-button'
import { CmsInput } from './cms-input'
import { ContentModal } from './content-modal'
import './delete-guide-modal.css'

export type DeleteGuideConfirmInputMode = 'phrase' | 'password'

export interface DeleteGuideModalProps {
  open: boolean
  onCancel: () => void
  /** `confirmInputMode=password` 이면 입력값을 인자로 전달 */
  onConfirm: (confirmInput?: string) => void
  title: string
  lines: string[]
  confirmText?: string
  confirmVariant?: 'delete' | 'primary'
  /** phrase 모드: 사용자가 입력해야 하는 확인 문구 */
  requiredConfirmInput?: string
  confirmInputPlaceholder?: string
  /** phrase(기본) | password — 회원 삭제/탈퇴 시 관리자 비밀번호 확인 */
  confirmInputMode?: DeleteGuideConfirmInputMode
  zIndex?: number
  /** 확인 버튼 로딩 (비동기 탈퇴 등) */
  confirmLoading?: boolean
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
  confirmInputMode = 'phrase',
  zIndex = 2500,
  confirmLoading = false,
}: DeleteGuideModalProps) {
  const [confirmInput, setConfirmInput] = useState('')
  const isPasswordMode = confirmInputMode === 'password'
  const needsTypedConfirm = Boolean(requiredConfirmInput) || isPasswordMode
  const canConfirm = isPasswordMode
    ? confirmInput.trim().length > 0
    : !needsTypedConfirm ||
      (requiredConfirmInput != null &&
        matchesDeleteGuideTypedConfirm(confirmInput, requiredConfirmInput))

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
            disabled={!canConfirm || confirmLoading}
            loading={confirmLoading}
            onClick={() => {
              if (canConfirm && !confirmLoading) {
                onConfirm(isPasswordMode || needsTypedConfirm ? confirmInput : undefined)
              }
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
            {renderLineWithEmphasis(line)}
            <br />
          </span>
        ))}
      </div>

      {needsTypedConfirm && (
        <div className="delete-guide-modal__confirm-input-wrap">
          <CmsInput
            width={'100%'}
            inputSize="large"
            type={isPasswordMode ? 'password' : 'text'}
            label={isPasswordMode ? '비밀번호' : undefined}
            placeholder={
              isPasswordMode
                ? (confirmInputPlaceholder || '비밀번호를 입력해 주세요')
                : confirmInputPlaceholder
            }
            value={confirmInput}
            onChange={e => setConfirmInput(e.target.value)}
            autoComplete={isPasswordMode ? 'current-password' : 'off'}
            allowClear={!isPasswordMode}
            onPressEnter={() => {
              if (canConfirm && !confirmLoading) {
                onConfirm(isPasswordMode || needsTypedConfirm ? confirmInput : undefined)
              }
            }}
          />
        </div>
      )}
    </ContentModal>
  )
}
