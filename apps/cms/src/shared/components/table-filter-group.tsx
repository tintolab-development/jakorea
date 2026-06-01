/**
 * 테이블 상단 필터 그룹 (UnifiedFilterCard와 동일 레이아웃·스타일)
 * - search: 로컬 `searchDrafts` → 조회 시 `flushSync`로 부모 `onFilterChange` 반영 후 `onSearch`(applySearch)
 * - dateRange: 부모 `onFilterChange` 직접 반영 · 기본값은 `filters[key] == null && defaultValue !== null`일 때만 시드
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Row, Col } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { LabeledSearchInput } from '@/shared/ui/labeled-search-input'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { CmsSelectMultipleOption } from '@/shared/ui/cms-select-multiple'
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

export type SelectPairLegSubConfig = {
  /** `filters`에 저장되는 값의 키 */
  key: string
  options: Array<{ label: string; value: string | number }>
  placeholder?: string
  allowClear?: boolean
  /** 상위 셀렉트 값이 비었을 때 비활성화할지 여부 */
  disableWhenPrimaryEmpty?: boolean
}

export type SelectPairFilterSubConfig = {
  /** 왼쪽(상위) 셀렉트 */
  primary: SelectPairLegSubConfig
  /** 오른쪽(하위) 셀렉트. `primary` 값에 따라 옵션을 동적으로 바꾸려면 `getSecondaryOptions` 사용 */
  secondary: SelectPairLegSubConfig
  /** 제공 시 `primary` 값을 인자로 받아 `secondary` 옵션을 반환(동적 옵션). 미제공 시 `secondary.options` 사용. */
  getSecondaryOptions?: (
    primaryValue: string | number | undefined | null
  ) => Array<{ label: string; value: string | number }>
}

export interface FilterFieldConfig {
  /** 필터 키 */
  key: string
  /** 필터 타입 */
  type:
    | 'search'
    | 'select'
    | 'dateRange'
    | 'multiSelect'
    | 'radio'
    | 'addressRegion'
    | 'selectPair'
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
  /** `type === 'selectPair'`일 때 범용 이중 셀렉트 설정 */
  selectPair?: SelectPairFilterSubConfig
  /**
   * 열 기준 너비(예: 200, '25%', 'min(280px, 30%)').
   * 지정 시 Col에 `flex: 0 0 <width>`를 쓰고, 좁은 select의 전역 min-width를 완화한다.
   * `%`는 조회 버튼 영역을 뺀 필터 전용 가로 폭(내부 행) 기준이다.
   */
  width?: string | number
  /** `dateRange`: 시작일 선택 시 종료일을 시작+1개월−1일로 맞춤 */
  dateRangeOneMonthFromStart?: boolean
  /** `select`: 첫 옵션 `전체` 자동 삽입 비활성화 */
  withAllOption?: boolean
  /** `search`: 숫자만 입력 가능 */
  searchNumericOnly?: boolean
}

export interface TableFilterGroupProps {
  /** 단일 행 필터 (기본). `rows`가 있으면 무시됨 */
  fields?: FilterFieldConfig[]
  /**
   * 다행 필터 — 지정 시 `fields` 대신 사용.
   * 각 행은 CSS Grid로 `gap: 12px`·`minmax(0,1fr)`로 가로를 꽉 채움(마지막 행이 3칸·최대 4칸이면 1fr 1fr 2fr).
   */
  rows?: FilterFieldConfig[][]
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
  /**
   * 다행(`rows`)일 때만 사용.
   * `fixed`: 기존처럼 행마다 `grid-template-columns`를 인라인 지정(최대 4칸·3칸은 1fr 1fr 2fr).
   * `responsive`: 인라인 그리드 없음 — `multiRowResponsiveLayout`에 따라 배치.
   */
  multiRowGridMode?: 'fixed' | 'responsive'
  /**
   * `multiRowGridMode="responsive"`일 때만.
   * `per-row`: 행 단위 그리드 + 컨테이너 쿼리(최대 4열 등).
   * `merged-auto-fill`: 상단 필터는 flex-wrap으로 카드 너비에 따라 1줄·2줄·3줄로 줄바꿈.
   * `mergedAutoFillInlineSearch`: true면 모든 필드 + 조회를 **한 줄 flex-wrap**에 넣어 문의일·조회도 동일 규칙으로 줄바꿈(이 경우 `mergedAutoFillTrailingFieldKeys` 무시).
   * `mergedAutoFillTrailingFieldKeys`만 있으면: 해당 키만 하단 행 + 조회(우측).
   * 둘 다 없으면: 전체 필드 한 블록 + 조회는 그 아래 한 줄 우측.
   */
  multiRowResponsiveLayout?: 'per-row' | 'merged-auto-fill'
  /**
   * `merged-auto-fill`일 때만. 예: `['dateRange']` — 나머지는 위쪽 flex-wrap, 나열한 필드는 하단 행 + 조회.
   */
  mergedAutoFillTrailingFieldKeys?: readonly string[]
  /** `merged-auto-fill`일 때만. true면 필터 전부와 조회 버튼을 한 flex-wrap에 배치 */
  mergedAutoFillInlineSearch?: boolean
}
type DateRangeFilterValue = [Dayjs | null, Dayjs | null] | null

function getCurrentMonthRangeTuple(reference = dayjs()): [Dayjs, Dayjs] {
  return [reference.startOf('month'), reference.endOf('month')]
}

export function TableFilterGroup({
  fields = [],
  rows: rowsProp,
  filters = {},
  onFilterChange,
  onSearch,
  loading = false,
  extra,
  multiRowGridMode = 'fixed',
  multiRowResponsiveLayout = 'per-row',
  mergedAutoFillTrailingFieldKeys,
  mergedAutoFillInlineSearch = false,
}: TableFilterGroupProps) {
  const resolvedRows = useMemo(
    () => (rowsProp != null && rowsProp.length > 0 ? rowsProp : [fields]),
    [rowsProp, fields]
  )

  const filterRowFields = useMemo(() => resolvedRows.flat(), [resolvedRows])

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

  /** `%` 열 flex 계산용 — `filter-controls-common` 의 `--filter-field-gap`(기본 12px)과 동일하게 유지 */
  const interFieldGapPx = 12

  /**
   * `%` 열 flex 상한(px) — 래퍼 Col의 max-width·컨트롤 상한과 맞춤
   * (단일 260 / 기간·이중 셀렉트는 2×260 + gap)
   */
  const pctColumnMaxCapPx = (field: FilterFieldConfig) => {
    if (field.type === 'dateRange') return 540
    if (field.type === 'addressRegion' || field.type === 'selectPair') return 540
    return 260
  }

  const colFlex = (field: FilterFieldConfig, defaultFlex: string, rowFieldCount = 1) => {
    if (field.width != null) {
      if (typeof field.width === 'string' && field.width.trim().endsWith('%')) {
        const pct = parseFloat(field.width) / 100
        if (!Number.isNaN(pct)) {
          const totalGaps = Math.max(0, rowFieldCount - 1) * interFieldGapPx
          const basis = `calc((100% - ${totalGaps}px) * ${pct})`
          const cap = pctColumnMaxCapPx(field)
          return `0 1 min(${basis}, ${cap}px)`
        }
      }
      const w = typeof field.width === 'number' ? `${field.width}px` : field.width
      return `0 0 ${w}`
    }
    return field.flex ?? defaultFlex
  }

  const colClassName = (field: FilterFieldConfig) => {
    if (field.width == null) return undefined
    const parts = ['unified-filter-card__col--explicit-width']
    if (typeof field.width === 'string' && field.width.trim().endsWith('%')) {
      parts.push('table-filter-group__col--pct-width')
      if (field.type === 'dateRange') parts.push('table-filter-group__col--date-range')
      else if (field.type === 'addressRegion' || field.type === 'selectPair') {
        parts.push('table-filter-group__col--wide')
      }
    }
    return parts.join(' ')
  }

  const maxRowFieldCount = useMemo(
    () => (resolvedRows.length > 0 ? Math.max(0, ...resolvedRows.map(r => r.length)) : 0),
    [resolvedRows]
  )

  /** 다행 Grid: 위 행이 4칸·아래가 3칸이면 1fr 1fr 2fr 로 수직 정렬 */
  const gridTemplateForRow = (rowFieldCount: number, maxCols: number): string => {
    if (rowFieldCount <= 0) return 'minmax(0, 1fr)'
    if (rowFieldCount === maxCols) {
      return `repeat(${rowFieldCount}, minmax(0, 1fr))`
    }
    if (rowFieldCount === 3 && maxCols === 4) {
      return 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2fr)'
    }
    return `repeat(${rowFieldCount}, minmax(0, 1fr))`
  }

  const renderFieldInner = (field: FilterFieldConfig) => {
    if (field.type === 'radio') {
      return (
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
      )
    }

    if (field.type === 'search') {
      return (
        <LabeledSearchInput
          label={field.label}
          placeholder={field.placeholder || `${field.label}을(를) 입력하세요`}
          value={searchDrafts[field.key] ?? ''}
          numericOnly={field.searchNumericOnly}
          onChange={value =>
            setSearchDrafts(prev =>
              prev[field.key] === value ? prev : { ...prev, [field.key]: value }
            )
          }
          width="100%"
        />
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
        <div className="unified-filter-card__field unified-filter-card__field--select">
          <span className="unified-filter-card__label">{field.label}</span>
          <div className="table-filter-group__select-pair-selects">
            <CmsSelect
              inputSize="large"
              placeholder={ar.sidoPlaceholder ?? '시/도'}
              value={sidoEmpty ? undefined : sido}
              selectClassName="unified-filter-card__select"
              onChange={value => onFilterChange(ar.sidoKey, value ?? '')}
              popupMatchSelectWidth={false}
              style={{ width: '100%', ...field.style }}
              options={ar.sidoOptions.map(opt => ({ label: opt.label, value: opt.value }))}
            />
            <CmsSelect
              inputSize="large"
              placeholder={ar.sigunguPlaceholder ?? '시/군/구'}
              value={sigungu == null || sigungu === '' ? undefined : sigungu}
              selectClassName="unified-filter-card__select"
              onChange={value => onFilterChange(ar.sigunguKey, value ?? '')}
              disabled={sidoEmpty}
              popupMatchSelectWidth={false}
              style={{ width: '100%', ...field.style }}
              options={districtOptions.map(opt => ({ label: opt.label, value: opt.value }))}
            />
          </div>
        </div>
      )
    }

    if (field.type === 'selectPair') {
      const sp = field.selectPair
      if (!sp) return null
      const primaryRaw = filters[sp.primary.key]
      const primaryEmpty = primaryRaw == null || primaryRaw === ''
      const secondaryRaw = filters[sp.secondary.key]
      const secondaryOptions = sp.getSecondaryOptions
        ? sp.getSecondaryOptions(primaryRaw as string | number | undefined | null)
        : sp.secondary.options
      return (
        <div className="unified-filter-card__field unified-filter-card__field--select">
          <span className="unified-filter-card__label">{field.label}</span>
          <div className="table-filter-group__select-pair-selects">
            <CmsSelect
              inputSize="large"
              placeholder={sp.primary.placeholder ?? '선택'}
              value={primaryEmpty ? undefined : (primaryRaw as string | number)}
              selectClassName="unified-filter-card__select"
              onChange={value => onFilterChange(sp.primary.key, value ?? '')}
              popupMatchSelectWidth
              style={{ width: '100%', ...field.style }}
              options={sp.primary.options.map(opt => ({ label: opt.label, value: opt.value }))}
            />
            <CmsSelect
              inputSize="large"
              placeholder={sp.secondary.placeholder ?? '선택'}
              value={
                secondaryRaw == null || secondaryRaw === ''
                  ? undefined
                  : (secondaryRaw as string | number)
              }
              selectClassName="unified-filter-card__select"
              onChange={value => onFilterChange(sp.secondary.key, value ?? '')}
              disabled={sp.secondary.disableWhenPrimaryEmpty === true && primaryEmpty}
              popupMatchSelectWidth
              style={{ width: '100%', ...field.style }}
              options={secondaryOptions.map(opt => ({ label: opt.label, value: opt.value }))}
            />
          </div>
        </div>
      )
    }

    if (field.type === 'select') {
      return (
        <div className="unified-filter-card__field unified-filter-card__field--select">
          <span className="unified-filter-card__label">{field.label}</span>
          <CmsSelect
            inputSize="large"
            placeholder={field.placeholder || '전체'}
            value={filters[field.key]}
            selectClassName="unified-filter-card__select"
            withAllOption={field.withAllOption}
            onChange={value => onFilterChange(field.key, value)}
            popupMatchSelectWidth
            style={{ width: '100%', ...field.style }}
            options={field.options?.map(opt => ({
              label: opt.label,
              value: opt.value,
            }))}
          />
        </div>
      )
    }

    if (field.type === 'dateRange') {
      return (
        <div className="unified-filter-card__field">
          <span className="unified-filter-card__label">{field.label}</span>
          <CmsDateRangePicker
            inputSize="large"
            width="100%"
            style={field.style}
            value={filters[field.key]}
            onChange={dates => onFilterChange(field.key, dates as DateRangeFilterValue)}
            allowClear={field.allowClear !== false}
            oneMonthFromStart={field.dateRangeOneMonthFromStart === true}
          />
        </div>
      )
    }

    if (field.type === 'multiSelect') {
      const raw = filters[field.key]
      const arr = Array.isArray(raw) ? (raw as string[]) : []
      return (
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
      )
    }

    return null
  }

  const renderFieldCol = (field: FilterFieldConfig, rowFieldCount: number) => {
    const inner = renderFieldInner(field)
    if (inner == null) return null

    const colDataAttrs = { 'data-filter-field-key': field.key }

    if (field.type === 'radio') {
      return (
        <Col
          key={field.key}
          flex={colFlex(field, '0 0 auto', rowFieldCount)}
          className={['unified-filter-card__col--radio', colClassName(field)].filter(Boolean).join(' ')}
          {...colDataAttrs}
        >
          {inner}
        </Col>
      )
    }

    if (field.type === 'search') {
      return (
        <Col
          key={field.key}
          flex={colFlex(field, '0 0 240px', rowFieldCount)}
          className={colClassName(field)}
          {...colDataAttrs}
        >
          {inner}
        </Col>
      )
    }

    if (field.type === 'select') {
      return (
        <Col
          key={field.key}
          flex={colFlex(field, '1 1 300px', rowFieldCount)}
          className={colClassName(field)}
          {...colDataAttrs}
        >
          {inner}
        </Col>
      )
    }

    if (field.type === 'dateRange') {
      return (
        <Col
          key={field.key}
          flex={colFlex(field, '1 1 360px', rowFieldCount)}
          className={colClassName(field)}
          {...colDataAttrs}
        >
          {inner}
        </Col>
      )
    }

    if (field.type === 'multiSelect') {
      return (
        <Col
          key={field.key}
          flex={colFlex(field, '0 0 240px', rowFieldCount)}
          className={colClassName(field)}
          {...colDataAttrs}
        >
          {inner}
        </Col>
      )
    }

    if (field.type === 'addressRegion' || field.type === 'selectPair') {
      return (
        <Col
          key={field.key}
          flex={colFlex(field, '1 1 320px', rowFieldCount)}
          className={colClassName(field)}
          {...colDataAttrs}
        >
          {inner}
        </Col>
      )
    }

    return null
  }

  const renderFieldGridCell = (field: FilterFieldConfig) => {
    const inner = renderFieldInner(field)
    if (inner == null) return null
    return (
      <div key={field.key} className="table-filter-group__grid-cell" data-filter-field-key={field.key}>
        {inner}
      </div>
    )
  }

  const actionButtons = (
    <div className="table-filter-group__shell-actions">
      <CmsButton
        variant="primary"
        type="button"
        className="table-filter-group__search-button"
        width={160}
        onClick={flushSearchToParentAndSearch}
        loading={loading}
      >
        조회
      </CmsButton>
      {extra}
    </div>
  )

  const isMultiRowLayout = resolvedRows.length > 1
  const useResponsiveMultiRowGrid = isMultiRowLayout && multiRowGridMode === 'responsive'
  const useMergedResponsiveGrid =
    useResponsiveMultiRowGrid && multiRowResponsiveLayout === 'merged-auto-fill'
  const useMergedInlineSearchWrap = useMergedResponsiveGrid && mergedAutoFillInlineSearch

  const mergedTrailingKeySet = useMemo(() => {
    if (
      !useMergedResponsiveGrid ||
      useMergedInlineSearchWrap ||
      mergedAutoFillTrailingFieldKeys == null ||
      mergedAutoFillTrailingFieldKeys.length === 0
    ) {
      return null
    }
    return new Set(mergedAutoFillTrailingFieldKeys)
  }, [mergedAutoFillTrailingFieldKeys, useMergedInlineSearchWrap, useMergedResponsiveGrid])

  const { mergedHeadFields, mergedTailFields } = useMemo(() => {
    if (!useMergedResponsiveGrid) {
      return { mergedHeadFields: filterRowFields, mergedTailFields: [] as typeof filterRowFields }
    }
    if (mergedTrailingKeySet == null) {
      return { mergedHeadFields: filterRowFields, mergedTailFields: [] as typeof filterRowFields }
    }
    const head = filterRowFields.filter(f => !mergedTrailingKeySet.has(f.key))
    const tail = filterRowFields.filter(f => mergedTrailingKeySet.has(f.key))
    if (tail.length === 0) {
      return { mergedHeadFields: filterRowFields, mergedTailFields: [] as typeof filterRowFields }
    }
    return { mergedHeadFields: head, mergedTailFields: tail }
  }, [filterRowFields, mergedTrailingKeySet, useMergedResponsiveGrid])

  const useMergedAutoFillSplitBottomRow =
    useMergedResponsiveGrid && !useMergedInlineSearchWrap && mergedTailFields.length > 0

  const fieldsContainerClassName = [
    'table-filter-group__fields-container',
    useResponsiveMultiRowGrid && 'table-filter-group__fields-container--multi-row-responsive',
  ]
    .filter(Boolean)
    .join(' ')

  const fieldsBody =
    resolvedRows.length <= 1 ? (
      <Row
        gutter={0}
        className="table-filter-group__fields-inner"
        align="bottom"
        justify="start"
        wrap={false}
      >
        {resolvedRows[0]?.map(field => renderFieldCol(field, resolvedRows[0].length)) ?? null}
      </Row>
    ) : useMergedResponsiveGrid ? (
      useMergedInlineSearchWrap ? (
        <div
          className={[
            'table-filter-group__fields-rows',
            'table-filter-group__fields-rows--merged-responsive',
            'table-filter-group__fields-rows--merged-responsive-inline-search',
          ].join(' ')}
        >
          <div className="table-filter-group__merged-inline-wrap">
            {filterRowFields.map(field => renderFieldGridCell(field))}
            <div className="table-filter-group__merged-inline-wrap__search">{actionButtons}</div>
          </div>
        </div>
      ) : (
        <div
          className={[
            'table-filter-group__fields-rows',
            'table-filter-group__fields-rows--merged-responsive',
            useMergedAutoFillSplitBottomRow && 'table-filter-group__fields-rows--merged-responsive-split',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div
            className={[
              'table-filter-group__fields-grid-row',
              'table-filter-group__fields-grid-row--responsive',
              'table-filter-group__fields-grid-row--merged-auto-fill',
            ].join(' ')}
            data-filter-row-items={String(mergedHeadFields.length)}
          >
            {mergedHeadFields.map(field => renderFieldGridCell(field))}
          </div>
          {useMergedAutoFillSplitBottomRow ? (
            <div className="table-filter-group__merged-responsive-bottom">
              <div className="table-filter-group__merged-responsive-bottom__fields">
                {mergedTailFields.map(field => renderFieldGridCell(field))}
              </div>
              <div className="table-filter-group__merged-responsive-bottom__actions">{actionButtons}</div>
            </div>
          ) : (
            <div className="table-filter-group__merged-responsive-actions">{actionButtons}</div>
          )}
        </div>
      )
    ) : (
      <div className="table-filter-group__fields-rows">
        {resolvedRows.map((rowFields, rowIndex) => {
          const isLastRow = rowIndex === resolvedRows.length - 1
          if (!isLastRow) {
            return (
              <div
                key={rowIndex}
                className={[
                  'table-filter-group__fields-grid-row',
                  useResponsiveMultiRowGrid && 'table-filter-group__fields-grid-row--responsive',
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-filter-row-items={useResponsiveMultiRowGrid ? String(rowFields.length) : undefined}
                style={
                  useResponsiveMultiRowGrid
                    ? undefined
                    : { gridTemplateColumns: gridTemplateForRow(rowFields.length, maxRowFieldCount) }
                }
              >
                {rowFields.map(field => renderFieldGridCell(field))}
              </div>
            )
          }
          return (
            <div key={rowIndex} className="table-filter-group__fields-row-with-action">
              <div
                className={[
                  'table-filter-group__fields-grid-row',
                  'table-filter-group__fields-grid-row--stretch',
                  useResponsiveMultiRowGrid && 'table-filter-group__fields-grid-row--responsive',
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-filter-row-items={useResponsiveMultiRowGrid ? String(rowFields.length) : undefined}
                style={
                  useResponsiveMultiRowGrid
                    ? undefined
                    : { gridTemplateColumns: gridTemplateForRow(rowFields.length, maxRowFieldCount) }
                }
              >
                {rowFields.map(field => renderFieldGridCell(field))}
              </div>
              <div className="table-filter-group__fields-shell table-filter-group__fields-shell--inline">
                {actionButtons}
              </div>
            </div>
          )
        })}
      </div>
    )

  return (
    <div className="table-filter-group__container">
      <div className={fieldsContainerClassName}>{fieldsBody}</div>
      {!isMultiRowLayout ? (
        <div className="table-filter-group__fields-shell">{actionButtons}</div>
      ) : null}
    </div>
  )
}
