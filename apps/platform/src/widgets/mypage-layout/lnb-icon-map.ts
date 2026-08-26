import type { MypageHomeLnbItemKey, MypageLnbItemKey } from '@/features/mypage'
import bookGrayIconUrl from './image/icon/book-gray-24.svg'
import bookMintIconUrl from './image/icon/book-mint-24.svg'
import handGrayIconUrl from './image/icon/hand-gray-24.svg'
import handMintIconUrl from './image/icon/hand-mint-24.svg'
import homeGrayIconUrl from './image/icon/home-gray-24.svg'
import homeMintIconUrl from './image/icon/home-mint-24.svg'
import monitorGrayIconUrl from './image/icon/monitor-gray-24.svg'
import monitorMintIconUrl from './image/icon/monitor-mint-24.svg'
import speechBubbleGrayIconUrl from './image/icon/speechbubble-gray-24.svg'
import speechBubbleMintIconUrl from './image/icon/speechbubble-mint-24.svg'
import walletGrayIconUrl from './image/icon/wallet-gray-24.svg'
import walletMintIconUrl from './image/icon/wallet-mint-24.svg'

const LNB_ICON_MAP: Record<MypageHomeLnbItemKey, { gray: string; mint: string }> = {
  home: { gray: homeGrayIconUrl, mint: homeMintIconUrl },
  lectures: { gray: monitorGrayIconUrl, mint: monitorMintIconUrl },
  settlement: { gray: walletGrayIconUrl, mint: walletMintIconUrl },
  education: { gray: bookGrayIconUrl, mint: bookMintIconUrl },
  volunteer: { gray: handGrayIconUrl, mint: handMintIconUrl },
  inquiries: { gray: speechBubbleGrayIconUrl, mint: speechBubbleMintIconUrl },
}

export function getLnbIconUrl(key: MypageLnbItemKey, active: boolean): string | undefined {
  const icons = LNB_ICON_MAP[key as MypageHomeLnbItemKey]
  if (!icons) return undefined
  return active ? icons.mint : icons.gray
}

export { default as instructorApplyIllustrationUrl } from './image/illustration/illust-lightbulb.svg'
