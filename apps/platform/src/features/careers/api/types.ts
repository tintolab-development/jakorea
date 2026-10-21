/** GET /api/public/careers/guide — 공개 채용 안내 (무토큰) */

export type PublicCareerCultureItem = {
  displayOrder?: number
  code?: string
  label?: string
  title?: string
  description?: string
}

export type PublicCareerInterview = {
  displayOrder?: number
  storyKey?: string
  title?: string
  year?: number
  coverImageUrl?: string | null
}

export type PublicCareerGuideResponse = {
  mainText?: string
  subTextKo?: string
  subTextEn?: string
  bannerImageUrl?: string | null
  cultureItems?: PublicCareerCultureItem[]
  interviews?: PublicCareerInterview[]
}

/** GET /api/public/careers/postings — 공개 채용공고 (무토큰). CLOSED는 응답에 없다. */

export type PublicCareerPostingStatus = 'RECRUITING' | 'RESULT' | 'CLOSED'

export type PublicCareerPostingItem = {
  id?: number
  externalKey?: string
  status?: PublicCareerPostingStatus
  title?: string
  /** YYYY-MM-DD */
  publishedOn?: string
}

export type PublicCareerPostingListQuery = {
  q?: string
  /** 0-based */
  page: number
  size: number
}

export type PublicCareerPostingListResponse = {
  items?: PublicCareerPostingItem[]
  totalCount?: number
  page?: number
  size?: number
  totalPages?: number
}

/**
 * GET /api/public/careers/postings/{key}
 * key는 목록과 같다. externalKey가 있으면 그 값, 없으면 숫자 id.
 * 비공개·CLOSED·없음은 404. 목록 item 스키마는 바꾸지 않는다.
 */
export type PublicCareerPostingAsset = {
  assetId?: number
  originalName?: string
  contentType?: string
  sizeBytes?: number
  /** 다운로드 URL. 도메인 fileUrl */
  publicUrl?: string
  purpose?: string
  status?: string
  confirmedAt?: string
  version?: number
}

export type PublicCareerPostingDetail = {
  id?: number
  externalKey?: string
  /** 200은 RECRUITING | RESULT 만. CLOSED는 404 */
  status?: PublicCareerPostingStatus
  title?: string
  /** YYYY-MM-DD */
  publishedOn?: string
  /** date-time. publishedOn이 없을 때만 표시 날짜 fallback */
  publishedAt?: string | null
  /** YYYY-MM-DD. 둘 다 있을 때만 모집 기간 */
  recruitStart?: string | null
  /** YYYY-MM-DD */
  recruitEnd?: string | null
  /** HTML. 없으면 "" */
  body?: string
  /** 0 또는 1. null 이면 첨부 없음 */
  attachment?: PublicCareerPostingAsset | null
  /** GET 성공 시 증가한 뒤의 값. 항상 숫자 */
  viewCount?: number
}

/** POST /api/public/careers/talent-applications — 공개 인재채용 지원 (무토큰) */

export type PublicCareerTalentJobInterest =
  | 'MANAGEMENT_PLANNING'
  | 'PR_DESIGN'
  | 'ACCOUNTING'
  | 'HR_ADMIN'
  | 'EDUCATION_OPS'
  | 'OTHER'

export type PublicCareerTalentEducationLevel =
  | 'HIGH_SCHOOL'
  | 'COLLEGE'
  | 'UNIVERSITY'
  | 'MASTER'
  | 'DOCTOR'
  | 'OTHER'

export type PublicCareerTalentCareerType = 'NEWBIE' | 'EXPERIENCED'

export type PublicCareerTalentApplicationCreateRequest = {
  jobInterest: PublicCareerTalentJobInterest
  name: string
  phone: string
  email: string
  addressRoad: string
  addressDetail?: string
  educationLevel: PublicCareerTalentEducationLevel
  schoolName: string
  major?: string
  educationInfo?: string
  careerType: PublicCareerTalentCareerType
  careerInfo?: string
  privacyAgreed: true
  /** confirm 완료된 careers 첨부 asset. 없으면 키 생략 */
  attachmentAssetId?: number
}

export type PublicCareerTalentApplicationCreateResponse = {
  id?: number
  status?: 'PENDING' | 'CONFIRMED'
}
