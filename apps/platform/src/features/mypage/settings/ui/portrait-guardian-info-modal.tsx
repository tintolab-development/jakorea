import { useId, type ReactNode } from 'react'
import { PFButton, PFModal, PFText, PFTextInput } from '@/shared/ui'
import {
  PORTRAIT_GUARDIAN_INFO_COPY,
  PORTRAIT_GUARDIAN_RELATION_MAX_LENGTH,
} from '../lib/portrait-guardian-verification-copy'
import styles from './portrait-guardian-info-modal.module.css'

export type PortraitGuardianInfoModalProps = {
  open: boolean
  guardianName: string
  guardianPhone: string
  relation: string
  /** 안내 문구 덮어쓰기 — 기본값: 마이페이지 초상권 맥락 (`PORTRAIT_GUARDIAN_INFO_COPY.description`) */
  description?: ReactNode
  relationError?: string | null
  confirmLoading?: boolean
  onRelationChange: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}

/** 미성년 초상권 동의 — 보호자 정보 확인·관계 입력 */
export function PortraitGuardianInfoModal({
  open,
  guardianName,
  guardianPhone,
  relation,
  description = PORTRAIT_GUARDIAN_INFO_COPY.description,
  relationError,
  confirmLoading = false,
  onRelationChange,
  onCancel,
  onConfirm,
}: PortraitGuardianInfoModalProps) {
  const descriptionId = useId()

  return (
    <PFModal
      open={open}
      size="md"
      title={PORTRAIT_GUARDIAN_INFO_COPY.title}
      ariaDescribedBy={descriptionId}
      onClose={onCancel}
      mobilePlacement="full"
      closeOnBackdropClick={!confirmLoading}
      closeOnEscape={!confirmLoading}
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
            {description}
          </PFText>

          <div className={styles.fields}>
            <PFTextInput
              size="xlarge"
              label={PORTRAIT_GUARDIAN_INFO_COPY.nameLabel}
              value={guardianName}
              disabled
            />
            <PFTextInput
              size="xlarge"
              label={PORTRAIT_GUARDIAN_INFO_COPY.phoneLabel}
              value={guardianPhone}
              disabled
            />
            <PFTextInput
              size="xlarge"
              name="portrait-guardian-relation"
              label={PORTRAIT_GUARDIAN_INFO_COPY.relationLabel}
              placeholder={PORTRAIT_GUARDIAN_INFO_COPY.relationPlaceholder}
              value={relation}
              maxLength={PORTRAIT_GUARDIAN_RELATION_MAX_LENGTH}
              required
              disabled={confirmLoading}
              onValueChange={onRelationChange}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  onConfirm()
                }
              }}
              error={Boolean(relationError)}
              message={relationError ?? undefined}
              messageStatus="error"
            />
          </div>
        </div>

        <div className={styles.actions}>
          <PFButton
            type="button"
            variant="secondary"
            size="xlarge"
            disabled={confirmLoading}
            onClick={onCancel}
          >
            {PORTRAIT_GUARDIAN_INFO_COPY.cancelLabel}
          </PFButton>
          <PFButton
            type="button"
            variant="primary"
            size="xlarge"
            disabled={confirmLoading}
            onClick={onConfirm}
          >
            {confirmLoading ? '처리 중…' : PORTRAIT_GUARDIAN_INFO_COPY.confirmLabel}
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
