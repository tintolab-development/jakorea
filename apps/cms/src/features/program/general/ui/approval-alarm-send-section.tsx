/**
 * 승인 알람 발송 영역
 * 강사 배정 완료 안내 모달 내에서, 승인&배정이 함께 이뤄진 경우에만 노출.
 * 즉시 / 발표일에 맞춰서 / 직접 설정(날짜·시간) 라디오 선택.
 */

import { CmsRadio } from '@/shared/ui'
import { useState } from 'react'
import { DatePicker } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import './approval-alarm-send-section.css'

export type ApprovalAlarmSendValue = 'immediate' | 'on_announcement' | 'manual'

export interface ApprovalAlarmSendSectionProps {
  value?: ApprovalAlarmSendValue
  /** 직접 설정 시 선택된 날짜·시간 */
  manualDateTime?: Dayjs | null
  onChange?: (value: ApprovalAlarmSendValue, manualDateTime?: Dayjs | null) => void
  className?: string
}

const LABELS: Record<ApprovalAlarmSendValue, string> = {
  immediate: '즉시',
  on_announcement: '발표일에 맞춰서',
  manual: '직접 설정',
}

export function ApprovalAlarmSendSection({
  value = 'immediate',
  manualDateTime = null,
  onChange,
  className,
}: ApprovalAlarmSendSectionProps) {
  const [internalValue, setInternalValue] = useState<ApprovalAlarmSendValue>(value)
  const [internalManual, setInternalManual] = useState<Dayjs | null>(manualDateTime ?? dayjs().add(1, 'day').hour(9).minute(15).second(0).millisecond(0))
  const isControlled = onChange != null
  const currentValue = isControlled ? value : internalValue
  const currentManual = isControlled ? manualDateTime : internalManual

  const handleChange = (v: ApprovalAlarmSendValue) => {
    if (!isControlled) {
      setInternalValue(v)
    }
    onChange?.(v, v === 'manual' ? (currentManual ?? undefined) : null)
  }

  const handleManualDateChange = (date: Dayjs | null) => {
    if (!isControlled) setInternalManual(date)
    onChange?.('manual', date ?? undefined)
  }

  return (
    <div className={`approval-alarm-send-section ${className ?? ''}`}>
      <div className="approval-alarm-send-section__label">승인 알람 발송</div>
      <CmsRadio.Group
        value={currentValue}
        onChange={e => handleChange(e.target.value as ApprovalAlarmSendValue)}
        className="approval-alarm-send-section__radio-group"
      >
        <CmsRadio value="immediate">{LABELS.immediate}</CmsRadio>
        <CmsRadio value="on_announcement">{LABELS.on_announcement}</CmsRadio>
        <CmsRadio value="manual">
          {LABELS.manual}
          {currentValue === 'manual' && currentManual && (
            <span className="approval-alarm-send-section__manual-display">
              {' '}({currentManual.format('YYYY. MM. DD HH:mm')})
            </span>
          )}
        </CmsRadio>
      </CmsRadio.Group>
      {currentValue === 'manual' && (
        <DatePicker
          showTime
          value={currentManual}
          onChange={handleManualDateChange}
          format="YYYY. MM. DD HH:mm"
          allowClear={false}
          className="approval-alarm-send-section__date-picker"
        />
      )}
    </div>
  )
}
