import { ProgramBackButton } from '@/features/program'
import {
  getNoticeIdFromPath,
  NOTICES_PATH,
  useMockNoticeDetail,
} from '@/features/notice'
import { RichTextViewer } from '@/shared/rich-text'
import { PFFileDownload, PFText } from '@/shared/ui'
import styles from './page.module.css'

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
  const noticeId = getNoticeIdFromPath()
  const detail = useMockNoticeDetail(noticeId)

  const handleBackToList = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    window.location.assign(NOTICES_PATH)
  }

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!detail) {
    return (
      <section className={styles.page}>
        <div className={styles.back}>
          <ProgramBackButton label="목록으로" onClick={handleBackToList} />
        </div>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          공지사항을 찾을 수 없습니다.
        </PFText>
      </section>
    )
  }

  const hasAttachments = detail.attachments.length > 0

  return (
    <section className={styles.page}>
      <div className={styles.back}>
        <ProgramBackButton label="목록으로" onClick={handleBackToList} />
      </div>

      <div className={styles.layout}>
        <header className={styles.header}>
          {detail.isPinned ? (
            <PFText as="span" typo="hl-sm" color="primary-500">
              공지
            </PFText>
          ) : null}
          <PFText as="h1" typo="hd-lg" color="black" className={styles.title}>
            {detail.title}
          </PFText>
          <div className={styles.meta}>
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
          <RichTextViewer content={detail.content} maxHeight="none" className={styles.content} />
        </div>
      </div>
    </section>
  )
}
