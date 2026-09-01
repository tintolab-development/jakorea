import { useMemo, useState } from 'react'
import type { ProgramDetail } from '@/features/program'
import illustQuotationUrl from '@/shared/assets/illustration/illust-quotation-no-bg.svg'
import type { EducationInProgressNotice } from '../model/education-in-progress-notice-types'
import {
  getMockEducationInProgressFiles,
  getMockEducationInProgressNotices,
} from '../lib/mock-education-in-progress-notices'
import { EducationInProgressFileRow } from './education-in-progress-file-row'
import { EducationInProgressNoticeCard } from './education-in-progress-notice-card'
import { EducationInProgressNoticeDetailModal } from './education-in-progress-notice-detail-modal'
import { EducationProgramInfoModal } from './education-program-info-modal'
import { PFAlertModal, PFButton, PFSearchInput, PFText } from '@/shared/ui'
import styles from './education-in-progress-notice-panel.module.css'

type EducationInProgressNoticePanelProps = {
  program: ProgramDetail
}

export function EducationInProgressNoticePanel({
  program,
}: EducationInProgressNoticePanelProps) {
  const programId = program.id
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false)
  const [isProgramInfoOpen, setIsProgramInfoOpen] = useState(false)
  const [fileQuery, setFileQuery] = useState('')
  const [notices, setNotices] = useState<EducationInProgressNotice[]>(() =>
    getMockEducationInProgressNotices(programId),
  )
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null)

  const files = useMemo(() => getMockEducationInProgressFiles(programId), [programId])

  const filteredFiles = useMemo(() => {
    const query = fileQuery.trim().toLowerCase()
    if (!query) return files
    return files.filter(file => file.fileName.toLowerCase().includes(query))
  }, [files, fileQuery])

  const openComingSoon = () => {
    setIsComingSoonOpen(true)
  }

  const openNoticeDetail = (noticeId: string) => {
    setNotices(prev =>
      prev.map(notice => (notice.id === noticeId ? { ...notice, read: true } : notice)),
    )
    setSelectedNoticeId(noticeId)
  }

  const deleteNotice = (noticeId: string) => {
    setNotices(prev => prev.filter(notice => notice.id !== noticeId))
    setSelectedNoticeId(null)
  }

  const hasNotices = notices.length > 0
  const hasFiles = files.length > 0
  const hasFileQuery = fileQuery.trim().length > 0

  return (
    <div className={styles.shell}>
      {hasNotices ? (
        <div className={styles.noticeList}>
          {notices.map(notice => (
            <EducationInProgressNoticeCard
              key={notice.id}
              notice={notice}
              onClick={() => openNoticeDetail(notice.id)}
            />
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
          <PFButton variant="text" onClick={() => setIsProgramInfoOpen(true)}>
            프로그램 정보
          </PFButton>
          <span className={styles.actionDivider} aria-hidden="true" />
          <PFButton variant="text" onClick={openComingSoon}>
            신청 정보
          </PFButton>
        </div>
      </div>

      <EducationInProgressNoticeDetailModal
        open={selectedNoticeId !== null}
        notices={notices}
        files={files}
        noticeId={selectedNoticeId}
        onClose={() => setSelectedNoticeId(null)}
        onNoticeChange={openNoticeDetail}
        onDelete={deleteNotice}
        onReactionCountChange={(noticeId, reactionCount) => {
          setNotices(prev =>
            prev.map(notice =>
              notice.id === noticeId ? { ...notice, reactionCount } : notice,
            ),
          )
        }}
        onCommentCountChange={(noticeId, commentCount) => {
          setNotices(prev =>
            prev.map(notice =>
              notice.id === noticeId ? { ...notice, commentCount } : notice,
            ),
          )
        }}
      />

      <EducationProgramInfoModal
        open={isProgramInfoOpen}
        program={program}
        onClose={() => setIsProgramInfoOpen(false)}
      />

      <PFAlertModal
        open={isComingSoonOpen}
        title="준비 중"
        onConfirm={() => setIsComingSoonOpen(false)}
      />
    </div>
  )
}
