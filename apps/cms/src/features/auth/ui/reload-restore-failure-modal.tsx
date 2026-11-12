/**
 * 새로고침 세션 복원 안내(3초 안에 확인하지 못함·네트워크·서버 오류) — 복원 로딩 화면 위에 띄운다 (QA-0137).
 * 공통 확인 모달(ConfirmModal) 그대로 쓴다.
 * - [다시 시도]: 진행 중 refresh가 있으면 합류, 없으면 탭 간 잠금 아래 1회 시작.
 * - [닫기]: refresh 수단·저장된 사용자를 지우지 않고 로그인 화면으로. 로그인 화면의 기존 `redirect` 파라미터에
 *   지금 경로를 넘겨, 진행 중 refresh가 늦게 성공하면 로그인 화면이 원래 화면으로 돌려보낸다.
 */
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { SESSION_RESTORE_NETWORK_FAILURE_NOTICE } from '@/features/auth/lib/session-restore-notice'
import { ConfirmModal } from '@/shared/ui'

export function ReloadRestoreFailureModal() {
  const navigate = useNavigate()
  const location = useLocation()
  const restoreFailure = useAuthStore(state => state.restoreFailure)
  const restoreRetrying = useAuthStore(state => state.restoreRetrying)

  const leaveToLogin = () => {
    const current = `${location.pathname}${location.search}`
    navigate(`/login?redirect=${encodeURIComponent(current)}`, { replace: true })
    useAuthStore.getState().leaveReloadRestoreToLogin()
  }

  return (
    <ConfirmModal
      open={restoreFailure === 'network' || restoreRetrying}
      title={SESSION_RESTORE_NETWORK_FAILURE_NOTICE.title}
      content={SESSION_RESTORE_NETWORK_FAILURE_NOTICE.content}
      cancelText={SESSION_RESTORE_NETWORK_FAILURE_NOTICE.cancelLabel}
      confirmText={SESSION_RESTORE_NETWORK_FAILURE_NOTICE.retryLabel}
      confirmLoading={restoreRetrying}
      onCancel={leaveToLogin}
      onConfirm={() => {
        void useAuthStore.getState().retryReloadRestore()
      }}
    />
  )
}
