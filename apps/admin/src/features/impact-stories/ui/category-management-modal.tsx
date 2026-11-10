/**
 * 임팩트 스토리 카테고리 관리 모달 — CMS 카테고리 관리와 동일 초안·저장 규칙
 */

import { useMemo } from 'react'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type { ImpactStory, ImpactStoryCategory } from '@/entities/impact-stories/model/types'
import { useCategoryManagementModal } from '@/features/impact-stories/hooks/use-category-management-modal'
import { CategoryDeleteBlockedModal } from '@/features/impact-stories/ui/category-delete-blocked-modal'
import {
  CmsButton,
  CmsInput,
  ConfirmModal,
  CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS,
  ContentModal,
} from '@/shared/ui'

import './category-management-modal.css'

/** 모달 가로 패딩 30×2 제외 (600 − 60). 관리 열 = 행 버튼 H32 100×2 + 간격 8 + 셀 패딩 12×2 = 232 */
const TABLE_INNER_WIDTH = 540
const ACTIONS_COL_WIDTH = 232
const NAME_COL_WIDTH = TABLE_INNER_WIDTH - ACTIONS_COL_WIDTH
/** 최대 6행은 잘리지 않게 전부 노출. 7행부터 tbody만 세로 스크롤 */
const VISIBLE_CATEGORY_ROWS = 6
/** 관리 버튼 H32 + 셀 패딩 10×2 */
const CATEGORY_ROW_HEIGHT = 52
const TABLE_BODY_SCROLL_Y = VISIBLE_CATEGORY_ROWS * CATEGORY_ROW_HEIGHT

const CATEGORY_MODAL_Z = 1000
const CATEGORY_SUB_MODAL_Z = 1100

type Props = {
  open: boolean
  onCancel: () => void
  categories: ImpactStoryCategory[]
  stories: readonly ImpactStory[]
  onSave: (next: ImpactStoryCategory[]) => Promise<void> | void
}

function CategoryGuideModal({
  open,
  title,
  body,
  onClose,
  zIndex = CATEGORY_SUB_MODAL_Z,
}: {
  open: boolean
  title: string
  body: string
  onClose: () => void
  zIndex?: number
}) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title={title}
      width={600}
      zIndex={zIndex}
      className="is-category-delete-blocked"
      description={body}
      footer={
        <CmsButton variant="secondary" size="h40" type="button" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      {null}
    </ContentModal>
  )
}

export function CategoryManagementModal({
  open,
  onCancel,
  categories,
  stories,
  onSave,
}: Props) {
  const ctrl = useCategoryManagementModal({
    open,
    categories,
    stories,
    onClose: onCancel,
    onSave,
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

  const columns: ColumnsType<ImpactStoryCategory> = useMemo(
    () => [
      {
        title: (
          <span className="is-category-modal__name-th">
            카테고리명
            <span className="is-category-modal__required" aria-hidden>
              *
            </span>
          </span>
        ),
        dataIndex: 'name',
        key: 'name',
        width: NAME_COL_WIDTH,
        align: 'center',
        render: (_: string, row) =>
          editingId === row.id ? (
            <div className="is-category-modal__compose">
              <CmsInput
                ref={editInputRef}
                inputSize="small"
                width="100%"
                value={editDraft}
                onChange={e => setEditDraft(e.target.value)}
                onPressEnter={submitEdit}
                aria-label="카테고리명 편집"
              />
            </div>
          ) : (
            <span className="is-category-modal__name-text">{row.name}</span>
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
              <CmsButton type="button" variant="default" size="h32" onClick={cancelEdit}>
                취소
              </CmsButton>
              <CmsButton type="button" variant="secondary" size="h32" onClick={submitEdit}>
                등록
              </CmsButton>
            </div>
          ) : (
            <div className={CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS}>
              <CmsButton type="button" variant="default" size="h32" onClick={() => startEdit(row)}>
                수정
              </CmsButton>
              <CmsButton
                type="button"
                variant="delete"
                size="h32"
                onClick={() => requestDeleteCategory(row)}
              >
                삭제
              </CmsButton>
            </div>
          ),
      },
    ],
    [cancelEdit, editDraft, editingId, requestDeleteCategory, startEdit, submitEdit]
  )

  const bodyScrolls = ctrl.draftCategories.length > VISIBLE_CATEGORY_ROWS
  const tableClassName = [
    'cms-data-table',
    'cms-data-table--skip-auto-no-col',
    'is-category-modal__table',
    bodyScrolls ? 'is-category-modal__table--scrollable' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const footer = (
    <>
      <CmsButton
        variant="default"
        size="h40"
        type="button"
        disabled={ctrl.isSaving}
        onClick={ctrl.handleClose}
      >
        닫기
      </CmsButton>
      <CmsButton
        variant="secondary"
        size="h40"
        type="button"
        disabled={ctrl.isSaving}
        onClick={ctrl.openCompose}
      >
        항목 추가
      </CmsButton>
      <CmsButton
        variant="primary"
        size="h40"
        type="button"
        loading={ctrl.isSaving}
        disabled={ctrl.isSaving}
        onClick={() => {
          void ctrl.applySettings()
        }}
      >
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
        className="is-category-modal"
        zIndex={CATEGORY_MODAL_Z}
      >
        <div className="is-category-modal__table-wrap">
          <div className="is-category-modal__table-scroll">
            <CmsDataTable<ImpactStoryCategory>
              rowKey="id"
              className={tableClassName}
              tableLayout="fixed"
              pagination={false}
              scroll={bodyScrolls ? { y: TABLE_BODY_SCROLL_Y } : undefined}
              columns={columns}
              dataSource={ctrl.draftCategories}
              emptyTitle="등록된 카테고리가 없습니다."
              emptyDescription={null}
              summary={
                ctrl.composeOpen
                  ? () => (
                      <CmsDataTable.Summary fixed={bodyScrolls ? 'bottom' : undefined}>
                        <CmsDataTable.Summary.Row className="is-category-modal__summary">
                          <CmsDataTable.Summary.Cell index={0} align="center">
                            <div className="is-category-modal__compose">
                              <CmsInput
                                ref={ctrl.newInputRef}
                                inputSize="small"
                                width="100%"
                                placeholder="카테고리명을 입력해 주세요"
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
                                onClick={ctrl.cancelNew}
                              >
                                취소
                              </CmsButton>
                              <CmsButton
                                type="button"
                                variant="secondary"
                                size="h32"
                                onClick={ctrl.submitNew}
                              >
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
        open={ctrl.deleteBlockedOpen}
        onClose={ctrl.closeDeleteBlocked}
        zIndex={CATEGORY_SUB_MODAL_Z}
      />

      <CategoryGuideModal
        open={ctrl.duplicateAlertOpen}
        title="카테고리명 중복 안내"
        body="동일한 카테고리명이 존재합니다."
        onClose={ctrl.closeDuplicateAlert}
      />

      <CategoryGuideModal
        open={ctrl.settingsCompleteOpen}
        title="카테고리 설정 완료"
        body="카테고리 설정이 완료되었습니다."
        onClose={ctrl.closeSettingsComplete}
      />

      <CategoryGuideModal
        open={ctrl.saveErrorMessage != null}
        title="카테고리 저장 안내"
        body={ctrl.saveErrorMessage ?? ''}
        onClose={ctrl.closeSaveError}
      />

      <ConfirmModal
        open={ctrl.deleteConfirmOpen}
        title="카테고리 삭제"
        content={
          ctrl.pendingDeleteRow?.name
            ? `「${ctrl.pendingDeleteRow.name}」 카테고리를 삭제하시겠습니까?\n삭제하면 카테고리 목록에서 제거되며, 이 작업은 취소할 수 없습니다.`
            : '카테고리를 삭제하시겠습니까?\n삭제하면 카테고리 목록에서 제거되며, 이 작업은 취소할 수 없습니다.'
        }
        confirmText="삭제"
        cancelText="취소"
        danger
        onCancel={ctrl.cancelDeleteConfirm}
        onConfirm={ctrl.confirmDeleteCategory}
      />
    </>
  )
}
