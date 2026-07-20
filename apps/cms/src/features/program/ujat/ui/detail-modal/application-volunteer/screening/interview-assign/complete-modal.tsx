import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import type { UjatInterviewAssignConfirmPayload } from './modal'
import { formatInterviewSummaryDate } from './schedule-utils'
import { parseUjatInterviewDateLabel } from '../shared/interview-calendar-events'
import './complete-modal.css'

const MODAL_WIDTH = 600
/** 풀페이지 상세(기본 z-index) 위에 완료 모달이 항상 보이도록 */
const MODAL_Z_INDEX = 10000

export type UjatVolunteerInterviewAssignCompleteModalProps = {
  open: boolean
  applicantName: string
  mode: 'assign' | 'reassign'
  payload: UjatInterviewAssignConfirmPayload
  onClose: () => void
}

export function buildInterviewAssignCompleteScheduleSummary(
  payload: UjatInterviewAssignConfirmPayload
): string {
  const parsed = parseUjatInterviewDateLabel(payload.dateLabel)
  const datePart = parsed ? formatInterviewSummaryDate(parsed) : payload.dateLabel
  return `${datePart} ${payload.timeRange}`
}

export function UjatVolunteerInterviewAssignCompleteModal({
  open,
  applicantName,
  mode,
  payload,
  onClose,
}: UjatVolunteerInterviewAssignCompleteModalProps) {
  const title = mode === 'reassign' ? '면접일 재배정 완료' : '면접일 배정 완료'
  const descriptionAction =
    mode === 'reassign' ? '면접일 재배정이 완료 되었습니다.' : '면접일 배정이 완료 되었습니다.'
  const scheduleSummary = buildInterviewAssignCompleteScheduleSummary(payload)

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title={title}
      width={MODAL_WIDTH}
      zIndex={MODAL_Z_INDEX}
      className="ujat-volunteer-interview-assign-complete-modal"
      description={`**[${applicantName}]** 봉사자의 ${descriptionAction}`}
      footer={
        <CmsButton variant="secondary" size="medium" type="button" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      <div className="ujat-volunteer-interview-assign-complete-modal__summary" role="status">
        {scheduleSummary}
      </div>
    </ContentModal>
  )
}
