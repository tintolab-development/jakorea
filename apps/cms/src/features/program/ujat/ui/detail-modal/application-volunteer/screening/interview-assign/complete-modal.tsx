import type { Dayjs } from 'dayjs'
import { formatKoreanYearMonthDayWithWeekday } from '@/shared/lib/format-date-korean-weekday'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import type { UjatInterviewAssignConfirmPayload } from './modal'
import { normalizeTimeRangeKey } from './schedule-utils'
import { parseUjatInterviewDateLabel } from '../shared/interview-calendar-events'
import './complete-modal.css'

const MODAL_WIDTH = 600
/** 풀페이지 상세(기본 z-index) 위에 완료 모달이 항상 보이도록 */
const MODAL_Z_INDEX = 10000

/** 완료 모달 시안 — `2026년 9월 15일(화) 09:00 ~ 09:30` */
export function formatInterviewAssignCompleteScheduleDisplay(
  date: Dayjs,
  timeRange: string
): string {
  const time = normalizeTimeRangeKey(timeRange)
  const datePart = formatKoreanYearMonthDayWithWeekday(date)
  return datePart ? `${datePart} ${time}` : time
}

export type UjatVolunteerInterviewAssignCompleteModalProps = {
  open: boolean
  applicantName: string
  mode: 'assign' | 'reassign'
  payload: UjatInterviewAssignConfirmPayload
  /** @deprecated 시안은 `님의` 고정. 하위 호환용으로만 유지 */
  subjectNoun?: string
  onClose: () => void
}

export function buildInterviewAssignCompleteScheduleSummary(
  payload: UjatInterviewAssignConfirmPayload
): string {
  const parsed = parseUjatInterviewDateLabel(payload.dateLabel)
  if (!parsed) return `${payload.dateLabel} ${normalizeTimeRangeKey(payload.timeRange)}`
  return formatInterviewAssignCompleteScheduleDisplay(parsed, payload.timeRange)
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
    mode === 'reassign' ? '면접일 재배정이 완료되었습니다.' : '면접일 배정이 완료되었습니다.'
  const scheduleSummary = buildInterviewAssignCompleteScheduleSummary(payload)

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title={title}
      width={MODAL_WIDTH}
      zIndex={MODAL_Z_INDEX}
      className="ujat-volunteer-interview-assign-complete-modal"
      description={`**[${applicantName}]** 님의 ${descriptionAction}`}
      footer={
        <CmsButton variant="secondary" size="h40" type="button" onClick={onClose}>
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
