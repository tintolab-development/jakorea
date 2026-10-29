import { forwardRef, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Select } from 'antd'
import type { SelectProps } from 'antd'
import type { RefSelectProps } from 'antd/es/select'
import {
  AdminFieldClearButton,
  AdminFieldFrame,
  cmsControlSizeClass,
  joinClassNames,
  shouldRenderFieldFrame,
  useAdminFieldStatus,
  type AdminControlSize,
  type AdminFieldProps,
} from '../field/index.js'
import { FieldChevronDownIcon } from '../icons/field-icons.js'
import {
  AdminSelectMultiple,
  type AdminSelectMultipleOption,
} from './admin-select-multiple.js'
import {
  mapClearedSelectValue,
  mergeSelectOptions,
  optionsIncludeEmptyValueOption,
  resolveSelectOptionPolicy,
  type AdminSelectOptionPolicy,
} from './select-options.js'
import './admin-select.css'

const CMS_SELECT_DROPDOWN_CLASS = 'cms-select-dropdown'

function normalizeMultipleOptions(options: SelectProps['options']): AdminSelectMultipleOption[] {
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

export { ADMIN_MULTI_SELECT_TAG_COLORS as CMS_MULTI_SELECT_TAG_COLORS } from './admin-select-multiple.js'

export interface AdminSelectProps
  extends Omit<SelectProps, 'variant' | 'size' | 'allowClear'>,
    AdminFieldProps {
  selectClassName?: string
  inputSize?: AdminControlSize
  width?: number | string
  withAllOption?: boolean
  stripSentinelOptions?: boolean
  optionPolicy?: AdminSelectOptionPolicy
  allowClear?: boolean
  filterLocally?: boolean
  searchDebounceMs?: number
  onSearchChange?: (query: string) => void
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
  formatSelectedLabel?: (value: string, optionLabel: string) => string
}

export const AdminSelect = forwardRef<RefSelectProps, AdminSelectProps>((props, ref) => {
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
    withAllOption,
    stripSentinelOptions,
    optionPolicy,
    allowClear = true,
    filterLocally,
    searchDebounceMs,
    onSearchChange,
    hasMore,
    loadingMore,
    onLoadMore,
    formatSelectedLabel,
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

  const framed = shouldRenderFieldFrame(props, label)
  const { isError, message: resolvedMessage } = useAdminFieldStatus({
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
  // width만 잠근다. flex-basis에 px를 넣으면 column flex 부모(필터 label+control)에서
  // 높이가 width 값(예: 240px)으로 늘어난다.
  const widthStyle: CSSProperties | undefined =
    width == null
      ? undefined
      : typeof width === 'number'
        ? {
            width: `${width}px`,
            minWidth: `${width}px`,
            maxWidth: `${width}px`,
            flexGrow: 0,
            flexShrink: 0,
          }
        : { width, flexGrow: 0, flexShrink: 0 }

  const mergedOptions = useMemo(
    () =>
      mergeSelectOptions(
        options,
        mode,
        resolveSelectOptionPolicy({
          withAllOption,
          stripSentinelOptions,
          optionPolicy,
        })
      ),
    [options, mode, withAllOption, stripSentinelOptions, optionPolicy]
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
    const normalized = mapClearedSelectValue({
      next,
      mode,
      optionsHaveEmptyValue,
    })
    if (!isControlled) setUncontrolledValue(normalized)
    onChange?.(normalized as never, option as never)
  }

  const handleClear = () => {
    const isMulti = mode === 'multiple' || mode === 'tags'
    handleChange((isMulti ? [] : undefined) as never, (isMulti ? [] : undefined) as never)
    onClear?.()
  }

  const boxCn = joinClassNames(
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
      <AdminFieldFrame
        size={inputSize}
        label={label}
        required={required}
        message={resolvedMessage}
        isError={isError}
        className={joinClassNames(
          'cms-select-field',
          hasExplicitWidth && 'cms-field--explicit-width',
          className
        )}
        style={{ ...widthStyle, ...style }}
      >
        {control}
      </AdminFieldFrame>
    ) : (
      control
    )

  if (mode === 'multiple') {
    return renderFrame(
      <AdminSelectMultiple
        className={joinClassNames(
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
        formatSelectedLabel={formatSelectedLabel}
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
        <AdminFieldClearButton
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

AdminSelect.displayName = 'AdminSelect'
