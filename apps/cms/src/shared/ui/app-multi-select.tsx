/**
 * 앱 공통 다중 선택 — 닫힘: 선택 라벨을 쉼표로 한 줄(말줄임), 열림: 검색 + 체크 + 옵션별 배경색
 */

import { useCallback, useId, useMemo, useState } from 'react'
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react'
import { Checkbox, Input, Popover } from 'antd'
import { CloseCircleFilled, DownOutlined } from '@ant-design/icons'
import './app-multi-select.css'

export interface AppMultiSelectOption {
  value: string
  label: string
  /** 드롭다운 라벨 배경 (예: #f0f0f0). 없으면 인덱스 기본 팔레트 */
  tagColor?: string
  /** 라벨 글자색 (학교 대표색 등). 없으면 기본 #3d3d3d */
  tagTextColor?: string
}

export interface AppMultiSelectProps {
  value: string[]
  onChange: (next: string[]) => void
  options: AppMultiSelectOption[]
  placeholder?: string
  disabled?: boolean
  allowClear?: boolean
  className?: string
  id?: string
  style?: CSSProperties
}

/** 드롭다운 옵션 기본 배경 팔레트 (필터에서 동일 팔레트로 `tagColor` 부여 시 재사용 가능) */
export const APP_MULTI_SELECT_TAG_COLORS = [
  '#f5f5f5',
  '#f0f5ff',
  '#fff7e6',
  '#f6ffed',
  '#fff0f6',
  '#e6fffb',
  '#fcffe6',
  '#f9f0ff',
]

function labelStyleForOption(opt: AppMultiSelectOption, index: number): CSSProperties {
  const bg = opt.tagColor ?? APP_MULTI_SELECT_TAG_COLORS[index % APP_MULTI_SELECT_TAG_COLORS.length]
  const style: CSSProperties = { backgroundColor: bg }
  if (opt.tagTextColor) style.color = opt.tagTextColor
  return style
}

export function AppMultiSelect({
  value,
  onChange,
  options,
  placeholder = '선택하세요',
  disabled = false,
  allowClear = true,
  className,
  id: idProp,
  style,
}: AppMultiSelectProps) {
  const reactId = useId()
  const listId = idProp ?? `app-multi-select-${reactId.replace(/:/g, '')}`
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const valueSet = useMemo(() => new Set(value), [value])

  const optionByValue = useMemo(() => {
    const m = new Map<string, AppMultiSelectOption>()
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
    <div className="app-multi-select__panel" id={listId}>
      <Input
        className="app-multi-select__search"
        size="small"
        placeholder="검색"
        value={search}
        onChange={e => setSearch(e.target.value)}
        allowClear
        onClick={e => e.stopPropagation()}
      />
      <ul className="app-multi-select__list" role="listbox" aria-multiselectable>
        {filteredOptions.length === 0 ? (
          <li className="app-multi-select__empty">검색 결과가 없습니다.</li>
        ) : (
          filteredOptions.map((opt, index) => {
            const originalIndex = options.indexOf(opt)
            const idx = originalIndex >= 0 ? originalIndex : index
            const checked = valueSet.has(opt.value)
            return (
              <li
                key={opt.value}
                className={`app-multi-select__row${checked ? ' app-multi-select__row--checked' : ''}`}
                role="option"
                aria-selected={checked}
              >
                <Checkbox
                  className="app-multi-select__checkbox"
                  checked={checked}
                  onChange={e => toggle(opt.value, e.target.checked)}
                >
                  <span
                    className="app-multi-select__label-pill"
                    style={labelStyleForOption(opt, idx)}
                  >
                    {opt.label}
                  </span>
                </Checkbox>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )

  return (
    <div className={['app-multi-select', className].filter(Boolean).join(' ')} style={style}>
      <Popover
        open={disabled ? false : open}
        onOpenChange={next => {
          if (!disabled) {
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
          className={[
            'app-multi-select__trigger',
            open ? 'app-multi-select__trigger--open' : '',
          ].join(' ')}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
        >
          <span
            className={[
              'app-multi-select__trigger-text',
              !displayText ? 'app-multi-select__trigger-text--placeholder' : '',
            ].join(' ')}
          >
            {displayText || placeholder}
          </span>
          {allowClear && value.length > 0 && !disabled && (
            <span
              role="button"
              tabIndex={0}
              className="app-multi-select__clear"
              onClick={handleClear}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleClear(e)
                }
              }}
              aria-label="선택 초기화"
            >
              <CloseCircleFilled />
            </span>
          )}
          <DownOutlined className="app-multi-select__chevron" />
        </button>
      </Popover>
    </div>
  )
}
