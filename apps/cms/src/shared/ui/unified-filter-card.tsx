/**
 * 통일된 필터 카드 컴포넌트
 * - 카드 컴포넌트 자식으로 렌더링
 * - select box와 input 모두 레이블 포함
 * - 필터가 많아지면 자동으로 두 줄 처리
 * - 조회 버튼 클릭 시 필터링
 * - 쿼리 파라미터 연동 지원
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, Row, Col, Space } from 'antd'
import type { Dayjs } from 'dayjs'
import { LAYOUT_CONSTANTS } from '@/shared/constants/layout'
import { LabeledSearchInput } from './labeled-search-input'
import { FilterSearchButton } from './app-button'
import { AppMultiSelect } from './app-multi-select'
import type { AppMultiSelectOption } from './app-multi-select'
import { AppSelect } from './app-select'
import { AppDateRangePicker } from './app-datepicker'
import { AppRadio } from './app-radio'
import './unified-filter-card.css'

export interface FilterFieldConfig {
  /** 필터 키 */
  key: string
  /** 필터 타입 */
  type: 'search' | 'select' | 'dateRange' | 'multiSelect' | 'radio'
  /** 레이블 텍스트 */
  label: string
  /** placeholder 텍스트 */
  placeholder?: string
  /** Select / Radio 옵션 (type이 'select' | 'radio'일 때) */
  options?: Array<{ label: string; value: string | number }>
  /** 다중 선택 옵션 (type이 'multiSelect'일 때). value는 문자열 */
  multiSelectOptions?: AppMultiSelectOption[]
  /** 기본값 */
  defaultValue?: string | number | [Dayjs, Dayjs] | null
  /** allowClear 옵션 */
  allowClear?: boolean
  /** 스타일 */
  style?: React.CSSProperties
  /** 너비 (flex 값 또는 숫자) */
  flex?: number | string
  /**
   * 열 기준 너비(예: 200, '25%', 'min(280px, 30%)').
   * 지정 시 Col에 `flex: 0 0 <width>`를 쓰고, 좁은 select의 전역 min-width를 완화한다.
   * `%`는 조회 버튼 영역을 뺀 필터 전용 가로 폭(내부 행) 기준이다.
   */
  width?: string | number
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
  /** 조회 버튼 로딩 상태 */
  loading?: boolean
  /** 추가 컨텐츠 */
  extra?: React.ReactNode
  /** Card 스타일 */
  cardStyle?: React.CSSProperties
  /** Card 테두리 표시 여부 */
  bordered?: boolean
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
 * />
 * ```
 */
export function UnifiedFilterCard({
  fields = [],
  filters = {},
  onFilterChange,
  onSearch,
  loading = false,
  extra,
  cardStyle,
  bordered,
}: UnifiedFilterCardProps) {
  // 필터 한 줄 배치 (사이즈 조정으로 단일 행 표현)
  const filterRowFields = fields

  const searchFieldKeys = useMemo(
    () => filterRowFields.filter(f => f.type === 'search').map(f => f.key),
    [filterRowFields]
  )

  const filtersSearchSignature = useMemo(
    () => JSON.stringify(Object.fromEntries(searchFieldKeys.map(k => [k, filters[k] ?? '']))),
    [filters, searchFieldKeys]
  )

  /**
   * 검색(search) 필드는 카드 내부 초안만 갱신 — 키 입력마다 부모·테이블 리렌더 방지.
   * 부모 filters(URL·조회 반영 등)가 바뀌면 시그니처로 동기화.
   */
  const [searchDrafts, setSearchDrafts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const k of searchFieldKeys) {
      init[k] = String(filters[k] ?? '')
    }
    return init
  })

  const prevSearchSigRef = useRef(filtersSearchSignature)
  useEffect(() => {
    if (prevSearchSigRef.current === filtersSearchSignature) return
    prevSearchSigRef.current = filtersSearchSignature
    setSearchDrafts(prev => {
      const next = { ...prev }
      let changed = false
      for (const k of searchFieldKeys) {
        const v = String(filters[k] ?? '')
        if (next[k] !== v) {
          next[k] = v
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [filters, filtersSearchSignature, searchFieldKeys])

  const searchDraftsRef = useRef(searchDrafts)
  searchDraftsRef.current = searchDrafts

  const onSearchRef = useRef(onSearch)
  onSearchRef.current = onSearch

  const flushSearchToParentAndSearch = useCallback(() => {
    for (const f of filterRowFields) {
      if (f.type === 'search') {
        onFilterChange(f.key, searchDraftsRef.current[f.key] ?? '')
      }
    }
    const run = () => onSearchRef.current()
    if (typeof globalThis !== 'undefined' && typeof globalThis.setTimeout === 'function') {
      globalThis.setTimeout(run, 0)
    } else {
      run()
    }
  }, [filterRowFields, onFilterChange])

  /** 필드 칸 사이 margin 12px — % basis는 gap 없이도 (100% - margin 합) 안에서만 잡히게 calc */
  const interFieldGapPx = 12

  const colFlex = (field: FilterFieldConfig, defaultFlex: string) => {
    if (field.width != null) {
      if (typeof field.width === 'string' && field.width.trim().endsWith('%')) {
        const pct = parseFloat(field.width) / 100
        if (!Number.isNaN(pct)) {
          const totalGaps = Math.max(0, filterRowFields.length - 1) * interFieldGapPx
          return `0 0 calc((100% - ${totalGaps}px) * ${pct})`
        }
      }
      const w = typeof field.width === 'number' ? `${field.width}px` : field.width
      return `0 0 ${w}`
    }
    return field.flex ?? defaultFlex
  }

  const colClassFor = (field: FilterFieldConfig) =>
    field.width != null ? 'unified-filter-card__col--explicit-width' : undefined

  // 필터 렌더링 함수
  const renderField = (field: FilterFieldConfig) => {
    if (field.type === 'radio') {
      return (
        <Col
          key={field.key}
          flex={colFlex(field, '0 0 auto')}
          className={['unified-filter-card__col--radio', colClassFor(field)].filter(Boolean).join(' ')}
        >
          <div className="unified-filter-card__field unified-filter-card__field--radio">
            <span className="unified-filter-card__label">{field.label}</span>
            <AppRadio.Group
              value={filters[field.key]}
              onChange={e => onFilterChange(field.key, e.target.value)}
            >
              {(field.options ?? []).map(opt => (
                <AppRadio key={String(opt.value)} value={opt.value}>
                  {opt.label}
                </AppRadio>
              ))}
            </AppRadio.Group>
          </div>
        </Col>
      )
    }

    if (field.type === 'search') {
      return (
        <Col key={field.key} flex={colFlex(field, '0 0 240px')} className={colClassFor(field)}>
          <LabeledSearchInput
            uiVariant="filter"
            label={field.label}
            placeholder={field.placeholder || `${field.label}을(를) 입력하세요`}
            value={searchDrafts[field.key] ?? ''}
            onChange={value =>
              setSearchDrafts(prev =>
                prev[field.key] === value ? prev : { ...prev, [field.key]: value }
              )
            }
            allowClear={field.allowClear !== false}
            width="100%"
          />
        </Col>
      )
    }

    if (field.type === 'select') {
      return (
        <Col key={field.key} flex={colFlex(field, '1 1 300px')} className={colClassFor(field)}>
          <div className="unified-filter-card__field unified-filter-card__field--select">
            <span className="unified-filter-card__label">{field.label}</span>
            <AppSelect
              uiVariant="filter"
              size="small"
              placeholder={field.placeholder || '전체'}
              value={filters[field.key]}
              selectClassName="unified-filter-card__select"
              onChange={value => onFilterChange(field.key, value)}
              allowClear={field.allowClear !== false}
              popupMatchSelectWidth
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
        <Col key={field.key} flex={colFlex(field, '1 1 360px')} className={colClassFor(field)}>
          <div className="unified-filter-card__field">
            <span className="unified-filter-card__label">{field.label}</span>
            <AppDateRangePicker
              uiVariant="filter"
              size="small"
              style={{ width: '100%', ...field.style }}
              value={filters[field.key]}
              onChange={dates => onFilterChange(field.key, dates)}
              allowClear={field.allowClear !== false}
            />
          </div>
        </Col>
      )
    }

    if (field.type === 'multiSelect') {
      const raw = filters[field.key]
      const arr = Array.isArray(raw) ? (raw as string[]) : []
      return (
        <Col key={field.key} flex={colFlex(field, '0 0 240px')} className={colClassFor(field)}>
          <div className="unified-filter-card__field">
            <span className="unified-filter-card__label">{field.label}</span>
            <AppMultiSelect
              className="unified-filter-card__multi-select"
              placeholder={field.placeholder || '선택하세요'}
              value={arr}
              onChange={next => onFilterChange(field.key, next)}
              options={field.multiSelectOptions ?? []}
              allowClear={field.allowClear !== false}
              style={{ width: '100%', ...field.style }}
            />
          </div>
        </Col>
      )
    }

    return null
  }

  const actionButtons = (
    <Space size="small">
      <FilterSearchButton
        onClick={flushSearchToParentAndSearch}
        loading={loading}
        className="unified-filter-card__button"
      />
      {extra}
    </Space>
  )

  return (
    <Card
      className={`unified-filter-card unified-filter-card--single-row${bordered === false ? ' unified-filter-card--no-border' : ''}`}
      style={{
        marginBottom: LAYOUT_CONSTANTS.margins.md,
        ...cardStyle,
        ...(bordered === false ? { border: 'none', boxShadow: 'none' } : {}),
      }}
      bordered={bordered}
    >
      <div className="unified-filter-card__toolbar">
        <div className="unified-filter-card__fields-shell">
          <Row gutter={0} className="unified-filter-card__fields-inner" align="bottom" wrap={false}>
            {filterRowFields.map(renderField)}
          </Row>
        </div>
        <div className="unified-filter-card__actions">{actionButtons}</div>
      </div>
    </Card>
  )
}
