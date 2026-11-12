/**
 * QA-0137 새로고침 세션 복원 실패 안내.
 * - session-ended: 공통 Alert 모달 [확인]. ProtectedRoute가 `/login?redirect=…`로 보내므로 로그인 화면 위에 뜬다.
 * - unreachable: 로딩 화면("로그인 정보 확인 중") 위 확인 모달 [닫기] [다시 시도].
 */
import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  BOOTSTRAP_SESSION_ENDED_NOTICE,
  BOOTSTRAP_SESSION_UNREACHABLE_NOTICE,
} from '@/features/auth/model/bootstrap-session-notice-copy'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'

export function BootstrapSessionNotice() {
  const notice = useAuthStore(state => state.bootstrapNotice)
  const retrying = useAuthStore(state => state.bootstrapRetrying)
  const { showAlert } = useCmsAlert()

  useEffect(() => {
    if (notice !== 'session-ended') return
    showAlert({
      title: BOOTSTRAP_SESSION_ENDED_NOTICE.title,
      content: BOOTSTRAP_SESSION_ENDED_NOTICE.content,
      confirmLabel: BOOTSTRAP_SESSION_ENDED_NOTICE.confirmLabel,
    })
    useAuthStore.getState().clearBootstrapNotice()
  }, [notice, showAlert])

  return (
    <ConfirmModal
      open={notice === 'unreachable'}
      title={BOOTSTRAP_SESSION_UNREACHABLE_NOTICE.title}
      content={BOOTSTRAP_SESSION_UNREACHABLE_NOTICE.content}
      cancelText={BOOTSTRAP_SESSION_UNREACHABLE_NOTICE.cancelLabel}
      confirmText={BOOTSTRAP_SESSION_UNREACHABLE_NOTICE.retryLabel}
      confirmLoading={retrying}
      onCancel={() => useAuthStore.getState().dismissBootstrapUnreachable()}
      onConfirm={() => {
        void useAuthStore.getState().retryBootstrapRestore()
      }}
    />
  )
}
