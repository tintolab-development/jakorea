/**
 * 로그인 시도 관리 Hook (5회 실패 → 30분 잠금)
 */

import { useState, useCallback, useEffect } from 'react'
import { LOGIN_POLICY } from '@/shared/constants/login-policy'
import {
  LOGIN_FAILED_ATTEMPTS_KEY,
  LOGIN_LOCK_UNTIL_KEY,
} from '@/features/auth/model/auth-storage'

interface LoginAttemptsState {
  failedAttempts: number
  isLocked: boolean
  lockUntil: Date | null
}

export function useLoginAttempts() {
  const loadState = (): LoginAttemptsState => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {
        failedAttempts: 0,
        isLocked: false,
        lockUntil: null,
      }
    }

    const storedAttempts = localStorage.getItem(LOGIN_FAILED_ATTEMPTS_KEY)
    const storedLockUntil = localStorage.getItem(LOGIN_LOCK_UNTIL_KEY)

    const failedAttempts = storedAttempts ? parseInt(storedAttempts, 10) : 0
    const lockUntil = storedLockUntil ? new Date(storedLockUntil) : null

    if (lockUntil && lockUntil <= new Date()) {
      localStorage.removeItem(LOGIN_FAILED_ATTEMPTS_KEY)
      localStorage.removeItem(LOGIN_LOCK_UNTIL_KEY)
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

  useEffect(() => {
    if (!state.isLocked || !state.lockUntil) {
      return
    }

    const checkLock = () => {
      if (state.lockUntil && state.lockUntil <= new Date()) {
        localStorage.removeItem(LOGIN_FAILED_ATTEMPTS_KEY)
        localStorage.removeItem(LOGIN_LOCK_UNTIL_KEY)
        setState({
          failedAttempts: 0,
          isLocked: false,
          lockUntil: null,
        })
      }
    }

    const interval = setInterval(checkLock, 1000)
    return () => clearInterval(interval)
  }, [state.isLocked, state.lockUntil])

  const recordFailure = useCallback(() => {
    const newAttempts = state.failedAttempts + 1
    let isLocked = state.isLocked
    let lockUntil = state.lockUntil

    if (newAttempts >= LOGIN_POLICY.maxFailedAttempts) {
      isLocked = true
      lockUntil = new Date(Date.now() + LOGIN_POLICY.lockoutDurationMinutes * 60 * 1000)

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(LOGIN_FAILED_ATTEMPTS_KEY, newAttempts.toString())
        localStorage.setItem(LOGIN_LOCK_UNTIL_KEY, lockUntil.toISOString())
      }
    } else if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(LOGIN_FAILED_ATTEMPTS_KEY, newAttempts.toString())
    }

    setState({
      failedAttempts: newAttempts,
      isLocked,
      lockUntil,
    })
  }, [state.failedAttempts, state.isLocked, state.lockUntil])

  const recordSuccess = useCallback(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(LOGIN_FAILED_ATTEMPTS_KEY)
      localStorage.removeItem(LOGIN_LOCK_UNTIL_KEY)
    }

    setState({
      failedAttempts: 0,
      isLocked: false,
      lockUntil: null,
    })
  }, [])

  const checkLocked = useCallback((): boolean => {
    if (!state.isLocked || !state.lockUntil) {
      return false
    }

    if (state.lockUntil <= new Date()) {
      recordSuccess()
      return false
    }

    return true
  }, [state.isLocked, state.lockUntil, recordSuccess])

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
