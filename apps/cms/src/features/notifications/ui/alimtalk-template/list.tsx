/**
 * 알림 메시지 관리 > 알림톡 관리 > 알림톡 템플릿 탭
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useSearchParams } from 'react-router-dom'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton, CmsModal, useCmsAlert } from '@/shared/ui'
import {
  ALIMTALK_ROOT_CATEGORY_ID,
  type AlimtalkCategory,
  type AlimtalkTemplateItem,
  type AlimtalkTemplatePendingFilters,
  type AlimtalkTreeSelection,
} from '@/features/notifications/model/alimtalk-template/types'
import { ALIMTALK_TEMPLATE_FILTER_FIELDS } from '@/features/notifications/model/alimtalk-template/filter-fields'
import {
  applyAlimtalkFiltersToSearchParams,
  pendingFiltersFromSearchParams,
} from '@/features/notifications/model/alimtalk-template/filter-url'
import {
  ALIMTALK_CATEGORY_MOCK,
  ALIMTALK_TEMPLATE_ITEM_MOCK,
} from '@/features/notifications/model/alimtalk-template/mock'
import {
  canMoveCategoryTo,
  categoryHasChildren,
  categoryNameById,
  filterAlimtalkTree,
  findTemplate,
  isVirtualUnclassifiedCategoryId,
  moveCategoryToParent,
  moveTemplateToCategory,
} from '@/features/notifications/lib/tree'
import { resolveNhnConsoleUrl } from '@/features/notifications/api/adapters/alimtalk-template-adapters'
import { alimtalkSyncSuccessMessage } from '@/features/notifications/api/adapters/alimtalk-sync-adapters'
import {
  getNotificationsApiErrorMessage,
  isCategoryHasChildrenError,
  isCategoryNeedsSyncError,
  isAlimtalkTemplateDeleteRejectedByNhnError,
  isProviderUnavailableError,
} from '@/features/notifications/api/get-notifications-api-error'
import { shouldUseAlimtalkTemplatesRemoteApi } from '@/features/notifications/api/alimtalk-template-service'
import {
  useAlimtalkCategoryTreeQuery,
  useAlimtalkTemplateDetailQuery,
  useAlimtalkTemplatePreviewQuery,
  useAlimtalkTemplateTreeMutations,
} from '@/features/notifications/hooks/use-alimtalk-template-tree-query'
import { CategoryNameModal } from './category-name-modal'
import { CategoryTree, parseAlimtalkDndId, ALIMTALK_DND_CATEGORY_MOVE_PREFIX } from './category-tree'
import { DetailPanel } from './detail-panel'
import { PreviewModal } from './preview-modal'
import '@/pages/programs/program-list-page.css'
import './list.css'

const AUTO_SYNC_SESSION_KEY = 'cms.alimtalk.nhnAutoSyncAttempted'

type SyncBannerKind =
  | 'need-sync'
  | 'local-mode'
  | 'error'
  | 'provider-unavailable'
  | 'synced-empty'
  | null

type PendingMove =
  | { kind: 'template'; templateId: string; targetCategoryId: string }
  | { kind: 'category'; categoryId: string; targetParentId: string }

type DeleteDialog = 'category' | 'template' | 'blocked' | null

/** UI Root(Category) + 바로 아래 1뎁스(Root Category 등)만 펼침. 그 아래 폴더는 접힘. */
function defaultExpandedIds(categories: AlimtalkCategory[] = []): Set<string> {
  const ids = new Set<string>([ALIMTALK_ROOT_CATEGORY_ID])
  for (const category of categories) {
    if (category.parentId === ALIMTALK_ROOT_CATEGORY_ID) {
      ids.add(category.id)
    }
  }
  return ids
}

/** UI Root(Category)는 항상 펼침 유지. */
function withUiRootExpanded(ids?: Iterable<string>): Set<string> {
  const next = new Set(ids)
  next.add(ALIMTALK_ROOT_CATEGORY_ID)
  return next
}

function targetCategoryForAdd(selection: AlimtalkTreeSelection, templates: AlimtalkTemplateItem[]): string {
  if (!selection) return ALIMTALK_ROOT_CATEGORY_ID
  if (selection.kind === 'category') return selection.id
  return findTemplate(templates, selection.id)?.categoryId ?? ALIMTALK_ROOT_CATEGORY_ID
}

function categoryIdForEdit(
  selection: AlimtalkTreeSelection,
  templates: AlimtalkTemplateItem[],
  categories: AlimtalkCategory[]
): string | null {
  if (!selection) return null
  if (selection.kind === 'category') {
    if (selection.id === ALIMTALK_ROOT_CATEGORY_ID) return null
    const category = categories.find(item => item.id === selection.id)
    if (category?.isVirtualUnclassified) return null
    return selection.id
  }
  const parentId = findTemplate(templates, selection.id)?.categoryId
  if (!parentId || parentId === ALIMTALK_ROOT_CATEGORY_ID) return null
  const parent = categories.find(item => item.id === parentId)
  if (parent?.isVirtualUnclassified) return null
  return parentId
}

export function AlimtalkTemplateList({
  onUseTemplate,
}: {
  onUseTemplate?: (templateId: string) => void
}) {
  const { showAlert } = useCmsAlert()
  const remote = shouldUseAlimtalkTemplatesRemoteApi()
  const [searchParams, setSearchParams] = useSearchParams()
  const appliedFilters = useMemo(() => pendingFiltersFromSearchParams(searchParams), [searchParams])
  const [pendingFilters, setPendingFilters] = useState<AlimtalkTemplatePendingFilters>(appliedFilters)
  const pendingFiltersRef = useRef(pendingFilters)
  pendingFiltersRef.current = pendingFilters

  useEffect(() => {
    setPendingFilters(appliedFilters)
  }, [appliedFilters])

  const treeQuery = useAlimtalkCategoryTreeQuery(searchParams, remote)
  const mutations = useAlimtalkTemplateTreeMutations()

  const [localCategories, setLocalCategories] = useState<AlimtalkCategory[]>(ALIMTALK_CATEGORY_MOCK)
  const [localTemplates, setLocalTemplates] = useState<AlimtalkTemplateItem[]>(ALIMTALK_TEMPLATE_ITEM_MOCK)
  const [syncBanner, setSyncBanner] = useState<SyncBannerKind>(null)
  const autoSyncStartedRef = useRef(false)

  const categories = remote ? (treeQuery.data?.categories ?? []) : localCategories
  const templates = remote ? (treeQuery.data?.templates ?? []) : localTemplates
  const isTreeEmpty = remote && categories.length === 0 && templates.length === 0
  const isSyncing = mutations.syncCatalog.isPending
  const isMutating =
    mutations.createCategory.isPending ||
    mutations.updateCategory.isPending ||
    mutations.deleteCategory.isPending ||
    mutations.deleteTemplate.isPending ||
    mutations.moveCategory.isPending ||
    mutations.moveTemplate.isPending
  const treeSettled = remote && !treeQuery.isLoading && !treeQuery.isFetching

  const clearTreeSearchAfterMutation = useCallback(() => {
    const filters = pendingFiltersRef.current
    const hasSearch = Boolean(filters.categoryName.trim() || filters.templateName.trim())
    if (!hasSearch) return
    const cleared = { categoryName: '', templateName: '' }
    setPendingFilters(cleared)
    pendingFiltersRef.current = cleared
    setSearchParams(prev => applyAlimtalkFiltersToSearchParams(prev, cleared), { replace: true })
  }, [setSearchParams])

  const runNhnSync = useCallback(
    async (source: 'auto' | 'manual') => {
      if (!remote || mutations.syncCatalog.isPending) return
      try {
        const result = await mutations.syncCatalog.mutateAsync()
        const outcome = result.templates
        // invalidate 후 최신 tree 반영
        const refreshed = await treeQuery.refetch()
        const nextCategories = refreshed.data?.categories ?? []
        const nextTemplates = refreshed.data?.templates ?? []
        const stillEmpty = nextCategories.length === 0 && nextTemplates.length === 0

        if (outcome.isLocalApprovalMark) {
          setSyncBanner('local-mode')
          showAlert({
            title: '안내',
            content: alimtalkSyncSuccessMessage(outcome),
          })
          return
        }

        if (outcome.isNhnLivePull && stillEmpty) {
          setSyncBanner('synced-empty')
          showAlert({
            title: '안내',
            content:
              outcome.upsertedCount > 0
                ? `동기화 ${outcome.upsertedCount.toLocaleString()}건 반영됐지만 트리에 표시할 항목이 없습니다. 필터를 확인하거나 다시 동기화해 주세요.`
                : 'NHN 동기화는 완료되었지만 가져올 템플릿이 없습니다. NHN Console에 승인 템플릿이 있는지 확인해 주세요.',
          })
          return
        }

        setSyncBanner(null)
        if (source === 'manual' || outcome.upsertedCount > 0) {
          showAlert({
            title: '안내',
            content: alimtalkSyncSuccessMessage(outcome),
          })
        }
      } catch (error) {
        const message = getNotificationsApiErrorMessage(
          error,
          'NHN 동기화에 실패했습니다. 다시 시도해 주세요.'
        )
        setSyncBanner(isProviderUnavailableError(error) ? 'provider-unavailable' : 'error')
        showAlert({ title: 'NHN 동기화 실패', content: message })
      }
    },
    [mutations.syncCatalog, remote, showAlert, treeQuery]
  )

  useEffect(() => {
    if (!remote || !treeSettled || !isTreeEmpty) return
    if (autoSyncStartedRef.current) return
    if (syncBanner === 'local-mode' || syncBanner === 'synced-empty') return

    const alreadyAttempted =
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(AUTO_SYNC_SESSION_KEY) === '1'

    if (alreadyAttempted) {
      setSyncBanner(prev =>
        prev === 'local-mode' ||
        prev === 'error' ||
        prev === 'provider-unavailable' ||
        prev === 'synced-empty'
          ? prev
          : 'need-sync'
      )
      return
    }

    autoSyncStartedRef.current = true
    try {
      sessionStorage.setItem(AUTO_SYNC_SESSION_KEY, '1')
    } catch {
      // ignore
    }
    void runNhnSync('auto')
  }, [isTreeEmpty, remote, runNhnSync, syncBanner, treeSettled])

  useEffect(() => {
    if (!remote || !treeSettled) return
    if (!isTreeEmpty && (syncBanner === 'need-sync' || syncBanner === 'synced-empty')) {
      setSyncBanner(null)
    }
  }, [isTreeEmpty, remote, syncBanner, treeSettled])

  const visibleTree = useMemo(() => {
    if (remote) return { categories, templates }
    return filterAlimtalkTree(
      categories,
      templates,
      appliedFilters.categoryName,
      appliedFilters.templateName
    )
  }, [appliedFilters.categoryName, appliedFilters.templateName, categories, remote, templates])

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    defaultExpandedIds(remote ? [] : ALIMTALK_CATEGORY_MOCK)
  )
  const [selection, setSelection] = useState<AlimtalkTreeSelection>(
    remote ? null : { kind: 'template', id: 'tpl-password' }
  )
  const [previewOpen, setPreviewOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialog>(null)
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
  const [categoryModal, setCategoryModal] = useState<{ mode: 'add' | 'edit'; categoryId: string | null } | null>(
    null
  )
  const didInitExpandRef = useRef(!remote)

  useEffect(() => {
    if (!remote || selection || templates.length === 0) return
    setSelection({ kind: 'template', id: templates[0]!.id })
  }, [remote, selection, templates])

  const isTreeSearching = Boolean(
    appliedFilters.categoryName.trim() || appliedFilters.templateName.trim()
  )
  const wasTreeSearchingRef = useRef(isTreeSearching)

  useEffect(() => {
    if (isTreeSearching) {
      // 검색 중: 결과 경로가 보이도록 매칭된 폴더 펼침
      setExpandedIds(withUiRootExpanded(visibleTree.categories.map(category => category.id)))
      didInitExpandRef.current = true
    } else if (wasTreeSearchingRef.current) {
      // 검색 해제: Category + 1뎁스(Root Category)만 펼침
      setExpandedIds(defaultExpandedIds(categories))
    } else if (!didInitExpandRef.current && categories.length > 0) {
      // 최초 트리 로드: Category + Root Category 펼침, 그 아래는 접힘
      setExpandedIds(defaultExpandedIds(categories))
      didInitExpandRef.current = true
    }
    wasTreeSearchingRef.current = isTreeSearching
  }, [categories, isTreeSearching, visibleTree.categories])

  const selectedTemplateId = selection?.kind === 'template' ? selection.id : null
  const detailQuery = useAlimtalkTemplateDetailQuery(
    selectedTemplateId,
    remote && Boolean(selectedTemplateId)
  )
  const treeTemplate =
    selection?.kind === 'template' ? findTemplate(templates, selection.id) ?? null : null
  const selectedTemplate = (remote ? detailQuery.data : null) ?? treeTemplate
  const selectedCategoryName = selectedTemplate
    ? categoryNameById(categories, selectedTemplate.categoryId)
    : ''

  const previewQuery = useAlimtalkTemplatePreviewQuery(
    selectedTemplateId,
    selectedTemplate,
    previewOpen && Boolean(selectedTemplateId)
  )
  const previewTemplate = previewQuery.data ?? selectedTemplate

  const canDeleteSelection = Boolean(
    selection &&
      !(
        selection.kind === 'category' &&
        (selection.id === ALIMTALK_ROOT_CATEGORY_ID ||
          isVirtualUnclassifiedCategoryId(selection.id) ||
          categories.find(item => item.id === selection.id)?.isVirtualUnclassified)
      )
  )

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
    setSearchParams(prev => applyAlimtalkFiltersToSearchParams(prev, pendingFiltersRef.current), {
      replace: true,
    })
  }, [setSearchParams])

  const handleToggleExpand = useCallback((categoryId: string) => {
    if (categoryId === ALIMTALK_ROOT_CATEGORY_ID) return
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return withUiRootExpanded(next)
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
    } catch (error) {
      if (isCategoryNeedsSyncError(error)) {
        showAlert({
          title: '안내',
          content: getNotificationsApiErrorMessage(error, '이동에 실패했습니다.'),
          confirmLabel: '동기화',
          onConfirm: () => {
            void runNhnSync('manual')
          },
        })
        return
      }
      showAlert({
        title: '안내',
        content: getNotificationsApiErrorMessage(error, '이동에 실패했습니다.'),
      })
    }
  }, [
    clearTreeSearchAfterMutation,
    mutations.moveCategory,
    mutations.moveTemplate,
    pendingMove,
    remote,
    runNhnSync,
    showAlert,
  ])

  const handleRequestDelete = useCallback(() => {
    if (!selection) return
    if (selection.kind === 'category') {
      if (selection.id === ALIMTALK_ROOT_CATEGORY_ID) return
      const category = categories.find(item => item.id === selection.id)
      if (category?.isVirtualUnclassified || isVirtualUnclassifiedCategoryId(selection.id)) {
        showAlert({
          title: '안내',
          content: '미분류 카테고리는 삭제할 수 없습니다.',
        })
        return
      }
      if (categoryHasChildren(categories, templates, selection.id)) {
        setDeleteDialog('blocked')
        return
      }
      setDeleteDialog('category')
      return
    }
    setDeleteDialog('template')
  }, [categories, selection, showAlert, templates])

  const handleConfirmDelete = useCallback(async () => {
    if (!selection) return

    try {
      if (deleteDialog === 'template' && selection.kind === 'template') {
        if (remote) {
          await mutations.deleteTemplate.mutateAsync(selection.id)
          clearTreeSearchAfterMutation()
        } else {
          setLocalTemplates(prev => prev.filter(item => item.id !== selection.id))
        }
        setSelection(null)
        setDeleteDialog(null)
        return
      }

      if (deleteDialog === 'category' && selection.kind === 'category') {
        if (remote) {
          await mutations.deleteCategory.mutateAsync(selection.id)
          clearTreeSearchAfterMutation()
        } else {
          setLocalCategories(prev => prev.filter(category => category.id !== selection.id))
        }
        setSelection(null)
        setDeleteDialog(null)
      }
    } catch (error) {
      if (isAlimtalkTemplateDeleteRejectedByNhnError(error)) {
        showAlert({
          title: '삭제 거절',
          content: getNotificationsApiErrorMessage(
            error,
            'NHN Console에서 템플릿 삭제가 거절되었습니다.'
          ),
          confirmLabel: 'NHN Console 열기',
          onConfirm: () => {
            window.open(resolveNhnConsoleUrl(selectedTemplate), '_blank', 'noopener,noreferrer')
          },
        })
        setDeleteDialog(null)
        return
      }
      if (isCategoryHasChildrenError(error)) {
        setDeleteDialog('blocked')
        return
      }
      if (isCategoryNeedsSyncError(error)) {
        showAlert({
          title: '안내',
          content: getNotificationsApiErrorMessage(error, '삭제에 실패했습니다.'),
          confirmLabel: '동기화',
          onConfirm: () => {
            void runNhnSync('manual')
          },
        })
        return
      }
      showAlert({
        title: '안내',
        content: getNotificationsApiErrorMessage(error, '삭제에 실패했습니다.'),
      })
    }
  }, [
    clearTreeSearchAfterMutation,
    deleteDialog,
    mutations.deleteCategory,
    mutations.deleteTemplate,
    remote,
    runNhnSync,
    selectedTemplate,
    selection,
    showAlert,
  ])

  const handleSubmitCategory = useCallback(
    async (name: string) => {
      if (!categoryModal) return
      try {
        if (remote) {
          if (categoryModal.mode === 'add') {
            const parentId = targetCategoryForAdd(selection, templates)
            await mutations.createCategory.mutateAsync({ name, parentId })
            setExpandedIds(prev => new Set(prev).add(parentId))
          } else if (categoryModal.categoryId) {
            await mutations.updateCategory.mutateAsync({
              categoryId: categoryModal.categoryId,
              name,
            })
          }
          clearTreeSearchAfterMutation()
        } else if (categoryModal.mode === 'add') {
          const parentId = targetCategoryForAdd(selection, templates)
          const id = `cat-${Date.now()}`
          setLocalCategories(prev => [...prev, { id, name, parentId }])
          setExpandedIds(prev => new Set(prev).add(parentId).add(id))
          setSelection({ kind: 'category', id })
        } else if (categoryModal.categoryId) {
          const editId = categoryModal.categoryId
          setLocalCategories(prev =>
            prev.map(category => (category.id === editId ? { ...category, name } : category))
          )
        }
        setCategoryModal(null)
      } catch (error) {
        const content = getNotificationsApiErrorMessage(
          error,
          '카테고리 저장에 실패했습니다.'
        )
        if (remote && isCategoryNeedsSyncError(error)) {
          showAlert({
            title: '안내',
            content,
            confirmLabel: '동기화',
            onConfirm: () => {
              void runNhnSync('manual')
            },
          })
          return
        }
        showAlert({ title: '안내', content })
      }
    },
    [
      categoryModal,
      clearTreeSearchAfterMutation,
      mutations.createCategory,
      mutations.updateCategory,
      remote,
      runNhnSync,
      selection,
      showAlert,
      templates,
    ]
  )

  const editCategoryId = categoryIdForEdit(selection, templates, categories)
  const busy = isSyncing || isMutating

  return (
    <div className="program-list-page">
      <FilterTableLayout
        bordered={false}
        filterResponsiveWrap={false}
        hideExcelDownload
        fields={ALIMTALK_TEMPLATE_FILTER_FIELDS}
        filters={{
          categoryName: pendingFilters.categoryName,
          templateName: pendingFilters.templateName,
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="알림톡 템플릿"
        actions={
          <>
            {remote ? (
              <CmsButton
                variant="secondary"
                size="large"
                type="button"
                disabled={busy}
                onClick={() => void runNhnSync('manual')}
              >
                {isSyncing ? '동기화 중…' : '동기화'}
              </CmsButton>
            ) : null}
            <CmsButton
              variant="delete"
              size="large"
              type="button"
              disabled={!canDeleteSelection || busy}
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
              onClick={() =>
                window.open(
                  resolveNhnConsoleUrl(selectedTemplate),
                  '_blank',
                  'noopener,noreferrer'
                )
              }
            >
              템플릿 등록
            </CmsButton>
          </>
        }
      >
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="alimtalk-template-split">
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
              onPreview={() => setPreviewOpen(true)}
            />
          </div>
        </DndContext>
      </FilterTableLayout>

      <PreviewModal
        open={previewOpen}
        template={previewTemplate}
        onClose={() => setPreviewOpen(false)}
        onUse={template => {
          setPreviewOpen(false)
          onUseTemplate?.(template.id)
        }}
      />
      <CmsModal
        open={deleteDialog === 'blocked'}
        onClose={() => setDeleteDialog(null)}
        title="카테고리 삭제 불가"
        content="하위 카테고리 또는 템플릿이 있어 삭제할 수 없습니다."
        buttons={[
          { label: '닫기', onClick: () => setDeleteDialog(null), variant: 'secondary' },
          { label: '확인', onClick: () => setDeleteDialog(null), variant: 'primary' },
        ]}
      />
      <CmsModal
        open={deleteDialog === 'category'}
        onClose={() => setDeleteDialog(null)}
        title="카테고리 삭제"
        content="선택한 카테고리를 삭제할까요? NHN Console에도 반영됩니다."
        buttons={[
          { label: '취소', onClick: () => setDeleteDialog(null), variant: 'secondary' },
          { label: '삭제', onClick: () => void handleConfirmDelete(), variant: 'delete' },
        ]}
      />
      <CmsModal
        open={deleteDialog === 'template'}
        onClose={() => setDeleteDialog(null)}
        title="삭제 확인"
        content="선택한 알림톡 템플릿을 삭제할까요? NHN Console에도 반영됩니다. (승인·공용 템플릿은 NHN에서 거절될 수 있습니다.)"
        buttons={[
          { label: '취소', onClick: () => setDeleteDialog(null), variant: 'secondary' },
          { label: '삭제', onClick: () => void handleConfirmDelete(), variant: 'delete' },
        ]}
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
          { label: '이동', onClick: () => void handleConfirmMove(), variant: 'primary' },
        ]}
      />
      <CmsModal
        open={pendingMove?.kind === 'template'}
        onClose={() => setPendingMove(null)}
        title="템플릿 이동"
        buttons={[
          { label: '취소', onClick: () => setPendingMove(null), variant: 'secondary' },
          { label: '이동', onClick: () => void handleConfirmMove(), variant: 'primary' },
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
        onSubmit={name => void handleSubmitCategory(name)}
      />
    </div>
  )
}
