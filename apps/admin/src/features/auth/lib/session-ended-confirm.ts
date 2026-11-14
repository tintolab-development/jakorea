/**
 * 세션 종료 확인 흐름 (CMS `features/auth/lib/session-ended-confirm.ts`와 같은 방식).
 * 서버가 세션 무효를 확정하면 지금 화면에 머문 채 「로그인이 종료되었어요.」 안내를 띄우고,
 * 사용자가 [확인](또는 X·바깥 클릭·Esc)으로 닫을 때 로그아웃한다. 로그아웃 뒤 ProtectedRoute가 원래 경로를 redirect로 넘겨 로그인 화면으로 보낸다.
 * 여러 요청·경로가 동시에 세션 종료를 알려도 안내는 한 번, 로그아웃도 한 번만 한다.
 * 공통 Alert를 쓸 수 없으면(Provider 마운트 전) 바로 로그아웃하고, onUnavailable로 로그인 화면 안내를 남긴다.
 */
import { BOOTSTRAP_SESSION_ENDED_NOTICE } from '@/features/auth/model/bootstrap-session-notice-copy'
import { cmsAlertModal, isCmsAlertModalReady } from '@/shared/ui/cms-alert-modal-api'

let pending = false

/** 세션 종료 안내가 떠 있고 사용자의 확인을 기다리는 중인지 (이 동안 refresh·Activity를 다시 시도하지 않는다) */
export function isSessionEndConfirmPending(): boolean {
  return pending
}

export function confirmSessionEnded(
  endSession: () => void,
  options?: { onUnavailable?: () => void },
): void {
  if (pending) return
  if (!isCmsAlertModalReady()) {
    endSession()
    options?.onUnavailable?.()
    return
  }
  pending = true
  let finished = false
  const finish = () => {
    if (finished) return
    finished = true
    pending = false
    endSession()
  }
  cmsAlertModal.show({
    title: BOOTSTRAP_SESSION_ENDED_NOTICE.title,
    content: BOOTSTRAP_SESSION_ENDED_NOTICE.content,
    confirmLabel: BOOTSTRAP_SESSION_ENDED_NOTICE.confirmLabel,
    exclusive: true,
    onConfirm: finish,
    onDismiss: finish,
  })
}

/** @internal 테스트 전용 */
export function resetSessionEndConfirmForTest(): void {
  pending = false
}
