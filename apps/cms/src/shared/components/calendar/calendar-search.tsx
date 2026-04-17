import { Checkbox } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { CmsInput } from '@/shared/ui/cms-input'
import { CALENDAR_FILTER_COLOR_CLASSES } from './calendar-color-set'

interface CalendarSearchOption {
  id: string
  title: string
}

interface CalendarSearchProps {
  keyword: string
  options: CalendarSearchOption[]
  selectedIds: string[]
  onKeywordChange: (value: string) => void
  onOptionToggle: (id: string, checked: boolean) => void
}

export function CalendarSearch({
  keyword,
  options,
  selectedIds,
  onKeywordChange,
  onOptionToggle,
}: CalendarSearchProps) {
  return (
    <div className="calendar-search">
      <div className="calendar-search__input">
        <CmsInput
          placeholder="프로그램명을 입력하세요"
          icon={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
          value={keyword}
          onChange={e => onKeywordChange(e.target.value)}
          allowClear
        />
      </div>
      <div className="calendar-search__filters">
        {options.map((opt, index) => (
          <div key={opt.id} className="calendar-search__filters-wrapper">
            <Checkbox
              className={`calendar-search__filter-item ${
                CALENDAR_FILTER_COLOR_CLASSES[index % CALENDAR_FILTER_COLOR_CLASSES.length]
              }`}
              checked={selectedIds.includes(opt.id)}
              onChange={e => onOptionToggle(opt.id, e.target.checked)}
            >
              {opt.title}
            </Checkbox>
          </div>
        ))}
      </div>
    </div>
  )
}

export type { CalendarSearchProps, CalendarSearchOption }

