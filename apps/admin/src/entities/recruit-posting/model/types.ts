/**
 * 채용공고 관리
 * status: recruiting 모집중 / result 결과발표 / closed 모집완료
 * 등록·수정 폼 게시글 유형은 모집(recruiting) · 발표(result)만 선택
 */

import type { GeneralAttachmentMime } from '@/shared/lib/attachment-policy'

export type RecruitPostingStatus = 'recruiting' | 'result' | 'closed'

/** 등록·수정 모달 — 게시글 유형 (모집 / 발표) */
export type RecruitPostingFormStatus = 'recruiting' | 'result'

export type RecruitPostingVisibility = 'public' | 'private'

export type RecruitPostingAttachmentMime = GeneralAttachmentMime

export type RecruitPostingAttachment = {
  id: string
  name: string
  mime: RecruitPostingAttachmentMime
  /** mock: data URL / remote: publicUrl */
  dataUrl?: string
  /** 신규 선택 시 원본 File */
  file?: File
  assetId?: number
}

export type RecruitPosting = {
  id: string
  isPublic: boolean
  status: RecruitPostingStatus
  title: string
  /** 본문 — local은 markdown, remote 응답은 HTML일 수 있음 */
  contentMarkdown: string
  /** Platform 공개 목록에는 없음. Admin 목록·상세용. */
  authorName: string
  /** ISO 또는 YYYY-MM-DD. Admin 목록·상세용. */
  recruitStart: string
  recruitEnd: string
  /** Platform 게시일. 날짜 또는 ISO datetime. */
  publishedAt: string
  /** Admin 작성일시. */
  createdAt: string
  /** 조회수 — 목록 OpenAPI에 없으면 0 */
  viewCount: number
  attachments: RecruitPostingAttachment[]
  /** 홈페이지 상세 하단 버튼명. 비면 플랫폼 기본 문구. */
  buttonLabel: string
  /** 하단 버튼 이동 URL. 값이 있을 때만 공개 상세에 버튼 노출 */
  linkUrl: string
  version: number
}

export type RecruitPostingListFilter = {
  visibility?: RecruitPostingVisibility
  status?: RecruitPostingStatus
  title?: string
  authorName?: string
  recruitFrom?: string
  recruitTo?: string
  publishedFrom?: string
  publishedTo?: string
}

export type RecruitPostingCreateInput = {
  title: string
  contentMarkdown: string
  isPublic: boolean
  /** 모집 | 발표 (등록). 수정 시 모집완료 유지용 `closed` 가능 */
  status: RecruitPostingFormStatus | 'closed'
  publishedAt: string
  recruitStart: string
  recruitEnd: string
  authorName: string
  attachments: RecruitPostingAttachment[]
  buttonLabel: string
  linkUrl: string
}

export type RecruitPostingUpdateInput = RecruitPostingCreateInput & {
  id: string
}
