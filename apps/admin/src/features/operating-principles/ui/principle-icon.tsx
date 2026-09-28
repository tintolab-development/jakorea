/**
 * 운영 원칙 아이콘 — Platform 투명경영과 동일 SVG (고정 매핑, 수정/삭제 불가)
 */
import type { PrincipleIconKey } from '@/entities/operating-principles/model/types'
import assetIconUrl from './assets/principles-asset-icon.svg'
import auditIconUrl from './assets/principles-audit-icon.svg'
import governanceIconUrl from './assets/principles-governance-icon.svg'
import partnershipIconUrl from './assets/principles-partnership-icon.svg'
import privacyIconUrl from './assets/principles-privacy-icon.svg'

type PrincipleIconProps = {
  iconKey: PrincipleIconKey
  size?: number
  className?: string
}

/** Platform TransparencyPrincipleIcon 과 동일 순서 · 자산 */
const PRINCIPLE_ICON_SRC: Record<PrincipleIconKey, string> = {
  p1: auditIconUrl,
  p2: governanceIconUrl,
  p3: privacyIconUrl,
  p4: assetIconUrl,
  p5: partnershipIconUrl,
}

export function PrincipleIcon({ iconKey, size = 40, className }: PrincipleIconProps) {
  return (
    <img
      className={className}
      src={PRINCIPLE_ICON_SRC[iconKey] ?? PRINCIPLE_ICON_SRC.p1}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      draggable={false}
      style={{ display: 'block', flexShrink: 0 }}
    />
  )
}
