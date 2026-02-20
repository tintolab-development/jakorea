/**
 * 수정 모드 진입 시 탭 안쪽(폼/에디터)으로 오토 포커스되는 것을 막고, 버튼에 포커스 유지
 */

import { useLayoutEffect } from 'react'

const GUARD_MS = 3500

export function useEditModeFocusRestore(
  isEditMode: boolean,
  editButtonRef: React.RefObject<HTMLButtonElement | null>,
  contentRef: React.RefObject<HTMLDivElement | null>
) {
  useLayoutEffect(() => {
    if (!isEditMode) return

    const bringBackFocus = () => {
      editButtonRef.current?.focus({ preventScroll: true })
    }
    bringBackFocus()

    const el = contentRef.current
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (editButtonRef.current && el?.contains(target)) {
        bringBackFocus()
      }
    }
    el?.addEventListener('focusin', onFocusIn, true)
    const stop = setTimeout(() => el?.removeEventListener('focusin', onFocusIn, true), GUARD_MS)

    const interval = setInterval(bringBackFocus, 100)
    const stopInterval = setTimeout(() => clearInterval(interval), GUARD_MS)

    return () => {
      el?.removeEventListener('focusin', onFocusIn, true)
      clearTimeout(stop)
      clearInterval(interval)
      clearTimeout(stopInterval)
    }
  }, [isEditMode, editButtonRef, contentRef])
}
