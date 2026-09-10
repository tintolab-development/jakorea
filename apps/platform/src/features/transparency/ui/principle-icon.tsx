import assetIconUrl from '../image/icon/principles-asset-icon.svg'
import auditIconUrl from '../image/icon/principles-audit-icon.svg'
import governanceIconUrl from '../image/icon/principles-governance-icon.svg'
import partnershipIconUrl from '../image/icon/principles-partnership-icon.svg'
import privacyIconUrl from '../image/icon/principles-privacy-icon.svg'
import type { TransparencyPrincipleIcon } from '../model/types'

type PrincipleIconProps = {
  icon: TransparencyPrincipleIcon
}

const PRINCIPLE_ICON_SRC: Record<TransparencyPrincipleIcon, string> = {
  audit: auditIconUrl,
  governance: governanceIconUrl,
  privacy: privacyIconUrl,
  asset: assetIconUrl,
  partnership: partnershipIconUrl,
}

/** 운영 원칙 아이콘 */
export function PrincipleIcon({ icon }: PrincipleIconProps) {
  return (
    <img
      src={PRINCIPLE_ICON_SRC[icon]}
      alt=""
      aria-hidden="true"
      width={80}
      height={80}
      draggable={false}
    />
  )
}
