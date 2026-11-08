import { Form } from 'antd'
import type { FaqFormModalProps } from '@/features/posts/model/faq-form-types'
import { useFaqFormModal } from '@/features/posts/hooks/use-faq-form-modal'
import { resolvePostsDeleteConfirmCopy } from '@/features/posts/lib/posts-delete-confirm-copy'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'

const FAQ_SINGLE_DELETE_COPY = resolvePostsDeleteConfirmCopy('faq', 'single')
import { ContentModal } from '@/shared/ui'
import { FaqFormFields } from '@/features/posts/ui/faq-form/faq-form-fields'
import { FaqFormModalFooter } from '@/features/posts/ui/faq-form/faq-form-modal-footer'
import './faq-form-modal.css'

export type { FaqFormModalMode, FaqFormModalProps } from '@/features/posts/model/faq-form-types'
export type { FaqFormFieldValues } from '@/features/posts/model/faq-form-types'

/**
 * FAQ 등록·수정 모달 — 본문은 `FaqFormFields`, 로직은 `useFaqFormModal` (목록·상세에서 동일 props로 재사용)
 */
export function FaqFormModal(props: FaqFormModalProps) {
  const ctrl = useFaqFormModal(props)

  if (ctrl.isBroken) {
    return null
  }

  return (
    <>
      <NoticeDeleteConfirmModal
        open={ctrl.deleteConfirmOpen}
        onCancel={() => ctrl.setDeleteConfirmOpen(false)}
        onConfirm={ctrl.handleConfirmDelete}
        preset="faq"
        {...FAQ_SINGLE_DELETE_COPY}
      />
      <ContentModal
        open={props.open}
        onCancel={props.onCancel}
        title={ctrl.modalTitle}
        size="large"
        titleBodyGap="none"
        className="faq-form-modal"
        wrapClassName="faq-form-modal-wrap"
        footer={
          <FaqFormModalFooter
            isEdit={ctrl.isEdit}
            canWrite={ctrl.canWrite}
            submitLabel={ctrl.submitLabel}
            onCancel={props.onCancel}
            onSubmit={ctrl.handleSubmit}
            onRequestDelete={ctrl.handleRequestDelete}
          />
        }
      >
        <Form
          form={ctrl.form}
          layout="vertical"
          requiredMark={false}
          className="faq-form-modal__form"
        >
          <FaqFormFields categoryOptions={ctrl.categoryOptions} />
        </Form>
      </ContentModal>
    </>
  )
}
