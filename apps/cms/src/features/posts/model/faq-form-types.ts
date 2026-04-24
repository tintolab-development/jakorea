import type { AdminFaq } from '@/data/mock/admin-faqs'

/** FAQ 등록/수정 모달 — Ant Form 필드 */
export type FaqFormFieldValues = {
  question: string
  answer: string
  category: string
  visibility: 'public' | 'private'
}

export type FaqFormModalMode = 'create' | 'edit'

/** 등록·수정 모달 공통 props — 상세·목록 등 어디서든 동일 컴포넌트 재사용 */
export interface FaqFormModalProps {
  open: boolean
  onCancel: () => void
  mode?: FaqFormModalMode
  /** `mode === 'edit'` 일 때 필수 — 기본값·에디터 초기값 주입 */
  faq?: AdminFaq | null
  onSuccess?: (faq: AdminFaq) => void
  /** 수정 모드에서 삭제 완료 후 */
  onDeleted?: () => void
}
