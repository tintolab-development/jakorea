/**
 * 전체 회원 — 회원 신규 등록 모달
 * ContentModal footer 고정 + 본문만 스크롤 (관리자/강사 등록 모달과 동일 패턴)
 */

import { useCallback, useState } from 'react'
import type { CreateUserRequest } from '@/entities/user/api/user-service'
import { AddUserIndividual } from '@/features/user/shared/ui/add-user-individual'
import { CmsButton, ContentModal } from '@/shared/ui'
import './member-register-modal.css'

const FORM_ID = 'cms-member-register-modal-form'

export type MemberRegisterModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (request: CreateUserRequest) => Promise<void>
  loading?: boolean
}

export function MemberRegisterModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: MemberRegisterModalProps) {
  const [canSubmit, setCanSubmit] = useState(false)

  const handleCanSubmitChange = useCallback((next: boolean) => {
    setCanSubmit(next)
  }, [])

  return (
    <ContentModal
      open={open}
      title="회원 신규 등록"
      onCancel={onClose}
      width={1400}
      className="member-register-modal"
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="medium"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            닫기
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            type="submit"
            form={FORM_ID}
            loading={loading}
            disabled={loading || !canSubmit}
          >
            신규 등록
          </CmsButton>
        </>
      }
    >
      <AddUserIndividual
        formId={FORM_ID}
        hideActions
        onSubmit={onSubmit}
        onCancel={onClose}
        loading={loading}
        onCanSubmitChange={handleCanSubmitChange}
      />
    </ContentModal>
  )
}
