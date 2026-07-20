/**
 * 임시저장 이력 안내 모달 — 이어서 작성 / 신규 등록 선택
 */

import { useEffect, useState } from 'react'
import { CmsButton, CmsRadio, ContentModal } from '@/shared/ui'
import './draft-notice-modal.css'

export type RegistrationDraftNoticeChoice = 'continue' | 'fresh'

export type RegistrationDraftNoticeModalProps = {
  open: boolean
  /** 박스에 `[제목]` 으로 표시 */
  draftTitle: string
  onCancel: () => void
  onConfirm: (choice: RegistrationDraftNoticeChoice) => void
}

export function RegistrationDraftNoticeModal({
  open,
  draftTitle,
  onCancel,
  onConfirm,
}: RegistrationDraftNoticeModalProps) {
  const [choice, setChoice] = useState<RegistrationDraftNoticeChoice>('fresh')

  useEffect(() => {
    if (open) setChoice('fresh')
  }, [open])

  const confirmLabel = choice === 'continue' ? '이어서 작성' : '프로그램 등록'
  const displayTitle = draftTitle.trim() || '제목 없음'

  return (
    <ContentModal
      open={open}
      title="임시저장 이력 안내"
      description="임시저장된 등록 건이 있습니다. 이어서 작성하시겠습니까?"
      width={600}
      onCancel={onCancel}
      className="registration-draft-notice-modal"
      footer={
        <>
          <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            type="button"
            onClick={() => onConfirm(choice)}
          >
            {confirmLabel}
          </CmsButton>
        </>
      }
    >
      <div className="registration-draft-notice-modal__panel">
        <p className="registration-draft-notice-modal__title">[{displayTitle}]</p>
        <CmsRadio.Group
          className="registration-draft-notice-modal__radios"
          value={choice}
          onChange={e => setChoice(e.target.value as RegistrationDraftNoticeChoice)}
          size="large"
        >
          <CmsRadio value="continue">이어서 작성</CmsRadio>
          <CmsRadio value="fresh">신규 등록</CmsRadio>
        </CmsRadio.Group>
      </div>
    </ContentModal>
  )
}
