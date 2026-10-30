import { PFButton, PFModal, PFText } from '@/shared/ui'
import {
  MEMBER_CONVERSION_ALERT,
  type MemberConversionAlertKind,
} from '../lib/alert-copy'
import styles from './alert.module.css'

type MemberConversionAlertProps = {
  kind: MemberConversionAlertKind | null
  onClose: () => void
  onInquiry?: () => void
}

export function MemberConversionAlert({ kind, onClose, onInquiry }: MemberConversionAlertProps) {
  if (!kind) return null

  const copy = MEMBER_CONVERSION_ALERT[kind]
  const hasInquiry = kind === 'under14' || kind === 'duplicate'

  return (
    <PFModal open size="sm" showCloseButton={false} onClose={onClose} closeOnBackdropClick>
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <PFText as="div" typo="hl-lg" color="black" className={styles.title}>
            {copy.title}
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-warm-600" className={styles.description}>
            {copy.description}
          </PFText>
        </div>
        {hasInquiry ? (
          <div className={styles.actions}>
            <PFButton type="button" variant="tertiary" size="xlarge" onClick={onClose}>
              닫기
            </PFButton>
            <PFButton type="button" variant="primary" size="xlarge" onClick={onInquiry}>
              문의하기
            </PFButton>
          </div>
        ) : (
          <PFButton type="button" variant="tertiary" size="xlarge" width="100%" onClick={onClose}>
            확인
          </PFButton>
        )}
      </div>
    </PFModal>
  )
}
