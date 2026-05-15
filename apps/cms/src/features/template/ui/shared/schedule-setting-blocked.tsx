import type { CSSProperties } from 'react'
import './schedule-setting-blocked.css'

export interface ScheduleSettingBlockedProps {
  /** 노출할 안내 문구 */
  text: string
  className?: string
  style?: CSSProperties
}

/**
 * 일정·시간대 영역이 관리자 설정 전이라 표시할 수 없을 때 노출하는 공통 박스.
 * - 부모 폭/높이를 채우는 회색 surface + 가운데 정렬 안내 문구.
 * - 텍스트만 prop으로 받음. (스타일 커스터마이즈는 className/style로)
 */
export function ScheduleSettingBlocked({
  text,
  className,
  style,
}: ScheduleSettingBlockedProps) {
  return (
    <div
      role="status"
      className={['schedule-setting-blocked', className].filter(Boolean).join(' ')}
      style={style}
    >
      <span>{text}</span>
    </div>
  )
}
