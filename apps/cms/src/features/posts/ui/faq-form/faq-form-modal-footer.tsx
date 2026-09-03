import { CmsButton } from '@/shared/ui'

export type FaqFormModalFooterProps = {
  isEdit: boolean
  canWrite: boolean
  submitLabel: string
  onCancel: () => void
  onSubmit: () => void
  onRequestDelete: () => void
}

/** FAQ 모달 하단 — 수정 시 좌측 FAQ 삭제, 우측 취소·등록/수정 */
export function FaqFormModalFooter({
  isEdit,
  submitLabel,
  onCancel,
  onSubmit,
  onRequestDelete,
}: FaqFormModalFooterProps) {
  return (
    <div className="faq-form-modal__footer-row">
      {isEdit ? (
        <CmsButton
          variant="delete"
          size="large"
          type="button"
          className="faq-form-modal__faq-delete"
          onClick={onRequestDelete}
        >
          FAQ 삭제
        </CmsButton>
      ) : null}
      <div className="faq-form-modal__footer-actions-right">
        <CmsButton variant="secondary" size="large" type="button" onClick={onCancel}>
          취소
        </CmsButton>
        <CmsButton variant="primary" size="large" type="button" adminAction="write" onClick={onSubmit}>
          {submitLabel}
        </CmsButton>
      </div>
    </div>
  )
}
