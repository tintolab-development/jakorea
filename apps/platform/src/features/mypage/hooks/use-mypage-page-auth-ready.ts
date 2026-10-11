import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAccessToken,
  getDevAuthLoggedIn,
  isRemoteApiConfigured,
  resolveLoginRequiredPath,
} from '@/shared/lib'

/**
 * 마이페이지 서브 라우트 공통: remote 토큰 또는 dev mock 로그인 확인 후 렌더 허용.
 */
export function useMypagePageAuthReady(loginReturnPath: string): boolean {
  const navigate = useNavigate()
  const [isAuthReady, setIsAuthReady] = useState(false)

  useEffect(() => {
    const hasRemoteToken = isRemoteApiConfigured() && Boolean(getAccessToken())
    if (hasRemoteToken) {
      setIsAuthReady(true)
      return
    }

    if (!getDevAuthLoggedIn()) {
      navigate(resolveLoginRequiredPath(loginReturnPath))
      return
    }

    setIsAuthReady(true)
  }, [loginReturnPath, navigate])

  return isAuthReady
}
