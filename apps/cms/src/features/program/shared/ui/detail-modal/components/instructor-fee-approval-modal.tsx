/**
 * 일반 프로그램(기관·개인) — 강사 승인 2단계: 강사비 책정 및 승인 안내 (600×474)
 */

import { useEffect } from 'react'
import { INSTRUCTOR_FEE_GRADE_OPTIONS } from '@/features/program/shared/model/program-wage-info'
import {
  INSTRUCTOR_FEE_APPROVAL_BASIS_OPTIONS,
  LECTURE_FEE_PAYMENT_CRITERIA_OPTIONS,
} from '@/features/program/general/lib/applicant-instructor-lecture-fee-basis'
import {
  useInstructorFeeApprovalModal,
  type InstructorFeeApprovalConfirmDetail,
} from '@/features/program/general/lib/use-instructor-fee-approval-modal'
import type { ApplicantInstructorLectureFeeBasisType } from '@/features/program/shared/model/applicant-instructor'
import type { InstructorApplicationFeePolicyContext } from '@/features/program/general/lib/applicant-instructor-lecture-fee-basis'
import { DateTimePickerPopover } from '@/shared/components/date-time-picker-modal'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  getDefaultManualNotifyAt,
  getMinimumManualNotifyAt,
} from '@/shared/lib/notification-schedule'
import { formatYmdHmWithKoreanWeekday } from '@/shared/lib/format-date-korean-weekday'
import { useCmsAlert } from '@/shared/ui'
import {
  NOTIFY_TIMING_CAPABILITY,
  UNSUPPORTED_NOTIFY_TIMING_ALERT_TITLE,
  getUnsupportedNotifyTimingMessage,
} from '@/shared/lib/notify-timing-capability'
import './instructor-fee-approval-modal.css'

const MODAL_WIDTH = 600
const MODAL_Z_INDEX = 2500
const DATE_TIME_PICKER_Z_OFFSET = 100

export type { InstructorFeeApprovalConfirmDetail }

export const NO_ASSIGNABLE_INSTITUTION_SCHEDULE_NOTICE_LINES = [
  '현재 배정 가능한 기관 일정이 없습니다.',
  '기관의 프로그램 신청을 승인한 후,',
  '기관 또는 강사의 배정 현황에서 교육 일정에 강사를 배정해 주세요.',
] as const

export function InstructorFeeNoAssignableScheduleNotice() {
  return (
    <p className="instructor-fee-approval-modal__no-schedule-notice" role="status">
      {NO_ASSIGNABLE_INSTITUTION_SCHEDULE_NOTICE_LINES.map((line, index) => (
        <span key={line}>
          {index > 0 ? <br /> : null}
          {line}
        </span>
      ))}
    </p>
  )
}

export type InstructorFeeApprovalModalProps = {
  open: boolean
  onCancel: () => void
  instructorName: string
  /** 프로그램 기준 적용 시 자동 선택 */
  instructorFeeGradeLabel?: string
  feePolicyContext?: InstructorApplicationFeePolicyContext
  feePolicyError?: string | null
  onConfirm: (detail: InstructorFeeApprovalConfirmDetail) => void
  submitting?: boolean
  /** 기관형에서 배정 가능한 기관 일정이 없어 배정 모달을 건너뛴 경우 */
  showNoAssignableInstitutionScheduleNotice?: boolean
}

function buildDescription(instructorName: string): string {
  return `**[${instructorName}]**님의 강사비 책정 방식을 선택해 주세요.\n선택한 방식으로 강사비가 책정되며, 회원에게 승인 알림이 발송됩니다.`
}

export function InstructorFeeApprovalModal({
  open,
  onCancel,
  instructorName,
  instructorFeeGradeLabel,
  feePolicyContext,
  feePolicyError,
  onConfirm,
  submitting = false,
  showNoAssignableInstitutionScheduleNotice = false,
}: InstructorFeeApprovalModalProps) {
  const { showAlert } = useCmsAlert()
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
  } = useInstructorFeeApprovalModal({ open, instructorFeeGradeLabel, feePolicyContext })

  useEffect(() => {
    if (!open || !feePolicyError) return
    document
      .querySelector('.instructor-fee-approval-modal__field')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [open, feePolicyError])

  const handleConfirm = () => {
    const unsupportedNotify = getUnsupportedNotifyTimingMessage(
      notifyTiming,
      NOTIFY_TIMING_CAPABILITY.scheduledOnly
    )
    if (unsupportedNotify) {
      showAlert({
        title: UNSUPPORTED_NOTIFY_TIMING_ALERT_TITLE,
        content: unsupportedNotify,
      })
      return
    }
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
        className={
          showNoAssignableInstitutionScheduleNotice
            ? 'instructor-fee-approval-modal instructor-fee-approval-modal--with-schedule-notice'
            : 'instructor-fee-approval-modal'
        }
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
              disabled={!canConfirm || submitting}
              onClick={handleConfirm} >
              {submitting ? '승인 중...' : '승인'}
            </CmsButton>
          </div>
        }
      >
        <div ref={modalContentRef} className="instructor-fee-approval-modal__content">
          {showNoAssignableInstitutionScheduleNotice ? (
            <InstructorFeeNoAssignableScheduleNotice />
          ) : null}

          <div className="instructor-fee-approval-modal__field-group">
            <div>
              <CmsRadio.Group
                label="강사비 책정 방식"
                required
                size="medium"
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
                <div className="instructor-fee-approval-modal__amount-row">
                  <CmsSelect
                    inputSize="medium"
                    width="100%"
                    withAllOption={false}
                    disabled
                    value={instructorFeeGrade}
                    options={INSTRUCTOR_FEE_GRADE_OPTIONS}
                    getPopupContainer={() => document.body}
                  />
                </div>
              ) : null}
              {showAmountFields ? (
                <div className="instructor-fee-approval-modal__amount-row">
                  <CmsSelect
                    inputSize="medium"
                    width={150}
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
                      inputSize="medium"
                      width="100%"
                      placeholder="강사비를 입력해 주세요"
                      value={lectureFeeAmount}
                      onValueChange={setLectureFeeAmount}
                    />
                    <span className="instructor-fee-approval-modal__amount-unit">원</span>
                  </div>
                </div>
              ) : null}
              {feePolicyError ? (
                <span className="instructor-fee-approval-modal__field-error" role="alert">
                  {feePolicyError}
                </span>
              ) : null}
            </div>

            <CmsRadio.Group
              label="알림 발송"
              required
              size="medium"
              value={notifyTiming}
              onChange={e => handleNotifyTimingChange(e.target.value)}
            >
              <CmsRadio value="immediate">즉시</CmsRadio>
              <span
                ref={manualRadioAnchorRef}
                className="instructor-fee-approval-modal__manual-anchor"
              >
                <CmsRadio
                  value="manual"
                  onClick={() => {
                    if (notifyTiming === 'manual') {
                      setManualNotifyAt(prev => prev ?? getDefaultManualNotifyAt())
                      setDateTimePickerOpen(true)
                    }
                  }}
                >
                  직접 설정
                  {notifyTiming === 'manual' && manualNotifyAt != null ? (
                    <span className="instructor-fee-approval-modal__manual-summary">
                      {' '}
                      ({formatYmdHmWithKoreanWeekday(manualNotifyAt)})
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
        value={manualNotifyAt ?? getDefaultManualNotifyAt()}
        onChange={setManualNotifyAt}
        onApply={value => {
          setManualNotifyAt(value)
          setDateTimePickerOpen(false)
          setNotifyError('')
        }}
        minDateTime={getMinimumManualNotifyAt()}
        zIndex={dateTimePickerZ}
      />
    </>
  )
}
