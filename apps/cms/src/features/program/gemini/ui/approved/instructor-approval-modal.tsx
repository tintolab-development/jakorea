import { PermissionModal, type PermissionModalPayload } from '@/shared/components/permission-modal'
import { NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'
import type { GeminiApprovedTrainingDetail } from '../../model/approved/detail-types'
import {
  buildGeminiInstructorApproveMessageLines,
  buildGeminiInstructorChangeMessageLines,
} from '../../lib/approved/instructor-approve-messages'
import { resolveGeminiInstructorApprovalTrainingSummary } from '../../lib/approved/format-display'
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

/** 승인 연수 상세 GET만 SSOT. trainingDateCandidates·lastPreferredDate·목록 API 미사용. */
function TrainingSummary({ detail }: { detail: GeminiApprovedTrainingDetail }) {
  const summary = resolveGeminiInstructorApprovalTrainingSummary(detail)
  return (
    <div className="gemini-instructor-approval-modal__training-summary" aria-label="연수 정보">
      <span>{summary.institutionName}</span>
      <span>{summary.trainingDateLabel}</span>
      <span>{summary.trainingTimeLabel}</span>
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
      notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.scheduledOnly}
      zIndex={zIndex}
    />
  )
}
