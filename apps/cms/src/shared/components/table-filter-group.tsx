/**
 * 테이블 상단 필터 그룹 (UnifiedFilterCard와 동일 레이아웃·스타일)
 * - search: 로컬 `searchDrafts` → 조회 시 `flushSync`로 부모 `onFilterChange` 반영 후 `onSearch`(applySearch)
 * - dateRange: 부모 `onFilterChange` 직접 반영 · 기본값은 `filters[key] == null && defaultValue !== null`일 때만 시드
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Row, Col, Space } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { LabeledSearchInput } from '@/shared/ui/labeled-search-input'
import { CmsButton } from '@/shared/ui/cms-button'
import { AppMultiSelect, type AppMultiSelectOption } from '@/shared/ui/app-multi-select'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsDateRangePicker } from '@/shared/ui/cms-datepicker'
import { CmsRadio } from '@/shared/ui/cms-radio'
import './table-filter-group.css'

export type AddressRegionFilterSubConfig = {
  /** 시/도 값이 저장되는 `filters` 키 */
  sidoKey: string
  /** 시/군/구 값이 저장되는 `filters` 키 */
  sigunguKey: string
  sidoOptions: Array<{ label: string; value: string }>
  getSigunguOptions: (sido: string | undefined | null) => Array<{ label: string; value: string }>
  sidoPlaceholder?: string
  sigunguPlaceholder?: string
}

export interface FilterFieldConfig {
  /** 필터 키 */
  key: string
  /** 필터 타입 */
  type: 'search' | 'select' | 'dateRange' | 'multiSelect' | 'radio' | 'addressRegion'
  /** 레이블 텍스트 */
  label: string
  /** placeholder 텍스트 */
  placeholder?: string
  /** Select / Radio 옵션 (type이 'select' | 'radio'일 때) */
  options?: Array<{ label: string; value: string | number }>
  /** 다중 선택 옵션 (type이 'multiSelect'일 때). value는 문자열 */
  multiSelectOptions?: AppMultiSelectOption[]
  /**
   * 기본값. `dateRange`에서만 추가 의미:
   * - `undefined`: 값이 없을 때 이번 달 1일~말일을 부모에 1회 시드
   * - `null`: 시드하지 않음(빈 구간 유지)
   * - `[Dayjs, Dayjs]`: 시드 시 해당 구간 사용
   */
  defaultValue?: string | number | [Dayjs, Dayjs] | null
  /** allowClear 옵션 */
  allowClear?: boolean
  /** 스타일 */
  style?: React.CSSProperties
  /** 너비 (flex 값 또는 숫자) */
  flex?: number | string
  /** `type === 'addressRegion'`일 때 시/도·시/군/구 이중 셀렉트 설정 */
  addressRegion?: AddressRegionFilterSubConfig
  /**
   * 열 기준 너비(예: 200, '25%', 'min(280px, 30%)').
   * 지정 시 Col에 `flex: 0 0 <width>`를 쓰고, 좁은 select의 전역 min-width를 완화한다.
   * `%`는 조회 버튼 영역을 뺀 필터 전용 가로 폭(내부 행) 기준이다.
   */
  width?: string | number
}

export interface TableFilterGroupProps {
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
type DateRangeFilterValue = [Dayjs | null, Dayjs | null] | null

function getCurrentMonthRangeTuple(reference = dayjs()): [Dayjs, Dayjs] {
  return [reference.startOf('month'), reference.endOf('month')]
}

export function TableFilterGroup({
  fields = [],
  filters = {},
  onFilterChange,
  onSearch,
  loading = false,
  extra,
}: TableFilterGroupProps) {
  const filterRowFields = fields

  const searchFieldKeys = useMemo(
    () => filterRowFields.filter(f => f.type === 'search').map(f => f.key),
    [filterRowFields]
  )

  const filtersSearchSignature = useMemo(
    () => JSON.stringify(Object.fromEntries(searchFieldKeys.map(k => [k, filters[k] ?? '']))),
    [filters, searchFieldKeys]
  )

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

  const onSearchRef = useRef(onSearch)
  useLayoutEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  const flushSearchToParentAndSearch = useCallback(() => {
    flushSync(() => {
      for (const f of filterRowFields) {
        if (f.type === 'search') {
          onFilterChange(f.key, searchDrafts[f.key] ?? '')
        }
      }
    })
    onSearchRef.current()
  }, [filterRowFields, onFilterChange, searchDrafts])

  useEffect(() => {
    for (const field of filterRowFields) {
      if (field.type !== 'dateRange') continue

      if (filters[field.key] == null && field.defaultValue !== null) {
        const range = Array.isArray(field.defaultValue)
          ? field.defaultValue
          : getCurrentMonthRangeTuple()

        onFilterChange(field.key, range)
      }
    }
  }, [filterRowFields, filters, onFilterChange])

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

  const renderField = (field: FilterFieldConfig) => {
    if (field.type === 'radio') {
      return (
        <Col
          key={field.key}
          flex={colFlex(field, '0 0 auto')}
          className={['unified-filter-card__col--radio', colClassFor(field)]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="unified-filter-card__field unified-filter-card__field--radio">
            <span className="unified-filter-card__label">{field.label}</span>
            <CmsRadio.Group
              value={filters[field.key]}
              onChange={e => onFilterChange(field.key, e.target.value)}
            >
              {(field.options ?? []).map(opt => (
                <CmsRadio key={String(opt.value)} value={opt.value}>
                  {opt.label}
                </CmsRadio>
              ))}
            </CmsRadio.Group>
          </div>
        </Col>
      )
    }

    if (field.type === 'search') {
      return (
        <Col key={field.key} flex={colFlex(field, '0 0 240px')} className={colClassFor(field)}>
          <LabeledSearchInput
            label={field.label}
            placeholder={field.placeholder || `${field.label}을(를) 입력하세요`}
            value={searchDrafts[field.key] ?? ''}
            onChange={value =>
              setSearchDrafts(prev =>
                prev[field.key] === value ? prev : { ...prev, [field.key]: value }
              )
            }
            width="100%"
          />
        </Col>
      )
    }

    if (field.type === 'addressRegion') {
      const ar = field.addressRegion
      if (!ar) return null
      const sido = filters[ar.sidoKey] as string | undefined
      const sigungu = filters[ar.sigunguKey] as string | undefined
      const sidoEmpty = sido == null || sido === ''
      const districtOptions = ar.getSigunguOptions(sido)
      return (
        <Col key={field.key} flex={colFlex(field, '1 1 320px')} className={colClassFor(field)}>
          <div className="unified-filter-card__field unified-filter-card__field--select">
            <span className="unified-filter-card__label">{field.label}</span>
            <div className="table-filter-group__address-region-selects">
              <CmsSelect
                inputSize="large"
                placeholder={ar.sidoPlaceholder ?? '시/도'}
                value={sidoEmpty ? undefined : sido}
                selectClassName="unified-filter-card__select"
                onChange={value => onFilterChange(ar.sidoKey, value ?? '')}
                allowClear={field.allowClear !== false}
                popupMatchSelectWidth
                style={{ width: '100%', ...field.style }}
                options={ar.sidoOptions.map(opt => ({ label: opt.label, value: opt.value }))}
              />
              <CmsSelect
                inputSize="large"
                placeholder={ar.sigunguPlaceholder ?? '시/군/구'}
                value={sigungu == null || sigungu === '' ? undefined : sigungu}
                selectClassName="unified-filter-card__select"
                onChange={value => onFilterChange(ar.sigunguKey, value ?? '')}
                allowClear={field.allowClear !== false}
                disabled={sidoEmpty}
                popupMatchSelectWidth
                style={{ width: '100%', ...field.style }}
                options={districtOptions.map(opt => ({ label: opt.label, value: opt.value }))}
              />
            </div>
          </div>
        </Col>
      )
    }

    if (field.type === 'select') {
      return (
        <Col key={field.key} flex={colFlex(field, '1 1 300px')} className={colClassFor(field)}>
          <div className="unified-filter-card__field unified-filter-card__field--select">
            <span className="unified-filter-card__label">{field.label}</span>
            <CmsSelect
              inputSize="large"
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
            <CmsDateRangePicker
              inputSize="large"
              style={{ width: '100%', ...field.style }}
              value={filters[field.key]}
              onChange={dates => onFilterChange(field.key, dates as DateRangeFilterValue)}
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
      <CmsButton
        variant="primary"
        type="button"
        onClick={flushSearchToParentAndSearch}
        loading={loading}
      >
        조회
      </CmsButton>
      {extra}
    </Space>
  )

  return (
    <div className="table-filter-group__container">
      <div className="table-filter-group__fields-container">
        <Row gutter={0} className="table-filter-group__fields-inner" align="bottom" wrap={false}>
          {filterRowFields.map(renderField)}
        </Row>
      </div>
      <div className="table-filter-group__fields-shell">{actionButtons}</div>
    </div>
  )
}
