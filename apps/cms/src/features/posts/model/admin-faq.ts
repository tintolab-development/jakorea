export interface AdminFaq {
  id: string
  /** 파일 업로드 owner. 공개 id와 다른 숫자 PK */
  resourceId?: number
  /** 카테고리 관리 모달 라벨과 문자열 일치 */
  category: string
  question: string
  answer: string
  author: string
  status: 'published' | 'draft' | 'archived'
  createdAt: string
  /** 수정일시 — API에 없으면 createdAt으로 표시 */
  updatedAt?: string
}
