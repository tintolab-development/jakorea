import dayjs from 'dayjs'
import { PermissionModal, type PermissionModalPayload } from '@/shared/components/permission-modal'
import { NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'
import { formatDateDotWithWeekday } from '@/shared/utils/date'
import type { GeminiApprovedTrainingDetail } from '../../model/approved/detail-types'
import {
  buildGeminiInstructorApproveMessageLines,
  buildGeminiInstructorChangeMessageLines,
} from '../../lib/approved/instructor-approve-messages'
import './instructor-approval-modal.css'

type GeminiInstructorApprovalModalMode = 'approve' | 'change'

export type GeminiInstructorApprovalModalProps = {
  open: boolean
  mode: GeminiInstructorApprovalModalMode
  instructorName: string
  trainingDetail: GeminiApprovedTrainingDetail
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  confirmLoading?: boolean
  zIndex?: number
}

function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ''
  return trimmed || '-'
}

function formatTrainingDate(value: string): string {
  const parsed = dayjs(value.trim())
  return parsed.isValid() ? formatDateDotWithWeekday(parsed) : '-'
}

function formatTrainingTime(value: string): string {
  const text = displayValue(value)
  if (text === '-') return text
  return text.replace(/\s*[~〜]\s*/gu, ' ~ ').replace(/\s*\((\d+차시)\)\s*$/u, ' ($1)')
}

function TrainingSummary({ detail }: { detail: GeminiApprovedTrainingDetail }) {
  return (
    <div className="gemini-instructor-approval-modal__training-summary" aria-label="연수 정보">
      <span>{displayValue(detail.institutionName)}</span>
      <span>{formatTrainingDate(detail.trainingDate)}</span>
      <span>{formatTrainingTime(detail.trainingTimeText)}</span>
    </div>
  )
}

export function GeminiInstructorApprovalModal({
  open,
  mode,
  instructorName,
  trainingDetail,
  onCancel,
  onConfirm,
  confirmLoading = false,
  zIndex,
}: GeminiInstructorApprovalModalProps) {
  const messageLines =
    mode === 'change'
      ? buildGeminiInstructorChangeMessageLines(instructorName)
      : buildGeminiInstructorApproveMessageLines(instructorName)

  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="gemini-instructor-approval-modal"
      title={mode === 'change' ? '강사 변경 안내' : '프로그램 신청 승인 안내'}
      message={messageLines.join('\n')}
      infoCallout={<TrainingSummary detail={trainingDetail} />}
      confirmLabel={mode === 'change' ? '강사 변경' : '승인'}
      confirmVariant="primary"
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      onConfirm={onConfirm}
      notifyTimingOptions="two"
      notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.immediateOnly}
      zIndex={zIndex}
    />
  )
}
