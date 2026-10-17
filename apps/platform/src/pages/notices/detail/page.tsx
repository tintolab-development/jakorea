import { ProgramBackButton } from '@/features/program'
import {
  canNavigateBackInApp,
  getNoticeIdFromPath,
  NoticeAdjacentNav,
  resolveNoticesListReturnPath,
  useNoticeDetail,
  type NoticeDetailStatus,
} from '@/features/notice'
import { RichTextViewer } from '@/shared/rich-text'
import { PFAttachmentDropdown, PFButton, PFDivider, PFLoadingSpinner, PFText } from '@/shared/ui'
import styles from './page.module.css'
import { useLocation, useNavigate } from 'react-router-dom'

function formatViewCount(count: number) {
  return count.toLocaleString('ko-KR')
}

function statusMessage(status: NoticeDetailStatus) {
  if (status === 'error') return '공지사항을 불러오지 못했습니다.'
  if (status === 'unavailable') return '공개되지 않았거나 삭제된 공지사항입니다.'
  return '공지사항을 찾을 수 없습니다.'
}

export function NoticeDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const noticeId = getNoticeIdFromPath(location.pathname)
  const { data: detail, status, adjacent, refetch } = useNoticeDetail(noticeId)
  const listReturnPath = resolveNoticesListReturnPath(location.state)

  const handleBack = () => {
    if (canNavigateBackInApp()) {
      navigate(-1)
      return
    }
    navigate(listReturnPath)
  }

  const handleGoToList = () => {
    navigate(listReturnPath)
  }

  if (status !== 'ready' || !detail) {
    return (
      <section className={styles.page}>
        <div className={styles.back}>
          <ProgramBackButton label="이전으로" onClick={handleBack} />
        </div>
        <div className={styles.status}>
          {status === 'loading' ? (
            <PFLoadingSpinner centered label="공지사항을 불러오는 중" />
          ) : (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              {statusMessage(status)}
            </PFText>
          )}
          {status === 'error' ? (
            <PFButton variant="tertiary" size="large" onClick={refetch}>
              다시 시도
            </PFButton>
          ) : null}
        </div>
      </section>
    )
  }

  const attachmentFiles = detail.attachments.map(file => ({
    id: file.id,
    fileName: file.name,
    href: file.fileUrl,
  }))

  return (
    <section className={styles.page}>
      <div className={styles.back}>
        <ProgramBackButton label="이전으로" onClick={handleBack} />
      </div>

      <div className={styles.layout}>
        <header className={styles.header}>
          <div className={styles.headerLead}>
            <PFText as="h1" typo="page-title-md" color="black" className={styles.title}>
              {detail.title}
            </PFText>
            <div className={styles.meta}>
              <PFText as="span" typo="bd-lg-rg" color="neutral-cool-500">
                {detail.publishedAtDetailLabel}
              </PFText>
              <span className={styles.viewCount}>
                <PFText as="span" typo="bd-lg-rg" color="black">
                  조회
                </PFText>
                <PFText as="span" typo="bd-lg-rg" color="black">
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

        <PFDivider variant="focus" />

        <div className={styles.body}>
          <RichTextViewer
            key={detail.id}
            content={detail.content}
            contentFormat={detail.contentFormat}
            maxHeight="none"
            className={styles.content}
          />
        </div>

        <div className={styles.footerNav}>
          <NoticeAdjacentNav
            previous={adjacent.previous}
            next={adjacent.next}
            listReturnPath={listReturnPath}
          />

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
