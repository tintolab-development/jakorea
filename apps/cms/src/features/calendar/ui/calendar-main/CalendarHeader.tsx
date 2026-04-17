import { Button } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { SegmentedTab } from '@/shared/ui/segmented-tab'

interface CalendarHeaderProps {
  headerTitle: string
  mode: 'month' | 'week'
  onModeChange: (mode: 'month' | 'week') => void
  onToday: () => void
  onPrev: () => void
  onNext: () => void
}

export function CalendarHeader({
  headerTitle,
  mode,
  onModeChange,
  onToday,
  onPrev,
  onNext,
}: CalendarHeaderProps) {
  return (
    <div className="program-calendar-header">
      <div className="program-calendar-header-left">
        <span className="program-calendar-header-title">{headerTitle}</span>
        <Button size="small" className="program-calendar-today-btn" onClick={onToday}>
          오늘
        </Button>
        <div className="program-calendar-nav">
          <Button
            type="text"
            size="small"
            icon={<LeftOutlined />}
            className="program-calendar-nav-btn"
            onClick={onPrev}
          />
          <Button
            type="text"
            size="small"
            icon={<RightOutlined />}
            className="program-calendar-nav-btn"
            onClick={onNext}
          />
        </div>
      </div>
      <div className="program-calendar-header-right">
        <SegmentedTab
          size="medium"
          value={mode}
          onChange={value => onModeChange(value as 'month' | 'week')}
          options={[
            { label: '월간', value: 'month' },
            { label: '주간', value: 'week' },
          ]}
        />
      </div>
    </div>
  )
}

