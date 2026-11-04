/**
 * 임팩트 스토리 카테고리 관리 모달 — Figma 2100:100121 · ContentModal 600
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type { InputRef } from 'antd'
import type { ImpactStory, ImpactStoryCategory } from '@/entities/impact-stories/model/types'
import {
  countByCategoryId,
  createCategoryId,
  hasDuplicateCategoryName,
  hasImpactCategoryDraftChanges,
  IMPACT_CATEGORY_NAME_INVALID_CHARACTERS_MESSAGE,
  validateImpactCategoryName,
} from '@/features/impact-stories/lib/category-domain'
import { CategoryDeleteBlockedModal } from '@/features/impact-stories/ui/category-delete-blocked-modal'
import { impactStoryCategoryMutationFailureAlert } from '@/features/impact-stories/lib/mutation-failure-alert'
import {
  CmsButton,
  CmsInput,
  ConfirmModal,
  CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS,
  ContentModal,
  showSaveCompletedAlert,
  useCmsAlert,
} from '@/shared/ui'

import './category-management-modal.css'

/** 모달 가로 패딩 30×2 제외 (600 − 60). 관리 열: h40 min-width 120 ×2 + gap 8 + 셀 패딩 10×2 */
const TABLE_INNER_WIDTH = 540
const ACTIONS_COL_WIDTH = 268
const NAME_COL_WIDTH = TABLE_INNER_WIDTH - ACTIONS_COL_WIDTH
/** 최대 6행은 잘리지 않게 전부 노출. 7행부터 tbody만 세로 스크롤 */
const VISIBLE_CATEGORY_ROWS = 6
/** 관리 버튼 h40 + 셀 패딩 10×2 */
const CATEGORY_ROW_HEIGHT = 60
const TABLE_BODY_SCROLL_Y = VISIBLE_CATEGORY_ROWS * CATEGORY_ROW_HEIGHT

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

function showCategoryNameValidationAlert(
  showAlert: ReturnType<typeof useCmsAlert>['showAlert'],
  validation: ReturnType<typeof validateImpactCategoryName>
) {
  if (validation === 'empty') {
    return
  }
  if (validation === 'invalid_characters') {
    showAlert({ title: '안내', content: IMPACT_CATEGORY_NAME_INVALID_CHARACTERS_MESSAGE })
  }
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
  const baselineRef = useRef<ImpactStoryCategory[]>([])
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
    baselineRef.current = cloneCategories(categories)
    setDraft(cloneCategories(categories))
    setEditingId(null)
    setEditDraft('')
    setNewDraft('')
    setDeleteBlockedOpen(false)
    setDeleteConfirmOpen(false)
    setPendingDeleteRow(null)
  }, [open, categories])

  const handleClose = useCallback(() => {
    if (saving) return
    setEditingId(null)
    setEditDraft('')
    setNewDraft('')
    onCancel()
  }, [onCancel, saving])

  const startEdit = useCallback((row: ImpactStoryCategory) => {
    setEditingId(row.id)
    setEditDraft(row.name)
    setNewDraft('')
    queueMicrotask(() => editInputRef.current?.focus())
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditDraft('')
  }, [])

  const submitEdit = useCallback(() => {
    if (!editingId) return
    const validation = validateImpactCategoryName(editDraft)
    if (validation !== 'valid') {
      showCategoryNameValidationAlert(showAlert, validation)
      return
    }
    const name = editDraft.trim()
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
    const validation = validateImpactCategoryName(newDraft)
    if (validation !== 'valid') {
      showCategoryNameValidationAlert(showAlert, validation)
      return
    }
    const name = newDraft.trim()
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
    queueMicrotask(() => newInputRef.current?.focus())
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
    if (newDraft.trim()) {
      showAlert({
        title: '등록 중',
        content: '입력 중인 카테고리를 등록하거나 취소한 뒤 저장해 주세요.',
      })
      return
    }
    const normalized = draft.map((r, i) => ({ ...r, name: r.name.trim(), sortOrder: i }))
    for (const row of normalized) {
      const validation = validateImpactCategoryName(row.name)
      if (validation !== 'valid') {
        showCategoryNameValidationAlert(showAlert, validation)
        return
      }
    }
    if (!hasImpactCategoryDraftChanges(baselineRef.current, normalized)) {
      handleClose()
      return
    }
    try {
      await onSave(normalized)
      baselineRef.current = cloneCategories(normalized)
      handleClose()
      showSaveCompletedAlert()
    } catch (error) {
      showAlert(impactStoryCategoryMutationFailureAlert(error))
    }
  }, [draft, editingId, handleClose, newDraft, onSave, showAlert])

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
            <div className={CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS}>
              <CmsButton type="button" variant="default" size="medium" onClick={cancelEdit}>
                취소
              </CmsButton>
              <CmsButton type="button" variant="secondary" size="medium" onClick={submitEdit}>
                저장
              </CmsButton>
            </div>
          ) : (
            <div className={CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS}>
              <CmsButton
                type="button"
                variant="default"
                size="medium"
                onClick={() => startEdit(row)}
              >
                수정
              </CmsButton>
              <CmsButton
                type="button"
                variant="delete"
                size="medium"
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

  const bodyScrolls = draft.length > VISIBLE_CATEGORY_ROWS
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
        size="medium"
        type="button"
        disabled={saving}
        onClick={handleClose}
      >
        닫기
      </CmsButton>
      <CmsButton
        variant="secondary"
        size="medium"
        type="button"
        disabled={saving}
        onClick={focusNewRow}
      >
        항목 추가
      </CmsButton>
      <CmsButton
        variant="primary"
        size="medium"
        type="button"
        loading={saving}
        onClick={() => {
          void handleSave()
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
        onCancel={handleClose}
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
              dataSource={draft}
              emptyTitle="등록된 카테고리가 없습니다."
              emptyDescription={null}
              summary={() => (
                <CmsDataTable.Summary fixed={bodyScrolls ? 'bottom' : undefined}>
                  <CmsDataTable.Summary.Row className="is-category-modal__summary">
                    <CmsDataTable.Summary.Cell index={0} align="center">
                      <div className="is-category-modal__compose">
                        <CmsInput
                          ref={newInputRef}
                          inputSize="medium"
                          width="100%"
                          placeholder="카테고리명을 입력해 주세요"
                          value={newDraft}
                          onChange={e => setNewDraft(e.target.value)}
                          onPressEnter={submitNew}
                          aria-label="새 카테고리명"
                        />
                      </div>
                    </CmsDataTable.Summary.Cell>
                    <CmsDataTable.Summary.Cell index={1} align="center">
                      <div className={CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS}>
                        <CmsButton type="button" variant="default" size="medium" onClick={cancelNew}>
                          취소
                        </CmsButton>
                        <CmsButton
                          type="button"
                          variant="secondary"
                          size="medium"
                          onClick={submitNew}
                        >
                          등록
                        </CmsButton>
                      </div>
                    </CmsDataTable.Summary.Cell>
                  </CmsDataTable.Summary.Row>
                </CmsDataTable.Summary>
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
