import { useCallback, useMemo } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { CmsButtonVariant } from '@/shared/ui/cms-button'

export interface PersonalInfoToggleButtonConfig {
  label: string
  variant: CmsButtonVariant
  onClick: () => void
}

export function usePersonalInfoToggle({
  personalInfoRevealed,
  setPersonalInfoRevealed,
}: {
  personalInfoRevealed: boolean
  setPersonalInfoRevealed: Dispatch<SetStateAction<boolean>>
}): PersonalInfoToggleButtonConfig {
  const onClick = useCallback(() => {
    if (personalInfoRevealed) {
      setPersonalInfoRevealed(false)
    } else {
      window.alert('준비 중입니다.')
    }
  }, [personalInfoRevealed, setPersonalInfoRevealed])

  return useMemo(
    () => ({
      label: personalInfoRevealed ? '개인정보 마스킹' : '개인정보 상세보기',
      variant: personalInfoRevealed ? ('default' as const) : ('primary' as const),
      onClick,
    }),
    [personalInfoRevealed, onClick]
  )
}
