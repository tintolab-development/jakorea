import { CmsButton, type CmsButtonSize, type CmsButtonVariant } from '@/shared/ui/cms-button'
import type { CSSProperties } from 'react'

/** 개인정보 상세보기 / 마스킹 토글 버튼 문구 (화면 공통) */
export const PERSONAL_INFO_REVEAL_BUTTON_LABEL = {
  reveal: '개인정보 상세보기',
  mask: '개인정보 마스킹',
} as const

export type PersonalInfoRevealButtonLabelMode =
  /** 상세보기 ↔ 마스킹 문구 전환 (대부분 화면) */
  | 'toggle'
  /** 항상 「개인정보 상세보기」 (신청자 헤더·회원 상세 헤더 등, 클릭 동작은 부모·훅) */
  | 'stickyReveal'
  /** 해제 후에는 렌더하지 않음 (`revealed`이면 `null`) */
  | 'revealOnly'

export type PersonalInfoRevealButtonProps = {
  revealed: boolean
  labelMode: PersonalInfoRevealButtonLabelMode
  onClick: () => void
  disabled?: boolean
  className?: string
  style?: CSSProperties
  cmsVariant?: CmsButtonVariant
  cmsSize?: CmsButtonSize
  width?: number | string
}

function resolveLabel(
  labelMode: PersonalInfoRevealButtonLabelMode,
  revealed: boolean
): string {
  if (labelMode === 'toggle') {
    return revealed ? PERSONAL_INFO_REVEAL_BUTTON_LABEL.mask : PERSONAL_INFO_REVEAL_BUTTON_LABEL.reveal
  }
  return PERSONAL_INFO_REVEAL_BUTTON_LABEL.reveal
}

/**
 * 개인정보 상세보기 플로우용 공통 버튼 (`usePersonalInfoReveal` / `usePersonalInfoRevealByRow`와 함께 사용).
 */
export function PersonalInfoRevealButton({
  revealed,
  labelMode,
  onClick,
  disabled,
  className,
  style,
  cmsVariant = 'primary',
  cmsSize = 'large',
  width = 160,
}: PersonalInfoRevealButtonProps) {
  if (labelMode === 'revealOnly' && revealed) {
    return null
  }

  const children = resolveLabel(labelMode, revealed)

  return (
    <CmsButton
      type="button"
      variant={cmsVariant}
      size={cmsSize}
      width={width}
      className={className}
      style={style}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </CmsButton>
  )
}
