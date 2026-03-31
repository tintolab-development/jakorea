/**
 * 강사 참여 승인 확인 모달 (강사비 책정 방식 선택)
 * 레이아웃: shared ContentModal (시안과 동일한 흰 헤더 + 본문 + 푸터)
 */

import { useEffect, useState } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { AppButton } from '@/shared/ui/app-button'
import { AppRadio } from '@/shared/ui/app-radio'
import { AppSelect } from '@/shared/ui/app-select'
import './application-approval-modal.css'

export type InstructorFeePricingMode = 'program' | 'instructor'

export interface InstructorApprovalConfirmDetail {
  feePricingMode: InstructorFeePricingMode
  /** `instructor`일 때만 선택된 옵션 value */
  instructorFeeType: string | null
}

const INSTRUCTOR_FEE_OPTIONS = [{ value: 'special_lecture', label: '특강 강사비' }]

export interface ApplicationApprovalModalProps {
  open: boolean
  onCancel: () => void
  /** 승인 확정 시 (강사비 선택값 포함 — API 연동 시 사용) */
  onConfirm: (detail: InstructorApprovalConfirmDetail) => void
  instructorName: string
}

export function ApplicationApprovalModal({
  open,
  onCancel,
  onConfirm,
  instructorName,
}: ApplicationApprovalModalProps) {
  const [feeMode, setFeeMode] = useState<InstructorFeePricingMode>('instructor')
  const [feeType, setFeeType] = useState<string>(INSTRUCTOR_FEE_OPTIONS[0]!.value)

  useEffect(() => {
    if (open) {
      setFeeMode('instructor')
      setFeeType(INSTRUCTOR_FEE_OPTIONS[0]!.value)
    }
  }, [open])

  const handleConfirm = () => {
    onConfirm({
      feePricingMode: feeMode,
      instructorFeeType: feeMode === 'instructor' ? feeType : null,
    })
  }

  const footer = (
    <>
      <AppButton variant="cancel" size="large" onClick={onCancel}>
        취소
      </AppButton>
      <AppButton variant="primary" size="large" modalTeal onClick={handleConfirm}>
        참여 승인
      </AppButton>
    </>
  )

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="강사 승인 안내"
      width={560}
      footer={footer}
      className="application-approval-modal"
    >
      <div className="application-approval-modal__body">
        <p className="application-approval-modal__message">
          [<strong>{instructorName}</strong>] 강사님의 프로그램 참여를 승인하시겠습니까?
        </p>
        <div className="application-approval-modal__fee">
          <div className="application-approval-modal__fee-label">강사비 책정 방식</div>
          <div className="application-approval-modal__fee-row">
            <AppRadio.Group
              className="application-approval-modal__radio-group"
              value={feeMode}
              onChange={e => setFeeMode(e.target.value)}
            >
              <AppRadio value="program">프로그램 기준</AppRadio>
              <AppRadio value="instructor">강사 별도</AppRadio>
            </AppRadio.Group>
            {feeMode === 'instructor' ? (
              <AppSelect
                className="application-approval-modal__fee-select"
                size="large"
                value={feeType}
                onChange={v => setFeeType(v)}
                options={INSTRUCTOR_FEE_OPTIONS}
                getPopupContainer={() => document.body}
              />
            ) : null}
          </div>
        </div>
      </div>
    </ContentModal>
  )
}
