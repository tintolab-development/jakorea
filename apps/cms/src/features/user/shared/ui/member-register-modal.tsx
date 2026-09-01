/**
 * 전체 회원 — 회원 신규 등록 모달
 * ContentModal footer 고정 + 본문만 스크롤 (관리자/강사 등록 모달과 동일 패턴)
 */

import { useCallback, useEffect, useState } from 'react'
import type { CreateUserRequest } from '@/entities/user/api/user-service'
import { AddUserIndividual } from '@/features/user/shared/ui/add-user-individual'
import type { MemberConsentFieldKey } from '@/features/user/shared/lib/member-consent-template-map'
import {
  createEmptyMemberRegisterConsentWriteSnapshots,
  type MemberConsentAgreementDraftSnapshot,
  type MemberConsentCrimeDraftSnapshot,
  type MemberRegisterConsentWriteSnapshots,
} from '@/features/user/shared/lib/member-register-consent-write-snapshot'
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
  const [formKey, setFormKey] = useState(0)
  const [consentWriteSnapshots, setConsentWriteSnapshots] =
    useState<MemberRegisterConsentWriteSnapshots>(createEmptyMemberRegisterConsentWriteSnapshots)

  useEffect(() => {
    if (open) {
      setFormKey(key => key + 1)
      setConsentWriteSnapshots(createEmptyMemberRegisterConsentWriteSnapshots())
    }
  }, [open])

  const handleSaveConsentAgreementSnapshot = useCallback(
    (fieldKey: MemberConsentFieldKey, snapshot: MemberConsentAgreementDraftSnapshot) => {
      setConsentWriteSnapshots(prev => ({
        ...prev,
        agreementByFieldKey: { ...prev.agreementByFieldKey, [fieldKey]: snapshot },
      }))
    },
    []
  )

  const handleSaveConsentCrimeSnapshot = useCallback(
    (fieldKey: MemberConsentFieldKey, snapshot: MemberConsentCrimeDraftSnapshot) => {
      setConsentWriteSnapshots(prev => ({
        ...prev,
        crimeByFieldKey: { ...prev.crimeByFieldKey, [fieldKey]: snapshot },
      }))
    },
    []
  )

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
            disabled={loading}
          >
            신규 등록
          </CmsButton>
        </>
      }
    >
      <AddUserIndividual
        key={formKey}
        formId={FORM_ID}
        hideActions
        onSubmit={onSubmit}
        onCancel={onClose}
        loading={loading}
        consentWriteSnapshots={consentWriteSnapshots}
        onSaveConsentAgreementSnapshot={handleSaveConsentAgreementSnapshot}
        onSaveConsentCrimeSnapshot={handleSaveConsentCrimeSnapshot}
      />
    </ContentModal>
  )
}
