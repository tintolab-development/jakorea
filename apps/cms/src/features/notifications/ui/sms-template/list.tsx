/**
 * 알림 메시지 관리 > 문자 관리 > 문자 템플릿 탭
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useSearchParams } from 'react-router-dom'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton, CmsModal, ConfirmModal, useCmsAlert } from '@/shared/ui'
import {
  SMS_ROOT_CATEGORY_ID,
  type SmsCategory,
  type SmsTemplateItem,
  type SmsTemplatePendingFilters,
  type SmsTreeSelection,
} from '@/features/notifications/model/sms-template/types'
import { SMS_TEMPLATE_FILTER_FIELDS } from '@/features/notifications/model/sms-template/filter-fields'
import {
  applySmsFiltersToSearchParams,
  pendingFiltersFromSearchParams,
} from '@/features/notifications/model/sms-template/filter-url'
import {
  closeSmsFormSearchParams,
  openSmsCreateFormSearchParams,
  openSmsEditFormSearchParams,
  smsFormStateFromSearchParams,
} from '@/features/notifications/model/sms-template/form-url'
import { SMS_CATEGORY_MOCK, SMS_TEMPLATE_ITEM_MOCK } from '@/features/notifications/model/sms-template/mock'
import {
  canMoveCategoryTo,
  categoryHasChildren,
  categoryNameById,
  collectDeleteIds,
  filterNotificationTree,
  findTemplate,
  isVirtualUnclassifiedCategoryId,
  moveCategoryToParent,
  moveTemplateToCategory,
} from '@/features/notifications/lib/tree'
import {
  getNotificationsApiErrorMessage,
  isCategoryHasChildrenError,
  isCategoryNeedsSyncError,
} from '@/features/notifications/api/get-notifications-api-error'
import {
  shouldUseSmsTemplatesRemoteApi,
  smsSyncSuccessMessage,
} from '@/features/notifications/api/sms-template-service'
import {
  useSmsCategoryTreeQuery,
  useSmsTemplateDetailQuery,
  useSmsTemplatePreviewQuery,
  useSmsTemplateTreeMutations,
} from '@/features/notifications/hooks/use-sms-template-tree-query'
import { CategoryNameModal } from '@/features/notifications/ui/alimtalk-template/category-name-modal'
import {
  CategoryTree,
  parseAlimtalkDndId,
  ALIMTALK_DND_CATEGORY_MOVE_PREFIX,
} from '@/features/notifications/ui/alimtalk-template/category-tree'
import { DetailPanel } from './detail-panel'
import { FormModal } from './form-modal'
import { PreviewModal } from './preview-modal'
import type { SmsTemplateFormDraft } from './use-form'
import '@/pages/programs/program-list-page.css'
import '@/features/notifications/ui/alimtalk-template/list.css'
import './list.css'

type PendingMove =
  | { kind: 'template'; templateId: string; targetCategoryId: string }
  | { kind: 'category'; categoryId: string; targetParentId: string }

type DeleteDialog = 'category' | 'template' | 'blocked' | null

function defaultExpandedIds(categories: SmsCategory[]): Set<string> {
  return new Set([SMS_ROOT_CATEGORY_ID, ...categories.map(category => category.id)])
}

function targetCategoryForAdd(selection: SmsTreeSelection, templates: SmsTemplateItem[]): string {
  if (!selection) return SMS_ROOT_CATEGORY_ID
  if (selection.kind === 'category') return selection.id
  return findTemplate(templates, selection.id)?.categoryId ?? SMS_ROOT_CATEGORY_ID
}

function categoryIdForEdit(
  selection: SmsTreeSelection,
  templates: SmsTemplateItem[],
  categories: SmsCategory[]
): string | null {
  if (!selection) return null
  if (selection.kind === 'category') {
    if (selection.id === SMS_ROOT_CATEGORY_ID) return null
    const category = categories.find(item => item.id === selection.id)
    if (category?.isVirtualUnclassified) return null
    return selection.id
  }
  const parentId = findTemplate(templates, selection.id)?.categoryId
  if (!parentId || parentId === SMS_ROOT_CATEGORY_ID) return null
  const parent = categories.find(item => item.id === parentId)
  if (parent?.isVirtualUnclassified) return null
  return parentId
}

function buildLocalAttachments(
  draft: SmsTemplateFormDraft,
  existing?: SmsTemplateItem | null
): SmsTemplateItem['attachments'] {
  const existingMap = new Map((existing?.attachments ?? []).map(item => [item.fileName, item]))
  const attachedNames = new Set(draft.attachmentFileNames)
  const fromNewFiles = draft.newFiles
    .filter(file => attachedNames.has(file.name))
    .map((file, index) => ({
      attachmentId: Date.now() + index,
      fileName: file.name,
      byteSize: file.size,
    }))

  return draft.attachmentFileNames
    .map(name => {
      const existingItem = existingMap.get(name)
      if (existingItem) return existingItem
      return fromNewFiles.find(item => item.fileName === name) ?? null
    })
    .filter((item): item is NonNullable<typeof item> => item != null)
}

export function SmsTemplateList() {
  const { showAlert } = useCmsAlert()
  const remote = shouldUseSmsTemplatesRemoteApi()
  const [searchParams, setSearchParams] = useSearchParams()
  const appliedFilters = useMemo(() => pendingFiltersFromSearchParams(searchParams), [searchParams])
  const formState = useMemo(() => smsFormStateFromSearchParams(searchParams), [searchParams])
  const formOpen = formState.open
  const formMode = formState.mode
  const [pendingFilters, setPendingFilters] = useState<SmsTemplatePendingFilters>(appliedFilters)
  const pendingFiltersRef = useRef(pendingFilters)
  pendingFiltersRef.current = pendingFilters

  useEffect(() => {
    setPendingFilters(appliedFilters)
  }, [appliedFilters])

  const treeQuery = useSmsCategoryTreeQuery(searchParams, remote)
  const mutations = useSmsTemplateTreeMutations()

  const [localCategories, setLocalCategories] = useState<SmsCategory[]>(SMS_CATEGORY_MOCK)
  const [localTemplates, setLocalTemplates] = useState<SmsTemplateItem[]>(SMS_TEMPLATE_ITEM_MOCK)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    defaultExpandedIds(remote ? [] : SMS_CATEGORY_MOCK)
  )
  const [selection, setSelection] = useState<SmsTreeSelection>(
    remote ? null : { kind: 'template', id: 'sms-tpl-password' }
  )
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialog>(null)
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
  const [categoryModal, setCategoryModal] = useState<{
    mode: 'add' | 'edit'
    categoryId: string | null
  } | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const didInitExpandRef = useRef(!remote)

  const categories = remote ? (treeQuery.data?.categories ?? []) : localCategories
  const templates = remote ? (treeQuery.data?.templates ?? []) : localTemplates
  const isSyncing = mutations.syncCatalog.isPending
  const isMutating =
    mutations.createCategory.isPending ||
    mutations.updateCategory.isPending ||
    mutations.deleteCategory.isPending ||
    mutations.deleteTemplate.isPending ||
    mutations.moveCategory.isPending ||
    mutations.moveTemplate.isPending ||
    mutations.createTemplate.isPending ||
    mutations.updateTemplate.isPending
  const busy = isSyncing || isMutating
  const treeLoading = remote && !treeQuery.data && (treeQuery.isLoading || treeQuery.isFetching)
  const treeError = remote && treeQuery.isError && !treeQuery.data

  const clearTreeSearchAfterMutation = useCallback(() => {
    const filters = pendingFiltersRef.current
    const hasSearch = Boolean(filters.categoryName.trim() || filters.templateName.trim())
    if (!hasSearch) return
    const cleared = { categoryName: '', templateName: '' }
    setPendingFilters(cleared)
    pendingFiltersRef.current = cleared
    setSearchParams(prev => applySmsFiltersToSearchParams(prev, cleared), { replace: true })
  }, [setSearchParams])

  const runSmsSync = useCallback(async () => {
    if (!remote || mutations.syncCatalog.isPending) return
    try {
      const result = await mutations.syncCatalog.mutateAsync()
      await treeQuery.refetch()
      showAlert({
        title: '안내',
        content: smsSyncSuccessMessage(result),
      })
    } catch (error) {
      showAlert({
        title: '연동 실패',
        content: getNotificationsApiErrorMessage(
          error,
          '문자 카테고리 연동에 실패했습니다. 다시 시도해 주세요.'
        ),
      })
    }
  }, [mutations.syncCatalog, remote, showAlert, treeQuery])

  const offerSyncOnError = useCallback(
    (title: string, error: unknown, fallback: string) => {
      if (isCategoryNeedsSyncError(error)) {
        showAlert({
          title,
          content: getNotificationsApiErrorMessage(error, fallback),
          confirmLabel: '동기화',
          onConfirm: () => {
            void runSmsSync()
          },
        })
        return
      }
      showAlert({
        title,
        content: getNotificationsApiErrorMessage(error, fallback),
      })
    },
    [runSmsSync, showAlert]
  )

  useEffect(() => {
    if (!remote || selection || templates.length === 0) return
    setSelection({ kind: 'template', id: templates[0]!.id })
  }, [remote, selection, templates])

  useEffect(() => {
    if (!didInitExpandRef.current && categories.length > 0) {
      setExpandedIds(defaultExpandedIds(categories))
      didInitExpandRef.current = true
    }
  }, [categories])

  useEffect(() => {
    if (!formOpen) return
    if (formMode === 'edit') {
      if (!formState.templateId) {
        setSearchParams(prev => closeSmsFormSearchParams(prev), { replace: true })
        return
      }
      const template = findTemplate(templates, formState.templateId)
      if (!template && !remote) {
        setSearchParams(prev => closeSmsFormSearchParams(prev), { replace: true })
        return
      }
      if (template) {
        setSelection(current =>
          current?.kind === 'template' && current.id === template.id
            ? current
            : { kind: 'template', id: template.id }
        )
        setExpandedIds(prev => new Set(prev).add(template.categoryId))
      }
      return
    }
    if (formState.categoryId) {
      setExpandedIds(prev => new Set(prev).add(formState.categoryId!))
    }
  }, [
    formMode,
    formOpen,
    formState.categoryId,
    formState.templateId,
    remote,
    setSearchParams,
    templates,
  ])

  const visibleTree = useMemo(() => {
    if (remote) return { categories, templates }
    return filterNotificationTree(
      categories,
      templates,
      appliedFilters.categoryName,
      appliedFilters.templateName
    )
  }, [appliedFilters.categoryName, appliedFilters.templateName, categories, remote, templates])

  const selectedTemplateId = selection?.kind === 'template' ? selection.id : null
  const detailQuery = useSmsTemplateDetailQuery(
    selectedTemplateId,
    remote && Boolean(selectedTemplateId)
  )
  const treeTemplate =
    selection?.kind === 'template' ? findTemplate(templates, selection.id) ?? null : null
  const selectedTemplate = (remote ? detailQuery.data : null) ?? treeTemplate
  const detailLoading =
    remote && Boolean(selectedTemplateId) && detailQuery.isLoading && !detailQuery.data
  const editingTemplateId = formMode === 'edit' ? formState.templateId : null
  const editDetailQuery = useSmsTemplateDetailQuery(
    editingTemplateId,
    remote && formOpen && Boolean(editingTemplateId)
  )
  const editingTemplate = useMemo(() => {
    if (formMode !== 'edit' || !formState.templateId) return null
    if (remote) return editDetailQuery.data ?? findTemplate(templates, formState.templateId) ?? null
    return findTemplate(templates, formState.templateId) ?? null
  }, [editDetailQuery.data, formMode, formState.templateId, remote, templates])

  const previewQuery = useSmsTemplatePreviewQuery(
    selectedTemplateId,
    selectedTemplate,
    previewOpen && Boolean(selectedTemplateId)
  )
  const previewTemplate = previewQuery.data ?? selectedTemplate

  const selectedCategoryName = selectedTemplate
    ? selectedTemplate.categoryName?.trim() ||
      categoryNameById(categories, selectedTemplate.categoryId)
    : ''

  const selectedDeleteIds = useMemo(() => {
    if (!selection || (selection.kind === 'category' && selection.id === SMS_ROOT_CATEGORY_ID)) {
      return new Set<string>()
    }
    if (
      selection.kind === 'category' &&
      (isVirtualUnclassifiedCategoryId(selection.id) ||
        categories.find(item => item.id === selection.id)?.isVirtualUnclassified)
    ) {
      return new Set<string>()
    }
    return new Set([selection.id])
  }, [categories, selection])

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
    setSearchParams(prev => applySmsFiltersToSearchParams(prev, pendingFiltersRef.current), {
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

  const handleConfirmMove = useCallback(async () => {
    if (!pendingMove) return
    try {
      if (remote) {
        if (pendingMove.kind === 'template') {
          await mutations.moveTemplate.mutateAsync({
            templateId: pendingMove.templateId,
            targetCategoryId: pendingMove.targetCategoryId,
          })
          setExpandedIds(prev => new Set(prev).add(pendingMove.targetCategoryId))
        } else {
          await mutations.moveCategory.mutateAsync({
            categoryId: pendingMove.categoryId,
            targetParentId: pendingMove.targetParentId,
          })
          setExpandedIds(prev => new Set(prev).add(pendingMove.targetParentId))
        }
        clearTreeSearchAfterMutation()
      } else if (pendingMove.kind === 'template') {
        setLocalTemplates(prev =>
          moveTemplateToCategory(prev, pendingMove.templateId, pendingMove.targetCategoryId)
        )
        setExpandedIds(prev => new Set(prev).add(pendingMove.targetCategoryId))
      } else {
        setLocalCategories(prev =>
          moveCategoryToParent(prev, pendingMove.categoryId, pendingMove.targetParentId)
        )
        setExpandedIds(prev => new Set(prev).add(pendingMove.targetParentId))
      }
      setPendingMove(null)
      showAlert({
        title: '이동 완료',
        content: '이동이 완료되었습니다.',
        confirmLabel: '닫기',
      })
    } catch (error) {
      offerSyncOnError('이동 실패', error, '이동에 실패했습니다. 다시 시도해 주세요.')
    }
  }, [
    clearTreeSearchAfterMutation,
    mutations.moveCategory,
    mutations.moveTemplate,
    offerSyncOnError,
    pendingMove,
    remote,
    showAlert,
  ])

  const handleRequestDelete = useCallback(() => {
    if (!selection) return
    if (selection.kind === 'category') {
      if (selection.id === SMS_ROOT_CATEGORY_ID) return
      if (categoryHasChildren(categories, templates, selection.id)) {
        setDeleteDialog('blocked')
        return
      }
      setDeleteDialog('category')
      return
    }
    setDeleteDialog('template')
  }, [categories, selection, templates])

  const handleConfirmDelete = useCallback(async () => {
    const { categoryIds, templateIds } = collectDeleteIds(categories, templates, selectedDeleteIds)
    try {
      if (remote) {
        for (const categoryId of categoryIds) {
          await mutations.deleteCategory.mutateAsync(categoryId)
        }
        for (const templateId of templateIds) {
          await mutations.deleteTemplate.mutateAsync(templateId)
        }
        clearTreeSearchAfterMutation()
      } else {
        const categoryIdSet = new Set(categoryIds)
        const templateIdSet = new Set(templateIds)
        setLocalCategories(prev => prev.filter(category => !categoryIdSet.has(category.id)))
        setLocalTemplates(prev => prev.filter(template => !templateIdSet.has(template.id)))
      }
      setSelection(current => {
        if (!current) return current
        if (current.kind === 'category' && categoryIds.includes(current.id)) return null
        if (current.kind === 'template' && templateIds.includes(current.id)) return null
        return current
      })
      setDeleteDialog(null)
      showAlert({
        title: '삭제 완료',
        content: '삭제가 완료되었습니다.',
        confirmLabel: '닫기',
      })
    } catch (error) {
      if (isCategoryHasChildrenError(error)) {
        setDeleteDialog('blocked')
        return
      }
      offerSyncOnError('삭제 실패', error, '삭제에 실패했습니다. 다시 시도해 주세요.')
    }
  }, [
    categories,
    clearTreeSearchAfterMutation,
    mutations.deleteCategory,
    mutations.deleteTemplate,
    offerSyncOnError,
    remote,
    selectedDeleteIds,
    showAlert,
    templates,
  ])

  const handleSubmitCategory = useCallback(
    async (name: string) => {
      if (!categoryModal) return
      try {
        if (categoryModal.mode === 'add') {
          const parentId = targetCategoryForAdd(selection, templates)
          if (remote) {
            const tree = await mutations.createCategory.mutateAsync({ name, parentId })
            clearTreeSearchAfterMutation()
            const created = tree.categories.find(
              category => category.parentId === parentId && category.name === name
            )
            if (created) {
              setExpandedIds(prev => new Set(prev).add(parentId).add(created.id))
              setSelection({ kind: 'category', id: created.id })
            }
          } else {
            const id = `sms-cat-${Date.now()}`
            setLocalCategories(prev => [...prev, { id, name, parentId }])
            setExpandedIds(prev => new Set(prev).add(parentId).add(id))
            setSelection({ kind: 'category', id })
          }
        } else if (categoryModal.categoryId) {
          const editId = categoryModal.categoryId
          if (remote) {
            await mutations.updateCategory.mutateAsync({ categoryId: editId, name })
            clearTreeSearchAfterMutation()
          } else {
            setLocalCategories(prev =>
              prev.map(category => (category.id === editId ? { ...category, name } : category))
            )
          }
        }
        setCategoryModal(null)
      } catch (error) {
        offerSyncOnError(
          '카테고리 저장 실패',
          error,
          '카테고리 저장에 실패했습니다. 다시 시도해 주세요.'
        )
      }
    },
    [
      categoryModal,
      clearTreeSearchAfterMutation,
      mutations.createCategory,
      mutations.updateCategory,
      offerSyncOnError,
      remote,
      selection,
      templates,
    ]
  )

  const handleCloseForm = useCallback(() => {
    setSearchParams(prev => closeSmsFormSearchParams(prev), { replace: true })
  }, [setSearchParams])

  const handleOpenCreate = useCallback(() => {
    const categoryId = targetCategoryForAdd(selection, templates)
    setSearchParams(prev => openSmsCreateFormSearchParams(prev, categoryId), { replace: false })
  }, [selection, setSearchParams, templates])

  const handleOpenEdit = useCallback(
    (templateId: string) => {
      setPreviewOpen(false)
      setSearchParams(prev => openSmsEditFormSearchParams(prev, templateId), { replace: false })
    },
    [setSearchParams]
  )

  const handlePreviewEdit = useCallback(() => {
    if (!selectedTemplate) return
    handleOpenEdit(selectedTemplate.id)
  }, [handleOpenEdit, selectedTemplate])

  const handlePreviewDelete = useCallback(() => {
    if (!selectedTemplate) return
    setPreviewOpen(false)
    setSelection({ kind: 'template', id: selectedTemplate.id })
    setDeleteDialog('template')
  }, [selectedTemplate])

  const handleSubmitForm = useCallback(
    async (draft: SmsTemplateFormDraft) => {
      try {
        if (remote) {
          if (formMode === 'create') {
            const result = await mutations.createTemplate.mutateAsync({
              categoryId: draft.categoryId,
              templateName: draft.templateName,
              senderPhone: draft.senderPhone,
              messageType: draft.messageType,
              subject: draft.subject,
              bodyText: draft.bodyText,
              newFiles: draft.newFiles,
            })
            setSelection({ kind: 'template', id: result.templateId })
            setExpandedIds(prev => new Set(prev).add(draft.categoryId))
            clearTreeSearchAfterMutation()
          } else if (editingTemplate) {
            await mutations.updateTemplate.mutateAsync({
              templateId: editingTemplate.id,
              categoryId: draft.categoryId,
              templateName: draft.templateName,
              senderPhone: draft.senderPhone,
              messageType: draft.messageType,
              subject: draft.subject,
              bodyText: draft.bodyText,
              newFiles: draft.newFiles,
            })
            clearTreeSearchAfterMutation()
          }
        } else {
          const now = new Date().toISOString()
          if (formMode === 'create') {
            const id = `sms-tpl-${Date.now()}`
            const next: SmsTemplateItem = {
              id,
              name: draft.templateName,
              templateName: draft.templateName,
              categoryId: draft.categoryId,
              registeredAt: now,
              updatedAt: now,
              senderPhone: draft.senderPhone,
              messageType: draft.messageType,
              subject: draft.subject,
              bodyText: draft.bodyText,
              attachmentFileNames: draft.attachmentFileNames,
              attachments: buildLocalAttachments(draft),
            }
            setLocalTemplates(prev => [...prev, next])
            setSelection({ kind: 'template', id })
            setExpandedIds(prev => new Set(prev).add(draft.categoryId))
          } else if (editingTemplate) {
            const editId = editingTemplate.id
            setLocalTemplates(prev =>
              prev.map(item =>
                item.id === editId
                  ? {
                      ...item,
                      name: draft.templateName,
                      templateName: draft.templateName,
                      categoryId: draft.categoryId,
                      senderPhone: draft.senderPhone,
                      messageType: draft.messageType,
                      subject: draft.subject,
                      bodyText: draft.bodyText,
                      attachmentFileNames: draft.attachmentFileNames,
                      attachments: buildLocalAttachments(draft, editingTemplate),
                      updatedAt: now,
                    }
                  : item
              )
            )
          }
        }
        handleCloseForm()
      } catch (error) {
        offerSyncOnError('저장 실패', error, '템플릿 저장에 실패했습니다. 다시 시도해 주세요.')
      }
    },
    [
      clearTreeSearchAfterMutation,
      editingTemplate,
      formMode,
      handleCloseForm,
      mutations.createTemplate,
      mutations.updateTemplate,
      offerSyncOnError,
      remote,
    ]
  )

  const handleDeleteFromForm = useCallback(async () => {
    if (!editingTemplate) return
    const editId = editingTemplate.id
    try {
      if (remote) {
        await mutations.deleteTemplate.mutateAsync(editId)
        clearTreeSearchAfterMutation()
      } else {
        setLocalTemplates(prev => prev.filter(item => item.id !== editId))
      }
      setSelection(current =>
        current?.kind === 'template' && current.id === editId ? null : current
      )
      handleCloseForm()
    } catch (error) {
      offerSyncOnError('삭제 실패', error, '삭제에 실패했습니다. 다시 시도해 주세요.')
    }
  }, [
    clearTreeSearchAfterMutation,
    editingTemplate,
    handleCloseForm,
    mutations.deleteTemplate,
    offerSyncOnError,
    remote,
  ])

  const editCategoryId = categoryIdForEdit(selection, templates, categories)

  return (
    <div className="program-list-page">
      <FilterTableLayout
        bordered={false}
        filterResponsiveWrap={false}
        hideExcelDownload
        fields={SMS_TEMPLATE_FILTER_FIELDS}
        filters={{
          categoryName: pendingFilters.categoryName,
          templateName: pendingFilters.templateName,
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="문자 템플릿"
        actions={
          <>
            {remote ? (
              <CmsButton
                variant="secondary"
                size="large"
                type="button"
                disabled={busy}
                onClick={() => void runSmsSync()}
              >
                {isSyncing ? '동기화 중…' : '동기화'}
              </CmsButton>
            ) : null}
            <CmsButton
              variant="delete"
              size="large"
              type="button"
              disabled={deletableCheckedCount === 0 || busy}
              onClick={handleRequestDelete}
            >
              선택 삭제
            </CmsButton>
            <CmsButton
              variant="secondary"
              size="large"
              type="button"
              disabled={!editCategoryId || busy}
              onClick={() => setCategoryModal({ mode: 'edit', categoryId: editCategoryId })}
            >
              카테고리 수정
            </CmsButton>
            <CmsButton
              variant="secondary"
              size="large"
              type="button"
              disabled={busy}
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
              disabled={busy}
              onClick={handleOpenCreate}
            >
              템플릿 등록
            </CmsButton>
          </>
        }
      >
        {treeError ? (
          <div className="sms-template-tree-status" role="alert">
            <p>
              {getNotificationsApiErrorMessage(
                treeQuery.error,
                '문자 템플릿 목록을 불러오지 못했습니다.'
              )}
            </p>
            <CmsButton
              variant="secondary"
              size="large"
              type="button"
              onClick={() => void treeQuery.refetch()}
            >
              다시 시도
            </CmsButton>
          </div>
        ) : treeLoading ? (
          <div className="sms-template-tree-status" aria-busy="true">
            불러오는 중…
          </div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="sms-template-split">
              <CategoryTree
                categories={visibleTree.categories}
                templates={visibleTree.templates}
                expandedIds={expandedIds}
                selection={selection}
                onToggleExpand={handleToggleExpand}
                onSelect={setSelection}
              />
              <DetailPanel
                template={detailLoading ? null : selectedTemplate}
                categoryName={selectedCategoryName}
                loading={detailLoading}
                onPreview={() => setPreviewOpen(true)}
              />
            </div>
          </DndContext>
        )}
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
        content="해당 카테고리를 삭제하시겠습니까?\n삭제 시 NHN 서비스에서도 함께 반영됩니다."
        buttons={[
          { label: '취소', onClick: () => setDeleteDialog(null), variant: 'secondary' },
          {
            label: '삭제',
            onClick: () => void handleConfirmDelete(),
            variant: 'delete',
            disabled: busy,
          },
        ]}
      />
      <ConfirmModal
        open={deleteDialog === 'template'}
        title="선택 삭제"
        content={`선택한 ${deletableCheckedCount}개 항목을 삭제하시겠습니까?`}
        warningMessage="삭제된 항목은 복구할 수 없습니다."
        danger
        confirmText="삭제"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteDialog(null)}
      />
      <CmsModal
        open={pendingMove?.kind === 'category'}
        onClose={() => setPendingMove(null)}
        title="카테고리 이동"
        content={
          pendingMove?.kind === 'category'
            ? `[${categoryNameById(categories, pendingMove.categoryId)}] 카테고리의 위치를 이동하시겠습니까?\n카테고리 이동 시 하위의 카테고리/템플릿도 같이 이동되며, NHN 서비스에서도 함께 반영됩니다.`
            : ''
        }
        buttons={[
          { label: '취소', onClick: () => setPendingMove(null), variant: 'secondary' },
          {
            label: '이동',
            onClick: () => void handleConfirmMove(),
            variant: 'primary',
            disabled: busy,
          },
        ]}
      />
      <CmsModal
        open={pendingMove?.kind === 'template'}
        onClose={() => setPendingMove(null)}
        title="템플릿 이동"
        content={
          pendingMove?.kind === 'template'
            ? `해당 템플릿을 [${categoryNameById(categories, pendingMove.targetCategoryId)}] 카테고리로 이동하시겠습니까?\n템플릿 이동 시 NHN 서비스에서도 함께 반영됩니다.`
            : ''
        }
        buttons={[
          { label: '취소', onClick: () => setPendingMove(null), variant: 'secondary' },
          {
            label: '이동',
            onClick: () => void handleConfirmMove(),
            variant: 'primary',
            disabled: busy,
          },
        ]}
      />
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
        onSubmit={name => void handleSubmitCategory(name)}
      />
      <FormModal
        open={formOpen}
        mode={formMode}
        template={formMode === 'edit' ? editingTemplate : null}
        categories={categories}
        initialCategoryId={
          formMode === 'create'
            ? formState.categoryId?.trim() || targetCategoryForAdd(selection, templates)
            : editingTemplate?.categoryId ?? null
        }
        submitting={mutations.createTemplate.isPending || mutations.updateTemplate.isPending}
        onClose={handleCloseForm}
        onSubmit={draft => void handleSubmitForm(draft)}
        onDelete={() => void handleDeleteFromForm()}
      />
      <PreviewModal
        open={previewOpen && previewTemplate != null}
        templateName={previewTemplate?.templateName ?? ''}
        senderPhone={previewTemplate?.senderPhone ?? ''}
        messageType={previewTemplate?.messageType ?? 'SMS'}
        subject={previewTemplate?.subject ?? ''}
        bodyText={previewTemplate?.bodyText ?? ''}
        attachments={
          previewTemplate?.attachments?.map(item => ({
            name: item.fileName,
            sizeBytes: item.byteSize,
          })) ??
          previewTemplate?.attachmentFileNames.map(name => ({
            name,
          }))
        }
        previewAt={new Date().toISOString()}
        onClose={() => setPreviewOpen(false)}
        onEdit={handlePreviewEdit}
        onDelete={handlePreviewDelete}
      />
    </div>
  )
}
