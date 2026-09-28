/**
 * 목록 필터 영역 텍스트 인풋.
 *
 * 키마다 페이지 setState → 테이블/DnD 동기 리렌더가 나지 않도록,
 * 표시는 로컬 state, 부모로는 `patchPendingFilters`(ref-only)로만 넘긴다.
 * Enter/Blur에서는 같은 경로로 최신 값을 flush한다.
 */

import { memo, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { CmsInput, type CmsInputProps } from './cms-input'

export type AdminFilterTextInputProps = Omit<CmsInputProps, 'value' | 'onChange'> & {
  /** URL sync 등으로 내려오는 값. 타이핑 중에는 로컬이 SSOT. */
  value: string
  /** 권장: useListFilterUrl().patchPendingFilters 로 연결 */
  onChange: (value: string) => void
}

export const AdminFilterTextInput = memo(function AdminFilterTextInput({
  value,
  onChange,
  onPressEnter,
  onBlur,
  ...rest
}: AdminFilterTextInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const localRef = useRef(value)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (value === localRef.current) return
    localRef.current = value
    setLocalValue(value)
  }, [value])

  const emit = (next: string) => {
    localRef.current = next
    onChangeRef.current(next)
  }

  return (
    <CmsInput
      {...rest}
      value={localValue}
      onChange={e => {
        const next = e.target.value
        localRef.current = next
        setLocalValue(next)
        onChangeRef.current(next)
      }}
      onPressEnter={e => {
        emit(localRef.current)
        onPressEnter?.(e as KeyboardEvent<HTMLInputElement>)
      }}
      onBlur={e => {
        emit(localRef.current)
        onBlur?.(e)
      }}
    />
  )
})

AdminFilterTextInput.displayName = 'AdminFilterTextInput'
