import { useEffect, useState, type RefObject } from 'react'

type UseIntersectionObserverOptions = IntersectionObserverInit & {
  enabled?: boolean
}

export function useIntersectionObserver(
  targetRef: RefObject<Element | null>,
  options: UseIntersectionObserverOptions = {},
): boolean {
  const { enabled = true, ...observerOptions } = options
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setIsIntersecting(false)
      return
    }

    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, observerOptions)

    observer.observe(target)
    return () => observer.disconnect()
  }, [
    enabled,
    targetRef,
    observerOptions.root,
    observerOptions.rootMargin,
    observerOptions.threshold,
  ])

  return isIntersecting
}
