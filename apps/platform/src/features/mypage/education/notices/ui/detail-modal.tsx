import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import {
  getPlatformReactionEmojiIndex,
  getPlatformReactionEmojiTypeForIndex,
} from '../lib/reaction-emojis'
import type {
  EducationInProgressFile,
  EducationInProgressNotice,
} from '../model/types'
import { getNoticeAttachments } from '../model/types'
import { formatEducationNoticePublishedAt } from '../lib/format'
import {
  addNoticeComment,
  deleteNoticeComment,
  getNoticeComments,
  updateNoticeComment,
} from '../lib/mock-comments'
import {
  getNoticeReactions,
  getNoticeReactionUsers,
  toggleNoticeReaction,
} from '../lib/mock-reactions'
import { MOCK_MYPAGE_USER_NAME } from '../../../lib/constants'
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
import { EducationNoticeCommentDeleteConfirm } from './comment-delete-confirm'
import { EducationNoticeCommentList } from './comment-list'
import { EducationNoticeDeleteConfirm } from './delete-confirm'
import { EducationNoticeReactionEmojiPicker } from './reaction-emoji-picker'
import { EducationNoticeReactionUserList } from './reaction-user-list'
import { EducationNoticeStats } from './stats'
import styles from './detail-modal.module.css'

type EducationInProgressNoticeDetailModalProps = {
  open: boolean
  notices: EducationInProgressNotice[]
  files: EducationInProgressFile[]
  noticeId: string | null
  onClose: () => void
  onNoticeChange: (noticeId: string) => void
  onDelete: (noticeId: string) => void
  onReactionCountChange?: (noticeId: string, reactionCount: number) => void
  onCommentCountChange?: (noticeId: string, commentCount: number) => void
}

const AUTHOR_MENU_OPTIONS = [
  { value: 'edit', label: '수정하기' },
  { value: 'delete', label: '삭제하기' },
]

const REACTION_LIST_HEIGHT_PX = 249
const REACTION_LIST_MIN_HEIGHT_PX = 160
const REACTION_PICKER_HEIGHT_PX = 56
const REACTION_POPOVER_GAP_PX = 8
const REACTION_POPOVER_Z_INDEX = 1100

function computeReactionPopoverStyle(
  anchor: HTMLElement,
  align: 'left' | 'right',
  preferredHeight: number,
  minHeight: number,
  options?: { constrainHeight?: boolean }
): CSSProperties {
  const rect = anchor.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth
  const spaceAbove = Math.max(0, rect.top - REACTION_POPOVER_GAP_PX)
  const spaceBelow = Math.max(0, viewportHeight - rect.bottom - REACTION_POPOVER_GAP_PX)
  const openUpward = spaceAbove >= minHeight || spaceAbove >= spaceBelow
  const available = openUpward ? spaceAbove : spaceBelow
  const height = Math.min(preferredHeight, Math.max(minHeight, available || minHeight))

  return {
    position: 'fixed',
    top: openUpward ? undefined : rect.bottom + REACTION_POPOVER_GAP_PX,
    bottom: openUpward ? viewportHeight - rect.top + REACTION_POPOVER_GAP_PX : undefined,
    left: align === 'left' ? rect.left : undefined,
    right: align === 'right' ? viewportWidth - rect.right : undefined,
    ...(options?.constrainHeight === false ? undefined : { maxHeight: height }),
    zIndex: REACTION_POPOVER_Z_INDEX,
  }
}

export function EducationInProgressNoticeDetailModal({
  open,
  notices,
  files,
  noticeId,
  onClose,
  onNoticeChange,
  onDelete,
  onReactionCountChange,
  onCommentCountChange,
}: EducationInProgressNoticeDetailModalProps) {
  const [comment, setComment] = useState('')
  const [isAuthorMenuOpen, setIsAuthorMenuOpen] = useState(false)
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null)
  const [isAttachmentListOpen, setIsAttachmentListOpen] = useState(false)
  const [isCommentListOpen, setIsCommentListOpen] = useState(false)
  const [reactionPanel, setReactionPanel] = useState<'list' | 'picker' | null>(null)
  const [reactionTick, setReactionTick] = useState(0)
  const [commentTick, setCommentTick] = useState(0)
  const [listPopoverStyle, setListPopoverStyle] = useState<CSSProperties | null>(null)
  const [pickerPopoverStyle, setPickerPopoverStyle] = useState<CSSProperties | null>(null)
  const reactionListRef = useRef<HTMLDivElement>(null)
  const reactionListPopoverRef = useRef<HTMLDivElement>(null)
  const reactionPickerRef = useRef<HTMLDivElement>(null)
  const reactionPickerPopoverRef = useRef<HTMLDivElement>(null)
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
    [notice, reactionTick]
  )
  const reactionUsers = useMemo(
    () => (notice ? getNoticeReactionUsers(notice.id) : []),
    [notice, reactionTick]
  )
  const comments = useMemo(
    () => (notice ? getNoticeComments(notice.id) : []),
    [notice, commentTick]
  )
  const myReactionType = reactionUsers.find(
    row => row.authorName === MOCK_MYPAGE_USER_NAME
  )?.emojiType
  const selectedEmojiIndex =
    myReactionType != null ? getPlatformReactionEmojiIndex(myReactionType) : null

  useEffect(() => {
    setIsAttachmentListOpen(false)
    setReactionPanel(null)
    setIsCommentListOpen(false)
    setCommentToDeleteId(null)
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
      if (reactionListPopoverRef.current?.contains(target)) return
      if (reactionPickerRef.current?.contains(target)) return
      if (reactionPickerPopoverRef.current?.contains(target)) return
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

  useLayoutEffect(() => {
    if (reactionPanel !== 'list') {
      setListPopoverStyle(null)
      return
    }

    const updatePosition = () => {
      const anchor = reactionListRef.current
      if (!anchor) return
      setListPopoverStyle(
        computeReactionPopoverStyle(
          anchor,
          'left',
          REACTION_LIST_HEIGHT_PX,
          REACTION_LIST_MIN_HEIGHT_PX
        )
      )
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [reactionPanel])

  useLayoutEffect(() => {
    if (reactionPanel !== 'picker') {
      setPickerPopoverStyle(null)
      return
    }

    const updatePosition = () => {
      const anchor = reactionPickerRef.current
      if (!anchor) return
      setPickerPopoverStyle(
        computeReactionPopoverStyle(
          anchor,
          'right',
          REACTION_PICKER_HEIGHT_PX,
          REACTION_PICKER_HEIGHT_PX,
          { constrainHeight: false }
        )
      )
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
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
    const emojiType = getPlatformReactionEmojiTypeForIndex(index)
    if (!emojiType) return
    const { reactionCount } = toggleNoticeReaction(notice.id, emojiType, MOCK_MYPAGE_USER_NAME)
    setReactionTick(tick => tick + 1)
    onReactionCountChange?.(notice.id, reactionCount)
    if (reactionCount === 0 && reactionPanel === 'list') setReactionPanel(null)
  }

  const handleReactionListToggle = () => {
    if (notice.reactionCount <= 0) return
    setReactionPanel(panel => (panel === 'list' ? null : 'list'))
  }

  const handleCommentListToggle = () => {
    setIsCommentListOpen(open => !open)
  }

  const handleCommentSubmit = () => {
    const content = comment.trim()
    if (!content) return
    const { commentCount } = addNoticeComment(notice.id, MOCK_MYPAGE_USER_NAME, content)
    setComment('')
    setCommentTick(tick => tick + 1)
    setIsCommentListOpen(true)
    onCommentCountChange?.(notice.id, commentCount)
  }

  const handleCommentUpdate = (commentId: string, content: string) => {
    updateNoticeComment(commentId, content)
    setCommentTick(tick => tick + 1)
  }

  const handleCommentDeleteConfirm = () => {
    if (!commentToDeleteId) return
    const result = deleteNoticeComment(commentToDeleteId)
    setCommentToDeleteId(null)
    if (!result) return
    setCommentTick(tick => tick + 1)
    onCommentCountChange?.(result.noticeId, result.commentCount)
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
                    <img
                      className={styles.closeIcon}
                      src={closeIconUrl}
                      alt=""
                      aria-hidden="true"
                    />
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
                    <PFText
                      as="span"
                      typo="bd-md-sb"
                      color="black"
                      className={styles.attachmentName}
                    >
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
                      aria-label={
                        isAttachmentListOpen ? '첨부파일 목록 닫기' : '첨부파일 목록 열기'
                      }
                      onClick={() => setIsAttachmentListOpen(open => !open)}
                    >
                      <img
                        className={styles.attachmentChevron}
                        src={isAttachmentListOpen ? rChevronUpGray22Url : rChevronDownGray22Url}
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
                commentExpanded={isCommentListOpen}
                onCommentClick={handleCommentListToggle}
                onReactionClick={
                  notice.reactionCount > 0 ? handleReactionListToggle : undefined
                }
              />
              {reactionPanel === 'list' && listPopoverStyle
                ? createPortal(
                    <div
                      ref={reactionListPopoverRef}
                      className={styles.reactionListPopover}
                      style={listPopoverStyle}
                    >
                      <EducationNoticeReactionUserList
                        reactions={reactions}
                        users={reactionUsers}
                      />
                    </div>,
                    document.body
                  )
                : null}
            </div>
            {isCommentListOpen ? (
              <EducationNoticeCommentList
                className={styles.footerComments}
                comments={comments}
                currentUserName={MOCK_MYPAGE_USER_NAME}
                onUpdate={handleCommentUpdate}
                onDeleteRequest={setCommentToDeleteId}
              />
            ) : null}
            <div className={styles.commentRow}>
              <input
                className={styles.commentInput}
                type="text"
                value={comment}
                placeholder="댓글을 입력해 주세요"
                aria-label="댓글을 입력해 주세요"
                onChange={event => setComment(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleCommentSubmit()
                  }
                }}
              />
              <button
                type="button"
                className={styles.sendButton}
                aria-label="댓글 전송"
                disabled={comment.trim().length === 0}
                onClick={handleCommentSubmit}
              >
                <img src={jaSendGrayUrl} alt="" width={40} height={40} aria-hidden="true" />
              </button>
              <div className={styles.reactionAnchor} ref={reactionPickerRef}>
                <button
                  type="button"
                  className={styles.emojiButton}
                  aria-label="이모지 반응"
                  aria-expanded={reactionPanel === 'picker'}
                  onClick={() => setReactionPanel(panel => (panel === 'picker' ? null : 'picker'))}
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
                {reactionPanel === 'picker' && pickerPopoverStyle
                  ? createPortal(
                      <div
                        ref={reactionPickerPopoverRef}
                        className={styles.reactionPickerPopover}
                        style={pickerPopoverStyle}
                      >
                        <EducationNoticeReactionEmojiPicker
                          selectedIndex={selectedEmojiIndex}
                          onSelect={handleReactionEmojiSelect}
                        />
                      </div>,
                      document.body
                    )
                  : null}
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

      <EducationNoticeCommentDeleteConfirm
        open={commentToDeleteId !== null}
        onCancel={() => setCommentToDeleteId(null)}
        onConfirm={handleCommentDeleteConfirm}
      />

      <PFAlertModal
        open={isComingSoonOpen}
        title="준비 중"
        onConfirm={() => setIsComingSoonOpen(false)}
      />
    </>
  )
}
