/**
 * 세션 종료 확인 흐름.
 * 서버가 세션 무효를 확정하면 지금 화면에 머문 채 「로그인이 종료되었어요.」 안내를 띄우고,
 * 사용자가 [확인](또는 X·바깥 클릭·Esc)으로 닫을 때 로그아웃한다.
 * 여러 요청·경로가 동시에 세션 종료를 알려도 안내는 한 번, 로그아웃도 한 번만 한다.
 * 공통 Alert를 쓸 수 없으면(Provider 마운트 전) 기존처럼 로그인 화면이 안내하도록 표시를 남기고 바로 로그아웃한다.
 */
import { cmsAlertModal, isCmsAlertModalReady } from '@/shared/ui/cms-alert-modal-api'
import { SESSION_ENDED_NOTICE, markSessionEndedNotice } from './session-restore-notice'

let pending = false

/** 세션 종료 안내가 떠 있고 사용자의 확인을 기다리는 중인지 (이 동안 refresh·Activity를 다시 시도하지 않는다) */
export function isSessionEndConfirmPending(): boolean {
  return pending
}

export function confirmSessionEnded(endSession: () => void): void {
  if (pending) return
  if (!isCmsAlertModalReady()) {
    markSessionEndedNotice()
    endSession()
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
    title: SESSION_ENDED_NOTICE.title,
    content: SESSION_ENDED_NOTICE.content,
    exclusive: true,
    onConfirm: finish,
    onDismiss: finish,
  })
}

/** @internal 테스트 전용 */
export function resetSessionEndConfirmForTest(): void {
  pending = false
}
