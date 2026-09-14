import {
  SYSTEM_MANUAL_SEND_QA_BANNER_TEXT,
  isSystemManualSendQaEnabled,
} from '@/features/notifications/model/shared/system-manual-send-qa'
import './system-manual-send-qa-banner.css'

type SystemManualSendQaBannerProps = {
  enabled: boolean | null | undefined
  className?: string
}

/** TEMP local QA 배너 — `systemManualSendQaEnabled===true`일 때만 렌더. */
export function SystemManualSendQaBanner({
  enabled,
  className,
}: SystemManualSendQaBannerProps) {
  if (!isSystemManualSendQaEnabled(enabled)) return null
  return (
    <p
      role="status"
      className={['system-manual-send-qa-banner', className].filter(Boolean).join(' ')}
    >
      {SYSTEM_MANUAL_SEND_QA_BANNER_TEXT}
    </p>
  )
}
