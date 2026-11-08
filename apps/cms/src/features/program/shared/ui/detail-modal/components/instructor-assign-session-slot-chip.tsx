/**
 * 강사 배정 일정 선택 칩 — `ParagraphChip` + 일정 | 회차(+차시) + 인원 배지
 * 강의 배정 안내(개별) · 참여 기관 추가 배정 모달 공통
 */

import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'
import { DividerVertical } from '@/shared/components/divider-vertical'
import './instructor-assign-session-slot-chip.css'

export interface InstructorAssignSessionSlotChipProps {
  scheduleLabel: string
  /** 지정 시 scheduleLabel은 날짜만, timeLabel은 진행 시간으로 분리 표시 */
  timeLabel?: string
  /** 빈 값이면 회차 구분선·라벨을 생략 */
  sessionRoundLabel: string
  capacityLabel: string
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
}

/** 인원 미표기(`-`·빈 값)는 UI에서 `0명`으로 표시 */
function resolveCapacityLabel(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '-') return '0명'
  return trimmed
}

export function InstructorAssignSessionSlotChip({
  scheduleLabel,
  timeLabel,
  sessionRoundLabel,
  capacityLabel,
  selected = false,
  disabled = false,
  onClick,
}: InstructorAssignSessionSlotChipProps) {
  const roundLabel = sessionRoundLabel.trim()
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
          {timeLabel ? (
            <>
              <DividerVertical
                height={13}
                className="instructor-assign-session-slot-chip__divider"
              />
              <span className="instructor-assign-session-slot-chip__time">{timeLabel}</span>
            </>
          ) : null}
          {roundLabel ? (
            <>
              <DividerVertical
                height={13}
                className="instructor-assign-session-slot-chip__divider"
              />
              <span className="instructor-assign-session-slot-chip__round">{roundLabel}</span>
            </>
          ) : null}
        </span>
      </span>
      <span className="instructor-assign-session-slot-chip__count">
        {resolveCapacityLabel(capacityLabel)}
      </span>
    </ParagraphChip>
  )
}
