import { ProgramBackButton } from '@/features/program'
import {
  getAdjacentNotices,
  getNoticeIdFromPath,
  NoticeAdjacentNav,
  NOTICES_PATH,
  useMockNoticeDetail,
} from '@/features/notice'
import { RichTextViewer } from '@/shared/rich-text'
import {
  PFAttachmentDropdown,
  PFButton,
  PFDivider,
  PFFileDownload,
  PFText,
} from '@/shared/ui'
import styles from './page.module.css'
import { useNavigate } from 'react-router-dom'

function TopFabIcon() {
  return (
    <svg
      className={styles.topFabIcon}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M9 3.825L9 16L7 16L7 3.825L1.4 9.425L-3.49691e-07 8L8 -3.49691e-07L16 8L14.6 9.425L9 3.825Z"
        fill="white"
      />
    </svg>
  )
}

function formatViewCount(count: number) {
  return count.toLocaleString('ko-KR')
}

export function NoticeDetailPage() {
  const navigate = useNavigate()
  const noticeId = getNoticeIdFromPath()
  const detail = useMockNoticeDetail(noticeId)

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    navigate(NOTICES_PATH)
  }

  const handleGoToList = () => {
    navigate(NOTICES_PATH)
  }

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!detail) {
    return (
      <section className={styles.page}>
        <div className={styles.back}>
          <ProgramBackButton label="이전으로" onClick={handleBack} />
        </div>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          공지사항을 찾을 수 없습니다.
        </PFText>
      </section>
    )
  }

  const hasAttachments = detail.attachments.length > 0
  const attachmentFiles = detail.attachments.map(file => ({
    fileName: file.name,
    href: file.fileUrl,
  }))
  const adjacent = getAdjacentNotices(detail.id)

  return (
    <section className={styles.page}>
      <div className={styles.back}>
        <ProgramBackButton label="이전으로" onClick={handleBack} />
      </div>

      <div className={styles.layout}>
        <header className={styles.header}>
          <div className={styles.headerLead}>
            {detail.isPinned ? (
              <PFText as="span" typo="hl-sm" color="primary-500" className={styles.pin}>
                공지
              </PFText>
            ) : null}
            <PFText as="h1" typo="hd-lg" color="black" className={styles.title}>
              {detail.title}
            </PFText>
            <div className={styles.metaPc}>
              <div className={styles.metaItem}>
                <PFText as="span" typo="bd-lg-rg" color="neutral-cool-600">
                  작성일
                </PFText>
                <PFText as="span" typo="hl-sm" color="black">
                  {detail.publishedAtDetailLabel}
                </PFText>
              </div>
              <div className={styles.metaItem}>
                <PFText as="span" typo="bd-lg-rg" color="neutral-cool-600">
                  작성자
                </PFText>
                <PFText as="span" typo="hl-sm" color="black">
                  {detail.author}
                </PFText>
              </div>
              <div className={styles.metaItem}>
                <PFText as="span" typo="bd-lg-rg" color="neutral-cool-600">
                  조회수
                </PFText>
                <PFText as="span" typo="hl-sm" color="black">
                  {formatViewCount(detail.viewCount)}
                </PFText>
              </div>
            </div>
            <div className={styles.metaMobile}>
              <PFText as="span" typo="bd-sm-rg" color="neutral-cool-500" className={styles.date}>
                {detail.publishedAtDetailLabel}
              </PFText>
              <span className={styles.viewCount}>
                <PFText as="span" typo="bd-sm-rg" color="black" className={styles.viewLabel}>
                  조회
                </PFText>
                <PFText as="span" typo="bd-sm-rg" color="black" className={styles.viewNumber}>
                  {formatViewCount(detail.viewCount)}
                </PFText>
              </span>
            </div>
          </div>

          <PFAttachmentDropdown
            files={attachmentFiles}
            triggerLabel={`${detail.attachments.length}개의 첨부파일`}
            className={styles.attachmentDropdown}
          />
        </header>

        <aside className={styles.aside}>
          {hasAttachments ? (
            <ul className={styles.attachments}>
              {detail.attachments.map(attachment => (
                <li key={attachment.name}>
                  <PFFileDownload fileName={attachment.name} href={attachment.fileUrl} />
                </li>
              ))}
            </ul>
          ) : null}

          <button
            type="button"
            className={styles.topFab}
            aria-label="맨 위로"
            onClick={handleScrollToTop}
          >
            <TopFabIcon />
          </button>
        </aside>

        <div className={styles.body}>
          <PFDivider variant="focus" className={styles.mobileDivider} />
          <RichTextViewer content={detail.content} maxHeight="none" className={styles.content} />
        </div>

        <div className={styles.footerNav}>
          <NoticeAdjacentNav previous={adjacent.previous} next={adjacent.next} />

          <div className={styles.listAction}>
            <PFButton
              variant="tertiary"
              size="xlarge"
              className={styles.listButton}
              onClick={handleGoToList}
            >
              목록으로
            </PFButton>
          </div>
        </div>
      </div>
    </section>
  )
}
