import './admin-segmented-tab.css'

export interface AdminSegmentedTabOption {
  label: string
  value: string
}

export interface AdminSegmentedTabProps {
  options: AdminSegmentedTabOption[]
  value: string
  onChange: (value: string) => void
  size?: 'small' | 'medium' | 'mediumCompact'
}

export function AdminSegmentedTab({
  options,
  value,
  onChange,
  size = 'small',
}: AdminSegmentedTabProps) {
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
