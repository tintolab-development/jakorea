import { Button, Card, Input, Select, Space } from 'antd'
import type { TemplateStatus } from '@/types/template'
import { statusOptions } from '../constants'
import { LAYOUT_CONSTANTS } from '@/shared/constants'

const { Search } = Input

interface TemplateFiltersProps {
  query: string
  onQueryChange: (value: string) => void
  status: TemplateStatus | 'all'
  onStatusChange: (value: TemplateStatus | 'all') => void
  onCreateClick?: () => void
  createButtonText?: string
  searchPlaceholder?: string
}

export function TemplateFilters({
  query,
  onQueryChange,
  status,
  onStatusChange,
  onCreateClick,
  createButtonText = '등록',
  searchPlaceholder = '검색',
}: TemplateFiltersProps) {
  return (
    <Card style={{ marginBottom: LAYOUT_CONSTANTS.margins.md }}>
      <Space wrap>
        <Search
          placeholder={searchPlaceholder}
          allowClear
          onSearch={onQueryChange}
          onChange={e => onQueryChange(e.target.value)}
          value={query}
          style={{ width: LAYOUT_CONSTANTS.widths.search + 90 }}
        />
        <Select
          value={status}
          onChange={onStatusChange}
          style={{ width: LAYOUT_CONSTANTS.widths.filter + 10 }}
          options={[
            { value: 'all', label: '전체 상태' },
            ...statusOptions.map(o => ({ value: o.value, label: o.label })),
          ]}
        />
        {onCreateClick && (
          <Button type="primary" onClick={onCreateClick}>
            {createButtonText}
          </Button>
        )}
      </Space>
    </Card>
  )
}
