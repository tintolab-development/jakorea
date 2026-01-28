/**
 * List 페이지 필터 공통 컴포넌트
 * 검색, Select 필터, 초기화 버튼 패턴 추상화
 */

import { Card, Space, Select, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { LAYOUT_CONSTANTS } from '@/shared/constants/layout'
import { LabeledSearchInput } from './labeled-search-input'

export interface FilterOption {
  label: string
  value: string | number
}

export interface FilterConfig {
  key: string
  type: 'select'
  options: FilterOption[]
  placeholder: string
  allowClear?: boolean
  style?: React.CSSProperties
}

export interface ListPageFiltersProps<T extends Record<string, any>> {
  /** 필터 값 객체 */
  filters: T
  /** 필터 변경 핸들러 */
  onFilterChange: (key: keyof T, value: any) => void
  /** 필터 설정 배열 */
  filterConfig?: FilterConfig[]
  /** 검색어 */
  searchValue?: string
  /** 검색어 변경 핸들러 */
  onSearchChange?: (value: string) => void
  /** 검색 레이블 (기본값: "검색") */
  searchLabel?: string
  /** 검색 placeholder */
  searchPlaceholder?: string
  /** 초기화 핸들러 */
  onReset?: () => void
  /** 초기화 버튼 표시 여부 */
  showReset?: boolean
  /** 추가 컨텐츠 */
  extra?: React.ReactNode
  /** Card 스타일 */
  cardStyle?: React.CSSProperties
}

/**
 * List 페이지 필터 공통 컴포넌트
 *
 * @example
 * ```tsx
 * <ListPageFilters
 *   filters={{ status: 'all', category: 'all' }}
 *   onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
 *   searchValue={searchText}
 *   onSearchChange={setSearchText}
 *   searchPlaceholder="제목, 내용, 작성자 검색"
 *   filterConfig={[
 *     { key: 'status', type: 'select', options: statusOptions, placeholder: '상태' },
 *     { key: 'category', type: 'select', options: categoryOptions, placeholder: '카테고리' },
 *   ]}
 *   onReset={() => {
 *     setFilters({ status: 'all', category: 'all' })
 *     setSearchText('')
 *   }}
 * />
 * ```
 */
export function ListPageFilters<T extends Record<string, any>>({
  filters,
  onFilterChange,
  filterConfig = [],
  searchValue = '',
  onSearchChange,
  searchLabel = '검색',
  searchPlaceholder,
  onReset,
  showReset = true,
  extra,
  cardStyle,
}: ListPageFiltersProps<T>) {
  return (
    <Card style={{ marginBottom: LAYOUT_CONSTANTS.margins.md, ...cardStyle }}>
      <Space wrap align="start">
        {onSearchChange && (
          <LabeledSearchInput
            label={searchLabel}
            placeholder={searchPlaceholder || `${searchLabel}을(를) 입력하세요`}
            value={searchValue}
            onChange={onSearchChange}
            width={LAYOUT_CONSTANTS.widths.search}
          />
        )}

        {filterConfig.map(config => (
          <Select
            key={config.key}
            placeholder={config.placeholder}
            value={filters[config.key]}
            onChange={value => onFilterChange(config.key, value)}
            allowClear={config.allowClear !== false}
            style={{ width: LAYOUT_CONSTANTS.widths.filter, ...config.style }}
          >
            {config.options.map(option => (
              <Select.Option key={String(option.value)} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        ))}

        {showReset && onReset && (
          <Button icon={<ReloadOutlined />} onClick={onReset}>
            초기화
          </Button>
        )}

        {extra}
      </Space>
    </Card>
  )
}
