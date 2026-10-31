import { getProgramApplicationApiErrorMessage } from '@/features/program/lib/application-api-error'
import { PFButton, PFModal, PFText } from '@/shared/ui'
import styles from './cancel-confirm.module.css'

type EducationCancelConfirmProps = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  /** 취소 요청 진행 중 — 중복 요청 방지 */
  pending?: boolean
  /** 취소 API 실패 — 서버 메시지를 모달 안에 노출 */
  error?: unknown
}

export function EducationCancelConfirm({
  open,
  onCancel,
  onConfirm,
  pending = false,
  error,
}: EducationCancelConfirmProps) {
  const errorMessage =
    error != null
      ? getProgramApplicationApiErrorMessage(error, '신청 취소에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      : null
  return (
    <PFModal
      open={open}
      size="sm"
      onClose={onCancel}
      closeOnBackdropClick={!pending}
      showCloseButton={false}
    >
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <PFText as="div" typo="hl-lg" color="black" className={styles.title}>
            신청을 취소하시겠습니까?
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
            신청을 취소하면 신청 이력이 남지 않습니다.
          </PFText>
          {errorMessage ? (
            <PFText as="p" typo="bd-md-rg" color="error" className={styles.description} role="alert">
              {errorMessage}
            </PFText>
          ) : null}
        </div>
        <div className={styles.actions}>
          <PFButton type="button" variant="secondary" size="xlarge" onClick={onCancel} disabled={pending}>
            닫기
          </PFButton>
          <PFButton type="button" variant="primary" size="xlarge" onClick={onConfirm} disabled={pending}>
            신청 취소하기
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
