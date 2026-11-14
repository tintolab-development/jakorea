/**
 * 게시글 상세 모달
 * 수강 프로그램 상세 > 게시글 탭 > 게시글 카드 클릭 시 노출
 */

import { MaskIcon } from '@/shared/ui/icons'
import reactionSmileUrl from '@/shared/assets/icons/posts/reaction-smile.svg'
import reactionCommentUrl from '@/shared/assets/icons/posts/reaction-comment.svg'
import reactionViewUrl from '@/shared/assets/icons/posts/reaction-view.svg'
import { useState, useMemo, useEffect, useId } from 'react'
import { Dropdown, Popover, type MenuProps } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import {
  CmsButton,
  AttachmentDownloadList,
  CommentList,
  CommentComposer,
  ReactionUserList,
} from '@/shared/ui'
import {
  REACTION_EMOJI_ITEMS,
  getReactionEmojiItemByType,
  getReactionEmojiTypeForBarIndex,
} from '@/shared/ui/posts'
import type { ProgramPost, ProgramFile } from '@/types/domain'
import { formatDateTimeDot } from '@/shared/utils/date'
import { ProfileAvatarIcon } from '@/shared/ui/icons'
import { RichTextViewer } from '@/shared/rich-text'
import {
  getCommentsByPostId,
  getReactionsByPostId,
  getReactionUsersByPostId,
  getReactionTotalCountByPostId,
  getPostViewCountByPostId,
  markPostAsRead,
  createProgramPostComment,
  addProgramPostReaction,
  removeProgramPostReactionUser,
} from '@/features/user/detail/lib/program-post-interaction-stubs'
import { downloadFile } from '@/shared/lib/file-download'
import { PostReadStatusPopoverContent } from '../post-read-status-popover'
import { formatProgramPostAudienceBadgeLabel } from '../../lib/post-audience-display'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { useGeneralProgramPostDetail } from '@/features/program/general/hooks/use-general-program-posts-surveys'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import './post-detail-modal.css'

function formatKoDate(date: string | Date): string {
  return formatDateTimeDot(date)
}

// ── 아이콘 ───────────────────────────────────────────

/** 조회 — 시안 Sprite ico-reaction-24 view */
function EyeIcon(_props: { maskId: string }) {
  return <MaskIcon src={reactionViewUrl} style={{ display: 'block', width: 24, height: 24 }} />
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
  // 비활성 — 시안 Sprite ico-reaction-24 smile
  return <MaskIcon src={reactionSmileUrl} style={{ display: 'block', width: 24, height: 24 }} />
}

/** 댓글 — 시안 Sprite ico-reaction-24 comment */
function CommentIcon() {
  return <MaskIcon src={reactionCommentUrl} style={{ display: 'block', width: 24, height: 24 }} />
}

function PostManageMenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
      <g opacity="0.5">
        <path
          d="M15 24.0872C14.4844 24.0872 14.043 23.9035 13.6759 23.5363C13.3086 23.1692 13.125 22.7278 13.125 22.2122C13.125 21.6966 13.3086 21.2551 13.6759 20.8878C14.043 20.5207 14.4844 20.3372 15 20.3372C15.5156 20.3372 15.957 20.5207 16.3241 20.8878C16.6914 21.2551 16.875 21.6966 16.875 22.2122C16.875 22.7278 16.6914 23.1692 16.3241 23.5363C15.957 23.9035 15.5156 24.0872 15 24.0872ZM15 16.8756C14.4844 16.8756 14.043 16.692 13.6759 16.3247C13.3086 15.9576 13.125 15.5163 13.125 15.0006C13.125 14.485 13.3086 14.0436 13.6759 13.6766C14.043 13.3093 14.4844 13.1256 15 13.1256C15.5156 13.1256 15.957 13.3093 16.3241 13.6766C16.6914 14.0436 16.875 14.485 16.875 15.0006C16.875 15.5163 16.6914 15.9576 16.3241 16.3247C15.957 16.692 15.5156 16.8756 15 16.8756ZM15 9.66406C14.4844 9.66406 14.043 9.48052 13.6759 9.11344C13.3086 8.74615 13.125 8.30469 13.125 7.78906C13.125 7.27344 13.3086 6.83208 13.6759 6.465C14.043 6.09771 14.4844 5.91406 15 5.91406C15.5156 5.91406 15.957 6.09771 16.3241 6.465C16.6914 6.83208 16.875 7.27344 16.875 7.78906C16.875 8.30469 16.6914 8.74615 16.3241 9.11344C15.957 9.48052 15.5156 9.66406 15 9.66406Z"
          fill="#3D3D3D"
        />
      </g>
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
  /** 본인 작성글 — 공개 태그 옆 ⋮(수정/삭제) 표시 */
  canManage?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function PostDetailModal({
  open,
  onCancel,
  post,
  files,
  commentAuthorName,
  commentAuthorRoleLabel,
  onPostStatsChanged,
  canManage = false,
  onEdit,
  onDelete,
}: PostDetailModalProps) {
  const eyeIconMaskId = useId().replace(/:/g, '')
  const [commentInput, setCommentInput] = useState('')
  const [emojiActive, setEmojiActive] = useState(false)
  const [reactionPopoverOpen, setReactionPopoverOpen] = useState(false)
  const [readStatusPopoverOpen, setReadStatusPopoverOpen] = useState(false)
  /** 반응 저장·취소 요청 중 — 연속 클릭으로 요청이 겹치지 않게 막는다 */
  const [reactionSubmitting, setReactionSubmitting] = useState(false)
  const [commentsVersion, setCommentsVersion] = useState(0)
  const [reactionsVersion, setReactionsVersion] = useState(0)

  const remoteEnabled = shouldUseGeneralProgramsRemoteApi()
  const remoteDetail = useGeneralProgramPostDetail(
    post?.programId,
    post?.id,
    open && remoteEnabled && Boolean(post?.id)
  )
  const useRemote = remoteEnabled

  const displayPost = (useRemote && remoteDetail.post) || post
  const displayFiles =
    useRemote && remoteDetail.files.length > 0
      ? remoteDetail.files
      : files

  const comments = useMemo(
    () => {
      if (useRemote) return remoteDetail.comments
      return post ? getCommentsByPostId(post.id) : []
    },
    [post?.id, commentsVersion, remoteDetail.comments, useRemote]
  )
  const reactions = useMemo(
    () => {
      if (useRemote) return remoteDetail.reactions
      return post
        ? getReactionsByPostId(post.id).sort((a, b) => b.count - a.count)
        : []
    },
    [post?.id, reactionsVersion, remoteDetail.reactions, useRemote]
  )
  const reactionTotalCount = useMemo(
    () => {
      if (useRemote) return remoteDetail.reactionTotalCount
      return post ? getReactionTotalCountByPostId(post.id) : 0
    },
    [post?.id, reactionsVersion, remoteDetail.reactionTotalCount, useRemote]
  )
  const viewReadCount = useMemo(
    () => {
      if (useRemote && displayPost) return displayPost.viewCount
      return post ? getPostViewCountByPostId(post.id) : 0
    },
    [displayPost, post?.id, useRemote]
  )
  const reactionUsers = useMemo(
    () => {
      if (useRemote) return remoteDetail.reactionUsers
      return post ? getReactionUsersByPostId(post.id) : []
    },
    [post?.id, reactionsVersion, remoteDetail.reactionUsers, useRemote]
  )
  useEffect(() => {
    if (open && post && !useRemote) markPostAsRead(post.id)
  }, [open, post?.id, useRemote])

  useEffect(() => {
    if (!open) {
      setEmojiActive(false)
      setReactionPopoverOpen(false)
      setReadStatusPopoverOpen(false)
    }
  }, [open])

  useEffect(() => {
    setReactionPopoverOpen(false)
    setReadStatusPopoverOpen(false)
    setReactionsVersion(0)
  }, [post?.id])

  const viewerDisplayName = (commentAuthorName ?? '나').trim()
  const viewerRoleLabel = (commentAuthorRoleLabel ?? '학생').trim()

  /** 저장된 내 반응 — 반응 사용자 목록에서 이름·역할로 찾는다(ReactionUserList 본인 판정과 같은 기준) */
  const myReactionRow = reactionUsers.find(
    row =>
      row.authorName.trim() === viewerDisplayName && row.roleLabel.trim() === viewerRoleLabel
  )
  const myReactionItem = myReactionRow ? getReactionEmojiItemByType(myReactionRow.emojiType) : null
  const myReactionIndex = myReactionItem ? REACTION_EMOJI_ITEMS.indexOf(myReactionItem) : -1

  /**
   * 반응은 고르는 즉시 저장(기획 회신 261113 #8, 사용자 화면 USER-FUNC-0119·0121과 같은 동작).
   * 내 반응과 같은 이모지를 다시 고르면 취소, 다른 이모지면 교체. 별도 저장 버튼 없음.
   */
  const handleEmojiSelect = (index: number) => {
    setEmojiActive(false)
    if (!post || reactionSubmitting) return
    const emojiType = getReactionEmojiTypeForBarIndex(index)
    if (!emojiType) return
    const isSameAsMine = myReactionIndex === index
    if (useRemote) {
      setReactionSubmitting(true)
      void (async () => {
        try {
          if (isSameAsMine) await remoteDetail.removeReaction()
          else await remoteDetail.putReaction(emojiType)
          onPostStatsChanged?.()
        } catch (error) {
          cmsAlertModal.show({
            title: isSameAsMine ? '반응 취소 실패' : '반응 등록 실패',
            content: getGeneralProgramApiErrorMessage(
              error,
              isSameAsMine ? '반응을 취소하지 못했습니다.' : '반응을 등록하지 못했습니다.'
            ),
          })
        } finally {
          setReactionSubmitting(false)
        }
      })()
      return
    }
    if (isSameAsMine && myReactionRow) {
      removeProgramPostReactionUser(post.id, myReactionRow.id)
    } else {
      addProgramPostReaction(post.id, commentAuthorName ?? '나', emojiType, {
        roleLabel: viewerRoleLabel,
      })
    }
    setReactionsVersion(v => v + 1)
    onPostStatsChanged?.()
  }

  const handleRemoveOwnReaction = (reactionUserId: string) => {
    if (!post) return
    if (useRemote) {
      void remoteDetail
        .removeReaction()
        .then(() => onPostStatsChanged?.())
        .catch(error => {
          cmsAlertModal.show({
            title: '반응 취소 실패',
            content: getGeneralProgramApiErrorMessage(error, '반응을 취소하지 못했습니다.'),
          })
        })
      return
    }
    const ok = removeProgramPostReactionUser(post.id, reactionUserId)
    if (!ok) return
    setReactionsVersion(v => v + 1)
    onPostStatsChanged?.()
  }

  const handleSubmitComment = () => {
    if (!post) return
    const trimmed = commentInput.trim()
    if (!trimmed) return

    if (useRemote) {
      void (async () => {
        await remoteDetail.createComment(trimmed)
        setCommentInput('')
        onPostStatsChanged?.()
      })()
      return
    }

    createProgramPostComment(post.id, commentAuthorName ?? '나', trimmed, {
      reactionRoleLabel: viewerRoleLabel,
    })
    setCommentsVersion(v => v + 1)
    setCommentInput('')
    onPostStatsChanged?.()
  }

  if (!displayPost) return null

  const dateStr = formatKoDate(displayPost.publishedAt)
  const postTypeLabel =
    displayPost.postType === 'notice' ? '[공지사항]' :
    displayPost.postType === 'schedule' ? '[일정 알림]' :
    null
  const audienceBadgeLabel = formatProgramPostAudienceBadgeLabel(displayPost.audience)
  const manageMenuItems: MenuProps['items'] = [
    {
      key: 'delete',
      label: '삭제',
      onClick: () => onDelete?.(),
    },
    {
      key: 'edit',
      label: '수정',
      onClick: () => onEdit?.(),
    },
  ]

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
                    <span className="post-detail-modal__author-name">{displayPost.authorName}</span>
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
                        displayPost ? (
                          <PostReadStatusPopoverContent
                            postId={displayPost.id}
                            programId={displayPost.programId}
                            postSchoolId={displayPost.schoolId}
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
                      <CommentIcon /> {useRemote ? comments.length : displayPost.commentCount}
                    </span>
                  </div>
                </div>
                </div>
                <div className="post-detail-modal__header-actions">
                  <span className="post-detail-modal__audience-badge">{audienceBadgeLabel}</span>
                  {canManage ? (
                    <Dropdown
                      menu={{ items: manageMenuItems }}
                      trigger={['click']}
                      placement="bottomRight"
                    >
                      <button
                        type="button"
                        className="post-detail-modal__manage-menu-btn"
                        aria-label="게시글 메뉴"
                      >
                        <PostManageMenuIcon />
                      </button>
                    </Dropdown>
                  ) : null}
                </div>
              </div>

              <div className="post-detail-modal__content">
                {postTypeLabel && (
                  <span className="post-detail-modal__type-tag">{postTypeLabel}</span>
                )}
                <RichTextViewer
                  content={displayPost.content}
                  contentFormat="markdown"
                  className="post-detail-modal__viewer"
                />
              </div>

              <AttachmentDownloadList
                items={displayFiles.map(file => ({
                  id: file.id,
                  fileName: file.fileName,
                  fileUrl: file.fileUrl,
                }))}
                onDownload={item => void downloadFile(item.fileName, item.fileUrl)}
              />
            </div>
          </div>
        </div>

        {/* ── 댓글 카드 (전체 너비) ── */}
        <div className="post-detail-modal__comments-card">
          <CommentList
            className="post-detail-modal__comment-list"
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
            selectedEmojiIndex={myReactionIndex >= 0 ? myReactionIndex : null}
            onEmojiSelect={handleEmojiSelect}
            sendActive={commentInput.trim().length > 0}
          />
        </div>

      </div>
    </ContentModal>
  )
}
