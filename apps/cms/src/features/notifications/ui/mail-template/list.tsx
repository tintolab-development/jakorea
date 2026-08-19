/**
 * 알림 메시지 관리 > 메일 관리 > 메일 템플릿 탭
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useSearchParams } from 'react-router-dom'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton, CmsModal, ConfirmModal, useCmsAlert } from '@/shared/ui'
import {
  MAIL_ROOT_CATEGORY_ID,
  type MailCategory,
  type MailTemplateItem,
  type MailTemplatePendingFilters,
  type MailTreeSelection,
} from '@/features/notifications/model/mail-template/types'
import { MAIL_TEMPLATE_FILTER_FIELDS } from '@/features/notifications/model/mail-template/filter-fields'
import {
  applyMailFiltersToSearchParams,
  pendingFiltersFromSearchParams,
} from '@/features/notifications/model/mail-template/filter-url'
import {
  MAIL_CATEGORY_MOCK,
  MAIL_TEMPLATE_ITEM_MOCK,
} from '@/features/notifications/model/mail-template/mock'
import {
  canMoveCategoryTo,
  categoryHasChildren,
  categoryNameById,
  collectDeleteIds,
  filterNotificationTree,
  findTemplate,
  moveCategoryToParent,
  moveTemplateToCategory,
} from '@/features/notifications/lib/tree'
import { CategoryNameModal } from '@/features/notifications/ui/alimtalk-template/category-name-modal'
import {
  CategoryTree,
  parseAlimtalkDndId,
  ALIMTALK_DND_CATEGORY_MOVE_PREFIX,
} from '@/features/notifications/ui/alimtalk-template/category-tree'
import { DetailPanel } from './detail-panel'
import '@/pages/programs/program-list-page.css'
import '@/features/notifications/ui/alimtalk-template/list.css'
import './list.css'

type PendingMove =
  | { kind: 'template'; templateId: string; targetCategoryId: string }
  | { kind: 'category'; categoryId: string; targetParentId: string }

type DeleteDialog = 'category' | 'template' | 'blocked' | null

function defaultExpandedIds(categories: MailCategory[]): Set<string> {
  return new Set([MAIL_ROOT_CATEGORY_ID, ...categories.map(category => category.id)])
}

function targetCategoryForAdd(selection: MailTreeSelection, templates: MailTemplateItem[]): string {
  if (!selection) return MAIL_ROOT_CATEGORY_ID
  if (selection.kind === 'category') return selection.id
  return findTemplate(templates, selection.id)?.categoryId ?? MAIL_ROOT_CATEGORY_ID
}

function categoryIdForEdit(
  selection: MailTreeSelection,
  templates: MailTemplateItem[]
): string | null {
  if (!selection) return null
  if (selection.kind === 'category') {
    return selection.id === MAIL_ROOT_CATEGORY_ID ? null : selection.id
  }
  const parentId = findTemplate(templates, selection.id)?.categoryId
  if (!parentId || parentId === MAIL_ROOT_CATEGORY_ID) return null
  return parentId
}

export function MailTemplateList() {
  const { showAlert } = useCmsAlert()
  const [searchParams, setSearchParams] = useSearchParams()
  const appliedFilters = useMemo(() => pendingFiltersFromSearchParams(searchParams), [searchParams])
  const [pendingFilters, setPendingFilters] = useState<MailTemplatePendingFilters>(appliedFilters)
  const pendingFiltersRef = useRef(pendingFilters)
  pendingFiltersRef.current = pendingFilters

  useEffect(() => {
    setPendingFilters(appliedFilters)
  }, [appliedFilters])

  const [categories, setCategories] = useState<MailCategory[]>(MAIL_CATEGORY_MOCK)
  const [templates, setTemplates] = useState<MailTemplateItem[]>(MAIL_TEMPLATE_ITEM_MOCK)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    defaultExpandedIds(MAIL_CATEGORY_MOCK)
  )
  const [selection, setSelection] = useState<MailTreeSelection>({
    kind: 'template',
    id: 'mail-tpl-password',
  })
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialog>(null)
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
  const [categoryModal, setCategoryModal] = useState<{ mode: 'add' | 'edit'; categoryId: string | null } | null>(
    null
  )

  const visibleTree = useMemo(
    () =>
      filterNotificationTree(
        categories,
        templates,
        appliedFilters.categoryName,
        appliedFilters.templateName
      ),
    [appliedFilters.categoryName, appliedFilters.templateName, categories, templates]
  )

  const selectedTemplate =
    selection?.kind === 'template' ? findTemplate(templates, selection.id) ?? null : null
  const selectedCategoryName = selectedTemplate
    ? categoryNameById(categories, selectedTemplate.categoryId)
    : ''

  const selectedDeleteIds = useMemo(() => {
    if (!selection || (selection.kind === 'category' && selection.id === MAIL_ROOT_CATEGORY_ID)) {
      return new Set<string>()
    }
    return new Set([selection.id])
  }, [selection])

  const deletableCheckedCount = useMemo(() => {
    const { categoryIds, templateIds } = collectDeleteIds(categories, templates, selectedDeleteIds)
    return categoryIds.length + templateIds.length
  }, [categories, selectedDeleteIds, templates])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => {
      const next = { ...prev, [key]: typeof value === 'string' ? value : '' }
      pendingFiltersRef.current = next
      return next
    })
  }, [])

  const handleSearch = useCallback(() => {
    setSearchParams(prev => applyMailFiltersToSearchParams(prev, pendingFiltersRef.current), {
      replace: true,
    })
  }, [setSearchParams])

  const handleToggleExpand = useCallback((categoryId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const active = parseAlimtalkDndId(String(event.active.id))
      const over = event.over ? parseAlimtalkDndId(String(event.over.id)) : null
      if (!active || over?.kind !== 'category') return

      const isCategoryMove = String(event.active.id).startsWith(ALIMTALK_DND_CATEGORY_MOVE_PREFIX)
      if (isCategoryMove && active.kind === 'category') {
        if (!canMoveCategoryTo(categories, active.id, over.id)) return
        setPendingMove({ kind: 'category', categoryId: active.id, targetParentId: over.id })
        return
      }

      if (active.kind !== 'template') return
      const template = findTemplate(templates, active.id)
      if (!template || template.categoryId === over.id) return
      setPendingMove({ kind: 'template', templateId: active.id, targetCategoryId: over.id })
    },
    [categories, templates]
  )

  const handleConfirmMove = useCallback(() => {
    if (!pendingMove) return
    if (pendingMove.kind === 'template') {
      setTemplates(prev =>
        moveTemplateToCategory(prev, pendingMove.templateId, pendingMove.targetCategoryId)
      )
      setExpandedIds(prev => new Set(prev).add(pendingMove.targetCategoryId))
    } else {
      setCategories(prev =>
        moveCategoryToParent(prev, pendingMove.categoryId, pendingMove.targetParentId)
      )
      setExpandedIds(prev => new Set(prev).add(pendingMove.targetParentId))
    }
    setPendingMove(null)
  }, [pendingMove])

  const handleRequestDelete = useCallback(() => {
    if (!selection) return
    if (selection.kind === 'category') {
      if (selection.id === MAIL_ROOT_CATEGORY_ID) return
      if (categoryHasChildren(categories, templates, selection.id)) {
        setDeleteDialog('blocked')
        return
      }
      setDeleteDialog('category')
      return
    }
    setDeleteDialog('template')
  }, [categories, selection, templates])

  const handleConfirmDelete = useCallback(() => {
    const { categoryIds, templateIds } = collectDeleteIds(categories, templates, selectedDeleteIds)
    const categoryIdSet = new Set(categoryIds)
    const templateIdSet = new Set(templateIds)
    setCategories(prev => prev.filter(category => !categoryIdSet.has(category.id)))
    setTemplates(prev => prev.filter(template => !templateIdSet.has(template.id)))
    setSelection(current => {
      if (!current) return current
      if (current.kind === 'category' && categoryIdSet.has(current.id)) return null
      if (current.kind === 'template' && templateIdSet.has(current.id)) return null
      return current
    })
    setDeleteDialog(null)
  }, [categories, selectedDeleteIds, templates])

  const handleSubmitCategory = useCallback(
    (name: string) => {
      if (!categoryModal) return
      if (categoryModal.mode === 'add') {
        const parentId = targetCategoryForAdd(selection, templates)
        const id = `cat-${Date.now()}`
        setCategories(prev => [...prev, { id, name, parentId }])
        setExpandedIds(prev => new Set(prev).add(parentId).add(id))
        setSelection({ kind: 'category', id })
      } else if (categoryModal.categoryId) {
        const editId = categoryModal.categoryId
        setCategories(prev =>
          prev.map(category => (category.id === editId ? { ...category, name } : category))
        )
      }
      setCategoryModal(null)
    },
    [categoryModal, selection, templates]
  )

  const editCategoryId = categoryIdForEdit(selection, templates)

  return (
    <div className="program-list-page">
      <FilterTableLayout
        bordered={false}
        filterResponsiveWrap={false}
        hideExcelDownload
        fields={MAIL_TEMPLATE_FILTER_FIELDS}
        filters={{
          categoryName: pendingFilters.categoryName,
          templateName: pendingFilters.templateName,
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="메일 템플릿"
        actions={
          <>
            <CmsButton
              variant="delete"
              size="large"
              type="button"
              disabled={deletableCheckedCount === 0}
              onClick={handleRequestDelete}
            >
              선택 삭제
            </CmsButton>
            <CmsButton
              variant="secondary"
              size="large"
              type="button"
              disabled={!editCategoryId}
              onClick={() => setCategoryModal({ mode: 'edit', categoryId: editCategoryId })}
            >
              카테고리 수정
            </CmsButton>
            <CmsButton
              variant="secondary"
              size="large"
              type="button"
              onClick={() =>
                setCategoryModal({
                  mode: 'add',
                  categoryId: targetCategoryForAdd(selection, templates),
                })
              }
            >
              카테고리 추가
            </CmsButton>
            <CmsButton
              variant="primary"
              size="large"
              type="button"
              onClick={() =>
                showAlert({
                  title: '준비 중',
                  content: '템플릿 등록 기능은 현재 준비 중입니다.',
                })
              }
            >
              템플릿 등록
            </CmsButton>
          </>
        }
      >
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="mail-template-split">
            <CategoryTree
              categories={visibleTree.categories}
              templates={visibleTree.templates}
              expandedIds={expandedIds}
              selection={selection}
              onToggleExpand={handleToggleExpand}
              onSelect={setSelection}
            />
            <DetailPanel
              template={selectedTemplate}
              categoryName={selectedCategoryName}
              onPreview={() =>
                showAlert({
                  title: '준비 중',
                  content: '템플릿 미리보기 기능은 현재 준비 중입니다.',
                })
              }
            />
          </div>
        </DndContext>
      </FilterTableLayout>

      <CmsModal
        open={deleteDialog === 'blocked'}
        onClose={() => setDeleteDialog(null)}
        title="카테고리 삭제 불가"
        content="카테고리 하위에 카테고리 또는 템플릿이 있으면 삭제할 수 없습니다."
        buttons={[
          { label: '닫기', onClick: () => setDeleteDialog(null), variant: 'secondary' },
          { label: '확인', onClick: () => setDeleteDialog(null), variant: 'primary' },
        ]}
      />
      <CmsModal
        open={deleteDialog === 'category'}
        onClose={() => setDeleteDialog(null)}
        title="카테고리 삭제"
        content="카테고리를 삭제하시겠습니까?"
        buttons={[
          { label: '취소', onClick: () => setDeleteDialog(null), variant: 'secondary' },
          { label: '삭제', onClick: handleConfirmDelete, variant: 'delete' },
        ]}
      />
      <ConfirmModal
        open={deleteDialog === 'template'}
        title="선택 삭제"
        content={`선택한 ${deletableCheckedCount}개 항목을 삭제하시겠습니까?`}
        warningMessage="삭제된 항목은 복구할 수 없습니다."
        danger
        confirmText="삭제"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialog(null)}
      />
      <CmsModal
        open={pendingMove?.kind === 'category'}
        onClose={() => setPendingMove(null)}
        title="카테고리 이동"
        content={
          pendingMove?.kind === 'category'
            ? `카테고리 이동 시 하위의 카테고리/템플릿도 같이 이동됩니다.\n[${categoryNameById(categories, pendingMove.categoryId)}] 카테고리의 위치를 이동하시겠습니까?`
            : ''
        }
        buttons={[
          { label: '취소', onClick: () => setPendingMove(null), variant: 'secondary' },
          { label: '이동', onClick: handleConfirmMove, variant: 'primary' },
        ]}
      />
      <CmsModal
        open={pendingMove?.kind === 'template'}
        onClose={() => setPendingMove(null)}
        title="템플릿 이동"
        buttons={[
          { label: '취소', onClick: () => setPendingMove(null), variant: 'secondary' },
          { label: '이동', onClick: handleConfirmMove, variant: 'primary' },
        ]}
      >
        {pendingMove?.kind === 'template' ? (
          <p className="cms-modal__content">
            해당 템플릿을 <strong>[{categoryNameById(categories, pendingMove.targetCategoryId)}]</strong>{' '}
            카테고리로 이동하시겠습니까?
          </p>
        ) : null}
      </CmsModal>
      <CategoryNameModal
        open={categoryModal != null}
        mode={categoryModal?.mode ?? 'add'}
        parentName={
          categoryModal?.mode === 'add' && categoryModal.categoryId
            ? categoryNameById(categories, categoryModal.categoryId)
            : 'Category'
        }
        initialName={
          categoryModal?.mode === 'edit' && categoryModal.categoryId
            ? categoryNameById(categories, categoryModal.categoryId)
            : ''
        }
        onCancel={() => setCategoryModal(null)}
        onSubmit={handleSubmitCategory}
      />
    </div>
  )
}
