import type { CSSProperties } from 'react'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import { getScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import { CmsInput } from '@/shared/ui/cms-input'
import { FieldSearchIcon } from '@/shared/ui/icons'

interface CalendarSearchOption {
  id: string
  title: string
}

interface CalendarSearchProps {
  keyword: string
  options: CalendarSearchOption[]
  selectedIds: string[]
  /** CalendarMain과 동일: `buildResolvedScheduleColorMapForPrograms` 결과 */
  programColorMap: Map<string, ScheduleColorPair>
  onKeywordChange: (value: string) => void
  onOptionToggle: (id: string, checked: boolean) => void
}

export function CalendarSearch({
  keyword,
  options,
  selectedIds,
  programColorMap,
  onKeywordChange,
  onOptionToggle,
}: CalendarSearchProps) {
  return (
    <div className="calendar-search">
      <div className="calendar-search__input">
        <CmsInput
          width={'100%'}
          placeholder="프로그램명을 입력해 주세요"
          icon={<FieldSearchIcon />}
          value={keyword}
          onChange={e => onKeywordChange(e.target.value)}
          allowClear
        />
      </div>
      <div className="calendar-search__filters">
        {options.map(opt => {
          const pair = programColorMap.get(String(opt.id)) ?? getScheduleColorPair(String(opt.id))
          const rowStyle = {
            ['--calendar-search-checkbox-fill']: pair.bg,
            ['--calendar-search-checkbox-check']: pair.text,
          } as CSSProperties

          return (
            <div key={opt.id} className="calendar-search__filters-wrapper" style={rowStyle}>
              <CmsCheckbox
                className="calendar-search__filter-item"
                checked={selectedIds.includes(opt.id)}
                onChange={e => onOptionToggle(opt.id, e.target.checked)}
              >
                {opt.title}
              </CmsCheckbox>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export type { CalendarSearchProps, CalendarSearchOption }
