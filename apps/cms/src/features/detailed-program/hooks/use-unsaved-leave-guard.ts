import { useCallback, useEffect, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'

/**
 * 미저장 변경이 있을 때 메뉴·다른 페이지 이동(pathname)과 취소 액션을 막는다.
 * 같은 경로의 search 변경(필터)은 차단하지 않는다.
 */
export function useUnsavedLeaveGuard(shouldBlock: () => boolean) {
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const pendingConfirmRef = useRef<(() => void) | null>(null)
  const shouldBlockRef = useRef(shouldBlock)
  shouldBlockRef.current = shouldBlock

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (currentLocation.pathname === nextLocation.pathname) return false
    return shouldBlockRef.current()
  })

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    setLeaveConfirmOpen(true)
  }, [blocker])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!shouldBlockRef.current()) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  const requestLeave = useCallback((onConfirm: () => void) => {
    if (!shouldBlockRef.current()) {
      onConfirm()
      return
    }
    pendingConfirmRef.current = onConfirm
    setLeaveConfirmOpen(true)
  }, [])

  const confirmLeave = useCallback(() => {
    setLeaveConfirmOpen(false)
    const local = pendingConfirmRef.current
    pendingConfirmRef.current = null
    local?.()
    if (blocker.state === 'blocked') {
      blocker.proceed()
    }
  }, [blocker])

  const cancelLeave = useCallback(() => {
    setLeaveConfirmOpen(false)
    pendingConfirmRef.current = null
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }, [blocker])

  return {
    leaveConfirmOpen,
    requestLeave,
    confirmLeave,
    cancelLeave,
  }
}
