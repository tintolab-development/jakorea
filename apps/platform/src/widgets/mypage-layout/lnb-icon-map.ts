import type { MypageLnbItemKey } from '@/features/mypage'
import bookGrayIconUrl from './image/icon/book-gray-24.svg'
import bookMintIconUrl from './image/icon/book-mint-24.svg'
import handGrayIconUrl from './image/icon/hand-gray-24.svg'
import handMintIconUrl from './image/icon/hand-mint-24.svg'
import homeGrayIconUrl from './image/icon/home-gray-24.svg'
import homeMintIconUrl from './image/icon/home-mint-24.svg'
import speechBubbleGrayIconUrl from './image/icon/speechbubble-gray-24.svg'
import speechBubbleMintIconUrl from './image/icon/speechbubble-mint-24.svg'

const LNB_ICON_MAP: Record<MypageLnbItemKey, { gray: string; mint: string }> = {
  home: { gray: homeGrayIconUrl, mint: homeMintIconUrl },
  education: { gray: bookGrayIconUrl, mint: bookMintIconUrl },
  volunteer: { gray: handGrayIconUrl, mint: handMintIconUrl },
  inquiries: { gray: speechBubbleGrayIconUrl, mint: speechBubbleMintIconUrl },
}

export function getLnbIconUrl(key: MypageLnbItemKey, active: boolean) {
  const icons = LNB_ICON_MAP[key]
  return active ? icons.mint : icons.gray
}

export { default as instructorApplyIllustrationUrl } from './image/illustration/illust-lightbulb.svg'
