/**
 * 인증 컨텍스트 (FSD: shared는 features에 의존하지 않음)
 * 앱 레이어에서 AuthContextProvider로 값을 주입합니다.
 */

import { createContext, useContext, type ReactNode } from 'react'
import type { MfaState } from '@/types/mfa'
import type { User } from '@/types/user'

/** shared에서 사용하는 사용자 타입 (비밀번호 제외, types/user와 호환) */
export type AuthUser = Omit<User, 'password'>

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  loading: boolean
  checkAuth: () => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<AuthUser>) => void
  requiresMfa: boolean
  mfaState: MfaState | null
  /** 토큰 만료 시각(ISO 문자열). null이면 미저장 */
  expiresAt: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthContextProvider({
  value,
  children,
}: {
  value: AuthContextValue
  children: ReactNode
}) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (value == null) {
    throw new Error('useAuth must be used within AuthContextProvider')
  }
  return value
}

export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext)
}
