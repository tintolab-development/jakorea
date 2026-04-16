import { Form } from 'antd'
import type { FaqFormModalProps } from '@/features/posts/model/faq-form-types'
import { useFaqFormModal } from '@/features/posts/hooks/use-faq-form-modal'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'
import { ContentModal } from '@/shared/ui'
import { FaqFormFields } from '@/features/posts/ui/faq-form/faq-form-fields'
import { FaqFormModalFooter } from '@/features/posts/ui/faq-form/faq-form-modal-footer'
import '@toast-ui/editor/dist/toastui-editor.css'
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
        title="FAQ 삭제"
        line1="해당 FAQ를 삭제하시겠습니까?"
        line2="삭제된 목록 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?"
      />
      <ContentModal
        open={props.open}
        onCancel={props.onCancel}
        title={ctrl.modalTitle}
        width={800}
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
        <Form form={ctrl.form} layout="vertical" requiredMark={false} className="faq-form-modal__form">
          <FaqFormFields editorHostRef={ctrl.editorHostRef} categoryOptions={ctrl.categoryOptions} />
        </Form>
      </ContentModal>
    </>
  )
}
