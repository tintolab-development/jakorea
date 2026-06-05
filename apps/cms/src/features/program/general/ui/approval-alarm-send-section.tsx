/**
 * 승인 알림 발송 영역
 * 강사 배정 완료 안내 모달 내에서, 승인&배정이 함께 이뤄진 경우에만 노출.
 * 즉시 / 발표일에 맞춰서 / 직접 설정(날짜·시간) 라디오 선택 — `PermissionModal` 알림 발송 UI와 동일 패턴.
 */

import { useEffect, useRef, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { CmsRadio } from '@/shared/ui'
import { DateTimePickerPopover } from '@/shared/components/date-time-picker-modal'
import '@/shared/components/permission-modal.css'
import './approval-alarm-send-section.css'

/** 직접 설정 최초값 — 호출 시점의 현재 날짜·시간(초 이하 절삭) */
function nowManualNotifyAt(): Dayjs {
  return dayjs().second(0).millisecond(0)
}

export type ApprovalAlarmSendValue = 'immediate' | 'on_announcement' | 'manual'

export interface ApprovalAlarmSendSectionProps {
  value?: ApprovalAlarmSendValue
  /** 직접 설정 시 선택된 날짜·시간 */
  manualDateTime?: Dayjs | null
  onChange?: (value: ApprovalAlarmSendValue, manualDateTime?: Dayjs | null) => void
  className?: string
  /** true 또는 모달 open 값 — 닫힐 때 내부 상태 초기화 */
  resetWhen?: boolean
  /** 직접 설정 DateTimePickerPopover z-index (부모 모달보다 위) */
  dateTimePickerZIndex?: number
}

export function ApprovalAlarmSendSection({
  value = 'immediate',
  manualDateTime = null,
  onChange,
  className,
  resetWhen = true,
  dateTimePickerZIndex = 2600,
}: ApprovalAlarmSendSectionProps) {
  const [internalValue, setInternalValue] = useState<ApprovalAlarmSendValue>(value)
  const [internalManual, setInternalManual] = useState<Dayjs | null>(manualDateTime)
  const [dateTimePickerOpen, setDateTimePickerOpen] = useState(false)
  const manualRadioAnchorRef = useRef<HTMLSpanElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  const isControlled = onChange != null
  const currentValue = isControlled ? value : internalValue
  const currentManual = isControlled ? manualDateTime : internalManual

  useEffect(() => {
    if (!resetWhen) return
    setInternalValue(value)
    setInternalManual(manualDateTime)
    setDateTimePickerOpen(false)
  }, [resetWhen, value, manualDateTime])

  const handleChange = (next: ApprovalAlarmSendValue) => {
    if (!isControlled) {
      setInternalValue(next)
    }
    if (next === 'manual') {
      const resolved = currentManual ?? nowManualNotifyAt()
      if (!isControlled) setInternalManual(resolved)
      setDateTimePickerOpen(true)
      onChange?.(next, resolved)
      return
    }
    setDateTimePickerOpen(false)
    onChange?.(next, null)
  }

  const handleManualDateChange = (date: Dayjs) => {
    if (!isControlled) setInternalManual(date)
    onChange?.('manual', date)
  }

  return (
    <>
      <div
        ref={sectionRef}
        className={['approval-alarm-send-section', 'permission-modal__field', className]
          .filter(Boolean)
          .join(' ')}
      >
        <span className="permission-modal__label">승인 알림 발송</span>
        <CmsRadio.Group
          style={{ marginTop: 12, paddingLeft: 8 }}
          size="large"
          value={currentValue}
          onChange={e => handleChange(e.target.value as ApprovalAlarmSendValue)}
          className="approval-alarm-send-section__radio-group"
        >
          <CmsRadio value="immediate">즉시</CmsRadio>
          <CmsRadio value="on_announcement">발표일에 맞춰서</CmsRadio>
          <span ref={manualRadioAnchorRef} className="permission-modal__manual-anchor">
            <CmsRadio
              value="manual"
              onClick={() => {
                if (currentValue === 'manual') {
                  const resolved = currentManual ?? nowManualNotifyAt()
                  if (!isControlled) setInternalManual(resolved)
                  setDateTimePickerOpen(true)
                }
              }}
            >
              직접 설정
              {currentValue === 'manual' && currentManual != null ? (
                <span className="permission-modal__manual-summary">
                  {' '}
                  ({currentManual.format('YYYY. MM. DD HH:mm')})
                </span>
              ) : null}
            </CmsRadio>
          </span>
        </CmsRadio.Group>
      </div>

      <DateTimePickerPopover
        open={resetWhen && currentValue === 'manual' && dateTimePickerOpen}
        onClose={() => setDateTimePickerOpen(false)}
        anchorRef={manualRadioAnchorRef}
        dismissExcludeRef={sectionRef}
        value={currentManual ?? nowManualNotifyAt()}
        onChange={handleManualDateChange}
        onApply={date => {
          handleManualDateChange(date)
          setDateTimePickerOpen(false)
        }}
        zIndex={dateTimePickerZIndex}
      />
    </>
  )
}
