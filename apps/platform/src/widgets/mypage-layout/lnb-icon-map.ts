import type { MypageHomeLnbItemKey, MypageLnbItemKey } from '@/features/mypage'
import illustLectureUrl from '@/shared/assets/illustration/graphic-90-04.png'
import illustBookUrl from '@/shared/assets/illustration/illust-book.svg'
import illustMyHomeUrl from '@/shared/assets/illustration/illust-my-home.svg'
import illustPiggyBankUrl from '@/shared/assets/illustration/illust-piggy-bank.png'
import illustTeardropsUrl from '@/shared/assets/illustration/illust-teardrops.svg'
import illustWordballoonsUrl from '@/shared/assets/illustration/illust-wordballoons.svg'
import bookGrayIconUrl from './image/icon/book-gray-24.svg'
import bookMintIconUrl from './image/icon/book-mint-24.svg'
import handGrayIconUrl from './image/icon/hand-gray-24.svg'
import handMintIconUrl from './image/icon/hand-mint-24.svg'
import homeGrayIconUrl from './image/icon/home-gray-24.svg'
import homeMintIconUrl from './image/icon/home-mint-24.svg'
import readingIconUrl from '@/shared/assets/icons/reading.svg'
import readingMintIconUrl from '@/shared/assets/icons/reading-mint.svg'
import speechBubbleGrayIconUrl from './image/icon/speechbubble-gray-24.svg'
import speechBubbleMintIconUrl from './image/icon/speechbubble-mint-24.svg'
import walletCoinGrayIconUrl from './image/icon/wallet-coin-gray-24.svg'
import walletCoinMintIconUrl from './image/icon/wallet-coin-mint-24.svg'

const LNB_ICON_MAP: Record<MypageHomeLnbItemKey, { gray: string; mint: string }> = {
  home: { gray: homeGrayIconUrl, mint: homeMintIconUrl },
  lectures: { gray: readingIconUrl, mint: readingMintIconUrl },
  settlement: { gray: walletCoinGrayIconUrl, mint: walletCoinMintIconUrl },
  education: { gray: bookGrayIconUrl, mint: bookMintIconUrl },
  volunteer: { gray: handGrayIconUrl, mint: handMintIconUrl },
  inquiries: { gray: speechBubbleGrayIconUrl, mint: speechBubbleMintIconUrl },
}

export function getLnbIconUrl(key: MypageLnbItemKey, active: boolean): string | undefined {
  const icons = LNB_ICON_MAP[key as MypageHomeLnbItemKey]
  if (!icons) return undefined
  return active ? icons.mint : icons.gray
}

/** 모바일 LNB 트리거 — 각 서브페이지 pageTitleRow 일러스트와 동일 */
const LNB_MOBILE_TRIGGER_ILLUSTRATION: Partial<Record<MypageLnbItemKey, string>> = {
  home: illustMyHomeUrl,
  education: illustBookUrl,
  lectures: illustLectureUrl,
  settlement: illustPiggyBankUrl,
  volunteer: illustTeardropsUrl,
  inquiries: illustWordballoonsUrl,
}

export function isLnbMobileTriggerIllustration(key: MypageLnbItemKey): boolean {
  return LNB_MOBILE_TRIGGER_ILLUSTRATION[key] !== undefined
}

export function getLnbMobileTriggerIconUrl(
  key: MypageLnbItemKey,
  active: boolean,
): string | undefined {
  const illustrationUrl = LNB_MOBILE_TRIGGER_ILLUSTRATION[key]
  if (illustrationUrl) return illustrationUrl
  return getLnbIconUrl(key, active)
}

export { default as instructorApplyIllustrationUrl } from './image/illustration/illust-lightbulb.svg'
