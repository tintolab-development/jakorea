import { useId } from 'react'
import {
  IDENTITY_MODULE_IDLE_DESCRIPTION,
  IDENTITY_MODULE_IDLE_TITLE,
} from '@jakorea/domain/shared/identity-module-copy'
import { PFButton, PFModal, PFText } from '@/shared/ui'
import { PROGRAM_GUARDIAN_IDENTITY_COPY } from '../../lib/program-minor-portrait-copy'
import styles from './program-guardian-identity-modal.module.css'

export type ProgramGuardianIdentityCopy = {
  title: string
  description: string
  verifyLabel: string
}

export type ProgramGuardianIdentityModalProps = {
  open: boolean
  /** 문구 덮어쓰기 — 기본값: 프로그램 신청 초상권 맥락. 영수증 사전동의 등 다른 맥락에서 전달 */
  copy?: ProgramGuardianIdentityCopy
  /** 보호자 정보 누락 등 — 회색 박스 아래 안내 */
  errorMessage?: string | null
  onClose: () => void
  onVerify: () => void
}

/** 미성년 프로그램 신청 — 보호자 휴대폰 본인인증 안내 (PC 팝업 / 모바일 전체 화면 + 하단 고정 버튼) */
export function ProgramGuardianIdentityModal({
  open,
  copy = PROGRAM_GUARDIAN_IDENTITY_COPY,
  errorMessage,
  onClose,
  onVerify,
}: ProgramGuardianIdentityModalProps) {
  const descriptionId = useId()

  return (
    <PFModal
      open={open}
      size="md"
      title={copy.title}
      ariaDescribedBy={descriptionId}
      onClose={onClose}
      mobilePlacement="full"
    >
      <div className={styles.content}>
        <div className={styles.body}>
          <PFText
            as="p"
            typo="bd-md-rg"
            color="neutral-cool-600"
            id={descriptionId}
            className={styles.description}
          >
            {copy.description}
          </PFText>
          <div className={styles.identityModule}>
            <PFText as="p" typo="bd-sm-rg" color="neutral-warm-500">
              {IDENTITY_MODULE_IDLE_TITLE}
              <br />
              {IDENTITY_MODULE_IDLE_DESCRIPTION}
            </PFText>
            {errorMessage ? (
              <PFText as="p" typo="bd-sm-md" color="error">
                {errorMessage}
              </PFText>
            ) : null}
          </div>
        </div>
        <div className={styles.actions}>
          <PFButton type="button" variant="primary" size="xlarge" width="100%" onClick={onVerify}>
            {copy.verifyLabel}
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
