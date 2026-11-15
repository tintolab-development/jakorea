/**
 * 새로고침 세션 복원 안내(3초 안에 확인하지 못함·네트워크·서버 오류) — 복원 로딩 화면 위에 띄운다 (QA-0137).
 * 시안 「네트워크 오류 안내」(16898-166096) 공통 Alert — [확인] 하나.
 * [확인]·X: refresh 수단·저장된 사용자를 지우지 않고 로그인 화면으로. 로그인 화면의 기존 `redirect` 파라미터에
 * 지금 경로를 넘겨, 진행 중 refresh가 늦게 성공하면 로그인 화면이 원래 화면으로 돌려보낸다.
 */
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { SESSION_RESTORE_NETWORK_FAILURE_NOTICE } from '@/features/auth/lib/session-restore-notice'
import { AlertModal } from '@/shared/ui/alert-modal'

export function ReloadRestoreFailureModal() {
  const navigate = useNavigate()
  const location = useLocation()
  const restoreFailure = useAuthStore(state => state.restoreFailure)

  const leaveToLogin = () => {
    const current = `${location.pathname}${location.search}`
    navigate(`/login?redirect=${encodeURIComponent(current)}`, { replace: true })
    useAuthStore.getState().leaveReloadRestoreToLogin()
  }

  return (
    <AlertModal
      open={restoreFailure === 'network'}
      title={SESSION_RESTORE_NETWORK_FAILURE_NOTICE.title}
      content={SESSION_RESTORE_NETWORK_FAILURE_NOTICE.content}
      confirmLabel={SESSION_RESTORE_NETWORK_FAILURE_NOTICE.confirmLabel}
      onClose={leaveToLogin}
    />
  )
}
