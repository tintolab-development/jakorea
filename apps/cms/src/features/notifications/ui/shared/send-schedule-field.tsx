import { useEffect, useRef, useState } from 'react'
import { CalendarOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { DateTimePickerPopover } from '@/shared/components/date-time-picker-modal'
import { CMS_DATE_TIME_PICKER_DEFAULT_Z_INDEX } from '@/shared/constants/modal-z-index'
import { CmsInput, CmsRadio } from '@/shared/ui'
import {
  disablePastScheduleDates,
  formatNotificationSendScheduleDisplay,
  nextNotificationSendSchedule,
  NOTIFICATION_SEND_SCHEDULE_MINUTE_STEP,
  snapNotificationSendSchedule,
  type NotificationSendTiming,
} from '@/features/notifications/model/send-scheduled-at'
import './send-schedule-field.css'

type SendScheduleFieldProps = {
  sendTiming: NotificationSendTiming
  scheduledAt: Dayjs | null
  onSendTimingChange: (value: NotificationSendTiming) => void
  onScheduledAtChange: (value: Dayjs | null) => void
  /** 부모 풀페이지 모달보다 위 (기본 1200) */
  zIndex?: number
  className?: string
}

export function SendScheduleField({
  sendTiming,
  scheduledAt,
  onSendTimingChange,
  onScheduledAtChange,
  zIndex = CMS_DATE_TIME_PICKER_DEFAULT_Z_INDEX,
  className,
}: SendScheduleFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const fieldRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const scheduled = sendTiming === 'scheduled'
  const displayValue = formatNotificationSendScheduleDisplay(scheduledAt)

  useEffect(() => {
    if (!scheduled) setPickerOpen(false)
  }, [scheduled])

  const resolveScheduledValue = (current: Dayjs | null) =>
    snapNotificationSendSchedule(current) ?? nextNotificationSendSchedule()

  const handleTimingChange = (next: NotificationSendTiming) => {
    onSendTimingChange(next)
    if (next === 'immediate') {
      onScheduledAtChange(null)
      setPickerOpen(false)
      return
    }
    const resolved = resolveScheduledValue(scheduledAt)
    onScheduledAtChange(resolved)
    setPickerOpen(true)
  }

  const openPicker = () => {
    if (!scheduled) return
    const resolved = resolveScheduledValue(scheduledAt)
    if (scheduledAt == null || !scheduledAt.isSame(resolved)) {
      onScheduledAtChange(resolved)
    }
    setPickerOpen(true)
  }

  return (
    <>
      <div
        ref={fieldRef}
        className={['notification-send-schedule-field', className].filter(Boolean).join(' ')}
      >
        <CmsRadio.Group
          value={sendTiming}
          onChange={event => {
            const next = event.target.value
            if (next === 'immediate' || next === 'scheduled') handleTimingChange(next)
          }}
        >
          <CmsRadio value="immediate">즉시 발송</CmsRadio>
          <CmsRadio value="scheduled">예약 발송</CmsRadio>
        </CmsRadio.Group>
        <span className="notification-send-schedule-field__divider" aria-hidden />
        <span
          ref={triggerRef}
          className="notification-send-schedule-field__trigger"
          role="button"
          tabIndex={scheduled ? 0 : -1}
          aria-disabled={!scheduled}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          onClick={openPicker}
          onKeyDown={event => {
            if (!scheduled) return
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openPicker()
            }
          }}
        >
          <CmsInput
            inputSize="large"
            width="100%"
            allowClear={false}
            readOnly
            tabIndex={-1}
            disabled={!scheduled}
            placeholder="날짜를 선택하세요"
            value={scheduled ? displayValue : ''}
            icon={<CalendarOutlined />}
          />
        </span>
      </div>

      <DateTimePickerPopover
        open={scheduled && pickerOpen}
        onClose={() => setPickerOpen(false)}
        anchorRef={triggerRef}
        dismissExcludeRef={fieldRef}
        value={resolveScheduledValue(scheduledAt)}
        minuteStep={NOTIFICATION_SEND_SCHEDULE_MINUTE_STEP}
        disabledDate={disablePastScheduleDates}
        onChange={value => onScheduledAtChange(snapNotificationSendSchedule(value))}
        onApply={value => {
          onScheduledAtChange(snapNotificationSendSchedule(value))
          setPickerOpen(false)
        }}
        zIndex={zIndex}
      />
    </>
  )
}
