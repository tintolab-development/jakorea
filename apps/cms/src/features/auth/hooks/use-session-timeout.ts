/**
 * 세션 타임아웃 관리 Hook
 * Phase 0.5.5: 세션/접근 통제 UX (NFR-SEC-AUT-02)
 * 세션 만료 경고 및 자동 로그아웃 관리
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { SESSION_POLICY } from '@/shared/constants/session-policy'
import { useAuthStore } from '@/features/auth/model/auth-store'

/**
 * 세션 타임아웃 관리 Hook
 */
export function useSessionTimeout() {
  const { isAuthenticated, logout } = useAuthStore()
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [lastActivityTime, setLastActivityTime] = useState<number>(() => Date.now())

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /**
   * 세션 연장
   */
  const extendSession = useCallback(() => {
    setShowWarning(false)
    setCountdown(0)
    setLastActivityTime(Date.now())

    // 타이머 재설정
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
    }
    if (expireTimerRef.current) {
      clearTimeout(expireTimerRef.current)
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
    }
  }, [])

  /**
   * 타이머 초기화
   */
  const resetTimers = useCallback(() => {
    // 기존 타이머 정리
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
    }
    if (expireTimerRef.current) {
      clearTimeout(expireTimerRef.current)
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
    }

    if (!isAuthenticated) {
      return
    }

    const now = Date.now()
    const idleTime = now - lastActivityTime
    const remainingIdleTime = SESSION_POLICY.maxIdleMinutes * 60 * 1000 - idleTime

    // 경고 타이머 설정 (만료 5분 전)
    if (remainingIdleTime > SESSION_POLICY.warningBeforeExpireMinutes * 60 * 1000) {
      const timeUntilWarning =
        remainingIdleTime - SESSION_POLICY.warningBeforeExpireMinutes * 60 * 1000
      warningTimerRef.current = setTimeout(() => {
        setShowWarning(true)
        setCountdown(SESSION_POLICY.warningBeforeExpireMinutes * 60) // 초 단위

        // 카운트다운 시작
        countdownTimerRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current)
              }
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }, timeUntilWarning)
    } else if (remainingIdleTime > 0) {
      // 이미 경고 시간이 지났지만 아직 만료되지 않은 경우
      setShowWarning(true)
      const remainingSeconds = Math.ceil(remainingIdleTime / 1000)
      setCountdown(remainingSeconds)

      // 카운트다운 시작
      countdownTimerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    // 만료 타이머 설정
    if (remainingIdleTime > 0) {
      expireTimerRef.current = setTimeout(() => {
        logout()
        setShowWarning(false)
        setCountdown(0)
      }, remainingIdleTime)
    } else {
      // 이미 만료 시간이 지난 경우 즉시 로그아웃
      logout()
    }
  }, [isAuthenticated, lastActivityTime, logout])

  /**
   * 사용자 활동 감지
   */
  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false)
      setCountdown(0)
      return
    }

    const handleActivity = () => {
      setLastActivityTime(Date.now())
    }

    // 사용자 활동 이벤트 리스너 등록
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // 초기 타이머 설정
    resetTimers()

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current)
      }
      if (expireTimerRef.current) {
        clearTimeout(expireTimerRef.current)
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
      }
    }
  }, [isAuthenticated, resetTimers])

  /**
   * 활동 시간이 변경될 때마다 타이머 재설정
   */
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    // 활동 시간이 변경될 때마다 타이머 재설정 (디바운스)
    const timeoutId = setTimeout(() => {
      resetTimers()
    }, 1000) // 1초 디바운스

    return () => clearTimeout(timeoutId)
  }, [lastActivityTime, isAuthenticated, resetTimers])

  return {
    showWarning,
    countdown,
    extendSession,
  }
}
