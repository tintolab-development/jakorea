/**
 * 문의 카테고리 관리 모달 — 공지 카테고리 모달과 동일 레이아웃
 */

import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'
import { useInquiryCategoryManagementModal } from '@/features/posts/hooks/use-inquiry-category-management-modal'
import type {
  AdminInquiryRow,
  InquiryCategoryRow,
} from '@/features/posts/model/admin-inquiry-management.types'
import { InquiryCategoryDeleteBlockedModal } from '@/features/posts/ui/inquiry-category-management/inquiry-category-delete-blocked-modal'
import '@/features/posts/ui/notice-category-management-modal.css'

const TABLE_INNER_WIDTH = 540
const NAME_COL_WIDTH = 324
const ACTIONS_COL_WIDTH = TABLE_INNER_WIDTH - NAME_COL_WIDTH
const CATEGORY_MODAL_Z = 1000
const CATEGORY_SUB_MODAL_Z = 1100

export type InquiryCategoryManagementModalProps = {
  open: boolean
  onCancel: () => void
  categories: InquiryCategoryRow[]
  onCategoriesChange: (next: InquiryCategoryRow[]) => void
  inquiries: readonly AdminInquiryRow[]
}

export function InquiryCategoryManagementModal({
  open,
  onCancel,
  categories,
  onCategoriesChange,
  inquiries,
}: InquiryCategoryManagementModalProps) {
  const ctrl = useInquiryCategoryManagementModal({
    open,
    categories,
    onCategoriesChange,
    inquiries,
    onClose: onCancel,
  })

  const {
    editingId,
    editDraft,
    setEditDraft,
    editInputRef,
    startEdit,
    cancelEdit,
    submitEdit,
    requestDeleteCategory,
  } = ctrl

  const columns: ColumnsType<InquiryCategoryRow> = [
    {
      title: '카테고리명',
      dataIndex: 'name',
      key: 'name',
      width: NAME_COL_WIDTH,
      align: 'center',
      render: (_: string, row) =>
        editingId === row.id ? (
          <CmsInput
            ref={editInputRef}
            inputSize="medium"
            width="100%"
            value={editDraft}
            onChange={e => setEditDraft(e.target.value)}
            onPressEnter={submitEdit}
            aria-label="카테고리명 편집"
          />
        ) : (
          <span className="notice-category-management-modal__name-text">{row.name}</span>
        ),
    },
    {
      title: '관리',
      key: 'actions',
      width: ACTIONS_COL_WIDTH,
      align: 'center',
      render: (_: unknown, row) =>
        editingId === row.id ? (
          <div className="notice-category-management-modal__actions">
            <CmsButton
              type="button"
              variant="default"
              size="medium"
              width={80}
              className="notice-category-management-modal__action-btn"
              onClick={cancelEdit}
            >
              취소
            </CmsButton>
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              width={80}
              className="notice-category-management-modal__action-btn"
              onClick={submitEdit}
            >
              등록
            </CmsButton>
          </div>
        ) : (
          <div className="notice-category-management-modal__actions">
            <CmsButton
              type="button"
              variant="default"
              size="medium"
              width={80}
              className="notice-category-management-modal__action-btn"
              onClick={() => startEdit(row)}
            >
              수정
            </CmsButton>
            <CmsButton
              type="button"
              variant="delete"
              size="medium"
              width={80}
              className="notice-category-management-modal__action-btn"
              onClick={() => requestDeleteCategory(row)}
            >
              삭제
            </CmsButton>
          </div>
        ),
    },
  ]

  const footer = (
    <>
      <CmsButton variant="secondary" size="large" type="button" onClick={ctrl.handleClose}>
        닫기
      </CmsButton>
      <CmsButton variant="primary" size="large" type="button" onClick={ctrl.focusNewRow}>
        카테고리 추가
      </CmsButton>
    </>
  )

  return (
    <>
      <ContentModal
        open={open}
        onCancel={ctrl.handleClose}
        title="카테고리 관리"
        width={600}
        footer={footer}
        className="notice-category-management-modal"
        zIndex={CATEGORY_MODAL_Z}
      >
        <div className="notice-category-management-modal__table-wrap">
          <div className="notice-category-management-modal__table-scroll">
            <Table<InquiryCategoryRow>
              rowKey="id"
              bordered
              className="cms-data-table cms-data-table--skip-auto-no-col notice-category-management-modal__table"
              tableLayout="fixed"
              pagination={false}
              columns={columns}
              dataSource={categories}
              locale={{ emptyText: '등록된 카테고리가 없습니다.' }}
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row className="notice-category-management-modal__summary">
                    <Table.Summary.Cell index={0} align="center">
                      <div className="notice-category-management-modal__compose">
                        <CmsInput
                          ref={ctrl.newInputRef}
                          inputSize="medium"
                          width="100%"
                          placeholder="카테고리명을 입력해주세요"
                          value={ctrl.newDraft}
                          onChange={e => ctrl.setNewDraft(e.target.value)}
                          onPressEnter={ctrl.submitNew}
                          aria-label="새 카테고리명"
                        />
                      </div>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center">
                      <div className="notice-category-management-modal__actions">
                        <CmsButton
                          type="button"
                          variant="default"
                          size="medium"
                          width={80}
                          className="notice-category-management-modal__action-btn"
                          onClick={ctrl.cancelNew}
                        >
                          취소
                        </CmsButton>
                        <CmsButton
                          type="button"
                          variant="secondary"
                          size="medium"
                          width={80}
                          className="notice-category-management-modal__action-btn"
                          onClick={ctrl.submitNew}
                        >
                          등록
                        </CmsButton>
                      </div>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </div>
        </div>
      </ContentModal>

      <InquiryCategoryDeleteBlockedModal
        open={ctrl.deleteBlockedOpen}
        onClose={ctrl.closeDeleteBlocked}
        zIndex={CATEGORY_SUB_MODAL_Z}
      />

      <NoticeDeleteConfirmModal
        open={ctrl.deleteConfirmOpen}
        onCancel={ctrl.cancelDeleteConfirm}
        onConfirm={ctrl.confirmDeleteCategory}
        zIndex={CATEGORY_SUB_MODAL_Z}
        title="카테고리 삭제"
        line1={
          ctrl.pendingDeleteRow?.name != null && ctrl.pendingDeleteRow.name !== ''
            ? `「${ctrl.pendingDeleteRow.name}」 카테고리를 삭제하시겠습니까?`
            : '카테고리를 삭제하시겠습니까?'
        }
        line2="삭제하면 카테고리 목록에서 제거되며, 이 작업은 취소할 수 없습니다."
      />
    </>
  )
}
