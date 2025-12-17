/**
 * Material Design 3 Select React Wrapper
 * M3 컴포넌트를 직접 import하여 사용
 * 겹침 문제 및 선택 안됨 문제 해결을 위해 처음부터 재구성
 * 여러 Select가 있을 때 하나만 열리도록 처리
 */

// M3 Select 컴포넌트 import
import '@material/web/select/outlined-select.js'
import '@material/web/select/select-option.js'

import { createElement, useEffect, useRef, useCallback } from 'react'
import './MdSelect.css'

interface MdSelectProps {
  label: string
  value?: string
  onChange?: (value: string) => void
  required?: boolean
  error?: boolean
  errorText?: string
  disabled?: boolean
  children: React.ReactNode
}

interface MdSelectElement extends HTMLElement {
  value: string
  disabled: boolean
  required: boolean
  error: boolean
  errorText: string
  label: string
  open: boolean
  addEventListener(type: 'change' | 'opening', listener: (event: Event) => void): void
  removeEventListener(type: 'change' | 'opening', listener: (event: Event) => void): void
}

// 전역: 현재 열린 Select 요소들을 추적
const openSelects = new Set<MdSelectElement>()

export default function MdSelect({
  label,
  value = '',
  onChange,
  required = false,
  error = false,
  errorText,
  disabled = false,
  children,
}: MdSelectProps) {
  const selectRef = useRef<MdSelectElement | null>(null)
  const onChangeRef = useRef(onChange)

  // onChange ref 업데이트 (의존성 배열 방지)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // 값 변경 핸들러
  const handleChange = useCallback((e: Event) => {
    const target = e.target as MdSelectElement
    onChangeRef.current?.(target.value)
  }, [])

  // Select 요소 연결 및 이벤트 리스너 설정
  useEffect(() => {
    const select = selectRef.current
    if (!select) return

    // 이벤트 리스너 등록
    select.addEventListener('change', handleChange)

    // 열림 이벤트 핸들러: 다른 Select 닫기
    const handleOpening = () => {
      // 다른 모든 Select 닫기
      openSelects.forEach(otherSelect => {
        if (otherSelect !== select && otherSelect.open) {
          otherSelect.open = false
        }
      })
      // 현재 Select를 열린 목록에 추가
      openSelects.add(select)
    }

    select.addEventListener('opening', handleOpening)

    // MutationObserver로 open 속성 변경 감지 (M3 Select의 close 이벤트가 없을 수 있음)
    const observer = new MutationObserver(() => {
      if (!select.open) {
        openSelects.delete(select)
      }
    })
    observer.observe(select, {
      attributes: true,
      attributeFilter: ['open'],
    })

    return () => {
      select.removeEventListener('change', handleChange)
      select.removeEventListener('opening', handleOpening)
      observer.disconnect()
      openSelects.delete(select)
    }
  }, [handleChange])

  // value 동기화
  useEffect(() => {
    const select = selectRef.current
    if (!select) return

    if (value !== undefined && select.value !== value) {
      select.value = value
    }
  }, [value])

  // 속성 동기화
  useEffect(() => {
    const select = selectRef.current
    if (!select) return

    if (disabled !== undefined) {
      select.disabled = disabled
    }
    if (required !== undefined) {
      select.required = required
    }
    if (error !== undefined) {
      select.error = error
    }
    if (errorText !== undefined) {
      select.errorText = errorText
    }
    if (label !== undefined) {
      select.label = label
    }
  }, [disabled, required, error, errorText, label])

  // ref 콜백을 통한 요소 연결
  const setSelectRef = useCallback(
    (element: HTMLElement | null) => {
      if (element) {
        selectRef.current = element as MdSelectElement
        // 초기 속성 설정
        const select = element as MdSelectElement
        if (value !== undefined) select.value = value
        select.disabled = disabled
        select.required = required
        select.error = error
        if (errorText !== undefined) select.errorText = errorText
        select.label = label
      } else {
        selectRef.current = null
      }
    },
    [value, disabled, required, error, errorText, label]
  )

  return createElement(
    'md-outlined-select',
    {
      ref: setSelectRef,
      label: label || '',
      'data-label': label || '',
    },
    children
  )
}
