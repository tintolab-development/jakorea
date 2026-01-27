/**
 * 통일된 필터 카드 컴포넌트
 * - 카드 컴포넌트 자식으로 렌더링
 * - select box와 input 모두 레이블 포함
 * - 필터가 많아지면 자동으로 두 줄 처리
 * - 조회 버튼 클릭 시 필터링
 * - 쿼리 파라미터 연동 지원
 */

import { Card, Row, Col, Select, Button, Space, DatePicker } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { LAYOUT_CONSTANTS } from '@/shared/constants/layout'
import { LabeledSearchInput } from './labeled-search-input'
import './unified-filter-card.css'

const { RangePicker } = DatePicker

export interface FilterFieldConfig {
  /** 필터 키 */
  key: string
  /** 필터 타입 */
  type: 'search' | 'select' | 'dateRange'
  /** 레이블 텍스트 */
  label: string
  /** placeholder 텍스트 */
  placeholder?: string
  /** Select 옵션 (type이 'select'일 때) */
  options?: Array<{ label: string; value: string | number }>
  /** 기본값 */
  defaultValue?: string | number | [Dayjs, Dayjs] | null
  /** allowClear 옵션 */
  allowClear?: boolean
  /** 스타일 */
  style?: React.CSSProperties
  /** 너비 (flex 값 또는 숫자) */
  flex?: number | string
}

export interface UnifiedFilterCardProps {
  /** 필터 필드 설정 배열 */
  fields: FilterFieldConfig[]
  /** 필터 값 객체 */
  filters: Record<string, any>
  /** 필터 변경 핸들러 (조회 버튼 클릭 전까지 임시 저장) */
  onFilterChange: (key: string, value: any) => void
  /** 조회 버튼 클릭 핸들러 */
  onSearch: () => void
  /** 초기화 핸들러 */
  onReset?: () => void
  /** 조회 버튼 로딩 상태 */
  loading?: boolean
  /** 추가 컨텐츠 */
  extra?: React.ReactNode
  /** Card 스타일 */
  cardStyle?: React.CSSProperties
  /** 초기화 버튼 텍스트 (기본값: "초기화") */
  resetButtonText?: string
}

/**
 * 통일된 필터 카드 컴포넌트
 *
 * @example
 * ```tsx
 * <UnifiedFilterCard
 *   fields={[
 *     { key: 'title', type: 'search', label: '프로그램명', placeholder: '프로그램명을 입력하세요' },
 *     { key: 'status', type: 'select', label: '모집 상태', options: statusOptions, placeholder: '전체' },
 *     { key: 'recruitmentPeriod', type: 'dateRange', label: '모집 기간' },
 *   ]}
 *   filters={pendingFilters}
 *   onFilterChange={(key, value) => setPendingFilters(prev => ({ ...prev, [key]: value }))}
 *   onSearch={handleSearch}
 *   onReset={handleReset}
 * />
 * ```
 */
export function UnifiedFilterCard({
  fields = [],
  filters = {},
  onFilterChange,
  onSearch,
  onReset,
  loading = false,
  extra,
  cardStyle,
  resetButtonText = '초기화',
}: UnifiedFilterCardProps) {
  // 필터를 두 줄로 분할
  // 첫 줄: search 필드와 처음 4개 select 필드
  // 두 번째 줄: 나머지 select 필드와 dateRange 필드
  const shouldSplitIntoTwoRows = fields.length > 5

  // 첫 줄: search 필드 + 처음 4개 select 필드
  const firstRowFields = shouldSplitIntoTwoRows
    ? fields.filter((f, index) => {
        if (f.type === 'search') return true
        if (f.type === 'select') {
          // search 필드를 제외한 select 필드 중 처음 4개
          const selectFieldsBefore = fields.slice(0, index).filter(field => field.type === 'select')
          return selectFieldsBefore.length < 4
        }
        return false
      })
    : fields // 6개 미만이면 모든 필터를 첫 줄에 표시

  // 두 번째 줄: 나머지 select 필드와 dateRange 필드
  const secondRowFields = shouldSplitIntoTwoRows
    ? fields.filter((f, index) => {
        if (f.type === 'dateRange') return true
        if (f.type === 'select') {
          // search 필드를 제외한 select 필드 중 4개 이후
          const selectFieldsBefore = fields.slice(0, index).filter(field => field.type === 'select')
          return selectFieldsBefore.length >= 4
        }
        return false
      })
    : [] // 6개 미만이면 두 번째 줄 없음

  // 필터 렌더링 함수
  const renderField = (field: FilterFieldConfig) => {
    if (field.type === 'search') {
      return (
        <Col key={field.key} flex={field.flex || '1'}>
          <LabeledSearchInput
            label={field.label}
            placeholder={field.placeholder || `${field.label}을(를) 입력하세요`}
            value={filters[field.key] || ''}
            onChange={value => onFilterChange(field.key, value)}
            allowClear={field.allowClear !== false}
            width="100%"
          />
        </Col>
      )
    }

    if (field.type === 'select') {
      return (
        <Col key={field.key} flex={field.flex || '1'}>
          <div className="unified-filter-card__field">
            <span className="unified-filter-card__label">{field.label}</span>
            <Select
              placeholder={field.placeholder || '전체'}
              value={filters[field.key]}
              onChange={value => onFilterChange(field.key, value)}
              allowClear={field.allowClear !== false}
              style={{ width: '100%', ...field.style }}
              options={field.options?.map(opt => ({
                label: opt.label,
                value: opt.value,
              }))}
            />
          </div>
        </Col>
      )
    }

    if (field.type === 'dateRange') {
      return (
        <Col key={field.key} flex={field.flex || '1.5'}>
          <div className="unified-filter-card__field">
            <span className="unified-filter-card__label">{field.label}</span>
            <RangePicker
              style={{ width: '100%', ...field.style }}
              value={filters[field.key]}
              onChange={dates => onFilterChange(field.key, dates)}
              allowClear={field.allowClear !== false}
            />
          </div>
        </Col>
      )
    }

    return null
  }

  return (
    <Card
      className="unified-filter-card"
      style={{ marginBottom: LAYOUT_CONSTANTS.margins.md, ...cardStyle }}
    >
      {/* 첫 번째 줄: search와 초기 select 필터들 */}
      <Row gutter={[12, 16]} className="unified-filter-card__row" align="bottom">
        {firstRowFields.map(renderField)}
        {/* 첫 줄에 버튼이 필요한지 확인 (두 번째 줄이 없으면 첫 줄에 버튼 표시) */}
        {secondRowFields.length === 0 && (
          <Col
            flex="none"
            style={{ display: 'flex', justifyContent: 'flex-end', minWidth: 'fit-content' }}
          >
            <Space>
              {onReset && <Button onClick={onReset}>{resetButtonText}</Button>}
              <Button type="primary" icon={<SearchOutlined />} onClick={onSearch} loading={loading}>
                조회
              </Button>
              {extra}
            </Space>
          </Col>
        )}
      </Row>

      {/* 두 번째 줄: 나머지 select 필터들과 dateRange */}
      {secondRowFields.length > 0 && (
        <Row
          gutter={[12, 16]}
          className="unified-filter-card__row"
          align="bottom"
          style={{ marginTop: 16 }}
        >
          {secondRowFields.map(renderField)}
          {/* 조회 버튼 (두 번째 줄 오른쪽) */}
          <Col
            flex="none"
            style={{ display: 'flex', justifyContent: 'flex-end', minWidth: 'fit-content' }}
          >
            <Space>
              {onReset && <Button onClick={onReset}>{resetButtonText}</Button>}
              <Button type="primary" icon={<SearchOutlined />} onClick={onSearch} loading={loading}>
                조회
              </Button>
              {extra}
            </Space>
          </Col>
        </Row>
      )}
    </Card>
  )
}
