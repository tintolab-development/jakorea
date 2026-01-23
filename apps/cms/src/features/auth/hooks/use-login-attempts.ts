/**
 * 로그인 시도 관리 Hook
 * Phase 0.5.5: 세션/접근 통제 UX (NFR-SEC-AUT-02)
 * 로그인 실패 횟수 추적 및 계정 잠금 관리
 */

import { useState, useCallback, useEffect } from 'react'
import { LOGIN_POLICY } from '@/shared/constants/login-policy'

const STORAGE_KEY = 'login_failed_attempts'
const LOCK_UNTIL_KEY = 'login_lock_until'

interface LoginAttemptsState {
  failedAttempts: number
  isLocked: boolean
  lockUntil: Date | null
}

/**
 * 로그인 시도 관리 Hook
 */
export function useLoginAttempts() {
  // localStorage에서 초기 상태 복원
  const loadState = (): LoginAttemptsState => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {
        failedAttempts: 0,
        isLocked: false,
        lockUntil: null,
      }
    }

    const storedAttempts = localStorage.getItem(STORAGE_KEY)
    const storedLockUntil = localStorage.getItem(LOCK_UNTIL_KEY)

    const failedAttempts = storedAttempts ? parseInt(storedAttempts, 10) : 0
    const lockUntil = storedLockUntil ? new Date(storedLockUntil) : null

    // 잠금 시간이 지났는지 확인
    if (lockUntil && lockUntil <= new Date()) {
      // 잠금 시간이 지났으면 초기화
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(LOCK_UNTIL_KEY)
      return {
        failedAttempts: 0,
        isLocked: false,
        lockUntil: null,
      }
    }

    return {
      failedAttempts,
      isLocked: lockUntil !== null && lockUntil > new Date(),
      lockUntil,
    }
  }

  const [state, setState] = useState<LoginAttemptsState>(loadState)

  // 잠금 상태 주기적 확인
  useEffect(() => {
    if (!state.isLocked || !state.lockUntil) {
      return
    }

    const checkLock = () => {
      if (state.lockUntil && state.lockUntil <= new Date()) {
        // 잠금 시간이 지났으면 초기화
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(LOCK_UNTIL_KEY)
        setState({
          failedAttempts: 0,
          isLocked: false,
          lockUntil: null,
        })
      }
    }

    const interval = setInterval(checkLock, 1000) // 1초마다 확인

    return () => clearInterval(interval)
  }, [state.isLocked, state.lockUntil])

  /**
   * 로그인 실패 처리
   */
  const recordFailure = useCallback(() => {
    const newAttempts = state.failedAttempts + 1
    let isLocked = state.isLocked
    let lockUntil = state.lockUntil

    // 최대 실패 횟수 초과 시 잠금
    if (newAttempts >= LOGIN_POLICY.maxFailedAttempts) {
      isLocked = true
      lockUntil = new Date(Date.now() + LOGIN_POLICY.lockoutDurationMinutes * 60 * 1000)

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, newAttempts.toString())
        localStorage.setItem(LOCK_UNTIL_KEY, lockUntil.toISOString())
      }
    } else {
      // 잠금되지 않은 경우에만 실패 횟수 저장
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, newAttempts.toString())
      }
    }

    setState({
      failedAttempts: newAttempts,
      isLocked,
      lockUntil,
    })
  }, [state.failedAttempts, state.isLocked, state.lockUntil])

  /**
   * 로그인 성공 처리 (실패 횟수 초기화)
   */
  const recordSuccess = useCallback(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(LOCK_UNTIL_KEY)
    }

    setState({
      failedAttempts: 0,
      isLocked: false,
      lockUntil: null,
    })
  }, [])

  /**
   * 잠금 상태 확인
   */
  const checkLocked = useCallback((): boolean => {
    if (!state.isLocked || !state.lockUntil) {
      return false
    }

    // 잠금 시간이 지났는지 확인
    if (state.lockUntil <= new Date()) {
      recordSuccess() // 자동으로 잠금 해제
      return false
    }

    return true
  }, [state.isLocked, state.lockUntil, recordSuccess])

  /**
   * 남은 잠금 시간 (분) 계산
   */
  const getRemainingLockMinutes = useCallback((): number | null => {
    if (!state.isLocked || !state.lockUntil) {
      return null
    }

    const remaining = state.lockUntil.getTime() - Date.now()
    if (remaining <= 0) {
      return null
    }

    return Math.ceil(remaining / (60 * 1000))
  }, [state.isLocked, state.lockUntil])

  return {
    failedAttempts: state.failedAttempts,
    isLocked: state.isLocked,
    lockUntil: state.lockUntil,
    recordFailure,
    recordSuccess,
    checkLocked,
    getRemainingLockMinutes,
  }
}
