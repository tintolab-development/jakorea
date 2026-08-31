import { useMemo, useState } from 'react'
import illustQuotationUrl from '@/shared/assets/illustration/illust-quotation-no-bg.svg'
import {
  getMockEducationInProgressFiles,
  getMockEducationInProgressNotices,
} from '../lib/mock-education-in-progress-notices'
import { EducationInProgressFileRow } from './education-in-progress-file-row'
import { EducationInProgressNoticeCard } from './education-in-progress-notice-card'
import { PFAlertModal, PFButton, PFSearchInput, PFText } from '@/shared/ui'
import styles from './education-in-progress-notice-panel.module.css'

type EducationInProgressNoticePanelProps = {
  programId: string
}

export function EducationInProgressNoticePanel({
  programId,
}: EducationInProgressNoticePanelProps) {
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false)
  const [fileQuery, setFileQuery] = useState('')

  const notices = useMemo(
    () => getMockEducationInProgressNotices(programId),
    [programId],
  )
  const files = useMemo(() => getMockEducationInProgressFiles(programId), [programId])

  const filteredFiles = useMemo(() => {
    const query = fileQuery.trim().toLowerCase()
    if (!query) return files
    return files.filter(file => file.fileName.toLowerCase().includes(query))
  }, [files, fileQuery])

  const openComingSoon = () => {
    setIsComingSoonOpen(true)
  }

  const hasNotices = notices.length > 0
  const hasFiles = files.length > 0
  const hasFileQuery = fileQuery.trim().length > 0

  return (
    <div className={styles.shell}>
      {hasNotices ? (
        <div className={styles.noticeList}>
          {notices.map(notice => (
            <EducationInProgressNoticeCard key={notice.id} notice={notice} />
          ))}
        </div>
      ) : (
        <div className={styles.noticeEmpty}>
          <div className={styles.noticeEmptyContent}>
            <img
              className={styles.illustration}
              src={illustQuotationUrl}
              alt=""
              aria-hidden="true"
            />
            <PFText as="p" typo="hl-lg" color="black" className={styles.noticeTitle}>
              아직 확인할 안내사항이 없어요
            </PFText>
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={styles.noticeDescription}>
              새로운 안내사항이 등록되면 이곳에서 확인할 수 있어요.
            </PFText>
          </div>
        </div>
      )}

      <div className={styles.files}>
        <PFSearchInput
          className={styles.search}
          variant="outlined"
          placeholder="파일명으로 검색해 보세요."
          aria-label="파일명으로 검색해 보세요."
          value={fileQuery}
          onValueChange={setFileQuery}
        />

        {!hasFiles ? (
          <div className={styles.filesEmpty}>
            <PFText as="p" typo="bd-md-bd" color="black" className={styles.filesEmptyTitle}>
              첨부된 파일이 없어요
            </PFText>
            <PFText as="p" typo="bd-sm-rg" color="neutral-cool-500" className={styles.filesEmptyDescription}>
              첨부파일이 등록되면 이곳에서 확인할 수 있어요.
            </PFText>
          </div>
        ) : filteredFiles.length === 0 && hasFileQuery ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={styles.searchEmpty}>
            검색 결과가 없습니다.
          </PFText>
        ) : (
          <div className={styles.filesList}>
            {filteredFiles.map(file => (
              <EducationInProgressFileRow
                key={file.id}
                file={file}
                onComingSoon={openComingSoon}
              />
            ))}
          </div>
        )}

        <div className={styles.footer}>
          <PFButton variant="text" onClick={openComingSoon}>
            프로그램 정보
          </PFButton>
          <span className={styles.actionDivider} aria-hidden="true" />
          <PFButton variant="text" onClick={openComingSoon}>
            신청 정보
          </PFButton>
        </div>
      </div>

      <PFAlertModal
        open={isComingSoonOpen}
        title="준비 중"
        onConfirm={() => setIsComingSoonOpen(false)}
      />
    </div>
  )
}
