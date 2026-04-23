/**
 * CMS 전용 셀렉트 (AppSelect와 동일하게 span 래퍼 + borderless Select)
 * - inputSize: large | medium | small (CmsInput 치수 정렬)
 * - `placeholder`: Ant `Select`와 동일. options에 `value: ''`가 없을 때 폼 값이 `''`여도 placeholder가 보이도록 표시용 value만 `undefined`로 맞춤 (`cms-input`과 동일한 empty UX).
 * - 단일 선택: `allowClear`(×) 없음. 첫 옵션에 `전체`(value `''`)를 넣어 초기화(필터 등)는 해당 옵션 선택으로 처리.
 * - 이미 `value: ''` 옵션이 있거나, 첫 플랫 옵션 라벨이 `전체`인 경우(예: `value: 'all'`)는 중복 삽입하지 않음. `multiple` / `tags`는 옵션 삽입·clear UX 변경 없음.
 */

import { forwardRef, useMemo } from 'react'
import type { CSSProperties } from 'react'
import { Select } from 'antd'
import type { SelectProps } from 'antd'
import type { RefSelectProps } from 'antd/es/select'
import type { CmsControlSize } from './cms-control-size'
import './cms-select.css'

const CMS_SELECT_ALL_OPTION = { label: '전체', value: '' as const }

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
  if (!withAllOption) return options
  if (mode === 'multiple' || mode === 'tags') return options
  if (!Array.isArray(options)) return options
  if (optionsIncludeEmptyValueOption(options)) return options
  if (optionsAlreadyStartWithAllLabel(options)) return options
  return [CMS_SELECT_ALL_OPTION, ...options]
}

export interface CmsSelectProps extends Omit<SelectProps, 'variant' | 'size' | 'allowClear'> {
  /** Ant Select 루트(.ant-select)에만 붙는 클래스 */
  selectClassName?: string
  /** large 44px / medium 40px / small 32px */
  inputSize?: CmsControlSize
  /** 지정 시 사이즈별 기본 width 대신 적용 (숫자는 px) */
  width?: number | string
  /** true면 비어있는 전체 옵션을 자동 삽입 (기본 true) */
  withAllOption?: boolean
}

export const CmsSelect = forwardRef<RefSelectProps, CmsSelectProps>(
  (
    {
      className,
      selectClassName,
      inputSize = 'large',
      width,
      disabled,
      style,
      value,
      onChange,
      options,
      mode,
      withAllOption = true,
      ...rest
    },
    ref
  ) => {
    const hasExplicitWidth = width != null
    const widthStyle: CSSProperties | undefined =
      width != null
        ? { width: typeof width === 'number' ? `${width}px` : width }
        : undefined

    const mergedOptions = useMemo(
      () => mergeOptionsForCmsSelect(options, mode, withAllOption),
      [options, mode, withAllOption]
    )

    const optionsHaveEmptyValue = useMemo(
      () => optionsIncludeEmptyValueOption(mergedOptions),
      [mergedOptions]
    )

    const resolvedValue = useMemo(() => {
      if (optionsHaveEmptyValue) return value
      if (value === '' || value === null || value === undefined) return undefined
      return value
    }, [value, optionsHaveEmptyValue])

    const handleChange: SelectProps['onChange'] = (next, option) => {
      if (!onChange) return
      const isMulti = mode === 'multiple' || mode === 'tags'
      if (
        !optionsHaveEmptyValue &&
        !isMulti &&
        (next === undefined || next === null)
      ) {
        onChange('' as never, option)
        return
      }
      onChange(next, option)
    }

    const wrapperCn = [
      'cms-select',
      `cms-select--${inputSize}`,
      hasExplicitWidth && 'cms-select--explicit-width',
      disabled && 'cms-select--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <span className={wrapperCn} style={{ ...widthStyle, ...style }}>
        <Select
          ref={ref}
          variant="borderless"
          className={selectClassName}
          disabled={disabled}
          {...rest}
          mode={mode}
          options={mergedOptions}
          value={resolvedValue as SelectProps['value']}
          onChange={handleChange}
          allowClear={false}
        />
      </span>
    )
  }
)

CmsSelect.displayName = 'CmsSelect'
