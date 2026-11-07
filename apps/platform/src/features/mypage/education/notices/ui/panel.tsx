import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ProgramDetail } from '@/features/program'
import { EducationNoticePanelSkeleton } from '@/features/mypage/shared/ui'
import {
  useApplicationNoticeDetailQuery,
  useApplicationNoticeFiles,
  useApplicationNoticesQuery,
} from '../../applications/api/activity-hooks'
import type { ProgramApplicationType } from '../../applications/api/types'
import type { GeminiOfficialDocumentDisplay } from '../../applications/lib/official-document-from-answers'
import { EducationApplicationInfoModal } from '../../applications/ui/application-info-modal'
import illustQuotationUrl from '@/shared/assets/illustration/illust-quotation-no-bg.svg'
import { useDebouncedValue } from '@/shared/hooks'
import type { EducationInProgressFile, EducationInProgressNotice } from '../model/types'
import {
  downloadEducationNoticeFile,
  downloadRemoteEducationNoticeFile,
  hasRemoteDownloadPath,
} from '../lib/download-file'
import {
  readCommentIdFromLocation,
  readNoticeIdFromLocation,
  writeNoticeIdToLocation,
} from '../lib/notice-url'
import { EducationInProgressFileRow } from './file-row'
import { EducationInProgressNoticeCard } from './card'
import { EducationInProgressNoticeDetailModal } from './detail-modal'
import { EducationProgramInfoModal } from './program-info-modal'
import { EducationProgramNoticeWriteModal } from './notice-write-modal'
import { PFAlertModal, PFButton, PFSearchInput, PFText } from '@/shared/ui'
import styles from './panel.module.css'

const SEARCH_DEBOUNCE_MS = 500

type EducationInProgressNoticePanelProps = {
  program: ProgramDetail
  selfIntroMotivation?: string
  preferredEducationScheduleLabel?: string
  preferredEducationScheduleLines?: readonly string[]
  alwaysShowPreferredSchedule?: boolean
  instructorAvailableScheduleLines?: readonly string[]
  instructorAvailableScheduleUnresolved?: boolean
  availableScheduleTitle?: string
  officialDocument?: GeminiOfficialDocumentDisplay | null
  /** 진행중 「신청 정보」 팝업 — 교사·기관 신청 내용 탭과 동일 */
  applicationInfoBody?: ReactNode
  /** 봉사현황 기관 안내사항 등 — 안내 목록 위 슬롯 */
  leading?: ReactNode
  applicationType?: ProgramApplicationType | null
  applicationId?: string | null
  /** 안내사항 게시글 작성 — `canWriteEducationNotice` (사전 안내와 별개) */
  noticeWriteEnabled?: boolean
  noticeWriteAuthorDisplayName?: string
}

export function EducationInProgressNoticePanel({
  program,
  selfIntroMotivation,
  preferredEducationScheduleLabel,
  preferredEducationScheduleLines,
  alwaysShowPreferredSchedule,
  instructorAvailableScheduleLines,
  instructorAvailableScheduleUnresolved,
  availableScheduleTitle,
  officialDocument,
  applicationInfoBody,
  leading,
  applicationType,
  applicationId,
  noticeWriteEnabled = false,
  noticeWriteAuthorDisplayName = '담당교사님',
}: EducationInProgressNoticePanelProps) {
  const [isNoticeWriteOpen, setIsNoticeWriteOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<EducationInProgressNotice | null>(null)
  const [editingNoticeAttachments, setEditingNoticeAttachments] = useState<
    EducationInProgressFile[]
  >([])
  const [isProgramInfoOpen, setIsProgramInfoOpen] = useState(false)
  const [isApplicationInfoOpen, setIsApplicationInfoOpen] = useState(false)
  const [draftFileQuery, setDraftFileQuery] = useState('')
  const debouncedFileQuery = useDebouncedValue(draftFileQuery, SEARCH_DEBOUNCE_MS)
  const remoteNotices = useApplicationNoticesQuery(applicationType, applicationId)
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(readNoticeIdFromLocation)
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(readCommentIdFromLocation)
  const [downloadErrorOpen, setDownloadErrorOpen] = useState(false)
  /** 이 패널이 push 한 history 엔트리 위에 있으면 닫을 때 back 으로 되돌린다. */
  const pushedNoticeEntryRef = useRef(false)
  const remoteDetail = useApplicationNoticeDetailQuery(
    applicationType,
    applicationId,
    remoteNotices.enabled ? selectedNoticeId : null,
  )

  const notices = remoteNotices.enabled ? remoteNotices.items : []
  /** 상세 본문은 팝업에만 합친다 — 목록 카드에 넣으면 열린 카드만 높이가 바뀌어 순서가 바뀐 듯 보인다 */
  const modalNotices = useMemo(() => {
    const detailNotice = remoteDetail.detail?.notice
    if (!detailNotice || !selectedNoticeId) return notices
    return notices.map(notice => {
      if (notice.id !== selectedNoticeId) return notice
      // 반응 수는 목록 invalidate·반응 쿼리가 최신이다. 상세 스냅샷으로 덮지 않는다.
      return { ...notice, ...detailNotice, reactionCount: notice.reactionCount }
    })
  }, [notices, remoteDetail.detail, selectedNoticeId])

  const remoteFiles = useApplicationNoticeFiles(
    applicationType,
    applicationId,
    remoteNotices.items,
    debouncedFileQuery,
  )
  const files = useMemo(() => {
    if (remoteNotices.enabled) return remoteFiles.files
    return []
  }, [remoteFiles.files, remoteNotices.enabled])

  const filteredFiles = useMemo(() => {
    if (remoteNotices.enabled && remoteFiles.isFullList) return files
    const query = debouncedFileQuery.trim().toLowerCase()
    if (!query) return files
    return files.filter(file => file.fileName.toLowerCase().includes(query))
  }, [debouncedFileQuery, files, remoteFiles.isFullList, remoteNotices.enabled])

  useEffect(() => {
    const handlePopState = () => {
      pushedNoticeEntryRef.current = false
      setSelectedNoticeId(readNoticeIdFromLocation())
      setSelectedCommentId(readCommentIdFromLocation())
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const closeNoticeDetail = () => {
    setSelectedNoticeId(null)
    if (pushedNoticeEntryRef.current && readNoticeIdFromLocation()) {
      pushedNoticeEntryRef.current = false
      window.history.back()
      return
    }
    pushedNoticeEntryRef.current = false
    writeNoticeIdToLocation(null, 'replace')
  }

  const isNoticeListReady = !remoteNotices.isLoading && !remoteNotices.isError
  const isSelectedNoticeMissing =
    selectedNoticeId !== null && !notices.some(notice => notice.id === selectedNoticeId)
  const shouldDropSelectedNotice =
    isNoticeListReady && (isSelectedNoticeMissing || remoteDetail.isError)

  useEffect(() => {
    if (!shouldDropSelectedNotice) return
    pushedNoticeEntryRef.current = false
    setSelectedNoticeId(null)
    writeNoticeIdToLocation(null, 'replace')
  }, [shouldDropSelectedNotice])

  const openNoticeEdit = (noticeId: string, noticeAttachments: EducationInProgressFile[]) => {
    const target = modalNotices.find(notice => notice.id === noticeId)
    if (!target) return
    setEditingNotice(target)
    setEditingNoticeAttachments(noticeAttachments)
    closeNoticeDetail()
  }

  const openNoticeDetail = (noticeId: string) => {
    if (selectedNoticeId === null) {
      writeNoticeIdToLocation(noticeId, 'push')
      pushedNoticeEntryRef.current = true
    } else {
      writeNoticeIdToLocation(noticeId, 'replace')
    }
    setSelectedNoticeId(noticeId)
  }

  const handleDownloadFile = (file: EducationInProgressFile) => {
    if (!hasRemoteDownloadPath(file)) {
      downloadEducationNoticeFile(file)
      return
    }
    downloadRemoteEducationNoticeFile(file).catch(() => setDownloadErrorOpen(true))
  }

  const handleViewOriginal = (file: EducationInProgressFile) => {
    if (file.postId) {
      openNoticeDetail(file.postId)
    }
  }

  const deleteNotice = (_noticeId: string) => {
    closeNoticeDetail()
  }

  if (remoteNotices.isLoading) {
    return <EducationNoticePanelSkeleton />
  }
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

        {hasFileQuery && filteredFiles.length === 0 ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={styles.searchEmpty}>
            검색 결과가 없습니다.
          </PFText>
        ) : !hasFiles ? (
          <div className={styles.filesEmpty}>
            <PFText as="p" typo="bd-md-bd" color="black" className={styles.filesEmptyTitle}>
              첨부된 파일이 없어요
            </PFText>
            <PFText as="p" typo="bd-sm-rg" color="neutral-cool-500" className={styles.filesEmptyDescription}>
              첨부파일이 등록되면 이곳에서 확인할 수 있어요.
            </PFText>
          </div>
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

        {noticeWriteEnabled && applicationType && applicationId ? (
          <PFButton
            type="button"
            className={styles.noticeWriteCta}
            variant="secondary"
            size="xlarge"
            width="100%"
            onClick={() => setIsNoticeWriteOpen(true)}
          >
            안내사항 작성하기
          </PFButton>
        ) : null}
      </div>

      <EducationInProgressNoticeDetailModal
        open={selectedNoticeId !== null}
        notices={modalNotices}
        files={files}
        noticeId={selectedNoticeId}
        commentId={selectedCommentId}
        onClose={closeNoticeDetail}
        onNoticeChange={openNoticeDetail}
        onEdit={openNoticeEdit}
        onDelete={deleteNotice}
        applicationType={applicationType}
        applicationId={applicationId}
        onReactionCountChange={undefined}
        onCommentCountChange={undefined}
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
        preferredEducationScheduleLines={preferredEducationScheduleLines}
        alwaysShowPreferredSchedule={alwaysShowPreferredSchedule}
        instructorAvailableScheduleLines={instructorAvailableScheduleLines}
        instructorAvailableScheduleUnresolved={instructorAvailableScheduleUnresolved}
        availableScheduleTitle={availableScheduleTitle}
        officialDocument={officialDocument}
        applicationBody={applicationInfoBody}
        onClose={() => setIsApplicationInfoOpen(false)}
      />

      {noticeWriteEnabled && applicationType && applicationId ? (
        <EducationProgramNoticeWriteModal
          open={isNoticeWriteOpen || editingNotice != null}
          onClose={() => {
            setIsNoticeWriteOpen(false)
            setEditingNotice(null)
            setEditingNoticeAttachments([])
          }}
          applicationType={applicationType}
          applicationId={applicationId}
          program={program}
          authorDisplayName={noticeWriteAuthorDisplayName}
          notice={editingNotice}
          existingAttachments={editingNoticeAttachments}
        />
      ) : null}

      <PFAlertModal
        open={downloadErrorOpen}
        title="첨부파일을 내려받지 못했습니다."
        onConfirm={() => setDownloadErrorOpen(false)}
      />
    </div>
  )
}
