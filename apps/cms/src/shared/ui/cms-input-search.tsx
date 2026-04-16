/**
 * CMS 검색형 인풋: `CmsInput` 마크업·`cms-input.css` 그대로 사용.
 * 입력 문자열을 포함하는 옵션만 실시간 필터링하여 목록 표시. 일치 구간은 `var(--JA-mint-01)` 색.
 * 일치 항목이 없으면 패널에 안내 문구를 표시한다.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import type { InputRef } from 'antd'
import { CmsInput, type CmsInputProps } from './cms-input'

const HIGHLIGHT_STYLE: CSSProperties = { color: 'var(--JA-mint-01, #01a1af)' }

function filterBySubstring(options: readonly string[], query: string): string[] {
  const q = query.trim()
  if (q === '') return []
  const lower = q.toLowerCase()
  return options.filter(opt => opt.toLowerCase().includes(lower))
}

function renderMatchHighlight(text: string, query: string): ReactNode {
  const q = query.trim()
  if (q === '') return text
  const qLower = q.toLowerCase()
  const textLower = text.toLowerCase()
  const parts: ReactNode[] = []
  let cursor = 0
  let k = 0
  while (cursor < text.length) {
    const found = textLower.indexOf(qLower, cursor)
    if (found === -1) {
      parts.push(text.slice(cursor))
      break
    }
    if (found > cursor) {
      parts.push(text.slice(cursor, found))
    }
    parts.push(
      <span key={`m-${k++}`} style={HIGHLIGHT_STYLE}>
        {text.slice(found, found + q.length)}
      </span>
    )
    cursor = found + q.length
  }
  return <>{parts}</>
}

export interface CmsInputSearchProps extends Omit<
  CmsInputProps,
  'value' | 'defaultValue' | 'onChange' | 'onSelect'
> {
  /** 선택 가능한 문자열 목록 */
  options: readonly string[]
  value?: string
  defaultValue?: string
  /** 입력값 변경 */
  onChange?: (value: string) => void
  /** 목록에서 항목을 선택했을 때 (입력값도 해당 문자열로 설정) */
  onSelect?: (option: string) => void
}

export const CmsInputSearch = forwardRef<InputRef, CmsInputSearchProps>(function CmsInputSearch(
  {
    options,
    value: valueProp,
    defaultValue = '',
    onChange,
    onSelect,
    onFocus,
    onBlur,
    onKeyDown,
    disabled,
    readOnly,
    width,
    style,
    className,
    ...cmsInputProps
  },
  ref
) {
  const listId = useId()
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (blurTimeout.current != null) {
        clearTimeout(blurTimeout.current)
      }
    }
  }, [])
  const isControlled = valueProp !== undefined
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const value = isControlled ? (valueProp ?? '') : uncontrolled

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) {
        setUncontrolled(next)
      }
      onChange?.(next)
    },
    [isControlled, onChange]
  )

  const filtered = useMemo(() => filterBySubstring(options, value), [options, value])
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const listPanelStyle: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    marginTop: 4,
    zIndex: 1050,
    background: '#fff',
    border: '1px solid rgba(0, 0, 0, 0.12)',
    borderRadius: 8,
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
    maxHeight: 240,
    overflowY: 'auto',
    margin: 0,
    padding: '4px 0',
    listStyle: 'none',
  }

  const rowStyle = (active: boolean): CSSProperties => ({
    margin: 0,
    padding: '8px 12px',
    cursor: 'pointer',
    background: active ? 'rgba(0, 0, 0, 0.04)' : undefined,
  })

  const clearBlurTimeout = () => {
    if (blurTimeout.current != null) {
      clearTimeout(blurTimeout.current)
      blurTimeout.current = null
    }
  }

  const hasQuery = value.trim() !== ''
  const showDropdownPanel = !disabled && !readOnly && panelOpen && hasQuery
  const hasResults = filtered.length > 0

  const emptyPanelStyle: CSSProperties = {
    ...listPanelStyle,
    padding: '12px 16px',
    color: 'rgba(61, 61, 61, 0.55)',
    fontSize: 14,
    lineHeight: '150%',
    textAlign: 'center',
    cursor: 'default',
  }

  const handleFocus = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      clearBlurTimeout()
      setPanelOpen(true)
      setActiveIndex(-1)
      onFocus?.(e)
    },
    [onFocus]
  )

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      blurTimeout.current = setTimeout(() => {
        setPanelOpen(false)
        setActiveIndex(-1)
      }, 150)
      onBlur?.(e)
    },
    [onBlur]
  )

  const pickOption = useCallback(
    (option: string) => {
      clearBlurTimeout()
      setValue(option)
      onSelect?.(option)
      setPanelOpen(false)
      setActiveIndex(-1)
    },
    [onSelect, setValue]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (showDropdownPanel && e.key === 'Escape') {
        e.preventDefault()
        setPanelOpen(false)
        setActiveIndex(-1)
        return
      }
      if (showDropdownPanel && hasResults) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setActiveIndex(i => (i + 1 >= filtered.length ? 0 : i + 1))
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setActiveIndex(i => (i <= 0 ? filtered.length - 1 : i - 1))
          return
        }
        if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < filtered.length) {
          e.preventDefault()
          pickOption(filtered[activeIndex]!)
          return
        }
      }
      onKeyDown?.(e)
    },
    [activeIndex, filtered, hasResults, onKeyDown, pickOption, showDropdownPanel]
  )

  const wrapStyle: CSSProperties = {
    position: 'relative',
    width: width != null ? (typeof width === 'number' ? `${width}px` : width) : '100%',
    ...style,
  }

  const wrapClassName = ['cms-input-search', className].filter(Boolean).join(' ')

  return (
    <div style={wrapStyle} className={wrapClassName}>
      <CmsInput
        ref={ref}
        {...cmsInputProps}
        width="100%"
        disabled={disabled}
        readOnly={readOnly}
        value={value}
        role="combobox"
        aria-expanded={showDropdownPanel}
        aria-controls={showDropdownPanel ? listId : undefined}
        aria-autocomplete="list"
        onChange={e => {
          setValue(e.target.value)
          setPanelOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      {showDropdownPanel ? (
        hasResults ? (
          <ul id={listId} role="listbox" style={listPanelStyle}>
            {filtered.map((opt, idx) => (
              <li
                key={idx}
                role="option"
                aria-selected={idx === activeIndex}
                style={rowStyle(idx === activeIndex)}
                onMouseDown={e => {
                  e.preventDefault()
                  pickOption(opt)
                }}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                {renderMatchHighlight(opt, value)}
              </li>
            ))}
          </ul>
        ) : (
          <div id={listId} role="status" aria-live="polite" style={emptyPanelStyle}>
            검색 결과가 없습니다.
          </div>
        )
      ) : null}
    </div>
  )
})

CmsInputSearch.displayName = 'CmsInputSearch'
