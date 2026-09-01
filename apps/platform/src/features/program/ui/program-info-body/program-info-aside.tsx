import type { ProgramAttachment } from '../../model/types'
import arrowRightWhite16Url from '@/shared/assets/icons/arrow-right-white-16.svg'
import closeIconUrl from '@/shared/ui/pf-modal/icons/close.svg'
import { PFCircleIconButton, PFFileDownload, PFText } from '@/shared/ui'
import styles from './program-info-aside.module.css'

type ProgramInfoAsideProps = {
  detailImageUrl?: string
  thumbnailUrl?: string
  attachments: ProgramAttachment[]
  isRecruiting?: boolean
  /** 신청하기 활성 — 모집 중·모집 예정 */
  canApply?: boolean
  applicationPeriodLabel?: string
  showApplyCta?: boolean
  showCancelCta?: boolean
  onApply?: () => void
  onCancel?: () => void
  showTopFab?: boolean
}

export function ProgramInfoAside({
  detailImageUrl,
  thumbnailUrl,
  attachments,
  isRecruiting = false,
  canApply = isRecruiting,
  applicationPeriodLabel = '',
  showApplyCta = false,
  showCancelCta = false,
  onApply,
  onCancel,
  showTopFab = true,
}: ProgramInfoAsideProps) {
  const bannerUrl = detailImageUrl?.trim() || thumbnailUrl?.trim() || ''
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
        {hasBannerImage ? <img className={styles.bannerImage} src={bannerUrl} alt="" /> : null}
      </div>

      {showApplyCta ? (
        <button
          type="button"
          className={styles.applyButton}
          disabled={!canApply}
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
