import type { ProgramAttachment } from '../../model/types'
import jaLogoGrayCompactUrl from '@/shared/assets/brand/ja-logo-gray-compact.svg'
import arrowRightWhite16Url from '@/shared/assets/icons/arrow-right-white-16.svg'
import arrowForwardWhite24Url from '@/shared/assets/icons/arrow-forward-white-24.svg'
import { resolvePortalPublicFileImageUrl } from '@/shared/lib/resolve-portal-public-file-image-url'
import closeIconUrl from '@/shared/ui/pf-modal/icons/close.svg'
import { PFCircleIconButton, PFFileDownload, PFText } from '@/shared/ui'
import styles from './program-info-aside.module.css'

/** 기본(마이페이지 등) · 참여하기 상세(`participate`: 모바일에서 포스터·첨부·신청은 상세 header/하단 바로 이동) */
export type ProgramInfoVariant = 'default' | 'participate'

type ProgramPosterProps = {
  detailImageUrl?: string
  thumbnailUrl?: string
  className?: string
}

/** 상세 포스터(배너) — 이미지가 없으면 JA 로고 플레이스홀더 */
export function ProgramPoster({ detailImageUrl, thumbnailUrl, className }: ProgramPosterProps) {
  const rawBannerUrl = detailImageUrl?.trim() || thumbnailUrl?.trim()
  const bannerUrl = resolvePortalPublicFileImageUrl(rawBannerUrl)
  const hasBannerImage = Boolean(bannerUrl)

  return (
    <div
      className={[className, hasBannerImage ? styles.bannerHasImage : styles.bannerNoImage]
        .filter(Boolean)
        .join(' ')}
    >
      {hasBannerImage ? (
        <img className={styles.bannerImage} src={bannerUrl} alt="" />
      ) : (
        <img
          className={styles.bannerPlaceholderLogo}
          src={jaLogoGrayCompactUrl}
          alt=""
          aria-hidden="true"
        />
      )}
    </div>
  )
}

type ProgramApplyButtonProps = {
  applicationPeriodLabel?: string
  onApply?: () => void
  /** application-options 조회 중 — 중복 클릭 방지 */
  applyChecking?: boolean
  className?: string
  /** 화살표 아이콘 크기 — 기본 16, 참여하기 상세 PC aside는 Figma 11001:199752 기준 24 */
  arrowSize?: 16 | 24
}

/** 신청하기 버튼 — PC aside 카드와 모바일 하단 고정 바가 같은 버튼·상태를 쓴다. */
export function ProgramApplyButton({
  applicationPeriodLabel = '',
  onApply,
  applyChecking = false,
  className,
  arrowSize = 16,
}: ProgramApplyButtonProps) {
  return (
    <button
      type="button"
      className={[styles.applyButton, className].filter(Boolean).join(' ')}
      disabled={applyChecking}
      aria-busy={applyChecking}
      onClick={onApply}
    >
      <span className={styles.applyCopy}>
        <PFText as="span" typo="bd-lg-sb" color="white">
          신청하기
        </PFText>
        <PFText as="span" typo="bd-sm-rg" color="white">
          {applicationPeriodLabel}
        </PFText>
      </span>
      {arrowSize === 24 ? (
        <img
          className={styles.applyArrow24}
          src={arrowForwardWhite24Url}
          alt=""
          width={24}
          height={24}
        />
      ) : (
        <img className={styles.applyArrow} src={arrowRightWhite16Url} alt="" width={16} height={16} />
      )}
    </button>
  )
}

type ProgramInfoAsideProps = {
  detailImageUrl?: string
  thumbnailUrl?: string
  attachments: ProgramAttachment[]
  applicationPeriodLabel?: string
  showApplyCta?: boolean
  showCancelCta?: boolean
  onApply?: () => void
  /** application-options 조회 중 — 중복 클릭 방지 */
  applyChecking?: boolean
  onCancel?: () => void
  showTopFab?: boolean
  variant?: ProgramInfoVariant
}

export function ProgramInfoAside({
  detailImageUrl,
  thumbnailUrl,
  attachments,
  applicationPeriodLabel = '',
  showApplyCta = false,
  showCancelCta = false,
  onApply,
  applyChecking = false,
  onCancel,
  showTopFab = true,
  variant = 'default',
}: ProgramInfoAsideProps) {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <aside
      className={[styles.aside, variant === 'participate' ? styles.participate : null]
        .filter(Boolean)
        .join(' ')}
    >
      <ProgramPoster
        detailImageUrl={detailImageUrl}
        thumbnailUrl={thumbnailUrl}
        className={styles.banner}
      />

      {showApplyCta ? (
        <div className={styles.applyBlock}>
          <ProgramApplyButton
            applicationPeriodLabel={applicationPeriodLabel}
            onApply={onApply}
            applyChecking={applyChecking}
            arrowSize={variant === 'participate' ? 24 : 16}
          />
        </div>
      ) : null}

      {showCancelCta ? (
        <button type="button" className={styles.cancelButton} onClick={onCancel}>
          <PFText as="span" typo="bd-lg-sb" color="black">
            신청 취소하기
          </PFText>
          <img className={styles.cancelIcon} src={closeIconUrl} alt="" width={16} height={16} />
        </button>
      ) : null}

      {attachments.length > 0 ? (
        <ul className={styles.attachments}>
          {attachments.map(attachment => (
            <li key={attachment.name}>
              <PFFileDownload fileName={attachment.name} href={attachment.url} />
            </li>
          ))}
        </ul>
      ) : null}

      {showTopFab ? (
        <PFCircleIconButton
          icon="scrollTop"
          className={styles.topFab}
          aria-label="맨 위로"
          onClick={handleScrollToTop}
        />
      ) : null}
    </aside>
  )
}
