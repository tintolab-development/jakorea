/**
 * 공지·FAQ·문의 카테고리 관리 모달 — 레이아웃·테이블; 상태·분기는 useCategoryManagementModal
 */

import type { ColumnsType } from 'antd/es/table'
import {
  ActionResultModal,
  ContentModal,
  CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS,
  CmsButton,
} from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'
import type { CategoryRemoteActions } from '@/features/posts/hooks/category-remote-actions'
import { useCategoryManagementModal } from '@/features/posts/hooks/use-category-management-modal'
import type {
  CategoryManagementKind,
  PostWithCategoryLabel,
} from '@/features/posts/model/category-management-config'
import type { PostsCategoryRow } from '@/features/posts/model/posts-category-row'
import { CategoryDeleteBlockedModal } from '@/features/posts/ui/category-delete-blocked-modal'
import { NoticeCategoryDuplicateAlertModal } from '@/features/posts/ui/notice-category-management/notice-category-duplicate-alert-modal'
import '@/features/posts/ui/notice-category-management-modal.css'
import { CmsDataTable } from '@/shared/ui/cms-data-table'

/** 모달 가로 패딩 30×2 제외한 테이블 영역 (600 − 60) */
const TABLE_INNER_WIDTH = 540
const NAME_COL_WIDTH = 324
const ACTIONS_COL_WIDTH = TABLE_INNER_WIDTH - NAME_COL_WIDTH
const CATEGORY_MODAL_Z = 1000
const CATEGORY_SUB_MODAL_Z = 1100

export type CategoryManagementModalProps = {
  kind: CategoryManagementKind
  open: boolean
  onCancel: () => void
  categories: PostsCategoryRow[]
  onCategoriesChange: (next: PostsCategoryRow[]) => void
  /** 삭제 전 로컬 사용 여부 — notice/faq/inquiry 목록 rows */
  posts: readonly PostWithCategoryLabel[]
  remoteActions?: CategoryRemoteActions
}

export function CategoryManagementModal({
  kind,
  open,
  onCancel,
  categories,
  onCategoriesChange,
  posts,
  remoteActions,
}: CategoryManagementModalProps) {
  const ctrl = useCategoryManagementModal({
    kind,
    open,
    categories,
    onCategoriesChange,
    posts,
    onClose: onCancel,
    remoteActions,
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

  const columns: ColumnsType<PostsCategoryRow> = [
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
          <div className={CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS}>
            <CmsButton
              type="button"
              variant="default"
              size="h32"
              onClick={cancelEdit} >
              취소
            </CmsButton>
            <CmsButton
              type="button"
              variant="secondary"
              size="h32"
              onClick={submitEdit} >
              등록
            </CmsButton>
          </div>
        ) : (
          <div className={CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS}>
            <CmsButton
              type="button"
              variant="default"
              size="h32"
              onClick={() => startEdit(row)} >
              수정
            </CmsButton>
            <CmsButton
              type="button"
              variant="delete"
              size="h32"
              onClick={() => requestDeleteCategory(row)} >
              삭제
            </CmsButton>
          </div>
        ),
    },
  ]

  const footer = (
    <>
      <CmsButton
        variant="default"
        size="h40"
        type="button"
        onClick={ctrl.handleClose} >
        닫기
      </CmsButton>
      <CmsButton
        variant="secondary"
        size="h40"
        type="button"
        onClick={ctrl.openCompose} >
        항목 추가
      </CmsButton>
      <CmsButton
        variant="primary"
        size="h40"
        type="button"
        onClick={() => void ctrl.applySettings()}
        loading={ctrl.isSaving}
        disabled={ctrl.isSaving} >
        저장
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
        titleBodyGap="list-settings"
        footer={footer}
        className="notice-category-management-modal"
        zIndex={CATEGORY_MODAL_Z}
      >
        <div className="notice-category-management-modal__table-wrap">
          <div className="notice-category-management-modal__table-scroll">
            <CmsDataTable<PostsCategoryRow>
              rowKey="id"
              className="cms-data-table cms-data-table--skip-auto-no-col notice-category-management-modal__table"
              tableLayout="fixed"
              pagination={false}
              columns={columns}
              dataSource={ctrl.draftCategories}
              locale={{ emptyText: '등록된 카테고리가 없습니다.' }}
              summary={
                ctrl.composeOpen
                  ? () => (
                      <CmsDataTable.Summary>
                        <CmsDataTable.Summary.Row className="notice-category-management-modal__summary">
                          <CmsDataTable.Summary.Cell index={0} align="center">
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
                          </CmsDataTable.Summary.Cell>
                          <CmsDataTable.Summary.Cell index={1} align="center">
                            <div className={CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS}>
                              <CmsButton
                                type="button"
                                variant="default"
                                size="h32"
                                onClick={ctrl.cancelNew} >
                                취소
                              </CmsButton>
                              <CmsButton
                                type="button"
                                variant="secondary"
                                size="h32"
                                onClick={ctrl.submitNew} >
                                등록
                              </CmsButton>
                            </div>
                          </CmsDataTable.Summary.Cell>
                        </CmsDataTable.Summary.Row>
                      </CmsDataTable.Summary>
                    )
                  : undefined
              }
            />
          </div>
        </div>
      </ContentModal>

      <CategoryDeleteBlockedModal
        kind={kind}
        open={ctrl.deleteBlockedOpen}
        onClose={ctrl.closeDeleteBlocked}
        zIndex={CATEGORY_SUB_MODAL_Z}
      />

      <NoticeCategoryDuplicateAlertModal
        open={ctrl.duplicateAlertOpen}
        onClose={ctrl.closeDuplicateAlert}
        zIndex={CATEGORY_SUB_MODAL_Z}
      />

      <ActionResultModal
        open={ctrl.settingsCompleteOpen}
        title="카테고리 설정 완료"
        body="카테고리 설정이 완료되었습니다."
        onClose={ctrl.closeSettingsComplete}
        zIndex={CATEGORY_SUB_MODAL_Z}
      />

      <ActionResultModal
        open={ctrl.saveErrorMessage != null}
        title="카테고리 저장 안내"
        body={ctrl.saveErrorMessage ?? ''}
        onClose={ctrl.closeSaveError}
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
