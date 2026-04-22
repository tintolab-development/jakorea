/**
 * 수강 프로그램 상세 모달 — 게시글 탭
 * enrollment-program-detail-posts-tab-spec.md 기준
 * getProgramPostsByProgramId, getProgramFilesByProgramId mock 연동
 */

import { useMemo, useState, useRef, useEffect } from 'react'
import { AppButton } from '@/shared/ui/app-button'
import { Input, Dropdown, Popover, type MenuProps } from 'antd'
import type { Program, ProgramPost, ProgramFile } from '@/types/domain'
import {
  getProgramPostsByProgramId,
  getProgramPostsByProgramIdAndSchoolId,
  getProgramFilesByProgramId,
  getReactionTotalCountByPostId,
  getPostViewCountForContext,
} from '@/data/mock'
import { PostReadStatusPopoverContent } from './post-read-status-popover'
import { downloadFile } from '@/shared/lib/file-download'
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
import { PostWriteModal } from './modal/post-write-modal'
import { PostDetailModal } from './modal/post-detail-modal'
import { ProfileAvatarIcon } from '@/shared/ui/icons'
import './modal/enrollment-program-detail-modal.css'

/** 파일 리스트 옵션 아이콘 (세로 점 세 개) — 30×30 */
function FileMenuOptionIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
      <g opacity="0.5">
        <mask id="mask0_file_menu_option" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="30">
          <rect width="30" height="30" fill="#D9D9D9" />
        </mask>
        <g mask="url(#mask0_file_menu_option)">
          <path d="M15 24.0872C14.4844 24.0872 14.043 23.9035 13.6759 23.5363C13.3086 23.1692 13.125 22.7278 13.125 22.2122C13.125 21.6966 13.3086 21.2551 13.6759 20.8878C14.043 20.5207 14.4844 20.3372 15 20.3372C15.5156 20.3372 15.957 20.5207 16.3241 20.8878C16.6914 21.2551 16.875 21.6966 16.875 22.2122C16.875 22.7278 16.6914 23.1692 16.3241 23.5363C15.957 23.9035 15.5156 24.0872 15 24.0872ZM15 16.8756C14.4844 16.8756 14.043 16.692 13.6759 16.3247C13.3086 15.9576 13.125 15.5163 13.125 15.0006C13.125 14.485 13.3086 14.0436 13.6759 13.6766C14.043 13.3093 14.4844 13.1256 15 13.1256C15.5156 13.1256 15.957 13.3093 16.3241 13.6766C16.6914 14.0436 16.875 14.485 16.875 15.0006C16.875 15.5163 16.6914 15.9576 16.3241 16.3247C15.957 16.692 15.5156 16.8756 15 16.8756ZM15 9.66406C14.4844 9.66406 14.043 9.48052 13.6759 9.11344C13.3086 8.74615 13.125 8.30469 13.125 7.78906C13.125 7.27344 13.3086 6.83208 13.6759 6.465C14.043 6.09771 14.4844 5.91406 15 5.91406C15.5156 5.91406 15.957 6.09771 16.3241 6.465C16.6914 6.83208 16.875 7.27344 16.875 7.78906C16.875 8.30469 16.6914 8.74615 16.3241 9.11344C15.957 9.48052 15.5156 9.66406 15 9.66406Z" fill="#3D3D3D" />
        </g>
      </g>
    </svg>
  )
}

/** 게시글 메타 아이콘 — 눈(조회). mask id는 postId로 고유화, 22×22 */
function PostMetaEyeIcon({ postId }: { postId: string }) {
  const maskId = `post-meta-eye-${postId}`.replace(/:/g, '')
  return (
    <span className="enrollment-program-detail-modal__post-meta-icon" aria-hidden>
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none" role="img" aria-label="조회수">
        <mask id={maskId} className="enrollment-program-detail-modal__post-meta-mask" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="22">
          <rect width="22" height="22" fill="#D9D9D9" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <path d="M13.6493 13.6513C14.375 12.9256 14.7379 12.0427 14.7379 11.0026C14.7379 9.96249 14.375 9.07959 13.6493 8.3539C12.9236 7.6282 12.0407 7.26535 11.0006 7.26535C9.96052 7.26535 9.07762 7.6282 8.35192 8.3539C7.62623 9.07959 7.26338 9.96249 7.26338 11.0026C7.26338 12.0427 7.62623 12.9256 8.35192 13.6513C9.07762 14.377 9.96052 14.7399 11.0006 14.7399C12.0407 14.7399 12.9236 14.377 13.6493 13.6513ZM9.24751 12.7557C8.76625 12.2745 8.52563 11.6901 8.52563 11.0026C8.52563 10.3151 8.76625 9.73073 9.24751 9.24948C9.72875 8.76823 10.3131 8.5276 11.0006 8.5276C11.6881 8.5276 12.2725 8.76823 12.7538 9.24948C13.235 9.73073 13.4756 10.3151 13.4756 11.0026C13.4756 11.6901 13.235 12.2745 12.7538 12.7557C12.2725 13.237 11.6881 13.4776 11.0006 13.4776C10.3131 13.4776 9.72875 13.237 9.24751 12.7557ZM5.70596 15.8749C4.10592 14.8455 2.82878 13.4911 1.87453 11.8118C1.79814 11.6801 1.7423 11.5476 1.70701 11.4142C1.67187 11.2808 1.6543 11.1436 1.6543 11.0026C1.6543 10.8616 1.67187 10.7244 1.70701 10.591C1.7423 10.4576 1.79814 10.3251 1.87453 10.1934C2.82878 8.51408 4.10592 7.15971 5.70596 6.13029C7.30601 5.10072 9.07089 4.58594 11.0006 4.58594C12.9304 4.58594 14.6953 5.10072 16.2953 6.13029C17.8953 7.15971 19.1725 8.51408 20.1267 10.1934C20.2031 10.3251 20.259 10.4576 20.2943 10.591C20.3294 10.7244 20.347 10.8616 20.347 11.0026C20.347 11.1436 20.3294 11.2808 20.2943 11.4142C20.259 11.5476 20.2031 11.6801 20.1267 11.8118C19.1725 13.4911 17.8953 14.8455 16.2953 15.8749C14.6953 16.9045 12.9304 17.4193 11.0006 17.4193C9.07089 17.4193 7.30601 16.9045 5.70596 15.8749ZM15.7558 14.6807C17.1996 13.7717 18.3034 12.5457 19.0673 11.0026C18.3034 9.45955 17.1996 8.23351 15.7558 7.32448C14.3121 6.41545 12.727 5.96094 11.0006 5.96094C9.27424 5.96094 7.68917 6.41545 6.24542 7.32448C4.80167 8.23351 3.69785 9.45955 2.93396 11.0026C3.69785 12.5457 4.80167 13.7717 6.24542 14.6807C7.68917 15.5898 9.27424 16.0443 11.0006 16.0443C12.727 16.0443 14.3121 15.5898 15.7558 14.6807Z" fill="currentColor" />
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
  const [readPopoverPostId, setReadPopoverPostId] = useState<string | null>(null)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [postsVersion, setPostsVersion] = useState(0)
  const posts = useMemo(() => {
    const list = schoolId
      ? getProgramPostsByProgramIdAndSchoolId(program.id, schoolId)
      : getProgramPostsByProgramId(program.id)
    return [...list].sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })
  }, [program.id, schoolId, postsVersion])
  const allFilesRaw = useMemo(
    () => getProgramFilesByProgramId(program.id),
    [program.id, postsVersion]
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
    { key: 'download', label: '다운로드', onClick: () => downloadFile(file.fileName, file.fileUrl) },
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
                    <Popover
                      trigger="click"
                      arrow={false}
                      open={readPopoverPostId === post.id}
                      onOpenChange={open => setReadPopoverPostId(open ? post.id : null)}
                      overlayClassName="post-read-status-popover"
                      overlayStyle={{ transition: 'none' }}
                      overlayInnerStyle={{ transition: 'none' }}
                      getPopupContainer={trigger =>
                        trigger.closest('.enrollment-program-detail-modal__posts-list') ?? document.body
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
                        <PostMetaEyeIcon postId={post.id} />
                        <span>
                          {getPostViewCountForContext(post.id, program.id, post.schoolId, schoolId)}
                        </span>
                      </button>
                    </Popover>
                    <span className="enrollment-program-detail-modal__post-meta-item">
                      <PostMetaEmoticonIcon postId={post.id} />
                      <span>{getReactionTotalCountByPostId(post.id)}</span>
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
            prefix={
              <span className="enrollment-program-detail-modal__files-search-icon" aria-hidden>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M9.0625 1.875C13.032 1.875 16.25 5.09295 16.25 9.0625C16.25 10.8222 15.6153 12.4322 14.5654 13.6816L17.9419 17.0581C18.1859 17.3022 18.1859 17.6978 17.9419 17.9419C17.6978 18.186 17.3022 18.1859 17.0581 17.9419L13.6816 14.5667C12.4323 15.6162 10.8219 16.25 9.0625 16.25C5.09295 16.25 1.875 13.032 1.875 9.0625C1.875 5.09296 5.09295 1.875 9.0625 1.875ZM9.0625 3.125C5.78331 3.125 3.125 5.78331 3.125 9.0625C3.125 12.3417 5.78331 15 9.0625 15C12.3417 15 15 12.3417 15 9.0625C15 5.78331 12.3417 3.125 9.0625 3.125Z" fill="#85969D" />
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
            <p className="enrollment-program-detail-modal__placeholder">등록된 파일이 없습니다.</p>
          ) : filteredFiles.length === 0 ? (
            <p className="enrollment-program-detail-modal__placeholder">검색 결과가 없습니다.</p>
          ) : (
            filteredFiles.map(file => (
              <div
                key={file.id}
                className={`enrollment-program-detail-modal__file-item ${selectedFileId === file.id ? 'enrollment-program-detail-modal__file-item--selected' : ''}`}
                onClick={() => setSelectedFileId(file.id)}
              >
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
                    <FileMenuOptionIcon />
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
        programId={program.id}
        schoolId={schoolId}
        authorName="JA KOREA 알림"
        onSuccess={() => setPostsVersion(v => v + 1)}
      />
      <PostDetailModal
        open={detailPost !== null}
        onCancel={() => setDetailPost(null)}
        post={detailPost}
        files={detailPost ? allFiles.filter(f => f.postId === detailPost.id) : []}
        onPostStatsChanged={() => setPostsVersion(v => v + 1)}
      />
    </div>
  )
}
