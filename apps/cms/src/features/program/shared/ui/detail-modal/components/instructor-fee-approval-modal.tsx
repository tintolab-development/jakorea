/**
 * 일반 프로그램(기관·개인) — 강사 승인 2단계: 강사비 책정 및 승인 안내 (600×474)
 */

import dayjs from 'dayjs'
import { INSTRUCTOR_FEE_GRADE_OPTIONS } from '@/data/mock/program-wage-info'
import {
  INSTRUCTOR_FEE_APPROVAL_BASIS_OPTIONS,
  LECTURE_FEE_PAYMENT_CRITERIA_OPTIONS,
} from '@/features/program/general/lib/applicant-instructor-lecture-fee-basis'
import {
  useInstructorFeeApprovalModal,
  type InstructorFeeApprovalConfirmDetail,
} from '@/features/program/general/lib/use-instructor-fee-approval-modal'
import type { ApplicantInstructorLectureFeeBasisType } from '@/data/mock/applicant-instructors'
import { DateTimePickerPopover } from '@/shared/components/date-time-picker-modal'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import './instructor-fee-approval-modal.css'

const MODAL_WIDTH = 600
const MODAL_Z_INDEX = 2500
const DATE_TIME_PICKER_Z_OFFSET = 100

function nowManualNotifyAt() {
  return dayjs().second(0).millisecond(0)
}

export type { InstructorFeeApprovalConfirmDetail }

export type InstructorFeeApprovalModalProps = {
  open: boolean
  onCancel: () => void
  instructorName: string
  /** 프로그램 기준 적용 시 자동 선택 */
  instructorFeeGradeLabel?: string
  onConfirm: (detail: InstructorFeeApprovalConfirmDetail) => void
}

function buildDescription(instructorName: string): string {
  return `[${instructorName}] 강사님의 강사비 책정 방식을 선택해 주세요.\n선택한 방식으로 강사비가 책정되며, 강사님에게 승인 알림이 발송됩니다.`
}

export function InstructorFeeApprovalModal({
  open,
  onCancel,
  instructorName,
  instructorFeeGradeLabel,
  onConfirm,
}: InstructorFeeApprovalModalProps) {
  const {
    lectureFeeBasisType,
    instructorFeeGrade,
    lectureFeeMeasure,
    lectureFeeAmount,
    notifyTiming,
    manualNotifyAt,
    dateTimePickerOpen,
    notifyError,
    manualRadioAnchorRef,
    modalContentRef,
    showAmountFields,
    canConfirm,
    setLectureFeeMeasure,
    setLectureFeeAmount,
    setManualNotifyAt,
    setDateTimePickerOpen,
    setNotifyError,
    handleLectureFeeBasisTypeChange,
    handleNotifyTimingChange,
    buildConfirmDetail,
  } = useInstructorFeeApprovalModal({ open, instructorFeeGradeLabel })

  const handleConfirm = () => {
    const detail = buildConfirmDetail()
    if (!detail) return
    onConfirm(detail)
  }

  const dateTimePickerZ = MODAL_Z_INDEX + DATE_TIME_PICKER_Z_OFFSET

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title="강사비 책정 및 승인 안내"
        width={MODAL_WIDTH}
        zIndex={MODAL_Z_INDEX}
        className="instructor-fee-approval-modal"
        description={buildDescription(instructorName)}
        footer={
          <div className="content-modal__footer-actions">
            <CmsButton variant="secondary" size="large" type="button" onClick={onCancel}>
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              size="large"
              type="button"
              disabled={!canConfirm}
              onClick={handleConfirm}
            >
              승인
            </CmsButton>
          </div>
        }
      >
        <div ref={modalContentRef} className="instructor-fee-approval-modal__content">
          <div className="instructor-fee-approval-modal__field">
            <span className="instructor-fee-approval-modal__label">강사비 책정 방식</span>
            <CmsRadio.Group
              className="instructor-fee-approval-modal__radio-group"
              size="large"
              value={lectureFeeBasisType}
              onChange={e =>
                handleLectureFeeBasisTypeChange(
                  e.target.value as ApplicantInstructorLectureFeeBasisType
                )
              }
            >
              {INSTRUCTOR_FEE_APPROVAL_BASIS_OPTIONS.map(option => (
                <CmsRadio key={option.value} value={option.value}>
                  {option.label}
                </CmsRadio>
              ))}
            </CmsRadio.Group>

            {lectureFeeBasisType === 'program' ? (
              <CmsSelect
                className="instructor-fee-approval-modal__program-select"
                inputSize="large"
                width="100%"
                withAllOption={false}
                disabled
                value={instructorFeeGrade}
                options={INSTRUCTOR_FEE_GRADE_OPTIONS}
                getPopupContainer={() => document.body}
              />
            ) : null}

            {showAmountFields ? (
              <div className="instructor-fee-approval-modal__amount-row">
                <CmsSelect
                  className="instructor-fee-approval-modal__measure-select"
                  inputSize="large"
                  withAllOption={false}
                  placeholder="지급 기준"
                  value={lectureFeeMeasure || undefined}
                  options={LECTURE_FEE_PAYMENT_CRITERIA_OPTIONS}
                  onChange={v => setLectureFeeMeasure(v != null ? String(v) : '')}
                  getPopupContainer={() => document.body}
                />
                <div className="instructor-fee-approval-modal__amount-field">
                  <CmsNumericInput
                    mode="currency"
                    className="instructor-fee-approval-modal__amount-input"
                    inputSize="large"
                    width="100%"
                    placeholder="강사비를 입력해 주세요"
                    value={lectureFeeAmount}
                    onValueChange={setLectureFeeAmount}
                  />
                  <span className="instructor-fee-approval-modal__amount-unit">원</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="instructor-fee-approval-modal__field">
            <span className="instructor-fee-approval-modal__label">알림 발송</span>
            <CmsRadio.Group
              className="instructor-fee-approval-modal__radio-group"
              size="large"
              value={notifyTiming}
              onChange={e => handleNotifyTimingChange(e.target.value)}
            >
              <CmsRadio value="immediate">즉시</CmsRadio>
              <CmsRadio value="on_announcement">발표일에 맞춰서</CmsRadio>
              <span ref={manualRadioAnchorRef} className="instructor-fee-approval-modal__manual-anchor">
                <CmsRadio
                  value="manual"
                  onClick={() => {
                    if (notifyTiming === 'manual') {
                      setManualNotifyAt(prev => prev ?? nowManualNotifyAt())
                      setDateTimePickerOpen(true)
                    }
                  }}
                >
                  직접 설정
                  {notifyTiming === 'manual' && manualNotifyAt != null ? (
                    <span className="instructor-fee-approval-modal__manual-summary">
                      {' '}
                      ({manualNotifyAt.format('YYYY. MM. DD HH:mm')})
                    </span>
                  ) : null}
                </CmsRadio>
              </span>
            </CmsRadio.Group>
            {notifyError ? (
              <span className="instructor-fee-approval-modal__field-error" role="alert">
                {notifyError}
              </span>
            ) : null}
          </div>
        </div>
      </ContentModal>

      <DateTimePickerPopover
        open={open && notifyTiming === 'manual' && dateTimePickerOpen}
        onClose={() => setDateTimePickerOpen(false)}
        anchorRef={manualRadioAnchorRef}
        dismissExcludeRef={modalContentRef}
        value={manualNotifyAt ?? nowManualNotifyAt()}
        onChange={setManualNotifyAt}
        onApply={value => {
          setManualNotifyAt(value)
          setDateTimePickerOpen(false)
          setNotifyError('')
        }}
        zIndex={dateTimePickerZ}
      />
    </>
  )
}
