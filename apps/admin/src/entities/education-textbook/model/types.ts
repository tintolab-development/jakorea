/**
 * 교재 소개 · 교재 도메인
 * - isActive=false 인 교재는 어드민에서 조회 가능, 홈페이지 비노출(Platform 연동 시)
 */

export type EducationTextbook = {
  id: string
  isActive: boolean
  businessFieldId: string
  /** 교육 대상 다중 선택 */
  educationTargetIds: string[]
  educationEffect: string
  title: string
  description: string
  /** 미첨부 시 기본 썸네일 URL */
  thumbnailUrl: string
  thumbnailFileName?: string
  /** 총 단원 수 */
  unitCount: number
  /** 상세 차시 설명 */
  unitSessionText: string
  /** 단원 소개 Markdown (비어 있으면 상세 비노출) */
  unitIntroMarkdown: string
  authorName: string
  createdAt: string
  updatedAt: string
}

export type EducationTextbookCreateInput = {
  isActive: boolean
  businessFieldId: string
  educationTargetIds: string[]
  educationEffect: string
  title: string
  description: string
  thumbnailUrl: string
  thumbnailFileName?: string
  unitCount: number
  unitSessionText: string
  unitIntroMarkdown: string
  authorName?: string
}

export type EducationTextbookUpdateInput = EducationTextbookCreateInput & {
  id: string
}

export type EducationTextbookListFilter = {
  usage?: 'active' | 'inactive'
  title?: string
  businessFieldId?: string
  educationTargetId?: string
  createdFrom?: string
  createdTo?: string
}
