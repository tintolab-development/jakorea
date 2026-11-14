/**
 * 수강 프로그램 상세 모달 — 게시글 탭
 * enrollment-program-detail-posts-tab-spec.md 기준
 * getProgramPostsByProgramId, getProgramFilesByProgramId mock 연동
 */

import { MaskIcon } from '@/shared/ui/icons'
import reactionSmileUrl from '@/shared/assets/icons/posts/reaction-smile.svg'
import reactionCommentUrl from '@/shared/assets/icons/posts/reaction-comment.svg'
import reactionViewUrl from '@/shared/assets/icons/posts/reaction-view.svg'
import { useMemo, useState, useRef, useEffect } from 'react'
import {
  CmsButton,
  AttachmentClipIcon,
  CmsTableEmptyState,
  DeleteGuideModal,
  useCmsAlert,
} from '@/shared/ui'
import { extractApiErrorMessage } from '@/shared/lib/extract-api-error-message'
import { DetailInfoFormTdDivider } from '@/shared/components/detail-info-form'
import { Input, Dropdown, Popover, type MenuProps } from 'antd'
import type { Program, ProgramPost, ProgramFile } from '@/types/domain'
import {
  getReactionTotalCountByPostId,
} from '@/features/user/detail/lib/program-post-interaction-stubs'

function getPostViewCountForContext(
  _postId: string,
  _programId?: unknown,
  _postSchoolId?: unknown,
  _schoolId?: unknown
): number {
  void _postId
  void _programId
  void _postSchoolId
  void _schoolId
  return 0
}
import { useAuthStore } from '@/features/auth/model/auth-store'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import {
  resolveEnrollmentProgramFilesList,
  resolveEnrollmentProgramPostsList,
} from '@/features/user/detail/lib/enrollment-program-posts-source'
import { isOwnProgramPost } from '@/features/user/detail/lib/is-own-program-post'
import { toProgramPostPlainText } from '@/features/user/detail/lib/post-content-plain-text'
import { deleteGeneralProgramPost } from '@/features/program/general/api/admin-general-programs-service'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { PostReadStatusPopoverContent } from './post-read-status-popover'
import { buildPostDeleteGuideLines } from '@/features/user/detail/lib/post-delete-guide'
import { downloadFile } from '@/shared/lib/file-download'
import dayjs from 'dayjs'
import { formatDateTimeDot } from '@/shared/utils/date'

export interface EnrollmentProgramDetailPostsTabProps {
  program: Program
  /** 참여기관(학교) ID. 있으면 해당 학교 전용 게시글만 표시 (학교 상세 게시글 탭) */
  schoolId?: string
  /** 게시글 영역 상단 "게시글 등록" 버튼 표시 여부. 기본 true. 학교 상세 풀페이지에서는 탭 행 trailing만 쓰므로 false */
  showWriteButtonInSection?: boolean
  /** 일반 기관형 참여 기관 상세 시안 19 — 삭제 안내 첫 줄에 대상 글 앞부분 표시. 기본 false */
  deleteGuideWithPostPreview?: boolean
  /** PostWriteModal open을 부모에서 제어할 때 사용 */
  writeModalOpen?: boolean
  onWriteModalOpenChange?: (open: boolean) => void
  /** 게시글 등록 모달 작성자 표시명 (기본: JA KOREA 알림) */
  writeAuthorName?: string
  /** 게시글 등록 성공 시 추가 콜백 (목록 갱신 후 호출) */
  onPostWriteSuccess?: () => void
  /** 게시글 삭제 성공 시 콜백. 없으면 onPostWriteSuccess 를 호출한다 */
  onPostDeleted?: (postId: string) => void
  /** remote API 등으로 주입한 게시글 목록 — 있으면 mock 대신 사용 */
  postsOverride?: ProgramPost[] | null
  /** remote API 첨부 파일 목록 — 있으면 우측 파일 패널에 사용 */
  filesOverride?: ProgramFile[] | null
}

function formatKoDate(date: string | Date): string {
  return formatDateTimeDot(date)
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${Math.round(mb)}MB`
  const kb = bytes / 1024
  return `${Math.round(kb)}KB`
}

function formatFileDate(date: string | Date): string {
  return dayjs(date).format('YY. MM. DD')
}
import { PostWriteModal } from './modal/post-write-modal'
import { PostDetailModal } from './modal/post-detail-modal'
import { ProfileAvatarIcon } from '@/shared/ui/icons'
import './modal/enrollment-program-detail-modal.css'

/** 세로 점 세 개 메뉴 아이콘 — 30×30 (게시글·파일 공통) */
function MeatballMenuIcon({ maskId }: { maskId: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      aria-hidden
    >
      <g opacity="0.5">
        <mask
          id={maskId}
          style={{ maskType: 'alpha' }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="30"
          height="30"
        >
          <rect width="30" height="30" fill="#D9D9D9" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <path
            d="M15 24.0872C14.4844 24.0872 14.043 23.9035 13.6759 23.5363C13.3086 23.1692 13.125 22.7278 13.125 22.2122C13.125 21.6966 13.3086 21.2551 13.6759 20.8878C14.043 20.5207 14.4844 20.3372 15 20.3372C15.5156 20.3372 15.957 20.5207 16.3241 20.8878C16.6914 21.2551 16.875 21.6966 16.875 22.2122C16.875 22.7278 16.6914 23.1692 16.3241 23.5363C15.957 23.9035 15.5156 24.0872 15 24.0872ZM15 16.8756C14.4844 16.8756 14.043 16.692 13.6759 16.3247C13.3086 15.9576 13.125 15.5163 13.125 15.0006C13.125 14.485 13.3086 14.0436 13.6759 13.6766C14.043 13.3093 14.4844 13.1256 15 13.1256C15.5156 13.1256 15.957 13.3093 16.3241 13.6766C16.6914 14.0436 16.875 14.485 16.875 15.0006C16.875 15.5163 16.6914 15.9576 16.3241 16.3247C15.957 16.692 15.5156 16.8756 15 16.8756ZM15 9.66406C14.4844 9.66406 14.043 9.48052 13.6759 9.11344C13.3086 8.74615 13.125 8.30469 13.125 7.78906C13.125 7.27344 13.3086 6.83208 13.6759 6.465C14.043 6.09771 14.4844 5.91406 15 5.91406C15.5156 5.91406 15.957 6.09771 16.3241 6.465C16.6914 6.83208 16.875 7.27344 16.875 7.78906C16.875 8.30469 16.6914 8.74615 16.3241 9.11344C15.957 9.48052 15.5156 9.66406 15 9.66406Z"
            fill="#3D3D3D"
          />
        </g>
      </g>
    </svg>
  )
}

/** 게시글 메타 아이콘 — 눈(조회) */
function PostMetaEyeIcon() {
  return (
    <span className="enrollment-program-detail-modal__post-meta-icon" aria-hidden>
      <MaskIcon src={reactionViewUrl} style={{ display: 'block', width: 24, height: 24 }} />
    </span>
  )
}

/** 게시글 메타 아이콘 — 댓글 */
function PostMetaCommentIcon() {
  return (
    <span className="enrollment-program-detail-modal__post-meta-icon" aria-hidden>
      <MaskIcon src={reactionCommentUrl} style={{ display: 'block', width: 24, height: 24 }} />
    </span>
  )
}

/** 게시글 메타 아이콘 — 반응(이모티콘) */
function PostMetaEmoticonIcon() {
  return (
    <span className="enrollment-program-detail-modal__post-meta-icon" aria-hidden>
      <MaskIcon src={reactionSmileUrl} style={{ display: 'block', width: 24, height: 24 }} />
    </span>
  )
}

/**
 * 게시글 본문 — 3줄 초과 시 말줄임 + "... 더보기".
 * 목록에서는 텍스트 서식을 적용하지 않는다(일반 텍스트). 서식은 상세에서만 보인다.
 */
function PostContentWithMore({ content }: { content: string }) {
  const plainText = useMemo(() => toProgramPostPlainText(content), [content])
  const ref = useRef<HTMLDivElement>(null)
  const [isTruncated, setIsTruncated] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setIsTruncated(el.scrollHeight > el.clientHeight)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [content])
  return (
    <div className="enrollment-program-detail-modal__post-content-wrap">
      <div ref={ref} className="enrollment-program-detail-modal__post-content" title={plainText}>
        {plainText}
      </div>
      {isTruncated && (
        <button type="button" className="enrollment-program-detail-modal__post-more">
          ... 더보기
        </button>
      )}
    </div>
  )
}

/** 게시글 첨부파일 아이콘 (클립) */
function PostAttachmentIcon() {
  return (
    <span className="enrollment-program-detail-modal__post-attachment-icon" aria-hidden>
      <AttachmentClipIcon size={20} />
    </span>
  )
}

const DEFAULT_WRITE_AUTHOR_NAME = 'JA KOREA 알림'

const POST_DELETE_GUIDE_LINES = [
  '해당 게시글을 삭제하시겠습니까?',
  '삭제된 정보는 되돌릴 수 없습니다.',
]


export function EnrollmentProgramDetailPostsTab({
  program,
  schoolId,
  showWriteButtonInSection = true,
  deleteGuideWithPostPreview = false,
  writeModalOpen: writeModalOpenProp,
  onWriteModalOpenChange,
  writeAuthorName = DEFAULT_WRITE_AUTHOR_NAME,
  onPostWriteSuccess,
  onPostDeleted,
  postsOverride = null,
  filesOverride = null,
}: EnrollmentProgramDetailPostsTabProps) {
  const [internalWriteModalOpen, setInternalWriteModalOpen] = useState(false)
  const isWriteModalControlled =
    writeModalOpenProp !== undefined && onWriteModalOpenChange !== undefined
  const postWriteModalOpen = isWriteModalControlled ? writeModalOpenProp! : internalWriteModalOpen
  const setPostWriteModalOpen = isWriteModalControlled
    ? onWriteModalOpenChange!
    : setInternalWriteModalOpen

  const currentUser = useAuthStore(state => state.user)
  const { showAlert } = useCmsAlert()
  const membersRemote = isMembersRemoteEnabled()
  const [detailPost, setDetailPost] = useState<ProgramPost | null>(null)
  const [editingPost, setEditingPost] = useState<ProgramPost | null>(null)
  const [deleteTargetPost, setDeleteTargetPost] = useState<ProgramPost | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [removedPostIds, setRemovedPostIds] = useState<Set<string>>(() => new Set())
  const [contentOverrides, setContentOverrides] = useState<Record<string, string>>({})
  const [readPopoverPostId, setReadPopoverPostId] = useState<string | null>(null)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [postsVersion, setPostsVersion] = useState(0)

  useEffect(() => {
    if (!postWriteModalOpen) setEditingPost(null)
  }, [postWriteModalOpen])

  const posts = useMemo(() => {
    const list = resolveEnrollmentProgramPostsList({
      membersRemote,
      postsOverride,
      programId: program.id,
      schoolId,
    })
    return [...list]
      .filter(post => !removedPostIds.has(post.id))
      .map(post =>
        contentOverrides[post.id] != null ? { ...post, content: contentOverrides[post.id] } : post
      )
      .sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      })
  }, [
    program.id,
    schoolId,
    postsVersion,
    postsOverride,
    membersRemote,
    removedPostIds,
    contentOverrides,
  ])
  const allFilesRaw = useMemo(
    () =>
      resolveEnrollmentProgramFilesList({
        membersRemote,
        postsOverride,
        filesOverride,
        programId: program.id,
      }),
    [program.id, postsVersion, membersRemote, postsOverride, filesOverride]
  )
  const schoolPostIds = useMemo(() => new Set(posts.map(p => p.id)), [posts])
  const allFiles = useMemo(() => {
    if (!schoolId) return allFilesRaw
    return allFilesRaw.filter(f => !f.postId || schoolPostIds.has(f.postId))
  }, [allFilesRaw, schoolId, schoolPostIds])

  const [fileSearchInput, setFileSearchInput] = useState('')
  const [fileSearchDebounced, setFileSearchDebounced] = useState('')
  useEffect(() => {
    if (fileSearchInput.trim() === '') {
      setFileSearchDebounced('')
      return
    }
    const t = setTimeout(() => setFileSearchDebounced(fileSearchInput), 280)
    return () => clearTimeout(t)
  }, [fileSearchInput])

  const filteredFiles = useMemo(() => {
    if (!fileSearchDebounced.trim()) return allFiles
    const q = fileSearchDebounced.trim().toLowerCase()
    return allFiles.filter(f => f.fileName.toLowerCase().includes(q))
  }, [allFiles, fileSearchDebounced])

  useEffect(() => {
    if (!selectedFileId) return
    const exists = filteredFiles.some(file => file.id === selectedFileId)
    if (!exists) setSelectedFileId(null)
  }, [filteredFiles, selectedFileId])

  const makeFileMenuItems = (file: ProgramFile): MenuProps['items'] => [
    {
      key: 'download',
      label: '다운로드',
      onClick: () => void downloadFile(file.fileName, file.fileUrl),
    },
    {
      key: 'preview',
      label: '원글보기',
      onClick: () => {
        if (file.postId) {
          const post = posts.find(p => p.id === file.postId)
          if (post) setDetailPost(post)
        }
      },
    },
  ]

  const makePostMenuItems = (post: ProgramPost): MenuProps['items'] => [
    {
      key: 'delete',
      label: '삭제',
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation()
        setDeleteTargetPost(post)
      },
    },
    {
      key: 'edit',
      label: '수정',
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation()
        setEditingPost(post)
        setPostWriteModalOpen(true)
      },
    },
  ]

  const handleConfirmDeletePost = async () => {
    if (!deleteTargetPost) return
    setDeleteSubmitting(true)
    try {
      if (shouldUseGeneralProgramsRemoteApi() && !deleteTargetPost.id.startsWith('temp-')) {
        await deleteGeneralProgramPost(program.id, deleteTargetPost.id)
      }
      setRemovedPostIds(prev => new Set(prev).add(deleteTargetPost.id))
      if (detailPost?.id === deleteTargetPost.id) setDetailPost(null)
      if (onPostDeleted) onPostDeleted(deleteTargetPost.id)
      else onPostWriteSuccess?.()
      setDeleteTargetPost(null)
    } catch (e) {
      const data =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: unknown } }).response?.data
          : undefined
      showAlert({
        title: '안내',
        content: extractApiErrorMessage(data, { fallback: '게시글 삭제에 실패했습니다.' }),
      })
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const getFileTypeLabel = (file: ProgramFile): string => {
    const t = (file.fileType ?? file.fileName.split('.').pop() ?? '').toLowerCase()
    if (t === 'pdf') return 'PDF'
    if (t === 'xls' || t === 'xlsx') return 'XLS'
    return ''
  }

  return (
    <div className="enrollment-program-detail-modal__posts-tab">
      {showWriteButtonInSection ? (
        <div className="enrollment-program-detail-modal__posts-tab-toolbar">
          <CmsButton
            variant="primary"
            size="large"
            onClick={() => setPostWriteModalOpen(true)} >
            게시글 등록
          </CmsButton>
        </div>
      ) : null}
      <div className="enrollment-program-detail-modal__posts-tab-body">
      <div className="enrollment-program-detail-modal__posts-tab-column enrollment-program-detail-modal__posts-tab-column--left">
        {posts.length === 0 ? (
          <div className="enrollment-program-detail-modal__posts-empty">
            <CmsTableEmptyState
              variant="no-data"
              title="등록된 게시글이 없습니다"
              description="게시글이 등록되면 이곳에 목록이 표시됩니다."
            />
          </div>
        ) : (
          <div className="enrollment-program-detail-modal__posts-list">
            {posts.map(post => (
              <article
                key={post.id}
                role="button"
                tabIndex={0}
                className={`enrollment-program-detail-modal__post-card ${detailPost?.id === post.id ? 'enrollment-program-detail-modal__post-card--selected' : ''}`}
                onClick={() => setDetailPost(post)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setDetailPost(post)
                  }
                }}
              >
                <div className="enrollment-program-detail-modal__post-header">
                  <div className="enrollment-program-detail-modal__post-author">
                    <ProfileAvatarIcon className="enrollment-program-detail-modal__post-avatar" />
                    <div>
                      <div className="enrollment-program-detail-modal__post-author-name">
                        {post.authorName}
                      </div>
                      <div className="enrollment-program-detail-modal__post-date">
                        {formatKoDate(post.publishedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="enrollment-program-detail-modal__post-header-actions">
                    <span
                      className={`enrollment-program-detail-modal__read-tag enrollment-program-detail-modal__read-tag--${post.read ? 'read' : 'unread'}`}
                    >
                      {post.read ? '읽음' : '읽지 않음'}
                    </span>
                    {isOwnProgramPost(post, currentUser) ? (
                      <Dropdown
                        menu={{ items: makePostMenuItems(post) }}
                        trigger={['click']}
                        placement="bottomRight"
                      >
                        <button
                          type="button"
                          className="enrollment-program-detail-modal__post-menu-btn"
                          aria-label="게시글 메뉴"
                          onClick={e => e.stopPropagation()}
                        >
                          <MeatballMenuIcon
                            maskId={`post-menu-${post.id}`.replace(/[^a-zA-Z0-9_-]/g, '')}
                          />
                        </button>
                      </Dropdown>
                    ) : null}
                  </div>
                </div>
                <div className="enrollment-program-detail-modal__post-body">
                  {post.postType && (
                    <span className="enrollment-program-detail-modal__post-type-tag">
                      {post.postType === 'notice' ? '[공지사항]' : '[일정 알림]'}
                    </span>
                  )}
                  <PostContentWithMore content={post.content} />
                </div>
                <div
                  className="enrollment-program-detail-modal__post-meta"
                  aria-label="조회·댓글·반응"
                >
                  {(post.attachmentCount ?? 0) > 0 && (
                    <span className="enrollment-program-detail-modal__post-attachments">
                      <PostAttachmentIcon />
                      <span className="enrollment-program-detail-modal__post-attachment-label">
                        {post.attachmentCount}개의 첨부파일
                      </span>
                    </span>
                  )}
                  <div className="enrollment-program-detail-modal__post-meta-right">
                    <Popover
                      trigger="click"
                      arrow={false}
                      open={readPopoverPostId === post.id}
                      onOpenChange={open => setReadPopoverPostId(open ? post.id : null)}
                      overlayClassName="post-read-status-popover"
                      overlayStyle={{ transition: 'none' }}
                      overlayInnerStyle={{ transition: 'none' }}
                      getPopupContainer={trigger =>
                        trigger.closest('.enrollment-program-detail-modal__posts-list') ??
                        document.body
                      }
                      content={
                        <PostReadStatusPopoverContent
                          postId={post.id}
                          programId={program.id}
                          postSchoolId={post.schoolId}
                          tabSchoolId={schoolId}
                        />
                      }
                    >
                      <button
                        type="button"
                        className="enrollment-program-detail-modal__post-meta-item enrollment-program-detail-modal__post-meta-trigger"
                        onClick={e => e.stopPropagation()}
                        aria-label="게시글 읽음 현황"
                      >
                        <PostMetaEyeIcon />
                        <span>
                          {typeof post.viewCount === 'number'
                            ? post.viewCount
                            : getPostViewCountForContext(
                                post.id,
                                program.id,
                                post.schoolId,
                                schoolId
                              )}
                        </span>
                      </button>
                    </Popover>
                    <span className="enrollment-program-detail-modal__post-meta-item">
                      <PostMetaCommentIcon />
                      <span>{post.commentCount ?? 0}</span>
                    </span>
                    <span className="enrollment-program-detail-modal__post-meta-item">
                      <PostMetaEmoticonIcon />
                      <span>
                        {typeof post.reactionCount === 'number'
                          ? post.reactionCount
                          : getReactionTotalCountByPostId(post.id)}
                      </span>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <div className="enrollment-program-detail-modal__posts-tab-column enrollment-program-detail-modal__posts-tab-column--right">
        <div className="enrollment-program-detail-modal__files-search-wrap">
          <Input
            placeholder="파일명으로 검색해보세요"
            prefix={
              <span className="enrollment-program-detail-modal__files-search-icon" aria-hidden>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9.0625 1.875C13.032 1.875 16.25 5.09295 16.25 9.0625C16.25 10.8222 15.6153 12.4322 14.5654 13.6816L17.9419 17.0581C18.1859 17.3022 18.1859 17.6978 17.9419 17.9419C17.6978 18.186 17.3022 18.1859 17.0581 17.9419L13.6816 14.5667C12.4323 15.6162 10.8219 16.25 9.0625 16.25C5.09295 16.25 1.875 13.032 1.875 9.0625C1.875 5.09296 5.09295 1.875 9.0625 1.875ZM9.0625 3.125C5.78331 3.125 3.125 5.78331 3.125 9.0625C3.125 12.3417 5.78331 15 9.0625 15C12.3417 15 15 12.3417 15 9.0625C15 5.78331 12.3417 3.125 9.0625 3.125Z"
                    fill="#85969D"
                  />
                </svg>
              </span>
            }
            value={fileSearchInput}
            onChange={e => setFileSearchInput(e.target.value)}
            allowClear
            className="enrollment-program-detail-modal__files-search"
          />
        </div>
        <div className="enrollment-program-detail-modal__files-list">
          {allFiles.length === 0 ? (
            <div className="enrollment-program-detail-modal__files-empty" role="status">
              <p className="enrollment-program-detail-modal__files-empty-title">
                첨부된 파일이 없습니다.
              </p>
              <p className="enrollment-program-detail-modal__files-empty-desc">
                첨부 파일이 등록되면 확인 가능합니다.
              </p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <p className="enrollment-program-detail-modal__placeholder">검색 결과가 없습니다.</p>
          ) : (
            filteredFiles.map(file => (
              <div
                key={file.id}
                className={`enrollment-program-detail-modal__file-item ${selectedFileId === file.id ? 'enrollment-program-detail-modal__file-item--selected' : ''}`}
                onClick={() => setSelectedFileId(file.id)}
              >
                <div
                  className="enrollment-program-detail-modal__file-icon"
                  data-type={file.fileType || 'file'}
                >
                  {getFileTypeLabel(file) || null}
                </div>
                <div className="enrollment-program-detail-modal__file-info">
                  <div className="enrollment-program-detail-modal__file-name" title={file.fileName}>
                    {file.fileName}
                  </div>
                  <div className="enrollment-program-detail-modal__file-meta">
                    {formatFileDate(file.uploadedAt)}
                    {file.fileSize != null ? (
                      <>
                        <DetailInfoFormTdDivider />
                        {formatFileSize(file.fileSize)}
                      </>
                    ) : null}
                  </div>
                </div>
                <Dropdown
                  menu={{ items: makeFileMenuItems(file) }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <button
                    type="button"
                    className="enrollment-program-detail-modal__file-menu-btn"
                    aria-label="파일 메뉴"
                  >
                    <MeatballMenuIcon
                      maskId={`file-menu-${file.id}`.replace(/[^a-zA-Z0-9_-]/g, '')}
                    />
                  </button>
                </Dropdown>
              </div>
            ))
          )}
        </div>
      </div>
      </div>
      <PostWriteModal
        open={postWriteModalOpen}
        onCancel={() => {
          setPostWriteModalOpen(false)
          setEditingPost(null)
        }}
        programId={program.id}
        program={program}
        schoolId={schoolId}
        authorName={writeAuthorName}
        editingPost={editingPost}
        onSuccess={updated => {
          if (updated?.postId && updated.content != null) {
            setContentOverrides(prev => ({ ...prev, [updated.postId]: updated.content }))
          }
          setEditingPost(null)
          setPostsVersion(v => v + 1)
          onPostWriteSuccess?.()
        }}
      />
      <PostDetailModal
        open={detailPost !== null}
        onCancel={() => setDetailPost(null)}
        post={detailPost}
        files={detailPost ? allFiles.filter(f => f.postId === detailPost.id) : []}
        canManage={detailPost != null && isOwnProgramPost(detailPost, currentUser)}
        onEdit={() => {
          if (!detailPost) return
          setEditingPost(detailPost)
          setDetailPost(null)
          setPostWriteModalOpen(true)
        }}
        onDelete={() => {
          if (!detailPost) return
          setDeleteTargetPost(detailPost)
        }}
        onPostStatsChanged={() => setPostsVersion(v => v + 1)}
      />
      <DeleteGuideModal
        open={deleteTargetPost != null}
        title="게시글 삭제 안내"
        lines={
          deleteGuideWithPostPreview
            ? buildPostDeleteGuideLines(deleteTargetPost, POST_DELETE_GUIDE_LINES)
            : POST_DELETE_GUIDE_LINES
        }
        confirmLoading={deleteSubmitting}
        onConfirm={() => void handleConfirmDeletePost()}
        onCancel={() => {
          if (deleteSubmitting) return
          setDeleteTargetPost(null)
        }}
      />
    </div>
  )
}
