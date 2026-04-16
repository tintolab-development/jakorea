import { useCallback, useMemo } from 'react'
import type { CmsButtonVariant } from '@/shared/ui/cms-button'

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
      label: '개인정보 상세보기',
      variant: 'primary' as const,
      onClick,
    }
  }, [personalInfoRevealed, onClick])
}
