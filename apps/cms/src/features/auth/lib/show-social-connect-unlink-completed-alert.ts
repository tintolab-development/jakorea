import {
  SOCIAL_CONNECT_UNLINK_COMPLETE_CONTENT,
  SOCIAL_CONNECT_UNLINK_COMPLETE_TITLE,
} from '@/features/auth/lib/social-connect-unlink-copy'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

export function showSocialConnectUnlinkCompletedAlert(): void {
  cmsAlertModal.show({
    title: SOCIAL_CONNECT_UNLINK_COMPLETE_TITLE,
    content: SOCIAL_CONNECT_UNLINK_COMPLETE_CONTENT,
    confirmLabel: '확인',
  })
}
