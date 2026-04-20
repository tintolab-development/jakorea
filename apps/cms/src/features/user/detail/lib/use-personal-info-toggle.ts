import { useCallback, useMemo } from 'react'
import type { CmsButtonVariant } from '@/shared/ui/cms-button'
import { PERSONAL_INFO_REVEAL_BUTTON_LABEL } from '@/features/user/detail/ui/personal-info-reveal-button'

export interface PersonalInfoToggleButtonConfig {
  label: string
  variant: CmsButtonVariant
  onClick: () => void
}

/**
 * 마스킹 해제 후에는 CMS에서 다시 마스킹하는 버튼을 두지 않음 → 해제 상태면 `null`.
 */
export function usePersonalInfoToggle({
  personalInfoRevealed,
  onRequestReveal,
}: {
  personalInfoRevealed: boolean
  onRequestReveal: () => void
}): PersonalInfoToggleButtonConfig | null {
  const onClick = useCallback(() => {
    onRequestReveal()
  }, [onRequestReveal])

  return useMemo(() => {
    if (personalInfoRevealed) return null
    return {
      label: PERSONAL_INFO_REVEAL_BUTTON_LABEL.reveal,
      variant: 'primary' as const,
      onClick,
    }
  }, [personalInfoRevealed, onClick])
}
