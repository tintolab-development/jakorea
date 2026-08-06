/**
 * 메인 히어로 배너 관리
 */

import { useCallback, useMemo, useState, type Key } from 'react'
import { Image, Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { HeroBanner } from '@/entities/hero-banner/model/types'
import {
  useCreateHeroBanner,
  useHeroBannersList,
  useRemoveHeroBanners,
  useReorderHeroBanners,
  useSetHeroBannerActive,
  useUpdateHeroBanner,
} from '@/features/hero-banner/api/hooks'
import { heroBannerQueryKeys } from '@/features/hero-banner/api/query-keys'
import { HERO_BANNERS_CHANGED_EVENT } from '@/features/hero-banner/api/store'
import {
  HeroBannerFormModal,
  type HeroBannerFormValues,
} from '@/features/hero-banner/ui/form-modal'
import {
  HeroBannerDragHandle,
  HeroBannersSortableTable,
} from '@/features/hero-banner/ui/sortable-table'
import { HeroBannerTextLinkCell } from '@/features/hero-banner/ui/text-link-cell'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { CmsButton, ConfirmModal, useCmsAlert } from '@/shared/ui'

import './page.css'

export function HeroBannersPage() {
  const { showAlert } = useCmsAlert()
  const listQuery = useHeroBannersList()
  const createMutation = useCreateHeroBanner()
  const updateMutation = useUpdateHeroBanner()
  const removeMutation = useRemoveHeroBanners()
  const reorderMutation = useReorderHeroBanners()
  const setActiveMutation = useSetHeroBannerActive()

  const rows = useMemo(() => listQuery.data ?? [], [listQuery.data])
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useInvalidateOnWindowEvent(HERO_BANNERS_CHANGED_EVENT, heroBannerQueryKeys.lists())

  const handleRowsReorder = useCallback(
    (reorderedRows: HeroBanner[]) => {
      void reorderMutation.mutateAsync(reorderedRows.map(row => row.id)).catch(() => {
        showAlert({
          title: '순서 변경 실패',
          content: '배너 순서 저장에 실패했습니다. 목록을 다시 불러옵니다.',
        })
        void listQuery.refetch()
      })
    },
    [listQuery, reorderMutation, showAlert]
  )

  const handleToggleActive = useCallback(
    (id: string, isActive: boolean) => {
      void setActiveMutation.mutateAsync({ id, isActive }).catch(() => {
        showAlert({
          title: '사용 여부 변경 실패',
          content: '사용 여부 변경에 실패했습니다. 다시 시도해 주세요.',
        })
        void listQuery.refetch()
      })
    },
    [listQuery, setActiveMutation, showAlert]
  )

  const openCreate = useCallback(() => {
    setFormMode('create')
    setEditingBanner(null)
    setFormOpen(true)
  }, [])

  const openEdit = useCallback((banner: HeroBanner) => {
    setFormMode('edit')
    setEditingBanner(banner)
    setFormOpen(true)
  }, [])

  const handleFormSubmit = useCallback(
    async (values: HeroBannerFormValues) => {
      try {
        if (formMode === 'edit' && editingBanner) {
          await updateMutation.mutateAsync({ id: editingBanner.id, patch: values })
        } else {
          await createMutation.mutateAsync(values)
        }
        setFormOpen(false)
        setEditingBanner(null)
      } catch {
        showAlert({
          title: formMode === 'edit' ? '수정 실패' : '등록 실패',
          content:
            formMode === 'edit'
              ? '배너 수정에 실패했습니다. 다시 시도해 주세요.'
              : '배너 등록에 실패했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [createMutation, editingBanner, formMode, showAlert, updateMutation]
  )

  const handleDeleteClick = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert({
        title: '선택 항목 없음',
        content: '삭제할 배너를 선택해 주세요.',
      })
      return
    }
    setDeleteConfirmOpen(true)
  }, [selectedRowKeys.length, showAlert])

  const handleDeleteConfirm = useCallback(async () => {
    const ids = selectedRowKeys.map(String)
    try {
      await removeMutation.mutateAsync(ids)
      setSelectedRowKeys([])
      setDeleteConfirmOpen(false)
    } catch {
      showAlert({
        title: '삭제 실패',
        content: '배너 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [removeMutation, selectedRowKeys, showAlert])

  const columns = useMemo<ColumnsType<HeroBanner>>(
    () => [
      {
        title: '순서',
        key: 'sort',
        width: 72,
        align: 'center',
        render: () => <HeroBannerDragHandle />,
      },
      {
        title: 'No.',
        key: 'no',
        width: 72,
        align: 'center',
        render: (_value, _record, index) => index + 1,
      },
      {
        title: '사용 여부',
        key: 'isActive',
        width: 100,
        align: 'center',
        render: (_value, record) => (
          <Switch
            checked={record.isActive}
            onChange={checked => handleToggleActive(record.id, checked)}
            aria-label={`${record.mainTitle || '배너'} 사용 여부`}
          />
        ),
      },
      {
        title: '배너 이미지',
        key: 'image',
        width: 232,
        align: 'center',
        render: (_value, record) => (
          <div className="hero-banners-page__thumb-wrap">
            <Image
              className="hero-banners-page__thumb"
              src={record.imageUrl}
              alt={record.imageFileName || '배너 이미지'}
              preview={{ mask: '이미지 보기' }}
            />
          </div>
        ),
      },
      {
        title: '배너 텍스트 및 링크',
        key: 'textLink',
        render: (_value, record) => <HeroBannerTextLinkCell banner={record} />,
      },
      {
        title: '관리',
        key: 'actions',
        width: 120,
        align: 'center',
        render: (_value, record) => (
          <CmsButton
            variant="secondary"
            size="medium"
            width={88}
            type="button"
            onClick={e => {
              e.stopPropagation()
              openEdit(record)
            }}
          >
            수정
          </CmsButton>
        ),
      },
    ],
    [handleToggleActive, openEdit]
  )

  const totalCount = rows.length
  const formLoading =
    formMode === 'edit' ? updateMutation.isPending : createMutation.isPending

  return (
    <div className="hero-banners-page">
      <div className="admin-list-card">
        <div className="admin-list-toolbar">
          <div className="table-header-title--wrapper">
            <span className="table-title">히어로 배너 목록</span>
            <span className="table-description">총 {totalCount.toLocaleString()}건</span>
          </div>
          <div className="table-header-actions--wrapper">
            <CmsButton
              variant="delete"
              size="medium"
              type="button"
              onClick={handleDeleteClick}
              loading={removeMutation.isPending}
            >
              선택 삭제
            </CmsButton>
            <CmsButton variant="primary" size="medium" type="button" onClick={openCreate}>
              배너 등록
            </CmsButton>
          </div>
        </div>

        <div className="hero-banners-page__table-scroll">
          <HeroBannersSortableTable
            rows={rows}
            columns={columns}
            loading={listQuery.isLoading}
            onRowsReorder={handleRowsReorder}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys),
              columnWidth: 68,
            }}
          />
        </div>
      </div>

      <HeroBannerFormModal
        open={formOpen}
        mode={formMode}
        initial={editingBanner}
        confirmLoading={formLoading}
        onCancel={() => {
          setFormOpen(false)
          setEditingBanner(null)
        }}
        onSubmit={values => {
          void handleFormSubmit(values)
        }}
      />

      <ConfirmModal
        open={deleteConfirmOpen}
        title="배너 삭제"
        content={`선택한 배너 ${selectedRowKeys.length}건을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={removeMutation.isPending}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          void handleDeleteConfirm()
        }}
      />
    </div>
  )
}
