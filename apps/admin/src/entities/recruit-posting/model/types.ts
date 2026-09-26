/**
 * 채용공고 관리
 * status: recruiting 모집중 / result 결과발표 / closed 모집완료
 */

export type RecruitPostingStatus = 'recruiting' | 'result' | 'closed'

export type RecruitPostingVisibility = 'public' | 'private'

export type RecruitPosting = {
  id: string
  isPublic: boolean
  status: RecruitPostingStatus
  title: string
  /** Platform 공고에는 작성자가 없다. 시드는 빈 문자열. */
  authorName: string
  /** YYYY-MM-DD. 시드는 빈 문자열. */
  recruitStart: string
  recruitEnd: string
  /** Platform 게시일. 날짜만. */
  publishedAt: string
  /** Platform에 없음. 시드는 빈 문자열. */
  createdAt: string
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
