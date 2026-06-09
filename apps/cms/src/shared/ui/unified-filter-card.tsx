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
import dayjs, { type Dayjs } from 'dayjs'
import { LAYOUT_CONSTANTS } from '@/shared/constants/layout'
import { LabeledSearchInput } from './labeled-search-input'
import { FilterSearchButton } from './app-button'
import { CmsSelect } from './cms-select'
import type { CmsSelectMultipleOption } from './cms-select-multiple'
import { AppDateRangePicker } from './app-datepicker'
import { CmsRadio } from './cms-radio'
import type { AddressRegionFilterSubConfig } from '@/shared/components/table-filter-group'
import { isFilterFieldPctWidth } from '@/shared/components/table-filter-group-field-width'
import './unified-filter-card.css'

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
  multiSelectOptions?: CmsSelectMultipleOption[]
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

type DateRangeFilterValue = [Dayjs | null, Dayjs | null] | null

function sameCalendarDay(
  a: Dayjs | null | undefined,
  b: Dayjs | null | undefined
): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return a.isSame(b, 'day')
}

function serializeDateRangeFilter(raw: unknown): string {
  if (raw == null) return ''
  if (!Array.isArray(raw) || raw.length < 2) return ''
  const s = raw[0] as Dayjs | null | undefined
  const e = raw[1] as Dayjs | null | undefined
  return `${s?.valueOf() ?? ''}|${e?.valueOf() ?? ''}`
}

function normalizeDateRangeFromFilters(raw: unknown): DateRangeFilterValue {
  if (raw == null) return null
  if (!Array.isArray(raw) || raw.length < 2) return null
  const s = raw[0] as Dayjs | null | undefined
  const e = raw[1] as Dayjs | null | undefined
  if (s == null && e == null) return null
  return [s ?? null, e ?? null]
}

function getCurrentMonthRangeTuple(reference = dayjs()): [Dayjs, Dayjs] {
  return [reference.startOf('month'), reference.endOf('month')]
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
    // 외부 URL/초기값 동기화 시점에만 초안을 치환한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  const onSearchRef = useRef(onSearch)
  useEffect(() => {
    searchDraftsRef.current = searchDrafts
    onSearchRef.current = onSearch
  }, [searchDrafts, onSearch])

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

  const onFilterChangeRef = useRef(onFilterChange)
  useEffect(() => {
    onFilterChangeRef.current = onFilterChange
  }, [onFilterChange])

  const dateRangeSeededKeysRef = useRef(new Set<string>())
  const dateRangeEndLockedRef = useRef<Record<string, boolean>>({})
  const dateRangeLastEmittedRef = useRef<Record<string, DateRangeFilterValue>>({})
  const dateRangeCommittedSigRef = useRef<Record<string, string>>({})

  useEffect(() => {
    for (const field of filterRowFields) {
      if (field.type !== 'dateRange') continue

      if (field.defaultValue !== null && !dateRangeSeededKeysRef.current.has(field.key)) {
        const raw = filters[field.key]
        if (raw == null) {
          let range: [Dayjs, Dayjs]
          if (
            Array.isArray(field.defaultValue) &&
            field.defaultValue[0] &&
            field.defaultValue[1]
          ) {
            range = [field.defaultValue[0], field.defaultValue[1]]
          } else {
            range = getCurrentMonthRangeTuple()
          }
          onFilterChangeRef.current(field.key, range)
          dateRangeSeededKeysRef.current.add(field.key)
          dateRangeLastEmittedRef.current[field.key] = range
          dateRangeCommittedSigRef.current[field.key] = serializeDateRangeFilter(range)
          dateRangeEndLockedRef.current[field.key] = false
          continue
        }
        dateRangeSeededKeysRef.current.add(field.key)
      }

      const sig = serializeDateRangeFilter(filters[field.key])
      if (sig !== dateRangeCommittedSigRef.current[field.key]) {
        const normalized = normalizeDateRangeFromFilters(filters[field.key])
        dateRangeLastEmittedRef.current[field.key] = normalized
        dateRangeCommittedSigRef.current[field.key] = sig
        dateRangeEndLockedRef.current[field.key] = false
      }
    }
  }, [filterRowFields, filters])

  const handleDateRangeFilterChange = useCallback(
    (fieldKey: string, incoming: DateRangeFilterValue) => {
      const prev = dateRangeLastEmittedRef.current[fieldKey] ?? null

      if (incoming == null || (incoming[0] == null && incoming[1] == null)) {
        dateRangeEndLockedRef.current[fieldKey] = false
        dateRangeLastEmittedRef.current[fieldKey] = null
        dateRangeCommittedSigRef.current[fieldKey] = ''
        onFilterChange(fieldKey, null)
        return
      }

      const [ns, ne] = incoming
      const [ps, pe] = prev ?? [null, null]

      const startChanged = !sameCalendarDay(ns, ps)
      const endChanged = !sameCalendarDay(ne, pe)

      if (endChanged) {
        dateRangeEndLockedRef.current[fieldKey] = ne != null
      }

      let out: DateRangeFilterValue
      if (startChanged && ns != null && !dateRangeEndLockedRef.current[fieldKey]) {
        out = [ns, ns.add(1, 'month')]
      } else {
        out = [ns, ne]
      }

      dateRangeLastEmittedRef.current[fieldKey] = out
      dateRangeCommittedSigRef.current[fieldKey] = serializeDateRangeFilter(out)
      onFilterChange(fieldKey, out)
    },
    [onFilterChange]
  )

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

  const colClassFor = (field: FilterFieldConfig) => {
    if (field.width == null) return undefined
    const parts = ['unified-filter-card__col--explicit-width']
    if (isFilterFieldPctWidth(field)) {
      parts.push('unified-filter-card__col--pct-width')
    }
    return parts.join(' ')
  }

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
            <div className="unified-filter-card__address-region-selects">
              <CmsSelect
                inputSize="large"
                withAllOption={false}
                width="100%"
                placeholder={ar.sidoPlaceholder ?? '시/도'}
                value={sido}
                selectClassName="unified-filter-card__select"
                onChange={value => onFilterChange(ar.sidoKey, String(value ?? ''))}
                popupMatchSelectWidth
                style={field.style}
                options={ar.sidoOptions.map(opt => ({ label: opt.label, value: opt.value }))}
              />
              <CmsSelect
                inputSize="large"
                withAllOption={false}
                width="100%"
                placeholder={ar.sigunguPlaceholder ?? '시/군/구'}
                value={sigungu}
                selectClassName="unified-filter-card__select"
                onChange={value => onFilterChange(ar.sigunguKey, String(value ?? ''))}
                disabled={sidoEmpty}
                popupMatchSelectWidth
                style={field.style}
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
              withAllOption={field.allowClear !== false}
              width="100%"
              placeholder={field.placeholder || '전체'}
              value={filters[field.key]}
              selectClassName="unified-filter-card__select"
              onChange={value => onFilterChange(field.key, value)}
              popupMatchSelectWidth
              style={field.style}
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
              onChange={dates => handleDateRangeFilterChange(field.key, dates as DateRangeFilterValue)}
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
            <CmsSelect
              mode="multiple"
              withAllOption={false}
              inputSize="large"
              className="unified-filter-card__multi-select"
              placeholder={field.placeholder || '선택하세요'}
              value={arr}
              onChange={next => onFilterChange(field.key, next as string[])}
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
