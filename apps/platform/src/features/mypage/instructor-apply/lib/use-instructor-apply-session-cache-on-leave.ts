import { useEffect } from 'react'
import {
  clearInstructorApplySessionCache,
  isInstructorApplyFlowPath,
} from './instructor-apply-session-cache'

/**
 * 강사 신청·동의서 작성 화면을 벗어날 때 session draft를 제거한다.
 * 신청 ↔ 동의서 하위 경로 이동은 유지(언마운트 직후 pathname으로 판별).
 */
export function useInstructorApplySessionCacheOnLeave(): void {
  useEffect(() => {
    return () => {
      window.setTimeout(() => {
        if (!isInstructorApplyFlowPath(window.location.pathname)) {
          clearInstructorApplySessionCache()
        }
      }, 0)
    }
  }, [])
}
