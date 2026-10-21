import { useLayoutEffect } from 'react'
import { getCmsAuthUrl } from '@/features/auth/lib/cms-auth-url'

interface CmsAuthRedirectProps {
  /** CMS 경로. 예: `/find-email` */
  to: string
}

/** Admin 플레이스홀더 대신 CMS Auth 화면으로 보낸다. */
export function CmsAuthRedirect({ to }: CmsAuthRedirectProps) {
  useLayoutEffect(() => {
    window.location.replace(`${getCmsAuthUrl(to)}${window.location.search}`)
  }, [to])

  return null
}
