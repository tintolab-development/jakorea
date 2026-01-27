import { Button, Space } from 'antd'
import type { TemplateStatus } from '@/types/template'
import { statusOptions } from '../constants'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'

interface TemplateFiltersProps {
  /** 검색어 */
  query: string
  /** 검색어 변경 핸들러 (임시 상태) */
  onQueryChange: (value: string) => void
  /** 상태 필터 */
  status: TemplateStatus | 'all'
  /** 상태 필터 변경 핸들러 (임시 상태) */
  onStatusChange: (value: TemplateStatus | 'all') => void
  /** 조회 버튼 클릭 핸들러 */
  onSearch: () => void
  /** 초기화 핸들러 */
  onReset?: () => void
  /** 등록 버튼 클릭 핸들러 */
  onCreateClick?: () => void
  /** 등록 버튼 텍스트 */
  createButtonText?: string
  /** 검색 placeholder */
  searchPlaceholder?: string
  /** 로딩 상태 */
  loading?: boolean
}

export function TemplateFilters({
  query,
  onQueryChange,
  status,
  onStatusChange,
  onSearch,
  onReset,
  onCreateClick,
  createButtonText = '등록',
  searchPlaceholder = '검색',
  loading = false,
}: TemplateFiltersProps) {
  return (
    <UnifiedFilterCard
      fields={[
        {
          key: 'query',
          type: 'search',
          label: '검색',
          placeholder: searchPlaceholder || '검색어를 입력하세요',
          defaultValue: query,
        },
        {
          key: 'status',
          type: 'select',
          label: '상태',
          placeholder: '전체 상태',
          options: [
            { value: 'all', label: '전체 상태' },
            ...statusOptions.map(o => ({ value: o.value, label: o.label })),
          ],
          defaultValue: status,
        },
      ]}
      filters={{
        query,
        status,
      }}
      onFilterChange={(key, value) => {
        if (key === 'query') {
          onQueryChange(value)
        } else if (key === 'status') {
          onStatusChange(value)
        }
      }}
      onSearch={onSearch}
      onReset={onReset}
      loading={loading}
      extra={
        onCreateClick ? (
          <Button type="primary" onClick={onCreateClick}>
            {createButtonText}
          </Button>
        ) : undefined
      }
    />
  )
}
