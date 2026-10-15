import { ProgramBackButton } from '@/features/program'
import {
  getEmptyAdjacentResults,
  getResultIdFromPath,
  ResultAdjacentNav,
  RESULTS_PATH,
  useProgramResultDetail,
} from '@/features/result'
import { RichTextViewer } from '@/shared/rich-text'
import {
  PFAttachmentDropdown,
  PFButton,
  PFCategoryBadge,
  PFDivider,
  PFText,
} from '@/shared/ui'
import styles from './page.module.css'
import { useNavigate } from 'react-router-dom'

function formatViewCount(count: number) {
  return count.toLocaleString('ko-KR')
}

export function ResultDetailPage() {
  const navigate = useNavigate()
  const resultId = getResultIdFromPath()
  const remoteDetail = useProgramResultDetail(resultId)
  const detail = remoteDetail.isRemoteEnabled ? remoteDetail.data : null
  const adjacent = remoteDetail.isRemoteEnabled
    ? { previous: remoteDetail.previous, next: remoteDetail.next }
    : getEmptyAdjacentResults()

  const handleBackToList = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    navigate(RESULTS_PATH)
  }

  const handleGoToList = () => {
    navigate(RESULTS_PATH)
  }

  if (remoteDetail.isRemoteEnabled && remoteDetail.status === 'loading') {
    return (
      <section className={styles.page}>
        <div className={styles.back}>
          <ProgramBackButton label="이전으로" onClick={handleBackToList} />
        </div>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          결과를 불러오는 중이에요.
        </PFText>
      </section>
    )
  }

  if (!detail) {
    return (
      <section className={styles.page}>
        <div className={styles.back}>
          <ProgramBackButton label="이전으로" onClick={handleBackToList} />
        </div>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          {remoteDetail.status === 'error'
            ? '결과를 불러오지 못했어요.'
            : '결과 발표를 찾을 수 없습니다.'}
        </PFText>
      </section>
    )
  }

  const attachmentFiles = detail.attachments.map(file => ({
    fileName: file.name,
    href: file.fileUrl,
  }))

  return (
    <section className={styles.page}>
      <div className={styles.back}>
        <ProgramBackButton label="이전으로" onClick={handleBackToList} />
      </div>

      <div className={styles.layout}>
        <header className={styles.header}>
          <div className={styles.headerLead}>
            <PFCategoryBadge size="small" variant="secondary">
              {detail.categoryName}
            </PFCategoryBadge>

            <PFText as="h1" typo="hd-lg" color="black" className={styles.title}>
              {detail.title}
            </PFText>

            <div className={styles.meta}>
              <PFText as="span" typo="bd-lg-rg" color="neutral-cool-500">
                {detail.announcedAtDetailLabel}
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

          <PFAttachmentDropdown files={attachmentFiles} className={styles.attachmentDropdown} />
        </header>

        <PFDivider variant="focus" />

        <div className={styles.body}>
          <RichTextViewer content={detail.content} maxHeight="none" className={styles.content} />
        </div>

        <div className={styles.footerNav}>
          <ResultAdjacentNav previous={adjacent.previous} next={adjacent.next} />

          <div className={styles.listAction}>
            <PFButton
              variant="tertiary"
              size="xlarge"
              width={240}
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
