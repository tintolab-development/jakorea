/**
 * 임팩트 스토리 카테고리 관리 모달
 * CMS notice-category 관리 모달 UX 이식 + draft/「카테고리 저장」(Notion·시안)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { InputRef } from 'antd'
import type { ImpactStory, ImpactStoryCategory } from '@/entities/impact-stories/model/types'
import {
  countByCategoryId,
  createCategoryId,
  hasDuplicateCategoryName,
} from '@/features/impact-stories/lib/category-domain'
import { CategoryDeleteBlockedModal } from '@/features/impact-stories/ui/category-delete-blocked-modal'
import { CmsButton, CmsInput, ConfirmModal, ContentModal, useCmsAlert } from '@/shared/ui'

import './category-management-modal.css'

const TABLE_INNER_WIDTH = 540
const NAME_COL_WIDTH = 324
const ACTIONS_COL_WIDTH = TABLE_INNER_WIDTH - NAME_COL_WIDTH
const CATEGORY_MODAL_Z = 1000
const CATEGORY_SUB_MODAL_Z = 1100

type Props = {
  open: boolean
  onCancel: () => void
  categories: ImpactStoryCategory[]
  stories: readonly ImpactStory[]
  saving?: boolean
  onSave: (next: ImpactStoryCategory[]) => Promise<void> | void
}

function cloneCategories(rows: ImpactStoryCategory[]): ImpactStoryCategory[] {
  return rows.map(r => ({ ...r }))
}

export function CategoryManagementModal({
  open,
  onCancel,
  categories,
  stories,
  saving,
  onSave,
}: Props) {
  const { showAlert } = useCmsAlert()
  const [draft, setDraft] = useState<ImpactStoryCategory[]>(() => cloneCategories(categories))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [newDraft, setNewDraft] = useState('')
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [pendingDeleteRow, setPendingDeleteRow] = useState<ImpactStoryCategory | null>(null)

  const editInputRef = useRef<InputRef>(null)
  const newInputRef = useRef<InputRef>(null)

  useEffect(() => {
    if (!open) return
    setDraft(cloneCategories(categories))
    setEditingId(null)
    setEditDraft('')
    setNewDraft('')
    setDeleteBlockedOpen(false)
    setDeleteConfirmOpen(false)
    setPendingDeleteRow(null)
  }, [open, categories])

  const handleClose = useCallback(() => {
    setEditingId(null)
    setEditDraft('')
    setNewDraft('')
    onCancel()
  }, [onCancel])

  const startEdit = useCallback((row: ImpactStoryCategory) => {
    setEditingId(row.id)
    setEditDraft(row.name)
    setNewDraft('')
    requestAnimationFrame(() => editInputRef.current?.focus())
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditDraft('')
  }, [])

  const submitEdit = useCallback(() => {
    if (!editingId) return
    const name = editDraft.trim()
    if (!name) return
    if (hasDuplicateCategoryName(draft, name, editingId)) {
      showAlert({
        title: '카테고리 중복',
        content: '동일한 카테고리명이 이미 존재합니다.',
      })
      return
    }
    setDraft(prev => prev.map(r => (r.id === editingId ? { ...r, name } : r)))
    setEditingId(null)
    setEditDraft('')
  }, [draft, editDraft, editingId, showAlert])

  const cancelNew = useCallback(() => {
    setNewDraft('')
  }, [])

  const submitNew = useCallback(() => {
    const name = newDraft.trim()
    if (!name) return
    if (hasDuplicateCategoryName(draft, name)) {
      showAlert({
        title: '카테고리 중복',
        content: '동일한 카테고리명이 이미 존재합니다.',
      })
      return
    }
    const row: ImpactStoryCategory = {
      id: createCategoryId(),
      name,
      sortOrder: draft.length,
    }
    setDraft(prev => [...prev, row])
    setNewDraft('')
  }, [draft, newDraft, showAlert])

  const focusNewRow = useCallback(() => {
    setEditingId(null)
    setEditDraft('')
    requestAnimationFrame(() => newInputRef.current?.focus())
  }, [])

  const requestDeleteCategory = useCallback(
    (row: ImpactStoryCategory) => {
      const inUse =
        typeof row.storyCount === 'number'
          ? row.storyCount > 0
          : countByCategoryId(stories, s => s.categoryId, row.id) > 0
      if (inUse) {
        setDeleteBlockedOpen(true)
        return
      }
      setPendingDeleteRow(row)
      setDeleteConfirmOpen(true)
    },
    [stories]
  )

  const confirmDeleteCategory = useCallback(() => {
    if (!pendingDeleteRow) return
    setDraft(prev => prev.filter(r => r.id !== pendingDeleteRow.id))
    setPendingDeleteRow(null)
    setDeleteConfirmOpen(false)
  }, [pendingDeleteRow])

  const handleSave = useCallback(async () => {
    if (editingId) {
      showAlert({
        title: '수정 중',
        content: '카테고리 수정을 완료한 뒤 저장해 주세요.',
      })
      return
    }
    try {
      await onSave(draft.map((r, i) => ({ ...r, sortOrder: i })))
      showAlert({
        title: '저장 완료',
        content: '카테고리가 저장되었습니다.',
      })
    } catch {
      showAlert({
        title: '저장 실패',
        content: '카테고리 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [draft, editingId, onSave, showAlert])

  const columns: ColumnsType<ImpactStoryCategory> = useMemo(
    () => [
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
            <div className="is-category-modal__actions">
              <CmsButton
                type="button"
                variant="default"
                size="medium"
                width={80}
                className="is-category-modal__action-btn"
                onClick={cancelEdit}
              >
                취소
              </CmsButton>
              <CmsButton
                type="button"
                variant="secondary"
                size="medium"
                width={80}
                className="is-category-modal__action-btn"
                onClick={submitEdit}
              >
                등록
              </CmsButton>
            </div>
          ) : (
            <div className="is-category-modal__actions">
              <CmsButton
                type="button"
                variant="default"
                size="medium"
                width={80}
                className="is-category-modal__action-btn"
                onClick={() => startEdit(row)}
              >
                수정
              </CmsButton>
              <CmsButton
                type="button"
                variant="delete"
                size="medium"
                width={80}
                className="is-category-modal__action-btn"
                onClick={() => requestDeleteCategory(row)}
              >
                삭제
              </CmsButton>
            </div>
          ),
      },
    ],
    [
      cancelEdit,
      editDraft,
      editingId,
      requestDeleteCategory,
      startEdit,
      submitEdit,
    ]
  )

  const footer = (
    <>
      <CmsButton
        variant="secondary"
        size="large"
        type="button"
        disabled={saving}
        onClick={handleClose}
      >
        닫기
      </CmsButton>
      <CmsButton
        variant="secondary"
        size="large"
        type="button"
        disabled={saving}
        onClick={focusNewRow}
      >
        카테고리 추가
      </CmsButton>
      <CmsButton
        variant="primary"
        size="large"
        type="button"
        loading={saving}
        onClick={() => {
          void handleSave()
        }}
      >
        카테고리 저장
      </CmsButton>
    </>
  )

  return (
    <>
      <ContentModal
        open={open}
        onCancel={handleClose}
        title="카테고리 관리"
        width={600}
        footer={footer}
        className="is-category-modal"
        zIndex={CATEGORY_MODAL_Z}
      >
        <div className="is-category-modal__table-wrap">
          <div className="is-category-modal__table-scroll">
            <Table<ImpactStoryCategory>
              rowKey="id"
              bordered
              className="cms-data-table cms-data-table--skip-auto-no-col is-category-modal__table"
              tableLayout="fixed"
              pagination={false}
              columns={columns}
              dataSource={draft}
              locale={{ emptyText: '등록된 카테고리가 없습니다.' }}
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row className="is-category-modal__summary">
                    <Table.Summary.Cell index={0} align="center">
                      <div className="is-category-modal__compose">
                        <CmsInput
                          ref={newInputRef}
                          inputSize="medium"
                          width="100%"
                          placeholder="카테고리명을 입력해주세요"
                          value={newDraft}
                          onChange={e => setNewDraft(e.target.value)}
                          onPressEnter={submitNew}
                          aria-label="새 카테고리명"
                        />
                      </div>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center">
                      <div className="is-category-modal__actions">
                        <CmsButton
                          type="button"
                          variant="default"
                          size="medium"
                          width={80}
                          className="is-category-modal__action-btn"
                          onClick={cancelNew}
                        >
                          취소
                        </CmsButton>
                        <CmsButton
                          type="button"
                          variant="secondary"
                          size="medium"
                          width={80}
                          className="is-category-modal__action-btn"
                          onClick={submitNew}
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

      <CategoryDeleteBlockedModal
        open={deleteBlockedOpen}
        onClose={() => setDeleteBlockedOpen(false)}
        zIndex={CATEGORY_SUB_MODAL_Z}
      />

      <ConfirmModal
        open={deleteConfirmOpen}
        title="카테고리 삭제"
        content={
          pendingDeleteRow?.name
            ? `「${pendingDeleteRow.name}」 카테고리를 삭제하시겠습니까?\n삭제하면 카테고리 목록에서 제거되며, 이 작업은 취소할 수 없습니다.`
            : '카테고리를 삭제하시겠습니까?\n삭제하면 카테고리 목록에서 제거되며, 이 작업은 취소할 수 없습니다.'
        }
        confirmText="삭제"
        cancelText="취소"
        danger
        onCancel={() => {
          setDeleteConfirmOpen(false)
          setPendingDeleteRow(null)
        }}
        onConfirm={confirmDeleteCategory}
      />
    </>
  )
}
