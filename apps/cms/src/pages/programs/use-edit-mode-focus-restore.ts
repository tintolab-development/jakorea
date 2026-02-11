/**
 * 수정 모드 진입 시 포커스/스크롤 복원
 * 탭 안쪽(폼/에디터)으로 오토 포커스되는 것을 막고, 버튼에 포커스를 유지하며 스크롤 위치를 복원
 */

import { useLayoutEffect, useRef } from 'react'

export function useEditModeFocusRestore(
  isEditMode: boolean,
  editButtonRef: React.RefObject<HTMLButtonElement | null>,
  contentRef: React.RefObject<HTMLDivElement | null>
) {
  const scrollYRef = useRef(0)

  useLayoutEffect(() => {
    if (!isEditMode) return

    scrollYRef.current = window.scrollY

    const bringBackFocus = () => {
      editButtonRef.current?.focus({ preventScroll: true })
      window.scrollTo({ top: scrollYRef.current, left: window.scrollX, behavior: 'auto' })
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
    const stop = setTimeout(() => el?.removeEventListener('focusin', onFocusIn, true), 2000)

    const interval = setInterval(bringBackFocus, 100)
    const stopInterval = setTimeout(() => clearInterval(interval), 2000)

    return () => {
      el?.removeEventListener('focusin', onFocusIn, true)
      clearTimeout(stop)
      clearInterval(interval)
      clearTimeout(stopInterval)
    }
  }, [isEditMode, editButtonRef, contentRef])
}
