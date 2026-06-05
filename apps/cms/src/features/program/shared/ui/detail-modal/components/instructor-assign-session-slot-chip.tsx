/**
 * 강사 배정 일정 선택 칩 — `ParagraphChip` + 일정 | 차시 + 인원 배지
 * 강의 배정 안내(개별) · 참여 기관 추가 배정 모달 공통
 */

import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'
import { DividerVertical } from '@/shared/components/divider-vertical'
import './instructor-assign-session-slot-chip.css'

export interface InstructorAssignSessionSlotChipProps {
  scheduleLabel: string
  sessionRoundLabel: string
  capacityLabel: string
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
}

export function InstructorAssignSessionSlotChip({
  scheduleLabel,
  sessionRoundLabel,
  capacityLabel,
  selected = false,
  disabled = false,
  onClick,
}: InstructorAssignSessionSlotChipProps) {
  return (
    <ParagraphChip
      aria-pressed={selected}
      disabled={disabled}
      selected={selected && !disabled}
      className={[
        'instructor-assign-session-slot-chip',
        disabled ? 'instructor-assign-session-slot-chip--disabled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
    >
      <span className="instructor-assign-session-slot-chip__main">
        <span className="instructor-assign-session-slot-chip__content">
          <span className="instructor-assign-session-slot-chip__schedule">{scheduleLabel}</span>
          <DividerVertical
            height={13}
            className="instructor-assign-session-slot-chip__divider"
          />
          <span className="instructor-assign-session-slot-chip__round">{sessionRoundLabel}</span>
        </span>
      </span>
      <span className="instructor-assign-session-slot-chip__count">{capacityLabel}</span>
    </ParagraphChip>
  )
}
