import type { CSSProperties, ReactNode } from 'react'
import type { Dayjs } from 'dayjs'
import { dateRangeUsesClockTime } from '@/features/template/lib/date-range-clock'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'

export { dateRangeUsesClockTime }

export const WRITING_FORM_PERIOD_PICKER_WIDTH = 240

type WritingFormPeriodDatePickerFieldProps = {
  label?: ReactNode
  className?: string
  style?: CSSProperties
  width?: number | string
  /** 모달·트리거 앵커(단일 캘린더 기준일) */
  anchorDate: Dayjs
  /** 트리거 표시값 — null이면 빈 칸(오늘 자동 반영 없음) */
  value?: Dayjs | null
  /** 확정된 기간이 있으면 트리거에 표시 */
  appliedSurfaceRange: [Dayjs, Dayjs] | null
  appliedSurfaceWithTime?: boolean
  onCommitRange: (range: [Dayjs, Dayjs]) => void
  onCommitSingleDay: (d: Dayjs) => void
  placeholder?: string
  /** 제목형 작성 기간 — 시작/종료 240×44 듀얼 트리거(스크린샷 시안) */
  dualPeriodTrigger?: boolean
  dualStartPlaceholder?: string
  dualEndPlaceholder?: string
  /** 선택 불가 날짜(시작·종료 공통) */
  disabledDate?: (date: Dayjs) => boolean
  /** 비선택 단락 표시용 — 열림 차단, 회색 비활성 스킨 없음 */
  readOnly?: boolean
  /** 회색 비활성 스킨 + 열림 차단 */
  disabled?: boolean
}

/**
 * 설문 제목형「작성 기간」ON·단일항목 날짜형(기간 ON) 등 — 동일 트리거 + 포털 모달 UX.
 */
export function WritingFormPeriodDatePickerField({
  label,
  className,
  style,
  width = WRITING_FORM_PERIOD_PICKER_WIDTH,
  anchorDate,
  value = null,
  appliedSurfaceRange,
  appliedSurfaceWithTime = false,
  onCommitRange,
  onCommitSingleDay: _onCommitSingleDay,
  placeholder,
  dualPeriodTrigger = false,
  dualStartPlaceholder = '바로 시작',
  dualEndPlaceholder = '마감 없음',
  disabledDate,
  readOnly,
  disabled,
}: WritingFormPeriodDatePickerFieldProps) {
  return (
    <ParagraphDatePicker
      mode="single"
      presetMode="period"
      className={className}
      style={style}
      label={label}
      width={width}
      value={dualPeriodTrigger && value == null ? null : (value ?? anchorDate)}
      placeholder={placeholder}
      preferPeriodModeInPopover
      appliedSurfaceRange={appliedSurfaceRange}
      appliedSurfaceWithTime={appliedSurfaceWithTime}
      suppressAutoTodayWhenEmpty={dualPeriodTrigger}
      dualPeriodTrigger={dualPeriodTrigger}
      dualStartPlaceholder={dualStartPlaceholder}
      dualEndPlaceholder={dualEndPlaceholder}
      disabledDate={disabledDate}
      readOnly={readOnly}
      disabled={disabled}
      onRangeChange={onCommitRange}
      onChange={() => {
        // presetMode period + [설정]은 onCommitRange만 사용 (onChange는 ParagraphDatePicker 내부 동기용).
      }}
    />
  )
}
