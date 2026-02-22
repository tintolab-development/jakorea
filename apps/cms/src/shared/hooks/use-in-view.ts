/**
 * IntersectionObserver로 요소가 뷰포트에 들어왔는지 감지
 * 무한 스크롤 등에서 사용
 */

import { useEffect, useRef, useState } from 'react'

export interface UseInViewOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number
  triggerOnce?: boolean
}

export function useInView(options: UseInViewOptions = {}) {
  const { root = null, rootMargin = '0px', threshold = 0, triggerOnce = false } = options
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isInView = entry.isIntersecting
        setInView(isInView)
        if (isInView && triggerOnce && el) {
          observer.unobserve(el)
        }
      },
      { root, rootMargin, threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [root, rootMargin, threshold, triggerOnce])

  return { ref, inView }
}
