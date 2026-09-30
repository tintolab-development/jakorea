import { useMemo, useState, type ReactNode } from 'react'
import type { ProgramDetail } from '@/features/program'
import {
  useApplicationNoticeDetailQuery,
  useApplicationNoticesQuery,
} from '../../applications/api/activity-hooks'
import type { ProgramApplicationType } from '../../applications/api/types'
import { EducationApplicationInfoModal } from '../../applications/ui/application-info-modal'
import illustQuotationUrl from '@/shared/assets/illustration/illust-quotation-no-bg.svg'
import { useDebouncedValue } from '@/shared/hooks'
import type { EducationInProgressFile, EducationInProgressNotice } from '../model/types'
import { downloadEducationNoticeFile } from '../lib/download-file'
import {
  getMockEducationInProgressFiles,
  getMockEducationInProgressNotices,
} from '../lib/mock-notices'
import { EducationInProgressFileRow } from './file-row'
import { EducationInProgressNoticeCard } from './card'
import { EducationInProgressNoticeDetailModal } from './detail-modal'
import { EducationProgramInfoModal } from './program-info-modal'
import { PFAlertModal, PFButton, PFSearchInput, PFText } from '@/shared/ui'
import styles from './panel.module.css'

const SEARCH_DEBOUNCE_MS = 500

type EducationInProgressNoticePanelProps = {
  program: ProgramDetail
  selfIntroMotivation?: string
  preferredEducationScheduleLabel?: string
  /** 봉사현황 기관 안내사항 등 — 안내 목록 위 슬롯 */
  leading?: ReactNode
  applicationType?: ProgramApplicationType | null
  applicationId?: string | null
}

export function EducationInProgressNoticePanel({
  program,
  selfIntroMotivation,
  preferredEducationScheduleLabel,
  leading,
  applicationType,
  applicationId,
}: EducationInProgressNoticePanelProps) {
  const programId = program.id
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false)
  const [isProgramInfoOpen, setIsProgramInfoOpen] = useState(false)
  const [isApplicationInfoOpen, setIsApplicationInfoOpen] = useState(false)
  const [draftFileQuery, setDraftFileQuery] = useState('')
  const debouncedFileQuery = useDebouncedValue(draftFileQuery, SEARCH_DEBOUNCE_MS)
  const remoteNotices = useApplicationNoticesQuery(applicationType, applicationId)
  const [localNotices, setLocalNotices] = useState<EducationInProgressNotice[]>(() =>
    getMockEducationInProgressNotices(programId),
  )
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null)
  const remoteDetail = useApplicationNoticeDetailQuery(
    applicationType,
    applicationId,
    remoteNotices.enabled ? selectedNoticeId : null,
  )

  const notices = useMemo(() => {
    const source = remoteNotices.enabled ? remoteNotices.items : localNotices
    if (!remoteDetail.detail || !selectedNoticeId) return source
    return source.map(notice =>
      notice.id === selectedNoticeId ? { ...notice, ...remoteDetail.detail?.notice } : notice,
    )
  }, [localNotices, remoteDetail.detail, remoteNotices.enabled, remoteNotices.items, selectedNoticeId])

  const files = useMemo(() => {
    if (remoteNotices.enabled) return remoteDetail.detail?.files ?? []
    return getMockEducationInProgressFiles(programId)
  }, [programId, remoteDetail.detail?.files, remoteNotices.enabled])

  const filteredFiles = useMemo(() => {
    const query = debouncedFileQuery.trim().toLowerCase()
    if (!query) return files
    return files.filter(file => file.fileName.toLowerCase().includes(query))
  }, [files, debouncedFileQuery])

  const openComingSoon = () => {
    setIsComingSoonOpen(true)
  }

  const openNoticeDetail = (noticeId: string) => {
    if (!remoteNotices.enabled) {
      setLocalNotices(prev =>
        prev.map(notice => (notice.id === noticeId ? { ...notice, read: true } : notice)),
      )
    }
    setSelectedNoticeId(noticeId)
  }

  const handleDownloadFile = (file: EducationInProgressFile) => {
    downloadEducationNoticeFile(file)
  }

  const handleViewOriginal = (file: EducationInProgressFile) => {
    if (file.postId) {
      openNoticeDetail(file.postId)
      return
    }
    openComingSoon()
  }

  const deleteNotice = (noticeId: string) => {
    if (!remoteNotices.enabled) {
      setLocalNotices(prev => prev.filter(notice => notice.id !== noticeId))
    }
    setSelectedNoticeId(null)
  }

  if (remoteNotices.isLoading) return null
  if (remoteNotices.isError) {
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
        안내사항을 불러오지 못했습니다.
      </PFText>
    )
  }

  const hasNotices = notices.length > 0
  const hasFiles = files.length > 0
  const hasFileQuery = debouncedFileQuery.trim().length > 0

  return (
    <div className={styles.shell}>
      <div className={styles.mainColumn}>
        {leading}
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
      </div>

      <div className={styles.files}>
        <PFSearchInput
          className={styles.search}
          variant="outlined"
          placeholder="파일명으로 검색해 보세요."
          aria-label="파일명으로 검색해 보세요."
          value={draftFileQuery}
          onValueChange={setDraftFileQuery}
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
                onDownload={handleDownloadFile}
                onViewOriginal={handleViewOriginal}
              />
            ))}
          </div>
        )}

        <div className={styles.footer}>
          <PFButton variant="text" onClick={() => setIsProgramInfoOpen(true)}>
            프로그램 정보
          </PFButton>
          <span className={styles.actionDivider} aria-hidden="true" />
          <PFButton variant="text" onClick={() => setIsApplicationInfoOpen(true)}>
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
          if (!remoteNotices.enabled) {
            setLocalNotices(prev =>
              prev.map(notice =>
                notice.id === noticeId ? { ...notice, reactionCount } : notice,
              ),
            )
          }
        }}
        onCommentCountChange={(noticeId, commentCount) => {
          if (!remoteNotices.enabled) {
            setLocalNotices(prev =>
              prev.map(notice =>
                notice.id === noticeId ? { ...notice, commentCount } : notice,
              ),
            )
          }
        }}
      />

      <EducationProgramInfoModal
        open={isProgramInfoOpen}
        program={program}
        onClose={() => setIsProgramInfoOpen(false)}
      />

      <EducationApplicationInfoModal
        open={isApplicationInfoOpen}
        selfIntroMotivation={selfIntroMotivation}
        preferredEducationScheduleLabel={preferredEducationScheduleLabel}
        onClose={() => setIsApplicationInfoOpen(false)}
      />

      <PFAlertModal
        open={isComingSoonOpen}
        title="준비 중"
        onConfirm={() => setIsComingSoonOpen(false)}
      />
    </div>
  )
}
