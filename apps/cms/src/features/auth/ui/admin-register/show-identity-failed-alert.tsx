import { cmsAlertModal } from '@/shared/ui'

/** 「본인인증 실패」 안내 (시안 4776-125406) — 본인인증 단계·첫 로그인 본인인증 확정 공통 */
export function showIdentityVerificationFailedAlert(): void {
  cmsAlertModal.show({
    title: '본인인증 실패',
    content: (
      <>
        본인인증을 완료하지 못했습니다.
        <br />
        정보를 확인한 뒤 다시 시도해 주세요.
      </>
    ),
    width: 600,
    confirmLabel: '확인',
  })
}
