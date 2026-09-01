/**
 * 게시글 상세 모달
 * 수강 프로그램 상세 > 게시글 탭 > 게시글 카드 클릭 시 노출
 */

import { useState, useMemo, useEffect, useId } from 'react'
import { flushSync } from 'react-dom'
import { Popover } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import {
  CmsButton,
  AttachmentDownloadList,
  CommentList,
  CommentComposer,
  ReactionUserList,
} from '@/shared/ui'
import type { ProgramPost, ProgramFile } from '@/types/domain'
import dayjs from 'dayjs'
import { ProfileAvatarIcon } from '@/shared/ui/icons'
import {
  getCommentsByPostId,
  getReactionsByPostId,
  getReactionUsersByPostId,
  getReactionTotalCountByPostId,
  getPostViewCountByPostId,
  markPostAsRead,
  createProgramPostComment,
  addProgramPostReaction,
  getReactionEmojiTypeForBarIndex,
  removeProgramPostReactionUser,
} from '@/data/mock'
import { downloadFile } from '@/shared/lib/file-download'
import { PostReadStatusPopoverContent } from '../post-read-status-popover'
import { formatProgramPostAudienceBadgeLabel } from '../../lib/post-audience-display'
import './post-detail-modal.css'

function formatKoDate(date: string | Date): string {
  const d = dayjs(date)
  const ampm = d.hour() < 12 ? '오전' : '오후'
  const hour = d.hour() % 12 || 12
  return d.format(`YYYY년 M월 D일 ${ampm} ${hour}:mm`)
}

// ── 아이콘 ───────────────────────────────────────────

function EyeIcon({ maskId }: { maskId: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <mask id={maskId} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="22">
        <rect width="22" height="22" fill="#D9D9D9" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path
          d="M13.6493 13.6513C14.375 12.9256 14.7379 12.0427 14.7379 11.0026C14.7379 9.96249 14.375 9.07959 13.6493 8.3539C12.9236 7.6282 12.0407 7.26535 11.0006 7.26535C9.96052 7.26535 9.07762 7.6282 8.35192 8.3539C7.62623 9.07959 7.26338 9.96249 7.26338 11.0026C7.26338 12.0427 7.62623 12.9256 8.35192 13.6513C9.07762 14.377 9.96052 14.7399 11.0006 14.7399C12.0407 14.7399 12.9236 14.377 13.6493 13.6513ZM9.24751 12.7557C8.76625 12.2745 8.52563 11.6901 8.52563 11.0026C8.52563 10.3151 8.76625 9.73073 9.24751 9.24948C9.72875 8.76823 10.3131 8.5276 11.0006 8.5276C11.6881 8.5276 12.2725 8.76823 12.7538 9.24948C13.235 9.73073 13.4756 10.3151 13.4756 11.0026C13.4756 11.6901 13.235 12.2745 12.7538 12.7557C12.2725 13.237 11.6881 13.4776 11.0006 13.4776C10.3131 13.4776 9.72875 13.237 9.24751 12.7557ZM5.70596 15.8749C4.10592 14.8455 2.82878 13.4911 1.87453 11.8118C1.79814 11.6801 1.7423 11.5476 1.70701 11.4142C1.67187 11.2808 1.6543 11.1436 1.6543 11.0026C1.6543 10.8616 1.67187 10.7244 1.70701 10.591C1.7423 10.4576 1.79814 10.3251 1.87453 10.1934C2.82878 8.51408 4.10592 7.15971 5.70596 6.13029C7.30601 5.10072 9.07089 4.58594 11.0006 4.58594C12.9304 4.58594 14.6953 5.10072 16.2953 6.13029C17.8953 7.15971 19.1725 8.51408 20.1267 10.1934C20.2031 10.3251 20.259 10.4576 20.2943 10.591C20.3294 10.7244 20.347 10.8616 20.347 11.0026C20.347 11.1436 20.3294 11.2808 20.2943 11.4142C20.259 11.5476 20.2031 11.6801 20.1267 11.8118C19.1725 13.4911 17.8953 14.8455 16.2953 15.8749C14.6953 16.9045 12.9304 17.4193 11.0006 17.4193C9.07089 17.4193 7.30601 16.9045 5.70596 15.8749ZM15.7558 14.6807C17.1996 13.7717 18.3034 12.5457 19.0673 11.0026C18.3034 9.45955 17.1996 8.23351 15.7558 7.32448C14.3121 6.41545 12.727 5.96094 11.0006 5.96094C9.27424 5.96094 7.68917 6.41545 6.24542 7.32448C4.80167 8.23351 3.69785 9.45955 2.93396 11.0026C3.69785 12.5457 4.80167 13.7717 6.24542 14.6807C7.68917 15.5898 9.27424 16.0443 11.0006 16.0443C12.727 16.0443 14.3121 15.5898 15.7558 14.6807Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

function EmoticonIcon({ active }: { active?: boolean }) {
  const emoticonMaskId = useId().replace(/:/g, '')
  if (active) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <mask id={emoticonMaskId} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="22">
          <rect width="22" height="22" fill="#D9D9D9"/>
        </mask>
        <g mask={`url(#${emoticonMaskId})`}>
          <path d="M14.1222 9.9045C14.4559 9.9045 14.7388 9.7877 14.9709 9.5541C15.2029 9.32066 15.319 9.03718 15.319 8.70367C15.319 8.37015 15.2022 8.08736 14.9688 7.85529C14.7353 7.62307 14.4518 7.50696 14.1181 7.50696C13.7846 7.50696 13.5018 7.62376 13.2697 7.85735C13.0377 8.0908 12.9216 8.37428 12.9216 8.70779C12.9216 9.04131 13.0384 9.3241 13.2718 9.55617C13.5053 9.78839 13.7887 9.9045 14.1222 9.9045ZM7.88204 9.9045C8.21555 9.9045 8.49834 9.7877 8.73041 9.5541C8.96248 9.32066 9.07852 9.03718 9.07852 8.70367C9.07852 8.37015 8.9618 8.08736 8.72835 7.85529C8.49491 7.62307 8.21143 7.50696 7.87791 7.50696C7.54425 7.50696 7.26138 7.62376 7.02931 7.85735C6.79724 8.0908 6.68121 8.37428 6.68121 8.70779C6.68121 9.04131 6.79793 9.3241 7.03137 9.55617C7.26482 9.78839 7.54837 9.9045 7.88204 9.9045ZM13.6231 14.954C14.4153 14.4186 14.9993 13.7109 15.3753 12.8307H14.1626C13.8265 13.396 13.3796 13.8429 12.822 14.1714C12.2643 14.4998 11.657 14.6641 11.0001 14.6641C10.3431 14.6641 9.73585 14.4998 9.17821 14.1714C8.62057 13.8429 8.17369 13.396 7.83758 12.8307H6.62483C7.00082 13.7109 7.58489 14.4186 8.37704 14.954C9.16919 15.4893 10.0435 15.757 11.0001 15.757C11.9566 15.757 12.831 15.4893 13.6231 14.954ZM7.60521 19.0201C6.54539 18.563 5.62353 17.9426 4.83962 17.159C4.05572 16.3754 3.43506 15.4539 2.97764 14.3946C2.52038 13.3352 2.29175 12.2033 2.29175 10.999C2.29175 9.7945 2.5203 8.66234 2.97741 7.60252C3.43453 6.5427 4.05488 5.62084 4.83848 4.83694C5.62207 4.05303 6.54355 3.43237 7.60291 2.97496C8.66228 2.51769 9.79413 2.28906 10.9985 2.28906C12.203 2.28906 13.3351 2.51762 14.395 2.97473C15.4548 3.43184 16.3766 4.05219 17.1605 4.83579C17.9444 5.61939 18.5651 6.54087 19.0225 7.60023C19.4798 8.65959 19.7084 9.79144 19.7084 10.9958C19.7084 12.2003 19.4799 13.3325 19.0227 14.3923C18.5656 15.4521 17.9453 16.374 17.1617 17.1579C16.3781 17.9418 15.4566 18.5624 14.3972 19.0198C13.3379 19.4771 12.206 19.7057 11.0017 19.7057C9.79719 19.7057 8.66503 19.4772 7.60521 19.0201Z" fill="#3D3D3D"/>
        </g>
      </svg>
    )
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M12.838 9.007C13.142 9.007 13.399 8.9 13.61 8.688C13.821 8.476 13.926 8.218 13.926 7.915C13.926 7.612 13.82 7.355 13.608 7.144C13.396 6.932 13.138 6.827 12.835 6.827C12.531 6.827 12.274 6.933 12.063 7.145C11.852 7.358 11.747 7.615 11.747 7.919C11.747 8.222 11.853 8.479 12.065 8.69C12.277 8.901 12.535 9.007 12.838 9.007ZM7.165 9.007C7.469 9.007 7.726 8.9 7.937 8.688C8.148 8.476 8.253 8.218 8.253 7.915C8.253 7.612 8.147 7.355 7.935 7.144C7.722 6.932 7.465 6.827 7.162 6.827C6.858 6.827 6.601 6.933 6.39 7.145C6.179 7.358 6.074 7.615 6.074 7.919C6.074 8.222 6.18 8.479 6.392 8.69C6.604 8.901 6.862 9.007 7.165 9.007ZM12.385 13.597C13.105 13.11 13.636 12.467 13.977 11.667H12.875C12.569 12.181 12.163 12.587 11.656 12.886C11.149 13.184 10.597 13.333 10 13.333C9.403 13.333 8.851 13.184 8.344 12.886C7.837 12.587 7.43 12.181 7.125 11.667H6.022C6.364 12.467 6.895 13.11 7.615 13.597C8.335 14.084 9.13 14.327 10 14.327C10.87 14.327 11.664 14.084 12.385 13.597ZM10 17.917C8.906 17.917 7.877 17.709 6.913 17.293C5.95 16.878 5.112 16.314 4.4 15.602C3.687 14.889 3.123 14.051 2.707 13.088C2.291 12.125 2.083 11.096 2.083 10.002C2.083 8.907 2.291 7.877 2.707 6.914C3.122 5.95 3.686 5.112 4.398 4.4C5.111 3.687 5.949 3.123 6.912 2.707C7.875 2.291 8.904 2.083 9.999 2.083C11.094 2.083 12.123 2.291 13.086 2.707C14.05 3.122 14.888 3.686 15.6 4.399C16.313 5.111 16.877 5.949 17.293 6.907C17.709 7.875 17.917 8.945 17.917 9.999C17.917 11.094 17.709 12.123 17.293 13.086C16.878 14.05 16.314 14.888 15.601 15.601C14.889 16.313 14.051 16.877 13.088 17.293C12.125 17.709 11.096 17.917 10 17.917ZM10 16.667C11.861 16.667 13.438 16.021 14.729 14.729C16.021 13.438 16.667 11.861 16.667 10C16.667 8.139 16.021 6.563 14.729 5.271C13.438 3.979 11.861 3.333 10 3.333C8.139 3.333 6.563 3.979 5.271 5.271C3.979 6.563 3.333 8.139 3.333 10C3.333 11.861 3.979 13.438 5.271 14.729C6.563 16.021 8.139 16.667 10 16.667Z" fill="currentColor"/>
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5.401 15.632L3.76 17.274C3.527 17.507 3.258 17.56 2.955 17.432C2.652 17.305 2.5 17.075 2.5 16.742V4.816C2.5 4.401 2.643 4.051 2.93 3.764C3.217 3.477 3.568 3.333 3.982 3.333H16.597C17.011 3.333 17.361 3.477 17.648 3.764C17.935 4.051 18.079 4.401 18.079 4.816V14.15C18.079 14.564 17.935 14.915 17.648 15.202C17.361 15.489 17.011 15.632 16.597 15.632H5.401ZM4.878 14.403H16.597C16.66 14.403 16.718 14.376 16.77 14.324C16.823 14.271 16.849 14.213 16.849 14.15V4.816C16.849 4.752 16.823 4.695 16.77 4.642C16.718 4.59 16.66 4.563 16.597 4.563H3.982C3.919 4.563 3.861 4.59 3.809 4.642C3.756 4.695 3.73 4.752 3.73 4.816V15.538L4.878 14.403ZM7.523 9.996C7.664 9.855 7.735 9.684 7.735 9.483C7.735 9.282 7.664 9.111 7.523 8.97C7.381 8.828 7.21 8.758 7.01 8.758C6.809 8.758 6.638 8.828 6.496 8.97C6.355 9.111 6.284 9.282 6.284 9.483C6.284 9.684 6.355 9.855 6.496 9.996C6.638 10.137 6.809 10.208 7.01 10.208C7.21 10.208 7.381 10.137 7.523 9.996ZM10.803 9.996C10.944 9.855 11.015 9.684 11.015 9.483C11.015 9.282 10.944 9.111 10.803 8.97C10.661 8.828 10.49 8.758 10.289 8.758C10.089 8.758 9.918 8.828 9.776 8.97C9.635 9.111 9.564 9.282 9.564 9.483C9.564 9.684 9.635 9.855 9.776 9.996C9.918 10.137 10.089 10.208 10.289 10.208C10.49 10.208 10.661 10.137 10.803 9.996ZM14.082 9.996C14.224 9.855 14.294 9.684 14.294 9.483C14.294 9.282 14.224 9.111 14.082 8.97C13.941 8.828 13.77 8.758 13.569 8.758C13.368 8.758 13.197 8.828 13.056 8.97C12.914 9.111 12.844 9.282 12.844 9.483C12.844 9.684 12.914 9.855 13.056 9.996C13.197 10.137 13.368 10.208 13.569 10.208C13.77 10.208 13.941 10.137 14.082 9.996Z" fill="currentColor"/>
    </svg>
  )
}

// ── 컴포넌트 ─────────────────────────────────────────

export interface PostDetailModalProps {
  open: boolean
  onCancel: () => void
  post: ProgramPost | null
  files: ProgramFile[]
  /** 댓글 등록 시 표시할 작성자명 (미입력 시 '나') */
  commentAuthorName?: string
  /** 댓글·반응 행에 쓰는 역할(반응 목록에서 '내 행' 판별). 기본 '학생' */
  commentAuthorRoleLabel?: string
  /** mock 반응/댓글 수 변경 시 상위(게시글 목록 카드 등) 카운트 갱신용 */
  onPostStatsChanged?: () => void
}

export function PostDetailModal({
  open,
  onCancel,
  post,
  files,
  commentAuthorName,
  commentAuthorRoleLabel,
  onPostStatsChanged,
}: PostDetailModalProps) {
  const eyeIconMaskId = useId().replace(/:/g, '')
  const [commentInput, setCommentInput] = useState('')
  const [emojiActive, setEmojiActive] = useState(false)
  const [reactionPopoverOpen, setReactionPopoverOpen] = useState(false)
  const [readStatusPopoverOpen, setReadStatusPopoverOpen] = useState(false)
  /** 피커 선택 이모지(단일). 전송 시 댓글 본문에는 넣지 않고 상단 게시글 반응 집계만 반영 */
  const [selectedEmojiIndex, setSelectedEmojiIndex] = useState<number | null>(null)
  const [commentsVersion, setCommentsVersion] = useState(0)
  const [reactionsVersion, setReactionsVersion] = useState(0)

  const comments = useMemo(
    () => (post ? getCommentsByPostId(post.id) : []),
    [post?.id, commentsVersion]
  )
  const reactions = useMemo(
    () =>
      post
        ? getReactionsByPostId(post.id).sort((a, b) => b.count - a.count)
        : [],
    [post?.id, reactionsVersion]
  )
  const reactionTotalCount = useMemo(
    () => (post ? getReactionTotalCountByPostId(post.id) : 0),
    [post?.id, reactionsVersion]
  )
  const viewReadCount = useMemo(
    () => (post ? getPostViewCountByPostId(post.id) : 0),
    [post?.id]
  )
  const reactionUsers = useMemo(
    () => (post ? getReactionUsersByPostId(post.id) : []),
    [post?.id, reactionsVersion]
  )
  useEffect(() => {
    if (open && post) markPostAsRead(post.id)
  }, [open, post?.id])

  useEffect(() => {
    if (!open) {
      setSelectedEmojiIndex(null)
      setEmojiActive(false)
      setReactionPopoverOpen(false)
      setReadStatusPopoverOpen(false)
    }
  }, [open])

  useEffect(() => {
    setSelectedEmojiIndex(null)
    setReactionPopoverOpen(false)
    setReadStatusPopoverOpen(false)
    setReactionsVersion(0)
  }, [post?.id])

  const handleEmojiSelect = (index: number) => {
    flushSync(() => {
      setSelectedEmojiIndex(prev => (prev === index ? null : index))
    })
    setEmojiActive(false)
  }

  const viewerDisplayName = (commentAuthorName ?? '나').trim()
  const viewerRoleLabel = (commentAuthorRoleLabel ?? '학생').trim()

  const handleRemoveOwnReaction = (reactionUserId: string) => {
    if (!post) return
    const ok = removeProgramPostReactionUser(post.id, reactionUserId)
    if (!ok) return
    setReactionsVersion(v => v + 1)
    onPostStatsChanged?.()
  }

  const handleSubmitComment = () => {
    if (!post) return
    const trimmed = commentInput.trim()
    const hasEmojiSelection = selectedEmojiIndex != null
    if (!trimmed && !hasEmojiSelection) {
      return
    }
    const emojiType =
      selectedEmojiIndex != null ? getReactionEmojiTypeForBarIndex(selectedEmojiIndex) : undefined
    if (!trimmed && emojiType) {
      addProgramPostReaction(post.id, commentAuthorName ?? '나', emojiType, {
        roleLabel: viewerRoleLabel,
      })
      setReactionsVersion(v => v + 1)
      setSelectedEmojiIndex(null)
      onPostStatsChanged?.()
      return
    }

    createProgramPostComment(post.id, commentAuthorName ?? '나', trimmed, {
      ...(emojiType ? { emojiType } : {}),
      reactionRoleLabel: viewerRoleLabel,
    })
    setCommentsVersion(v => v + 1)
    if (emojiType) setReactionsVersion(v => v + 1)
    setCommentInput('')
    setSelectedEmojiIndex(null)
    onPostStatsChanged?.()
  }

  if (!post) return null

  const dateStr = formatKoDate(post.publishedAt)
  const postTypeLabel =
    post.postType === 'notice' ? '[공지사항]' :
    post.postType === 'schedule' ? '[일정 알림]' :
    null
  const audienceBadgeLabel = formatProgramPostAudienceBadgeLabel(post.audience)

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="게시글 상세"
      width={800}
      className="post-detail-modal"
      footer={
        <CmsButton variant="secondary" size="large" onClick={onCancel}>
          닫기
        </CmsButton>
      }
    >
      <div className="post-detail-modal__body">
        {/* 7:3 레이아웃: 좌 게시글 본문, 우 첨부파일 */}
        <div className="post-detail-modal__main-row">
          <div className="post-detail-modal__main-left">
            {/* ── 게시글 카드 (본문만) ── */}
            <div className="post-detail-modal__card">
              <div className="post-detail-modal__card-header">
                <div className="post-detail-modal__card-header-main">
                  <ProfileAvatarIcon className="post-detail-modal__avatar" />
                  <div className="post-detail-modal__author-info">
                    <span className="post-detail-modal__author-name">{post.authorName}</span>
                    <div className="post-detail-modal__author-meta">
                    <span className="post-detail-modal__date">{dateStr}</span>
                    <span className="post-detail-modal__meta-divider">|</span>
                    <Popover
                      trigger="click"
                      arrow={false}
                      open={readStatusPopoverOpen}
                      onOpenChange={setReadStatusPopoverOpen}
                      overlayClassName="post-read-status-popover"
                      overlayStyle={{ transition: 'none' }}
                      overlayInnerStyle={{ transition: 'none' }}
                      getPopupContainer={trigger =>
                        trigger.closest('.post-detail-modal__card') ?? document.body
                      }
                      content={
                        post ? (
                          <PostReadStatusPopoverContent
                            postId={post.id}
                            programId={post.programId}
                            postSchoolId={post.schoolId}
                          />
                        ) : null
                      }
                    >
                      <button
                        type="button"
                        className="post-detail-modal__meta-item post-detail-modal__meta-item--view"
                        aria-label="게시글 읽음 현황"
                      >
                        <EyeIcon maskId={eyeIconMaskId} /> {viewReadCount}
                      </button>
                    </Popover>
                    <Popover
                      trigger="click"
                      arrow={false}
                      open={reactionPopoverOpen}
                      onOpenChange={setReactionPopoverOpen}
                      overlayClassName="post-detail-modal__reaction-popover"
                      getPopupContainer={trigger =>
                        trigger.closest('.post-detail-modal__card') ?? document.body
                      }
                      content={
                        <ReactionUserList
                          reactions={reactions}
                          users={reactionUsers}
                          currentUserName={viewerDisplayName}
                          currentUserRoleLabel={viewerRoleLabel}
                          onRemoveOwnReaction={handleRemoveOwnReaction}
                        />
                      }
                      placement="bottomLeft"
                    >
                      <button
                        type="button"
                        className="post-detail-modal__meta-item post-detail-modal__meta-item--reaction"
                      >
                        <EmoticonIcon active={reactionPopoverOpen} /> {reactionTotalCount}
                      </button>
                    </Popover>
                    <span className="post-detail-modal__meta-item">
                      <CommentIcon /> {post.commentCount}
                    </span>
                  </div>
                </div>
                </div>
                <span className="post-detail-modal__audience-badge">{audienceBadgeLabel}</span>
              </div>

              <div className="post-detail-modal__content">
                {postTypeLabel && (
                  <span className="post-detail-modal__type-tag">{postTypeLabel}</span>
                )}
                {post.content}
              </div>

              <AttachmentDownloadList
                items={files.map(file => ({
                  id: file.id,
                  fileName: file.fileName,
                  fileUrl: file.fileUrl,
                }))}
                onDownload={item => downloadFile(item.fileName, item.fileUrl)}
              />
            </div>
          </div>
        </div>

        {/* ── 댓글 카드 (전체 너비) ── */}
        <div className="post-detail-modal__comments-card">
          <CommentList
            items={comments.map(comment => ({
              id: comment.id,
              authorName: comment.authorName,
              createdAtLabel: formatKoDate(comment.createdAt),
              content: comment.content,
            }))}
          />
          <CommentComposer
            value={commentInput}
            onChange={setCommentInput}
            onSubmit={handleSubmitComment}
            emojiPickerOpen={emojiActive}
            onEmojiToggle={() => setEmojiActive(prev => !prev)}
            selectedEmojiIndex={selectedEmojiIndex}
            onEmojiSelect={handleEmojiSelect}
          />
        </div>

      </div>
    </ContentModal>
  )
}
