/**
 * CMS 전용 셀렉트 (span 박스 + borderless Select, `cms-field.css` 공통 스펙)
 * - inputSize: xlarge | large | medium | small (CmsInput 치수 정렬)
 * - 상단 라벨 / 하단 메세지(선택) · error
 * - `placeholder`: Ant `Select`와 동일. options에 `value: ''`가 없을 때 폼 값이 `''`여도 placeholder가 보이도록 표시용 value만 `undefined`로 맞춤 (`cms-input`과 동일한 empty UX).
 * - 단일 선택: `allowClear`(기본 true)면 값이 있을 때 X와 화살표를 둠(Ant allowClear 대신 suffix 커스텀). X는 hover / focus·open 시에만 보임. `withAllOption`은 「전체」 옵션만 제어하고 ×를 막지 않는다.
 * - `mode="multiple"`: AppMultiSelect와 동일 UX(검색·체크·pill, 닫힘 시 쉼표 구분) — Ant Select 미사용.
 * - 열린 드롭다운: `.ant-select`가 테두리 박스를 채우므로 Ant 기본 `popupMatchSelectWidth`로 폭·좌측 정렬이 트리거와 일치.
 */

import { forwardRef, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Select } from 'antd'
import type { SelectProps } from 'antd'
import type { RefSelectProps } from 'antd/es/select'
import type { CmsControlSize } from './cms-control-size'
import {
  CmsFieldClearButton,
  CmsFieldFrame,
  cmsControlSizeClass,
  joinCmsClassNames,
  shouldRenderCmsFieldFrame,
  useCmsFieldStatus,
} from './cms-field'
import type { CmsFieldProps } from './cms-field'
import {
  CmsSelectMultiple,
  type CmsSelectMultipleOption,
} from './cms-select-multiple'
import { FieldChevronDownIcon } from './icons/FieldIcons'
import './cms-select.css'

const CMS_SELECT_ALL_OPTION = { label: '전체', value: '' as const }

/** 드롭다운은 body 포털이라 래퍼 클래스로 스타일링 불가 — 팝업 루트에 붙인다 */
const CMS_SELECT_DROPDOWN_CLASS = 'cms-select-dropdown'

/** 필터용 「전체」 센티널 — 등록/필수 선택 폼에서는 제외해야 함 */
function isAllSentinelOption(opt: unknown): boolean {
  if (opt == null || typeof opt !== 'object') return false
  const o = opt as { value?: unknown; label?: unknown; options?: unknown[] }
  if (Array.isArray(o.options)) return false
  const value = String(o.value ?? '').trim()
  return value === '' || value === 'ALL'
}

function stripAllSentinelOptions(options: SelectProps['options']): SelectProps['options'] {
  if (!Array.isArray(options)) return options
  return options.filter(opt => !isAllSentinelOption(opt))
}

function optionsIncludeEmptyValueOption(options: SelectProps['options']): boolean {
  if (!Array.isArray(options)) return false
  return options.some(opt => {
    if (opt == null || typeof opt !== 'object') return false
    const o = opt as { value?: unknown; options?: unknown[] }
    if (Array.isArray(o.options)) {
      return o.options.some(
        item =>
          item != null &&
          typeof item === 'object' &&
          'value' in item &&
          (item as { value: unknown }).value === ''
      )
    }
    return o.value === ''
  })
}

/** 첫 번째 플랫(비그룹) 옵션 — 옵션 그룹만 있으면 null */
function firstFlatOption(options: SelectProps['options']): Record<string, unknown> | null {
  if (!Array.isArray(options) || options.length === 0) return null
  const first = options[0]
  if (first == null || typeof first !== 'object') return null
  const o = first as { options?: unknown[] }
  if (Array.isArray(o.options)) return null
  return first as Record<string, unknown>
}

function optionsAlreadyStartWithAllLabel(options: SelectProps['options']): boolean {
  const first = firstFlatOption(options)
  if (!first) return false
  return first.label === '전체'
}

function mergeOptionsForCmsSelect(
  options: SelectProps['options'],
  mode: SelectProps['mode'] | undefined,
  withAllOption: boolean
): SelectProps['options'] {
  // 등록·필수 선택: 「전체」 자동삽입뿐 아니라 options에 섞인 센티널도 제거
  if (!withAllOption) {
    if (mode === 'multiple' || mode === 'tags') return options
    return stripAllSentinelOptions(options)
  }
  if (mode === 'multiple' || mode === 'tags') return options
  if (!Array.isArray(options)) return options
  if (optionsIncludeEmptyValueOption(options)) return options
  if (optionsAlreadyStartWithAllLabel(options)) return options
  return [CMS_SELECT_ALL_OPTION, ...options]
}

function normalizeMultipleOptions(options: SelectProps['options']): CmsSelectMultipleOption[] {
  if (!Array.isArray(options)) return []
  return options.flatMap(opt => {
    if (opt == null || typeof opt !== 'object') return []
    const o = opt as {
      value?: unknown
      label?: unknown
      options?: unknown[]
      tagColor?: string
      tagTextColor?: string
    }
    if (Array.isArray(o.options)) return []
    if (o.value == null) return []
    return [
      {
        value: String(o.value),
        label: String(o.label ?? o.value),
        tagColor: o.tagColor,
        tagTextColor: o.tagTextColor,
      },
    ]
  })
}

function hasSelectedValue(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false
  if (Array.isArray(value)) return value.length > 0
  return true
}

export { CMS_MULTI_SELECT_TAG_COLORS } from './cms-select-multiple'

export interface CmsSelectProps
  extends Omit<SelectProps, 'variant' | 'size' | 'allowClear'>,
    CmsFieldProps {
  /** Ant Select 루트(.ant-select)에만 붙는 클래스 */
  selectClassName?: string
  /** xlarge 52px / large 44px / medium 40px / small 36px */
  inputSize?: CmsControlSize
  /** 지정 시 기본 width(240px) 대신 적용 (숫자는 px) */
  width?: number | string
  /** true면 비어있는 전체 옵션을 자동 삽입 (기본 true) */
  withAllOption?: boolean
  /** 값이 있을 때 선택 초기화(×) 표시 (기본 true) */
  allowClear?: boolean
  /** mode="multiple" — 서버 검색·무한 스크롤 */
  filterLocally?: boolean
  searchDebounceMs?: number
  onSearchChange?: (query: string) => void
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
}

export const CmsSelect = forwardRef<RefSelectProps, CmsSelectProps>((props, ref) => {
  const {
    className,
    selectClassName,
    inputSize = 'large',
    width,
    disabled,
    style,
    value,
    defaultValue,
    onChange,
    onClear,
    onOpenChange,
    loading,
    options,
    mode,
    withAllOption = true,
    allowClear = true,
    filterLocally,
    searchDebounceMs,
    onSearchChange,
    hasMore,
    loadingMore,
    onLoadMore,
    placeholder,
    classNames,
    popupClassName,
    suffixIcon,
    label,
    required = false,
    message,
    error = false,
    status,
    'aria-labelledby': ariaLabelledBy,
    ...rest
  } = props

  const framed = shouldRenderCmsFieldFrame(props, label)
  const { isError, message: resolvedMessage } = useCmsFieldStatus({
    error,
    status,
    message,
    disabled,
  })

  const isControlled = Object.prototype.hasOwnProperty.call(props, 'value')
  const [uncontrolledValue, setUncontrolledValue] = useState<unknown>(defaultValue)
  const currentValue = isControlled ? value : uncontrolledValue

  const popupRootCn = [CMS_SELECT_DROPDOWN_CLASS, classNames?.popup?.root, popupClassName]
    .filter(Boolean)
    .join(' ')

  const hasExplicitWidth = width != null
  const widthStyle: CSSProperties | undefined =
    width == null
      ? undefined
      : typeof width === 'number'
        ? {
            width: `${width}px`,
            minWidth: `${width}px`,
            maxWidth: `${width}px`,
            flex: `0 0 ${width}px`,
          }
        : { width }

  const mergedOptions = useMemo(
    () => mergeOptionsForCmsSelect(options, mode, withAllOption),
    [options, mode, withAllOption]
  )

  const multipleOptions = useMemo(() => normalizeMultipleOptions(mergedOptions), [mergedOptions])

  const optionsHaveEmptyValue = useMemo(
    () => optionsIncludeEmptyValueOption(mergedOptions),
    [mergedOptions]
  )

  const resolvedValue = useMemo(() => {
    if (mode === 'multiple') {
      return Array.isArray(currentValue) ? currentValue.map(String) : []
    }
    if (optionsHaveEmptyValue) return currentValue
    if (currentValue === '' || currentValue === null || currentValue === undefined) return undefined
    return currentValue
  }, [currentValue, optionsHaveEmptyValue, mode])

  const isFilled = resolvedValue !== undefined && resolvedValue !== null
  const showClear = Boolean(allowClear && !disabled && hasSelectedValue(resolvedValue))

  const handleChange: SelectProps['onChange'] = (next, option) => {
    const isMulti = mode === 'multiple' || mode === 'tags'
    const normalized =
      !optionsHaveEmptyValue && !isMulti && (next === undefined || next === null) ? '' : next
    if (!isControlled) setUncontrolledValue(normalized)
    onChange?.(normalized as never, option as never)
  }

  const handleClear = () => {
    const isMulti = mode === 'multiple' || mode === 'tags'
    handleChange((isMulti ? [] : undefined) as never, (isMulti ? [] : undefined) as never)
    onClear?.()
  }

  const boxCn = joinCmsClassNames(
    'cms-select',
    `cms-select--${inputSize}`,
    cmsControlSizeClass(inputSize),
    'cms-field__box',
    hasExplicitWidth && 'cms-select--explicit-width',
    disabled && 'cms-select--disabled',
    disabled && 'cms-field__box--disabled',
    isError && 'cms-field__box--error',
    isFilled && 'cms-field__box--filled',
    showClear && 'cms-select--clearable',
    allowClear && 'cms-select--allow-clear',
    framed ? undefined : className
  )

  const boxStyle = framed ? undefined : { ...widthStyle, ...style }

  const renderFrame = (control: ReactNode) =>
    framed ? (
      <CmsFieldFrame
        size={inputSize}
        label={label}
        required={required}
        message={resolvedMessage}
        isError={isError}
        className={joinCmsClassNames(
          'cms-select-field',
          hasExplicitWidth && 'cms-field--explicit-width',
          className
        )}
        style={{ ...widthStyle, ...style }}
      >
        {control}
      </CmsFieldFrame>
    ) : (
      control
    )

  if (mode === 'multiple') {
    return renderFrame(
      <CmsSelectMultiple
        className={joinCmsClassNames(
          'cms-select',
          `cms-select--${inputSize}`,
          cmsControlSizeClass(inputSize),
          'cms-select--multiple-ui',
          hasExplicitWidth && 'cms-select--explicit-width',
          disabled && 'cms-select--disabled',
          framed ? undefined : className
        )}
        style={boxStyle}
        disabled={disabled}
        error={isError}
        placeholder={typeof placeholder === 'string' ? placeholder : undefined}
        options={multipleOptions}
        value={resolvedValue as string[]}
        allowClear={allowClear}
        optionsLoading={Boolean(loading)}
        filterLocally={filterLocally}
        searchDebounceMs={searchDebounceMs}
        onSearchChange={onSearchChange}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={onLoadMore}
        onOpenChange={onOpenChange}
        onChange={next => {
          if (!isControlled) setUncontrolledValue(next)
          onChange?.(next as never, [] as never)
        }}
        aria-labelledby={ariaLabelledBy}
      />
    )
  }

  const suffixNode = (
    <span className="cms-select__suffix">
      {showClear ? (
        <CmsFieldClearButton
          className="cms-select__clear"
          label="선택 초기화"
          onClear={handleClear}
        />
      ) : null}
      {suffixIcon ?? (
        <span className="cms-field__chevron cms-select__chevron" aria-hidden>
          <FieldChevronDownIcon />
        </span>
      )}
    </span>
  )

  return renderFrame(
    <span className={boxCn} style={boxStyle}>
      <Select
        ref={ref}
        variant="borderless"
        className={selectClassName}
        disabled={disabled}
        placeholder={placeholder}
        loading={loading}
        onOpenChange={onOpenChange}
        {...rest}
        classNames={{ ...classNames, popup: { ...classNames?.popup, root: popupRootCn } }}
        mode={mode}
        options={mergedOptions}
        value={resolvedValue as SelectProps['value']}
        onChange={handleChange}
        allowClear={false}
        suffixIcon={suffixNode}
      />
    </span>
  )
})

CmsSelect.displayName = 'CmsSelect'
