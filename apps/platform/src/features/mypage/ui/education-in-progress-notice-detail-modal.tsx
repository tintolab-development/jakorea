import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { getReactionEmojiTypeForBarIndex, REACTION_EMOJI_TYPE_TO_INDEX } from '@jakorea/ui'
import type {
  EducationInProgressFile,
  EducationInProgressNotice,
} from '../model/education-in-progress-notice-types'
import { getNoticeAttachments } from '../model/education-in-progress-notice-types'
import { formatEducationNoticePublishedAt } from '../lib/education-in-progress-notice-format'
import {
  getNoticeReactions,
  getNoticeReactionUsers,
  toggleNoticeReaction,
} from '../lib/mock-education-in-progress-notice-reactions'
import { MOCK_MYPAGE_USER_NAME } from '../lib/constants'
import moreVerticalUrl from '../assets/icon/more-vertical.svg'
import noticeIconEmojiUrl from '../assets/icon/notice-icon-emoji.svg'
import rChevronDownGray22Url from '@/shared/assets/icons/r-chevron-down-gray-22.svg'
import rChevronUpGray22Url from '@/shared/assets/icons/r-chevron-up-gray-22.svg'
import clipBlackUrl from '@/shared/assets/icons/clip-black.svg'
import fileDownloadGrayUrl from '@/shared/assets/icons/file-download-gray.svg'
import jaSendGrayUrl from '@/shared/assets/icons/ja-send-gray.svg'
import closeIconUrl from '@/shared/ui/pf-modal/icons/close.svg'
import { downloadAttachment } from '@/shared/lib/download-attachment'
import { PFAlertModal, PFCarouselButton, PFModal, PFOptionList, PFText } from '@/shared/ui'
import { EducationNoticeDeleteConfirm } from './education-notice-delete-confirm'
import { EducationNoticeReactionEmojiPicker } from './education-notice-reaction-emoji-picker'
import { EducationNoticeReactionUserList } from './education-notice-reaction-user-list'
import { EducationNoticeStats } from './education-notice-stats'
import styles from './education-in-progress-notice-detail-modal.module.css'

type EducationInProgressNoticeDetailModalProps = {
  open: boolean
  notices: EducationInProgressNotice[]
  files: EducationInProgressFile[]
  noticeId: string | null
  onClose: () => void
  onNoticeChange: (noticeId: string) => void
  onDelete: (noticeId: string) => void
  onReactionCountChange?: (noticeId: string, reactionCount: number) => void
}

const AUTHOR_MENU_OPTIONS = [
  { value: 'edit', label: '수정하기' },
  { value: 'delete', label: '삭제하기' },
]

export function EducationInProgressNoticeDetailModal({
  open,
  notices,
  files,
  noticeId,
  onClose,
  onNoticeChange,
  onDelete,
  onReactionCountChange,
}: EducationInProgressNoticeDetailModalProps) {
  const [comment, setComment] = useState('')
  const [isAuthorMenuOpen, setIsAuthorMenuOpen] = useState(false)
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isAttachmentListOpen, setIsAttachmentListOpen] = useState(false)
  const [reactionPanel, setReactionPanel] = useState<'list' | 'picker' | null>(null)
  const [reactionTick, setReactionTick] = useState(0)
  const reactionListRef = useRef<HTMLDivElement>(null)
  const reactionPickerRef = useRef<HTMLDivElement>(null)
  const authorMenuRef = useRef<HTMLDivElement>(null)
  const authorMenuId = useId()

  const currentIndex = noticeId ? notices.findIndex(notice => notice.id === noticeId) : -1
  const notice = currentIndex >= 0 ? notices[currentIndex] : undefined
  const attachments = notice ? getNoticeAttachments(notice.id, files) : []
  const singleAttachment = attachments.length === 1 ? attachments[0] : undefined
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex >= 0 && currentIndex < notices.length - 1

  const reactions = useMemo(
    () => (notice ? getNoticeReactions(notice.id) : []),
    [notice, reactionTick],
  )
  const reactionUsers = useMemo(
    () => (notice ? getNoticeReactionUsers(notice.id) : []),
    [notice, reactionTick],
  )
  const myReactionType = reactionUsers.find(
    row => row.authorName === MOCK_MYPAGE_USER_NAME,
  )?.emojiType
  const selectedEmojiIndex =
    myReactionType != null ? (REACTION_EMOJI_TYPE_TO_INDEX[myReactionType] ?? null) : null

  useEffect(() => {
    setIsAttachmentListOpen(false)
    setReactionPanel(null)
    if (!open) {
      setComment('')
      setIsAuthorMenuOpen(false)
      setIsDeleteConfirmOpen(false)
    }
  }, [open, noticeId])

  useEffect(() => {
    if (!reactionPanel) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (reactionListRef.current?.contains(target)) return
      if (reactionPickerRef.current?.contains(target)) return
      setReactionPanel(null)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setReactionPanel(null)
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [reactionPanel])

  useEffect(() => {
    if (!isAuthorMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (authorMenuRef.current?.contains(target)) return
      setIsAuthorMenuOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsAuthorMenuOpen(false)
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isAuthorMenuOpen])

  if (!notice) {
    return (
      <PFAlertModal
        open={isComingSoonOpen}
        title="준비 중"
        onConfirm={() => setIsComingSoonOpen(false)}
      />
    )
  }

  const publishedAtLabel = formatEducationNoticePublishedAt(notice.publishedAt)

  const handlePrev = () => {
    if (!canGoPrev) return
    const prev = notices[currentIndex - 1]
    if (prev) onNoticeChange(prev.id)
  }

  const handleNext = () => {
    if (!canGoNext) return
    const next = notices[currentIndex + 1]
    if (next) onNoticeChange(next.id)
  }

  const handleAuthorMenuSelect = (value: string) => {
    setIsAuthorMenuOpen(false)
    if (value === 'delete') {
      setIsDeleteConfirmOpen(true)
      return
    }
    setIsComingSoonOpen(true)
  }

  const handleDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false)
    onDelete(notice.id)
  }

  const handleDownload = (fileName: string) => {
    downloadAttachment(fileName)
  }

  const handleReactionEmojiSelect = (index: number) => {
    const emojiType = getReactionEmojiTypeForBarIndex(index)
    if (!emojiType) return
    const { reactionCount } = toggleNoticeReaction(notice.id, emojiType, MOCK_MYPAGE_USER_NAME)
    setReactionTick(tick => tick + 1)
    onReactionCountChange?.(notice.id, reactionCount)
  }

  return (
    <>
      <PFModal
        open={open}
        onClose={onClose}
        size="lg"
        mobilePlacement="full"
        className={styles.modal}
        ariaLabelledBy="education-notice-detail-author"
      >
        <PFCarouselButton
          className={[styles.carouselButton, styles.carouselPrev].join(' ')}
          size="large"
          direction="left"
          aria-label="이전 안내사항"
          disabled={!canGoPrev}
          onClick={handlePrev}
        />
        <PFCarouselButton
          className={[styles.carouselButton, styles.carouselNext].join(' ')}
          size="large"
          direction="right"
          aria-label="다음 안내사항"
          disabled={!canGoNext}
          onClick={handleNext}
        />

        <div className={styles.shell}>
          <div className={styles.body}>
            <div className={styles.stickyTop}>
              <header className={styles.header}>
                <div className={styles.meta}>
                  <PFText
                    as="p"
                    typo="bd-md-sb"
                    color="black"
                    id="education-notice-detail-author"
                    className={styles.author}
                  >
                    {notice.authorName}
                  </PFText>
                  <div className={styles.dateRow}>
                    <PFText
                      as="span"
                      typo="bd-sm-rg"
                      color="neutral-cool-500"
                      className={styles.date}
                    >
                      {publishedAtLabel}
                    </PFText>
                    <span className={styles.dot} aria-hidden="true" />
                    <PFText
                      as="span"
                      typo="bd-sm-sb"
                      color={notice.read ? 'neutral-cool-700' : 'primary-500'}
                      className={styles.readStatus}
                    >
                      {notice.read ? '읽음' : '안읽음'}
                    </PFText>
                  </div>
                </div>

                <div className={styles.headerActions}>
                  {notice.isAuthor ? (
                    <div className={styles.moreWrap} ref={authorMenuRef}>
                      <button
                        type="button"
                        className={styles.iconButton}
                        aria-label="더보기"
                        aria-haspopup="menu"
                        aria-expanded={isAuthorMenuOpen}
                        aria-controls={isAuthorMenuOpen ? authorMenuId : undefined}
                        onClick={() => setIsAuthorMenuOpen(open => !open)}
                      >
                        <img
                          className={styles.moreIcon}
                          src={moreVerticalUrl}
                          alt=""
                          aria-hidden="true"
                        />
                      </button>
                      {isAuthorMenuOpen ? (
                        <PFOptionList
                          id={authorMenuId}
                          className={styles.moreMenu}
                          role="menu"
                          options={AUTHOR_MENU_OPTIONS}
                          onSelect={handleAuthorMenuSelect}
                        />
                      ) : null}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label="닫기"
                    onClick={onClose}
                  >
                    <img className={styles.closeIcon} src={closeIconUrl} alt="" aria-hidden="true" />
                  </button>
                </div>
              </header>

              {singleAttachment ? (
                <button
                  type="button"
                  className={styles.attachment}
                  onClick={() => handleDownload(singleAttachment.fileName)}
                  aria-label={`${singleAttachment.fileName} 다운로드`}
                >
                  <span className={styles.attachmentMain}>
                    <img
                      className={styles.clipIcon}
                      src={clipBlackUrl}
                      alt=""
                      width={24}
                      height={24}
                      aria-hidden="true"
                    />
                    <PFText as="span" typo="bd-md-sb" color="black" className={styles.attachmentName}>
                      {singleAttachment.fileName}
                    </PFText>
                  </span>
                  <img
                    className={styles.downloadIcon}
                    src={fileDownloadGrayUrl}
                    alt=""
                    width={24}
                    height={24}
                    aria-hidden="true"
                  />
                </button>
              ) : attachments.length > 1 ? (
                <div className={styles.attachmentGroup}>
                  <div className={styles.attachmentGroupHeader}>
                    <span className={styles.attachmentMain}>
                      <img
                        className={styles.clipIcon}
                        src={clipBlackUrl}
                        alt=""
                        width={24}
                        height={24}
                        aria-hidden="true"
                      />
                      <PFText as="span" typo="bd-md-sb" color="black">
                        {`${attachments.length}개의 첨부파일`}
                      </PFText>
                    </span>
                    <button
                      type="button"
                      className={styles.attachmentToggle}
                      aria-expanded={isAttachmentListOpen}
                      aria-label={isAttachmentListOpen ? '첨부파일 목록 닫기' : '첨부파일 목록 열기'}
                      onClick={() => setIsAttachmentListOpen(open => !open)}
                    >
                      <img
                        className={styles.attachmentChevron}
                        src={
                          isAttachmentListOpen ? rChevronUpGray22Url : rChevronDownGray22Url
                        }
                        alt=""
                        width={22}
                        height={22}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  {isAttachmentListOpen ? (
                    <ul className={styles.attachmentList}>
                      {attachments.map(file => (
                        <li key={file.id}>
                          <button
                            type="button"
                            className={styles.attachmentRow}
                            onClick={() => handleDownload(file.fileName)}
                            aria-label={`${file.fileName} 다운로드`}
                          >
                            <PFText
                              as="span"
                              typo="bd-md-sb"
                              color="black"
                              className={styles.attachmentName}
                            >
                              {file.fileName}
                            </PFText>
                            <img
                              className={styles.downloadIcon}
                              src={fileDownloadGrayUrl}
                              alt=""
                              width={24}
                              height={24}
                              aria-hidden="true"
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className={styles.scroll}>
              <PFText as="div" typo="bd-md-md" color="black" className={styles.content}>
                {notice.content}
              </PFText>
            </div>
          </div>

          <footer className={styles.footer}>
            <div className={styles.reactionAnchor} ref={reactionListRef}>
              <EducationNoticeStats
                viewCount={notice.viewCount}
                commentCount={notice.commentCount}
                reactionCount={notice.reactionCount}
                reactionExpanded={reactionPanel === 'list'}
                onReactionClick={() =>
                  setReactionPanel(panel => (panel === 'list' ? null : 'list'))
                }
              />
              {reactionPanel === 'list' ? (
                <div className={styles.reactionListPopover}>
                  <EducationNoticeReactionUserList
                    reactions={reactions}
                    users={reactionUsers}
                  />
                </div>
              ) : null}
            </div>
            <div className={styles.commentRow}>
              <input
                className={styles.commentInput}
                type="text"
                value={comment}
                placeholder="댓글을 입력해 주세요"
                aria-label="댓글을 입력해 주세요"
                onChange={event => setComment(event.target.value)}
              />
              <button
                type="button"
                className={styles.sendButton}
                aria-label="댓글 전송"
                onClick={() => setIsComingSoonOpen(true)}
              >
                <img src={jaSendGrayUrl} alt="" width={24} height={24} aria-hidden="true" />
              </button>
              <div className={styles.reactionAnchor} ref={reactionPickerRef}>
                <button
                  type="button"
                  className={styles.emojiButton}
                  aria-label="이모지 반응"
                  aria-expanded={reactionPanel === 'picker'}
                  onClick={() =>
                    setReactionPanel(panel => (panel === 'picker' ? null : 'picker'))
                  }
                >
                  <img
                    className={styles.emojiIcon}
                    src={noticeIconEmojiUrl}
                    alt=""
                    width={40}
                    height={40}
                    aria-hidden="true"
                  />
                </button>
                {reactionPanel === 'picker' ? (
                  <div className={styles.reactionPickerPopover}>
                    <EducationNoticeReactionEmojiPicker
                      selectedIndex={selectedEmojiIndex}
                      onSelect={handleReactionEmojiSelect}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </footer>
        </div>
      </PFModal>

      <EducationNoticeDeleteConfirm
        open={isDeleteConfirmOpen}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      <PFAlertModal
        open={isComingSoonOpen}
        title="준비 중"
        onConfirm={() => setIsComingSoonOpen(false)}
      />
    </>
  )
}
