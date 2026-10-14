/**
 * CmsSelect `mode="multiple"` — AppMultiSelect와 동일 UX (검색·체크·pill, 닫힘 시 쉼표 구분)
 */

import { useCallback, useId, useMemo, useState } from 'react'
import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { Input, Popover } from 'antd'
import { CmsCheckbox } from './cms-checkbox'
import { CmsClearIconSvg, joinCmsClassNames } from './cms-field'
import { FieldChevronDownIcon } from './icons/FieldIcons'

export type CmsSelectMultipleOption = {
  value: string
  label: string
  tagColor?: string
  tagTextColor?: string
}

export const CMS_MULTI_SELECT_TAG_COLORS = [
  '#f5f5f5',
  '#f0f5ff',
  '#fff7e6',
  '#f6ffed',
  '#fff0f6',
  '#e6fffb',
  '#fcffe6',
  '#f9f0ff',
] as const

function labelStyleForOption(opt: CmsSelectMultipleOption, index: number): CSSProperties {
  const bg = opt.tagColor ?? CMS_MULTI_SELECT_TAG_COLORS[index % CMS_MULTI_SELECT_TAG_COLORS.length]
  const style: CSSProperties = { backgroundColor: bg }
  if (opt.tagTextColor) style.color = opt.tagTextColor
  return style
}

export type CmsSelectMultipleProps = {
  value: string[]
  onChange: (next: string[]) => void
  options: CmsSelectMultipleOption[]
  placeholder?: ReactNode
  disabled?: boolean
  /** 에러 테두리 (disabled 이면 무시) */
  error?: boolean
  allowClear?: boolean
  /** 옵션 목록 API 로딩 중 — 빈 목록일 때 검색 없음 문구 대신 표시 */
  optionsLoading?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  id?: string
  style?: CSSProperties
  'aria-labelledby'?: string
}

export function CmsSelectMultiple({
  value,
  onChange,
  options,
  placeholder = '선택하세요',
  disabled = false,
  error = false,
  allowClear = true,
  optionsLoading = false,
  onOpenChange,
  className,
  id: idProp,
  style,
  'aria-labelledby': ariaLabelledBy,
}: CmsSelectMultipleProps) {
  const reactId = useId()
  const listId = idProp ?? `cms-select-multi-${reactId.replace(/:/g, '')}`
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const valueSet = useMemo(() => new Set(value), [value])

  const optionByValue = useMemo(() => {
    const m = new Map<string, CmsSelectMultipleOption>()
    options.forEach(o => m.set(o.value, o))
    return m
  }, [options])

  const displayText = useMemo(() => {
    if (value.length === 0) return ''
    return value.map(v => optionByValue.get(v)?.label ?? v).join(', ')
  }, [value, optionByValue])

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    )
  }, [options, search])

  const toggle = useCallback(
    (v: string, checked: boolean) => {
      if (checked) {
        if (valueSet.has(v)) return
        onChange([...value, v])
      } else {
        onChange(value.filter(x => x !== v))
      }
    },
    [value, valueSet, onChange]
  )

  const handleClear = useCallback(
    (e: MouseEvent | KeyboardEvent) => {
      e.stopPropagation()
      onChange([])
    },
    [onChange]
  )

  const panel = (
    <div className="cms-select-multi__panel" id={listId}>
      <Input
        className="cms-select-multi__search"
        size="small"
        placeholder="검색"
        value={search}
        onChange={e => setSearch(e.target.value)}
        allowClear
        onClick={e => e.stopPropagation()}
      />
      <ul className="cms-select-multi__list" role="listbox" aria-multiselectable>
        {filteredOptions.length === 0 ? (
          <li className="cms-select-multi__empty">
            {optionsLoading ? '목록을 불러오는 중입니다.' : '검색 결과가 없습니다.'}
          </li>
        ) : (
          filteredOptions.map((opt, index) => {
            const originalIndex = options.indexOf(opt)
            const idx = originalIndex >= 0 ? originalIndex : index
            const checked = valueSet.has(opt.value)
            return (
              <li
                key={opt.value}
                className={`cms-select-multi__row${checked ? ' cms-select-multi__row--checked' : ''}`}
                role="option"
                aria-selected={checked}
              >
                <CmsCheckbox
                  checkboxSize="medium"
                  className="cms-select-multi__checkbox"
                  checked={checked}
                  onChange={e => toggle(opt.value, e.target.checked)}
                >
                  <span
                    className="cms-select-multi__label-pill"
                    style={labelStyleForOption(opt, idx)}
                  >
                    {opt.label}
                  </span>
                </CmsCheckbox>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )

  return (
    <div className={className} style={style}>
      <Popover
        open={disabled ? false : open}
        onOpenChange={next => {
          if (!disabled) {
            onOpenChange?.(next)
            setOpen(next)
            if (!next) setSearch('')
          }
        }}
        trigger="click"
        placement="bottomLeft"
        styles={{ body: { padding: 12 } }}
        content={panel}
      >
        <button
          type="button"
          onMouseDown={() => onOpenChange?.(true)}
          className={joinCmsClassNames(
            'cms-select-multi__trigger',
            'cms-field__box',
            open && 'cms-select-multi__trigger--open',
            open && 'cms-field__box--active',
            value.length > 0 && 'cms-field__box--filled',
            disabled && 'cms-field__box--disabled',
            error && !disabled && 'cms-field__box--error'
          )}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
          aria-labelledby={ariaLabelledBy}
        >
          <span
            className={[
              'cms-select-multi__trigger-text',
              !displayText ? 'cms-select-multi__trigger-text--placeholder' : '',
            ].join(' ')}
          >
            {displayText || placeholder}
          </span>
          {allowClear && value.length > 0 && !disabled && (
            <span
              role="button"
              tabIndex={0}
              className="cms-select-multi__clear cms-field__clear"
              onClick={handleClear}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleClear(e)
                }
              }}
              aria-label="선택 초기화"
            >
              <CmsClearIconSvg />
            </span>
          )}
          <span className="cms-select-multi__chevron cms-field__chevron" aria-hidden>
            <FieldChevronDownIcon />
          </span>
        </button>
      </Popover>
    </div>
  )
}
