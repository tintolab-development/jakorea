import { useState } from 'react'
import { getProgramApplicationApiErrorMessage } from '@/features/program/lib/application-api-error'
import { PFAlertModal, PFButton, PFModal, PFText } from '@/shared/ui'
import { resolveEducationErrorAlert } from '../../shared/lib/education-error-alert'
import styles from './cancel-confirm.module.css'

type EducationCancelConfirmProps = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  /** 취소 요청 진행 중 — 중복 요청 방지 */
  pending?: boolean
  /** 취소 API 실패 — 시안 오류 팝업(네트워크·처리 제한·처리 실패, 서버 메시지는 설명)으로 띄운다 */
  error?: unknown
}

export function EducationCancelConfirm({
  open,
  onCancel,
  onConfirm,
  pending = false,
  error,
}: EducationCancelConfirmProps) {
  // 같은 오류 객체는 [확인]을 누른 뒤 다시 띄우지 않는다 (재시도로 새 오류가 오면 다시 띄움)
  const [dismissedError, setDismissedError] = useState<unknown>(null)
  const errorAlert =
    error != null && error !== dismissedError
      ? resolveEducationErrorAlert(error, getProgramApplicationApiErrorMessage)
      : null
  return (
    <>
      <PFModal open={open} size="sm" onClose={onCancel} showCloseButton={false}>
        <div className={styles.content}>
          <div className={styles.textBlock}>
            <PFText as="div" typo="hl-lg" color="black" className={styles.title}>
              프로그램 신청을 취소할까요?
            </PFText>
            <PFText as="p" typo="bd-md-rg" color="neutral-warm-600" className={styles.description}>
              신청을 취소하면 해당 프로그램의 신청 내역이 삭제돼요.
            </PFText>
          </div>
          <div className={styles.actions}>
            <PFButton
              type="button"
              variant="secondary"
              size="xlarge"
              onClick={onCancel}
              disabled={pending}
            >
              닫기
            </PFButton>
            <PFButton
              type="button"
              variant="primary"
              size="xlarge"
              onClick={onConfirm}
              disabled={pending}
            >
              신청 취소하기
            </PFButton>
          </div>
        </div>
      </PFModal>
      <PFAlertModal
        open={open && errorAlert != null}
        title={errorAlert?.title ?? ''}
        description={errorAlert?.description}
        onConfirm={() => setDismissedError(error)}
      />
    </>
  )
}
