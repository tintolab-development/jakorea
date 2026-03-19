/**
 * 수강 프로그램 상세 모달 — 게시글 탭
 * enrollment-program-detail-posts-tab-spec.md 기준
 * getProgramPostsByProgramId, getProgramFilesByProgramId mock 연동
 */

import { useMemo, useState, useRef, useEffect } from 'react'
import { AppButton } from '@/shared/ui/app-button'
import { Input, Dropdown, type MenuProps } from 'antd'
import { SearchOutlined, MoreOutlined } from '@ant-design/icons'
import type { Program, ProgramPost, ProgramFile } from '@/types/domain'
import { getProgramPostsByProgramId, getProgramPostsByProgramIdAndSchoolId, getProgramFilesByProgramId } from '@/data/mock'
import dayjs from 'dayjs'

export interface EnrollmentProgramDetailPostsTabProps {
  program: Program
  /** 참여기관(학교) ID. 있으면 해당 학교 전용 게시글만 표시 (학교 상세 게시글 탭) */
  schoolId?: string
  /** 왼쪽 컬럼 상단 "게시글 작성" 버튼 표시 여부. 기본 true. 학교 상세 풀페이지에서는 탭 행 "게시글 등록"만 쓰므로 false */
  showWriteButtonInSection?: boolean
  /** PostWriteModal open을 부모에서 제어할 때 사용 */
  writeModalOpen?: boolean
  onWriteModalOpenChange?: (open: boolean) => void
}

function formatKoDate(date: string | Date): string {
  const d = dayjs(date)
  const ampm = d.hour() < 12 ? '오전' : '오후'
  const hour = d.hour() % 12 || 12
  return d.format(`YYYY년 M월 D일 ${ampm} ${hour}:mm`)
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
import { PostWriteModal } from './post-write-modal'
import { PostDetailModal } from './post-detail-modal'
import { ProfileAvatarIcon } from '@/shared/components/profile-avatar-icon'
import './enrollment-program-detail-modal.css'

/** 게시글 메타 아이콘 — 눈(조회). mask id는 postId로 고유화 */
function PostMetaEyeIcon({ postId }: { postId: string }) {
  const maskId = `post-meta-eye-${postId}`.replace(/:/g, '')
  return (
    <span className="enrollment-program-detail-modal__post-meta-icon" aria-hidden>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" role="img" aria-label="조회수">
        <mask id={maskId} className="enrollment-program-detail-modal__post-meta-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
          <rect width="20" height="20" fill="#D9D9D9" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <path d="M12.408 12.4079C13.0677 11.7482 13.3976 10.9455 13.3976 9.99996C13.3976 9.0544 13.0677 8.25176 12.408 7.59204C11.7483 6.93232 10.9456 6.60246 10.0001 6.60246C9.05453 6.60246 8.25189 6.93232 7.59217 7.59204C6.93245 8.25176 6.60259 9.0544 6.60259 9.99996C6.60259 10.9455 6.93245 11.7482 7.59217 12.4079C8.25189 13.0676 9.05453 13.3975 10.0001 13.3975C10.9456 13.3975 11.7483 13.0676 12.408 12.4079ZM8.40633 11.5937C7.96883 11.1562 7.75008 10.625 7.75008 9.99996C7.75008 9.37496 7.96883 8.84371 8.40633 8.40621C8.84383 7.96871 9.37508 7.74996 10.0001 7.74996C10.6251 7.74996 11.1563 7.96871 11.5938 8.40621C12.0313 8.84371 12.2501 9.37496 12.2501 9.99996C12.2501 10.625 12.0313 11.1562 11.5938 11.5937C11.1563 12.0312 10.6251 12.25 10.0001 12.25C9.37508 12.25 8.84383 12.0312 8.40633 11.5937ZM5.18675 14.4293C3.73217 13.4935 2.57113 12.2623 1.70363 10.7356C1.63418 10.6159 1.58342 10.4954 1.55133 10.3741C1.51939 10.2529 1.50342 10.1282 1.50342 9.99996C1.50342 9.87177 1.51939 9.74704 1.55133 9.62579C1.58342 9.50454 1.63418 9.38406 1.70363 9.26433C2.57113 7.73767 3.73217 6.50642 5.18675 5.57058C6.64134 4.63461 8.24578 4.16663 10.0001 4.16663C11.7544 4.16663 13.3588 4.63461 14.8134 5.57058C16.268 6.50642 17.429 7.73767 18.2965 9.26433C18.366 9.38406 18.4168 9.50454 18.4488 9.62579C18.4808 9.74704 18.4968 9.87177 18.4968 9.99996C18.4968 10.1282 18.4808 10.2529 18.4488 10.3741C18.4168 10.4954 18.366 10.6159 18.2965 10.7356C17.429 12.2623 16.268 13.4935 14.8134 14.4293C13.3588 15.3653 11.7544 15.8333 10.0001 15.8333C8.24578 15.8333 6.64134 15.3653 5.18675 14.4293ZM14.323 13.3437C15.6355 12.5173 16.639 11.4027 17.3334 9.99996C16.639 8.59718 15.6355 7.4826 14.323 6.65621C13.0105 5.82982 11.5695 5.41663 10.0001 5.41663C8.43064 5.41663 6.98967 5.82982 5.67717 6.65621C4.36467 7.4826 3.3612 8.59718 2.66675 9.99996C3.3612 11.4027 4.36467 12.5173 5.67717 13.3437C6.98967 14.1701 8.43064 14.5833 10.0001 14.5833C11.5695 14.5833 13.0105 14.1701 14.323 13.3437Z" fill="currentColor" />
        </g>
      </svg>
    </span>
  )
}

/** 게시글 메타 아이콘 — 이모티콘(반응) */
function PostMetaEmoticonIcon({ postId }: { postId: string }) {
  const maskId = `post-meta-emoticon-${postId}`.replace(/:/g, '')
  return (
    <span className="enrollment-program-detail-modal__post-meta-icon" aria-hidden>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" role="img" aria-label="반응">
        <mask id={maskId} className="enrollment-program-detail-modal__post-meta-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
          <rect width="20" height="20" fill="#D9D9D9" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <path d="M12.8383 9.0065C13.1416 9.0065 13.3987 8.90032 13.6097 8.68796C13.8207 8.47574 13.9262 8.21803 13.9262 7.91483C13.9262 7.61164 13.8201 7.35455 13.6078 7.14358C13.3956 6.93247 13.1378 6.82692 12.8345 6.82692C12.5313 6.82692 12.2742 6.9331 12.0633 7.14546C11.8523 7.35768 11.7468 7.61539 11.7468 7.91858C11.7468 8.22178 11.8529 8.47886 12.0651 8.68983C12.2773 8.90094 12.5351 9.0065 12.8383 9.0065ZM7.16534 9.0065C7.46853 9.0065 7.72561 8.90032 7.93658 8.68796C8.14756 8.47574 8.25304 8.21803 8.25304 7.91483C8.25304 7.61164 8.14693 7.35455 7.93471 7.14358C7.72249 6.93247 7.46478 6.82692 7.16159 6.82692C6.85825 6.82692 6.6011 6.9331 6.39013 7.14546C6.17915 7.35768 6.07367 7.61539 6.07367 7.91858C6.07367 8.22178 6.17978 8.47886 6.392 8.68983C6.60422 8.90094 6.862 9.0065 7.16534 9.0065ZM12.3845 13.5969C13.1046 13.1102 13.6356 12.4668 13.9774 11.6667H12.8749C12.5694 12.1806 12.1631 12.5868 11.6562 12.8855C11.1492 13.1841 10.5971 13.3334 9.99992 13.3334C9.4027 13.3334 8.85061 13.1841 8.34367 12.8855C7.83672 12.5868 7.43047 12.1806 7.12492 11.6667H6.02242C6.36422 12.4668 6.8952 13.1102 7.61534 13.5969C8.33547 14.0836 9.13033 14.3269 9.99992 14.3269C10.8695 14.3269 11.6644 14.0836 12.3845 13.5969ZM6.91367 17.2934C5.9502 16.8778 5.11214 16.3139 4.3995 15.6015C3.68686 14.8891 3.12263 14.0514 2.70679 13.0884C2.2911 12.1253 2.08325 11.0964 2.08325 10.0015C2.08325 8.9065 2.29103 7.87726 2.70659 6.91379C3.12214 5.95032 3.6861 5.11226 4.39846 4.39962C5.11082 3.68698 5.94853 3.12275 6.91159 2.70692C7.87464 2.29122 8.9036 2.08337 9.99846 2.08337C11.0935 2.08337 12.1227 2.29115 13.0862 2.70671C14.0496 3.12226 14.8877 3.68622 15.6003 4.39858C16.313 5.11094 16.8772 5.94865 17.293 6.91171C17.7087 7.87476 17.9166 8.90372 17.9166 9.99858C17.9166 11.0936 17.7088 12.1228 17.2933 13.0863C16.8777 14.0498 16.3137 14.8878 15.6014 15.6005C14.889 16.3131 14.0513 16.8773 13.0883 17.2932C12.1252 17.7089 11.0962 17.9167 10.0014 17.9167C8.90638 17.9167 7.87714 17.7089 6.91367 17.2934ZM14.7291 14.7292C16.0208 13.4375 16.6666 11.8612 16.6666 10C16.6666 8.13893 16.0208 6.56254 14.7291 5.27087C13.4374 3.97921 11.861 3.33337 9.99992 3.33337C8.13881 3.33337 6.56242 3.97921 5.27075 5.27087C3.97909 6.56254 3.33325 8.13893 3.33325 10C3.33325 11.8612 3.97909 13.4375 5.27075 14.7292C6.56242 16.0209 8.13881 16.6667 9.99992 16.6667C11.861 16.6667 13.4374 16.0209 14.7291 14.7292Z" fill="currentColor" />
        </g>
      </svg>
    </span>
  )
}

/** 게시글 메타 아이콘 — 댓글 */
function PostMetaCommentIcon({ postId }: { postId: string }) {
  const maskId = `post-meta-comment-${postId}`.replace(/:/g, '')
  return (
    <span className="enrollment-program-detail-modal__post-meta-icon" aria-hidden>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" role="img" aria-label="댓글">
        <mask id={maskId} className="enrollment-program-detail-modal__post-meta-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
          <rect width="20" height="20" fill="#D9D9D9" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <path d="M5.40134 15.6324L3.75983 17.2737C3.52656 17.5071 3.25823 17.56 2.95486 17.4324C2.65162 17.3046 2.5 17.0746 2.5 16.7424V4.81561C2.5 4.40141 2.64349 4.05082 2.93047 3.76384C3.21744 3.47686 3.56803 3.33337 3.98224 3.33337H16.5965C17.0107 3.33337 17.3613 3.47686 17.6483 3.76384C17.9353 4.05082 18.0788 4.40141 18.0788 4.81561V14.1502C18.0788 14.5644 17.9353 14.915 17.6483 15.2019C17.3613 15.4889 17.0107 15.6324 16.5965 15.6324H5.40134ZM4.87781 14.4025H16.5965C16.6597 14.4025 16.7175 14.3762 16.7699 14.3236C16.8226 14.2711 16.8489 14.2133 16.8489 14.1502V4.81561C16.8489 4.75248 16.8226 4.69467 16.7699 4.64219C16.7175 4.58958 16.6597 4.56328 16.5965 4.56328H3.98224C3.9191 4.56328 3.8613 4.58958 3.80882 4.64219C3.75621 4.69467 3.7299 4.75248 3.7299 4.81561V15.5379L4.87781 14.4025ZM7.52292 9.99616C7.66422 9.85472 7.73487 9.68363 7.73487 9.48288C7.73487 9.28214 7.66422 9.11104 7.52292 8.96961C7.38148 8.8283 7.21039 8.75765 7.00964 8.75765C6.80889 8.75765 6.6378 8.8283 6.49636 8.96961C6.35506 9.11104 6.28441 9.28214 6.28441 9.48288C6.28441 9.68363 6.35506 9.85472 6.49636 9.99616C6.6378 10.1375 6.80889 10.2081 7.00964 10.2081C7.21039 10.2081 7.38148 10.1375 7.52292 9.99616ZM10.8027 9.99616C10.944 9.85472 11.0146 9.68363 11.0146 9.48288C11.0146 9.28214 10.944 9.11104 10.8027 8.96961C10.6612 8.8283 10.4901 8.75765 10.2894 8.75765C10.0886 8.75765 9.91754 8.8283 9.7761 8.96961C9.6348 9.11104 9.56415 9.28214 9.56415 9.48288C9.56415 9.68363 9.6348 9.85472 9.7761 9.99616C9.91754 10.1375 10.0886 10.2081 10.2894 10.2081C10.4901 10.2081 10.6612 10.1375 10.8027 9.99616ZM14.0824 9.99616C14.2237 9.85472 14.2944 9.68363 14.2944 9.48288C14.2944 9.28214 14.2237 9.11104 14.0824 8.96961C13.941 8.8283 13.7699 8.75765 13.5691 8.75765C13.3684 8.75765 13.1973 8.8283 13.0558 8.96961C12.9145 9.11104 12.8439 9.28214 12.8439 9.48288C12.8439 9.68363 12.9145 9.85472 13.0558 9.99616C13.1973 10.1375 13.3684 10.2081 13.5691 10.2081C13.7699 10.2081 13.941 10.1375 14.0824 9.99616Z" fill="currentColor" />
        </g>
      </svg>
    </span>
  )
}

/** 게시글 본문 — 3줄 초과 시 말줄임 + "... 더보기" */
function PostContentWithMore({ content }: { content: string }) {
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
      <div ref={ref} className="enrollment-program-detail-modal__post-content" title={content}>
        {content}
      </div>
      {isTruncated && (
        <button type="button" className="enrollment-program-detail-modal__post-more">
          ... 더보기
        </button>
      )}
    </div>
  )
}

/** 게시글 첨부파일 아이콘 (클립) — mask id는 postId로 고유화 */
function PostAttachmentIcon({ postId }: { postId: string }) {
  const maskId = `post-attachment-${postId}`.replace(/:/g, '')
  return (
    <span className="enrollment-program-detail-modal__post-attachment-icon" aria-hidden>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" role="img" aria-label="첨부파일">
        <mask id={maskId} className="enrollment-program-detail-modal__post-attachment-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
          <rect width="20" height="20" fill="#D9D9D9" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <path d="M12.1889 15.4212C11.4539 16.472 10.463 17.1104 9.21615 17.3362C7.96934 17.5623 6.82258 17.3093 5.77586 16.5771C4.72504 15.8421 4.09093 14.8495 3.87353 13.5993C3.65605 12.3491 3.91482 11.1987 4.64984 10.1479L8.71807 4.33169C9.24018 3.58525 9.94318 3.13208 10.8271 2.97219C11.7108 2.81222 12.5259 2.99329 13.2724 3.51541C14.0188 4.03752 14.4685 4.74113 14.6214 5.62623C14.7743 6.51134 14.5898 7.32711 14.0676 8.07355L10.2169 13.5787C9.91068 14.0166 9.49637 14.2835 8.97403 14.3794C8.45179 14.4755 7.97169 14.3703 7.53372 14.064C7.09587 13.7577 6.82963 13.3424 6.73503 12.8181C6.6405 12.2937 6.74784 11.8105 7.05705 11.3685L11.0295 5.68928L11.9997 6.36792L8.02728 12.0471C7.90601 12.2205 7.86217 12.4072 7.89576 12.6074C7.92936 12.8075 8.03284 12.9682 8.20622 13.0895C8.37949 13.2106 8.56588 13.2527 8.76539 13.2156C8.9649 13.1786 9.1253 13.0733 9.24657 12.9L13.1016 7.38865C13.429 6.90622 13.5457 6.38535 13.4515 5.82603C13.3573 5.26671 13.0714 4.81996 12.5936 4.48579C12.116 4.15169 11.5959 4.03617 11.0334 4.13923C10.4709 4.24239 10.0226 4.5328 9.68846 5.01044L5.62022 10.8266C5.06646 11.6041 4.87158 12.4583 5.03556 13.3894C5.19947 14.3205 5.67249 15.0596 6.45462 15.6067C7.22596 16.1463 8.07272 16.3303 8.99489 16.1588C9.91698 15.9874 10.6582 15.5153 11.2185 14.7425L15.4085 8.75227L16.3789 9.43102L12.1889 15.4212Z" fill="#3D3D3D" />
        </g>
      </svg>
    </span>
  )
}

export function EnrollmentProgramDetailPostsTab({
  program,
  schoolId,
  showWriteButtonInSection = true,
  writeModalOpen: writeModalOpenProp,
  onWriteModalOpenChange,
}: EnrollmentProgramDetailPostsTabProps) {
  const [internalWriteModalOpen, setInternalWriteModalOpen] = useState(false)
  const isWriteModalControlled = writeModalOpenProp !== undefined && onWriteModalOpenChange !== undefined
  const postWriteModalOpen = isWriteModalControlled ? writeModalOpenProp! : internalWriteModalOpen
  const setPostWriteModalOpen = isWriteModalControlled ? onWriteModalOpenChange! : setInternalWriteModalOpen

  const [detailPost, setDetailPost] = useState<ProgramPost | null>(null)
  const posts = useMemo(() => {
    const list = schoolId
      ? getProgramPostsByProgramIdAndSchoolId(program.id, schoolId)
      : getProgramPostsByProgramId(program.id)
    return [...list].sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })
  }, [program.id, schoolId])
  const allFilesRaw = useMemo(() => getProgramFilesByProgramId(program.id), [program.id])
  const schoolPostIds = useMemo(() => new Set(posts.map(p => p.id)), [posts])
  const allFiles = useMemo(() => {
    if (!schoolId) return allFilesRaw
    return allFilesRaw.filter(f => !f.postId || schoolPostIds.has(f.postId))
  }, [allFilesRaw, schoolId, schoolPostIds])

  const [fileSearchQuery, setFileSearchQuery] = useState('')
  const filteredFiles = useMemo(() => {
    if (!fileSearchQuery.trim()) return allFiles
    const q = fileSearchQuery.trim().toLowerCase()
    return allFiles.filter(f => f.fileName.toLowerCase().includes(q))
  }, [allFiles, fileSearchQuery])

  const makeFileMenuItems = (file: ProgramFile): MenuProps['items'] => [
    { key: 'download', label: '다운로드', onClick: () => window.open(file.fileUrl ?? '#', '_blank') },
    { key: 'preview', label: '원글보기', onClick: () => window.open(file.fileUrl ?? '#', '_blank') },
  ]

  const getFileTypeLabel = (file: ProgramFile): string => {
    const t = (file.fileType ?? file.fileName.split('.').pop() ?? '').toLowerCase()
    if (t === 'pdf') return 'PDF'
    if (t === 'xls' || t === 'xlsx') return 'XLS'
    return ''
  }

  return (
    <div className="enrollment-program-detail-modal__posts-tab">
      <div className="enrollment-program-detail-modal__posts-tab-column enrollment-program-detail-modal__posts-tab-column--left">
        {showWriteButtonInSection && (
          <div className="enrollment-program-detail-modal__posts-tab-header">
            <AppButton
              variant="primary"
              size="middle"
              className="enrollment-program-detail-modal__posts-tab-btn"
              onClick={() => setPostWriteModalOpen(true)}
            >
              게시글 작성
            </AppButton>
          </div>
        )}
        <div className="enrollment-program-detail-modal__posts-list">
          {posts.length === 0 ? (
            <p className="enrollment-program-detail-modal__placeholder">등록된 게시글이 없습니다.</p>
          ) : (
            posts.map(post => (
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
                      <div className="enrollment-program-detail-modal__post-author-name">{post.authorName}</div>
                      <div className="enrollment-program-detail-modal__post-date">
                        {formatKoDate(post.publishedAt)}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`enrollment-program-detail-modal__read-tag enrollment-program-detail-modal__read-tag--${post.read ? 'read' : 'unread'}`}
                  >
                    {post.read ? '읽음' : '읽지 않음'}
                  </span>
                </div>
                <div className="enrollment-program-detail-modal__post-body">
                  {post.postType && (
                    <span className="enrollment-program-detail-modal__post-type-tag">
                      {post.postType === 'notice' ? '[공지사항]' : '[일정 알림]'}
                    </span>
                  )}
                  <PostContentWithMore content={post.content} />
                </div>
                <div className="enrollment-program-detail-modal__post-meta">
                  {post.attachmentCount > 0 && (
                    <span className="enrollment-program-detail-modal__post-meta-item enrollment-program-detail-modal__post-meta-item--attachment">
                      <PostAttachmentIcon postId={post.id} />
                      <span className="enrollment-program-detail-modal__post-attachment-label">
                        {post.attachmentCount}개의 첨부파일
                      </span>
                    </span>
                  )}
                  <div className="enrollment-program-detail-modal__post-meta-right">
                    <span className="enrollment-program-detail-modal__post-meta-item">
                      <PostMetaEyeIcon postId={post.id} />
                      <span>{post.viewCount}</span>
                    </span>
                    <span className="enrollment-program-detail-modal__post-meta-item">
                      <PostMetaEmoticonIcon postId={post.id} />
                      <span>{post.reactionCount}</span>
                    </span>
                    <span className="enrollment-program-detail-modal__post-meta-item">
                      <PostMetaCommentIcon postId={post.id} />
                      <span>{post.commentCount}</span>
                    </span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
      <div className="enrollment-program-detail-modal__posts-tab-column enrollment-program-detail-modal__posts-tab-column--right">
        <div className="enrollment-program-detail-modal__files-search-wrap">
          <Input
            placeholder="파일명으로 검색해보세요"
            prefix={<SearchOutlined className="enrollment-program-detail-modal__files-search-icon" />}
            value={fileSearchQuery}
            onChange={e => setFileSearchQuery(e.target.value)}
            allowClear
            className="enrollment-program-detail-modal__files-search"
          />
        </div>
        <div className="enrollment-program-detail-modal__files-list">
          {allFiles.length === 0 ? (
            <p className="enrollment-program-detail-modal__placeholder">등록된 파일이 없습니다.</p>
          ) : filteredFiles.length === 0 ? (
            <p className="enrollment-program-detail-modal__placeholder">검색 결과가 없습니다.</p>
          ) : (
            filteredFiles.map(file => (
              <div key={file.id} className="enrollment-program-detail-modal__file-item">
                <div className="enrollment-program-detail-modal__file-icon" data-type={file.fileType || 'file'}>
                  {getFileTypeLabel(file) || null}
                </div>
                <div className="enrollment-program-detail-modal__file-info">
                  <div className="enrollment-program-detail-modal__file-name" title={file.fileName}>{file.fileName}</div>
                  <div className="enrollment-program-detail-modal__file-meta">
                    {formatFileDate(file.uploadedAt)}
                    {file.fileSize != null ? ` | ${formatFileSize(file.fileSize)}` : ''}
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
                    <MoreOutlined />
                  </button>
                </Dropdown>
              </div>
            ))
          )}
        </div>
      </div>
      <PostWriteModal
        open={postWriteModalOpen}
        onCancel={() => setPostWriteModalOpen(false)}
      />
      <PostDetailModal
        open={detailPost !== null}
        onCancel={() => setDetailPost(null)}
        post={detailPost}
        files={detailPost ? allFiles.filter(f => f.postId === detailPost.id) : []}
      />
    </div>
  )
}
