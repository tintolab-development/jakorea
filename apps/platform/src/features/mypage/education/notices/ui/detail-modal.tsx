import {
  useCallback,
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
  PLATFORM_REACTION_EMOJI_ITEMS,
} from '../lib/reaction-emojis'
import type {
  EducationInProgressFile,
  EducationInProgressNotice,
} from '../model/types'
import { getNoticeAttachments } from '../model/types'
import { formatEducationNoticePublishedAt } from '../lib/format'
import { useMypageMember } from '../../../hooks/use-mypage-member'
import { MOCK_MYPAGE_USER_NAME } from '../../../lib/constants'
import {
  useApplicationNoticeCommentMutations,
  useApplicationNoticeDetailQuery,
  useApplicationNoticeReactionsQuery,
  useToggleApplicationNoticeReactionMutation,
} from '../../applications/api/activity-hooks'
import { fetchApplicationNoticeInlineImageSrc } from '../../applications/api/activity-client'
import type { ProgramApplicationType } from '../../applications/api/types'
import { RichTextViewer } from '@/shared/rich-text'
import { downloadRemoteEducationNoticeFile, hasRemoteDownloadPath } from '../lib/download-file'
import moreVerticalUrl from '../assets/icon/more-vertical.svg'
import noticeIconEmojiUrl from '../assets/icon/notice-icon-emoji.svg'
import rChevronDownGray22Url from '@/shared/assets/icons/r-chevron-down-gray-22.svg'
import rChevronUpGray22Url from '@/shared/assets/icons/r-chevron-up-gray-22.svg'
import clipBlackUrl from '@/shared/assets/icons/clip-black.svg'
import fileDownloadGrayUrl from '@/shared/assets/icons/file-download-gray.svg'
import jaSendGrayUrl from '@/shared/assets/icons/ja-send-gray.svg'
import jaSendMintUrl from '@/shared/assets/icons/ja-send-mint.svg'
import closeIconUrl from '@/shared/ui/pf-modal/icons/close.svg'
import { downloadAttachment } from '@/shared/lib/download-attachment'
import {
  PFAlertModal,
  PFCarouselButton,
  PFLoadingSpinner,
  PFModal,
  PFOptionList,
  PFText,
} from '@/shared/ui'
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
  commentId?: string | null
  onClose: () => void
  onNoticeChange: (noticeId: string) => void
  onDelete: (noticeId: string) => void
  onReactionCountChange?: (noticeId: string, reactionCount: number) => void
  onCommentCountChange?: (noticeId: string, commentCount: number) => void
  /** 원격 세션이면 댓글·반응을 회원 포탈 API로 처리 */
  applicationType?: ProgramApplicationType | null
  applicationId?: string | null
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
  commentId,
  onClose,
  onNoticeChange,
  onDelete,
  onReactionCountChange: _onReactionCountChange,
  onCommentCountChange: _onCommentCountChange,
  applicationType,
  applicationId,
}: EducationInProgressNoticeDetailModalProps) {
  const [comment, setComment] = useState('')
  const [isAuthorMenuOpen, setIsAuthorMenuOpen] = useState(false)
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null)
  const [isAttachmentListOpen, setIsAttachmentListOpen] = useState(false)
  const [isCommentListOpen, setIsCommentListOpen] = useState(false)
  const [reactionPanel, setReactionPanel] = useState<'list' | 'picker' | null>(null)
  const [listPopoverStyle, setListPopoverStyle] = useState<CSSProperties | null>(null)
  const [pickerPopoverStyle, setPickerPopoverStyle] = useState<CSSProperties | null>(null)
  const reactionListRef = useRef<HTMLDivElement>(null)
  const reactionListPopoverRef = useRef<HTMLDivElement>(null)
  const reactionPickerRef = useRef<HTMLDivElement>(null)
  const reactionPickerPopoverRef = useRef<HTMLDivElement>(null)
  const authorMenuRef = useRef<HTMLDivElement>(null)
  const authorMenuId = useId()
  const emojiPreviewClipId = useId().replace(/:/g, '')

  const currentIndex = noticeId ? notices.findIndex(notice => notice.id === noticeId) : -1
  const notice = currentIndex >= 0 ? notices[currentIndex] : undefined
  const attachments = notice ? getNoticeAttachments(notice.id, files) : []
  const singleAttachment = attachments.length === 1 ? attachments[0] : undefined
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex >= 0 && currentIndex < notices.length - 1

  const remoteNoticeId = open ? noticeId : null
  const remoteDetail = useApplicationNoticeDetailQuery(applicationType, applicationId, remoteNoticeId)
  const remoteReactions = useApplicationNoticeReactionsQuery(
    applicationType,
    applicationId,
    remoteNoticeId
  )
  const commentMutations = useApplicationNoticeCommentMutations(applicationType, applicationId)
  const toggleReactionMutation = useToggleApplicationNoticeReactionMutation(
    applicationType,
    applicationId
  )
  const isRemote = remoteDetail.enabled
  const resolveInlineImage = useCallback(
    (fileObjectId: number) => {
      if (!applicationType || !applicationId || !noticeId) {
        return Promise.reject(new Error('application scope is required'))
      }
      return fetchApplicationNoticeInlineImageSrc(
        applicationType,
        applicationId,
        noticeId,
        fileObjectId
      )
    },
    [applicationId, applicationType, noticeId]
  )
  const { displayName: memberDisplayName } = useMypageMember()
  const currentUserName = isRemote ? memberDisplayName : MOCK_MYPAGE_USER_NAME
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null)
  /** 댓글 입력창에서 고른 반응 — 전송 시 반영 (CMS comment-composer 와 동일) */
  const [draftEmojiIndex, setDraftEmojiIndex] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isContentImagesLoading, setIsContentImagesLoading] = useState(false)

  const remoteComments = useMemo(
    () =>
      (remoteDetail.detail?.comments ?? []).map(row =>
        row.mine && memberDisplayName ? { ...row, authorName: memberDisplayName } : row
      ),
    [memberDisplayName, remoteDetail.detail?.comments]
  )

  const remoteReactionUsers = useMemo(() => {
    if (remoteReactions.users) return remoteReactions.users
    if (!noticeId) return []
    return remoteReactions.myReactionTypes.map(emojiType => ({
      id: `${noticeId}-mine-${emojiType}`,
      noticeId,
      authorName: memberDisplayName || '나',
      emojiType,
      reactedAt: '',
    }))
  }, [memberDisplayName, noticeId, remoteReactions.myReactionTypes, remoteReactions.users])

  const reactions = isRemote ? remoteReactions.summary : []
  const reactionUsers = isRemote ? remoteReactionUsers : []
  const comments = useMemo(() => (isRemote ? remoteComments : []), [isRemote, remoteComments])
  const reactionCount = isRemote ? remoteReactions.total : (notice?.reactionCount ?? 0)
  const commentCount =
    isRemote && remoteDetail.detail ? remoteComments.length : (notice?.commentCount ?? 0)
  const myReactionType = isRemote
    ? remoteReactions.myReactionTypes[0]
    : undefined
  const selectedEmojiIndex =
    myReactionType != null ? getPlatformReactionEmojiIndex(myReactionType) : null

  useEffect(() => {
    setIsAttachmentListOpen(false)
    setReactionPanel(null)
    setIsCommentListOpen(false)
    setCommentToDeleteId(null)
    setDraftEmojiIndex(null)
    if (!open) {
      setComment('')
      setIsAuthorMenuOpen(false)
      setIsDeleteConfirmOpen(false)
    }
  }, [open, noticeId])

  useEffect(() => {
    if (!open || !commentId || comments.length === 0) return
    if (!comments.some(item => item.id === commentId)) return
    setIsCommentListOpen(true)
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`notice-comment-${commentId}`)?.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      })
      document.getElementById(`notice-comment-${commentId}`)?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [commentId, comments, open])

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

  const handleDownload = (file: EducationInProgressFile) => {
    if (!hasRemoteDownloadPath(file)) {
      void downloadAttachment(file.fileName)
      return
    }
    downloadRemoteEducationNoticeFile(file).catch(() => {
      setActionErrorMessage('첨부파일을 내려받지 못했습니다.')
    })
  }

  const handleReactionEmojiSelect = (index: number) => {
    if (!getPlatformReactionEmojiTypeForIndex(index)) return
    setDraftEmojiIndex(prev => (prev === index ? null : index))
    setReactionPanel(null)
  }

  const handleReactionListToggle = () => {
    if (reactionCount <= 0) return
    setReactionPanel(panel => (panel === 'list' ? null : 'list'))
  }

  const handleCommentListToggle = () => {
    setIsCommentListOpen(open => !open)
  }

  /** 같은 반응을 다시 보내면 취소, 다른 반응이면 교체 (1인 1반응) */
  const handleCommentSubmit = () => {
    const content = comment.trim()
    const emojiType =
      draftEmojiIndex != null ? getPlatformReactionEmojiTypeForIndex(draftEmojiIndex) : undefined
    if (!content && !emojiType) return
    if (isSubmitting) return

    const finish = () => {
      setComment('')
      setDraftEmojiIndex(null)
      if (content) setIsCommentListOpen(true)
    }

    if (isRemote) {
      setIsSubmitting(true)
      void (async () => {
        try {
          if (emojiType) {
            try {
              await toggleReactionMutation.mutateAsync({
                postId: notice.id,
                reactionType: emojiType,
                myReactionTypes: remoteReactions.myReactionTypes,
              })
            } catch {
              setActionErrorMessage('반응을 저장하지 못했습니다.')
              return
            }
          }
          if (content) {
            try {
              await commentMutations.create.mutateAsync({ postId: notice.id, content })
            } catch {
              setDraftEmojiIndex(null)
              setActionErrorMessage('댓글을 등록하지 못했습니다.')
              return
            }
          }
          finish()
        } finally {
          setIsSubmitting(false)
        }
      })()
      return
    }

    finish()
  }

  const handleCommentUpdate = (commentId: string, content: string) => {
    if (isRemote) {
      commentMutations.update.mutate(
        { postId: notice.id, commentId, content },
        { onError: () => setActionErrorMessage('댓글을 수정하지 못했습니다.') }
      )
      return
    }
  }

  const handleCommentDeleteConfirm = () => {
    if (!commentToDeleteId) return
    if (isRemote) {
      commentMutations.remove.mutate(
        { postId: notice.id, commentId: commentToDeleteId },
        { onError: () => setActionErrorMessage('댓글을 삭제하지 못했습니다.') }
      )
      setCommentToDeleteId(null)
      return
    }
    setCommentToDeleteId(null)
  }

  const canSubmitComment =
    (comment.trim().length > 0 || draftEmojiIndex != null) && !isSubmitting
  const draftEmojiItem =
    draftEmojiIndex != null ? PLATFORM_REACTION_EMOJI_ITEMS[draftEmojiIndex] : undefined

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
                    color={notice.authorIsStaff ? 'primary-500' : 'black'}
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
                  onClick={() => handleDownload(singleAttachment)}
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
                            onClick={() => handleDownload(file)}
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

            <div className={styles.scroll} aria-busy={isRemote && isContentImagesLoading}>
              {isRemote ? (
                <>
                  {isContentImagesLoading ? (
                    <div className={styles.contentLoading} role="status">
                      <PFLoadingSpinner label="이미지를 불러오는 중" />
                    </div>
                  ) : null}
                  <RichTextViewer
                    key={notice.id}
                    content={notice.content}
                    contentFormat="markdown"
                    maxHeight="none"
                    className={[
                      styles.richContent,
                      isContentImagesLoading ? styles.richContentLoading : null,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    resolveInlineImage={resolveInlineImage}
                    onInlineImagesLoadingChange={setIsContentImagesLoading}
                  />
                </>
              ) : (
                <PFText as="div" typo="bd-md-md" color="black" className={styles.content}>
                  {notice.content}
                </PFText>
              )}
            </div>
          </div>

          <footer className={styles.footer}>
            <div className={styles.reactionAnchor} ref={reactionListRef}>
              <EducationNoticeStats
                viewCount={notice.viewCount}
                commentCount={commentCount}
                reactionCount={reactionCount}
                reactionExpanded={reactionPanel === 'list'}
                commentExpanded={isCommentListOpen}
                onCommentClick={handleCommentListToggle}
                onReactionClick={reactionCount > 0 ? handleReactionListToggle : undefined}
              />
              {reactionPanel === 'list' && reactionCount > 0 && listPopoverStyle
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
                currentUserName={currentUserName}
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
                disabled={!canSubmitComment}
                onClick={handleCommentSubmit}
              >
                <img
                  src={canSubmitComment ? jaSendMintUrl : jaSendGrayUrl}
                  alt=""
                  width={40}
                  height={40}
                  aria-hidden="true"
                />
              </button>
              <div className={styles.reactionAnchor} ref={reactionPickerRef}>
                <button
                  type="button"
                  className={styles.emojiButton}
                  aria-label="이모지 반응"
                  aria-expanded={reactionPanel === 'picker'}
                  onClick={() => setReactionPanel(panel => (panel === 'picker' ? null : 'picker'))}
                >
                  {draftEmojiItem ? (
                    <span className={styles.emojiPreview} aria-hidden="true">
                      {draftEmojiItem.renderIcon(`${emojiPreviewClipId}-draft`)}
                    </span>
                  ) : (
                    <img
                      className={styles.emojiIcon}
                      src={noticeIconEmojiUrl}
                      alt=""
                      width={40}
                      height={40}
                      aria-hidden="true"
                    />
                  )}
                </button>
                {reactionPanel === 'picker' && pickerPopoverStyle
                  ? createPortal(
                      <div
                        ref={reactionPickerPopoverRef}
                        className={styles.reactionPickerPopover}
                        style={pickerPopoverStyle}
                      >
                        <EducationNoticeReactionEmojiPicker
                          selectedIndex={draftEmojiIndex ?? selectedEmojiIndex}
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

      <PFAlertModal
        open={actionErrorMessage !== null}
        title={actionErrorMessage ?? ''}
        onConfirm={() => setActionErrorMessage(null)}
      />
    </>
  )
}
