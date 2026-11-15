import { useEffect, useId, useState } from 'react'
import { PFButton, PFModal, PFRequiredMissingAlert, PFText, PFTextInput } from '@/shared/ui'
import {
  buildRequiredMissingAlertCopy,
  type RequiredMissingAlertCopy,
} from '@/shared/lib/required-missing-alert'
import styles from './fee-correction-request-modal.module.css'

/** BE 정정 사유 @Size(min = 2, max = 500). 제출 전과 확인 후 정정 요청이 같다. */
export const FEE_CORRECTION_REASON_MIN_LENGTH = 2
export const FEE_CORRECTION_REASON_MAX_LENGTH = 500

const REASON_LABEL = '정정 요청 사유'

type FeeCorrectionRequestModalProps = {
  open: boolean
  submitting?: boolean
  /** 사유 최소 글자 수. 기본값은 서버와 같은 2자 */
  minLength?: number
  onCancel: () => void
  /** 앞뒤 공백을 뺀 사유 */
  onSubmit: (reason: string) => void
}

/**
 * 시안 「03. 강사비 정정 요청 팝업」 — 지급조서 작성·제출 전 확인 화면의 [강사비 정정 요청하기].
 * 입력은 사유 한 줄이다. 제출 전 화면은 지급조서 제출과 함께 보내고, 제출 후 카드는 정정 요청만 보낸다.
 */
export function FeeCorrectionRequestModal({
  open,
  submitting = false,
  minLength = FEE_CORRECTION_REASON_MIN_LENGTH,
  onCancel,
  onSubmit,
}: FeeCorrectionRequestModalProps) {
  const descriptionId = useId()
  const [reason, setReason] = useState('')
  const [requiredMissing, setRequiredMissing] = useState<RequiredMissingAlertCopy | null>(null)
  const [showRequiredError, setShowRequiredError] = useState(false)

  useEffect(() => {
    if (open) return
    setReason('')
    setRequiredMissing(null)
    setShowRequiredError(false)
  }, [open])

  const handleCancel = () => {
    if (submitting) return
    onCancel()
  }

  const handleSubmit = () => {
    if (submitting) return
    const trimmed = reason.trim()
    if (trimmed.length < minLength) {
      setShowRequiredError(true)
      setRequiredMissing(buildRequiredMissingAlertCopy({ kind: 'field', labels: [REASON_LABEL] }))
      return
    }
    onSubmit(trimmed)
  }

  return (
    <>
      <PFModal
        open={open}
        title="강사비 정정 요청"
        className={styles.modal}
        ariaDescribedBy={descriptionId}
        onClose={handleCancel}
        mobilePlacement="center"
        closeOnEscape={!submitting}
      >
        <div className={styles.content}>
          <PFText
            id={descriptionId}
            as="p"
            typo="bd-md-rg"
            color="neutral-warm-600"
            className={styles.description}
          >
            정정 요청 사유를 작성해 주세요. 담당자 확인 후 정정이 완료되면 변경된 강사비로 지급조서를
            재신청해 주세요.
          </PFText>
          <PFTextInput
            size="xlarge"
            label={REASON_LABEL}
            placeholder="정정 요청 사유를 작성해 주세요"
            value={reason}
            maxLength={FEE_CORRECTION_REASON_MAX_LENGTH}
            onValueChange={setReason}
            disabled={submitting}
            error={showRequiredError && reason.trim().length < minLength}
          />
          <div className={styles.actions}>
            <PFButton
              type="button"
              variant="secondary"
              size="xlarge"
              disabled={submitting}
              onClick={handleCancel}
            >
              취소
            </PFButton>
            <PFButton
              type="button"
              variant="primary"
              size="xlarge"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? '요청 중' : '정정 요청하기'}
            </PFButton>
          </div>
        </div>
      </PFModal>
      <PFRequiredMissingAlert copy={requiredMissing} onConfirm={() => setRequiredMissing(null)} />
    </>
  )
}
