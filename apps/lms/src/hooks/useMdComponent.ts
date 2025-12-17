/**
 * M3 웹 컴포넌트와 React 통합을 위한 헬퍼 훅
 * react-hook-form Controller와 함께 사용
 */

import { useEffect, useRef } from 'react'

export function useMdComponent<T extends HTMLElement>(
  value: string | number | boolean | undefined,
  onChange?: (value: string | number | boolean) => void
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // 값 설정
    if (value !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const elementAny = element as any
      if ('value' in elementAny) {
        elementAny.value = value
      } else if ('checked' in elementAny) {
        elementAny.checked = value
      }
    }

    // 이벤트 리스너
    if (onChange) {
      const handleChange = (e: Event) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const target = e.target as any
        const newValue = 'value' in target ? target.value : target.checked
        onChange(newValue)
      }

      element.addEventListener('change', handleChange)
      element.addEventListener('input', handleChange)

      return () => {
        element.removeEventListener('change', handleChange)
        element.removeEventListener('input', handleChange)
      }
    }
  }, [value, onChange])

  return ref
}
