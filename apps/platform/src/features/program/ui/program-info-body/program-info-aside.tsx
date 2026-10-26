import type { ProgramAttachment } from '../../model/types'
import jaLogoGrayCompactUrl from '@/shared/assets/brand/ja-logo-gray-compact.svg'
import arrowRightWhite16Url from '@/shared/assets/icons/arrow-right-white-16.svg'
import { resolvePortalPublicFileImageUrl } from '@/shared/lib/resolve-portal-public-file-image-url'
import closeIconUrl from '@/shared/ui/pf-modal/icons/close.svg'
import { PFCircleIconButton, PFFileDownload, PFText } from '@/shared/ui'
import styles from './program-info-aside.module.css'

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
}: ProgramInfoAsideProps) {
  const rawBannerUrl = detailImageUrl?.trim() || thumbnailUrl?.trim()
  const bannerUrl = resolvePortalPublicFileImageUrl(rawBannerUrl)
  const hasBannerImage = Boolean(bannerUrl)

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <aside className={styles.aside}>
      <div
        className={[
          styles.banner,
          hasBannerImage ? styles.bannerHasImage : styles.bannerNoImage,
        ].join(' ')}
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

      {showApplyCta ? (
        <div className={styles.applyBlock}>
          <button
            type="button"
            className={styles.applyButton}
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
            <img
              className={styles.applyArrow}
              src={arrowRightWhite16Url}
              alt=""
              width={16}
              height={16}
            />
          </button>
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
