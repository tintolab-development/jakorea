/**
 * 2옵션 세그먼트 탭 (프로그램 진행현황 하위 탭 UI 동일)
 * - small: 래퍼 116×34 (위젯 헤더용)
 * - medium: 래퍼 217×50 (프로그램 진행현황 참여학교/강사 정보용)
 */

import './segmented-tab.css'

export interface SegmentedTabOption {
  label: string
  value: string
}

interface SegmentedTabProps {
  options: SegmentedTabOption[]
  value: string
  onChange: (value: string) => void
  /** small: 116×34 / medium: 217×50 / mediumCompact: 214×50 (진행현황 탭용) */
  size?: 'small' | 'medium' | 'mediumCompact'
}

export function SegmentedTab({
  options,
  value,
  onChange,
  size = 'small',
}: SegmentedTabProps) {
  return (
    <div
      className={`segmented-tab segmented-tab--${size}`}
      role="tablist"
      aria-label="보기 전환"
    >
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value ? 'true' : 'false'}
          className={`segmented-tab__btn ${value === opt.value ? 'segmented-tab__btn--active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
