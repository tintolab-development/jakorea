/**
 * @deprecated 이름 호환 — `NoticeFormModal` + `mode="create"` 사용 권장
 */
import { NoticeFormModal, type NoticeFormModalProps } from '@/features/posts/ui/notice-form-modal'

export type NoticeRegisterPayload = {
  category: string
  title: string
  contentMarkdown: string
  visibility: 'public' | 'private'
  pinToTop: boolean
  files: File[]
}

export type NoticeRegisterModalProps = Omit<NoticeFormModalProps, 'mode' | 'notice'>

export function NoticeRegisterModal({ open, onCancel, onSuccess }: NoticeRegisterModalProps) {
  return (
    <NoticeFormModal open={open} mode="create" onCancel={onCancel} onSuccess={onSuccess} />
  )
}
