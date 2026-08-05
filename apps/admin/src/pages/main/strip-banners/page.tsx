/**
 * 메인 상단 띠배너 관리
 */

import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { StripBanner } from '@/entities/strip-banner/model/types'
import {
  MAX_ACTIVE_STRIP_BANNERS,
  StripBannerActiveLimitError,
} from '@/entities/strip-banner/model/types'
import {
  useCreateStripBanner,
  useRemoveStripBanners,
  useReorderStripBanners,
  useSetStripBannerActive,
  useStripBannersList,
  useUpdateStripBanner,
  type StripBannerListFilter,
} from '@/features/strip-banner/api/hooks'
import { STRIP_BANNERS_CHANGED_EVENT } from '@/features/strip-banner/api/store'
import {
  StripBannerFormModal,
  type StripBannerFormValues,
} from '@/features/strip-banner/ui/form-modal'
import {
  StripBannerDragHandle,
  StripBannersSortableTable,
} from '@/features/strip-banner/ui/sortable-table'
import {
  CmsButton,
  CmsDateRangePicker,
  CmsInput,
  CmsSelect,
  ConfirmModal,
  useCmsAlert,
} from '@/shared/ui'

import './page.css'

type ActiveFilterValue = '' | 'true' | 'false'

function formatYmdDot(ymd: string): string {
  if (!ymd) return '-'
  return ymd.replace(/-/g, '.')
}

function formatCreatedDate(iso: string): string {
  if (!iso) return '-'
  const d = dayjs(iso)
  if (!d.isValid()) return '-'
  return d.format('YYYY.MM.DD')
}

function buildFilter(params: {
  active: ActiveFilterValue
  text: string
  period: [Dayjs | null, Dayjs | null]
}): StripBannerListFilter {
  const filter: StripBannerListFilter = {}
  if (params.active === 'true') filter.isActive = true
  if (params.active === 'false') filter.isActive = false
  const text = params.text.trim()
  if (text) filter.text = text
  const start = params.period[0]
  const end = params.period[1]
  if (start) filter.periodStart = start.format('YYYY-MM-DD')
  if (end) filter.periodEnd = end.format('YYYY-MM-DD')
  return filter
}

function matchesClientFilter(row: StripBanner, filter: StripBannerListFilter): boolean {
  if (filter.isActive === true && !row.isActive) return false
  if (filter.isActive === false && row.isActive) return false

  const textQ = filter.text?.trim().toLowerCase()
  if (textQ && !row.text.toLowerCase().includes(textQ)) return false

  const fStart = filter.periodStart?.trim()
  const fEnd = filter.periodEnd?.trim()
  if (fStart || fEnd) {
    const rangeStart = fStart || '0000-01-01'
    const rangeEnd = fEnd || '9999-12-31'
    if (!(row.periodStart <= rangeEnd && rangeStart <= row.periodEnd)) {
      return false
    }
  }
  return true
}

export function StripBannersPage() {
  const { showAlert } = useCmsAlert()

  const [draftActive, setDraftActive] = useState<ActiveFilterValue>('')
  const [draftText, setDraftText] = useState('')
  const [draftPeriod, setDraftPeriod] = useState<[Dayjs | null, Dayjs | null]>([null, null])
  const [appliedFilter, setAppliedFilter] = useState<StripBannerListFilter>({})

  const listQuery = useStripBannersList()
  const createMutation = useCreateStripBanner()
  const updateMutation = useUpdateStripBanner()
  const removeMutation = useRemoveStripBanners()
  const reorderMutation = useReorderStripBanners()
  const setActiveMutation = useSetStripBannerActive()

  const allRows = useMemo(() => listQuery.data ?? [], [listQuery.data])
  const rows = useMemo(
    () => allRows.filter(row => matchesClientFilter(row, appliedFilter)),
    [allRows, appliedFilter]
  )
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [formVariant, setFormVariant] = useState<'create' | 'detail'>('create')
  const [editingBanner, setEditingBanner] = useState<StripBanner | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    const handler = () => {
      void listQuery.refetch()
    }
    window.addEventListener(STRIP_BANNERS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(STRIP_BANNERS_CHANGED_EVENT, handler)
  }, [listQuery])

  const handleSearch = useCallback(() => {
    setAppliedFilter(
      buildFilter({
        active: draftActive,
        text: draftText,
        period: draftPeriod,
      })
    )
    setSelectedRowKeys([])
  }, [draftActive, draftPeriod, draftText])

  const handleRowsReorder = useCallback(
    (reorderedRows: StripBanner[]) => {
      const reorderedIds = reorderedRows.map(row => row.id)
      let cursor = 0
      const mergedIds =
        reorderedRows.length === allRows.length
          ? reorderedIds
          : allRows.map(row => {
              if (matchesClientFilter(row, appliedFilter)) {
                return reorderedIds[cursor++]!
              }
              return row.id
            })

      void reorderMutation.mutateAsync(mergedIds).catch(() => {
        showAlert({
          title: '순서 변경 실패',
          content: '배너 순서 저장에 실패했습니다. 목록을 다시 불러옵니다.',
        })
        void listQuery.refetch()
      })
    },
    [allRows, appliedFilter, listQuery, reorderMutation, showAlert]
  )

  const handleToggleActive = useCallback(
    (id: string, isActive: boolean) => {
      void setActiveMutation.mutateAsync({ id, isActive }).catch(error => {
        if (
          error instanceof StripBannerActiveLimitError ||
          (error as Error)?.name === 'StripBannerActiveLimitError'
        ) {
          showAlert({
            title: '사용 제한',
            content: `배너는 최대 ${MAX_ACTIVE_STRIP_BANNERS}개까지 동시 사용 가능합니다.`,
          })
        } else {
          showAlert({
            title: '사용 여부 변경 실패',
            content: '사용 여부 변경에 실패했습니다. 다시 시도해 주세요.',
          })
        }
        void listQuery.refetch()
      })
    },
    [listQuery, setActiveMutation, showAlert]
  )

  const openCreate = useCallback(() => {
    setFormVariant('create')
    setEditingBanner(null)
    setFormOpen(true)
  }, [])

  const openDetail = useCallback((banner: StripBanner) => {
    setFormVariant('detail')
    setEditingBanner(banner)
    setFormOpen(true)
  }, [])

  const handleFormSubmit = useCallback(
    async (values: StripBannerFormValues) => {
      try {
        if (formVariant === 'detail' && editingBanner) {
          await updateMutation.mutateAsync({ id: editingBanner.id, patch: values })
        } else {
          await createMutation.mutateAsync(values)
        }
        setFormOpen(false)
        setEditingBanner(null)
      } catch (error) {
        if (
          error instanceof StripBannerActiveLimitError ||
          (error as Error)?.name === 'StripBannerActiveLimitError'
        ) {
          showAlert({
            title: '사용 제한',
            content: `배너는 최대 ${MAX_ACTIVE_STRIP_BANNERS}개까지 동시 사용 가능합니다.`,
          })
          return
        }
        showAlert({
          title: formVariant === 'detail' ? '수정 실패' : '등록 실패',
          content:
            formVariant === 'detail'
              ? '배너 수정에 실패했습니다. 다시 시도해 주세요.'
              : '배너 등록에 실패했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [createMutation, editingBanner, formVariant, showAlert, updateMutation]
  )

  const handleDetailDelete = useCallback(async () => {
    if (!editingBanner) return
    try {
      await removeMutation.mutateAsync([editingBanner.id])
      setFormOpen(false)
      setEditingBanner(null)
      setSelectedRowKeys(prev => prev.filter(key => String(key) !== editingBanner.id))
    } catch {
      showAlert({
        title: '삭제 실패',
        content: '배너 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [editingBanner, removeMutation, showAlert])

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

  const totalCount = rows.length

  const columns = useMemo<ColumnsType<StripBanner>>(
    () => [
      {
        title: '순서',
        key: 'sort',
        width: 72,
        align: 'center',
        render: () => <StripBannerDragHandle />,
      },
      {
        title: 'No.',
        key: 'no',
        width: 72,
        align: 'center',
        render: (_value, _record, index) => totalCount - index,
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
            aria-label={`${record.text || '배너'} 사용 여부`}
          />
        ),
      },
      {
        title: '배너 문구',
        dataIndex: 'text',
        key: 'text',
        ellipsis: true,
      },
      {
        title: '게시 기간',
        key: 'period',
        width: 220,
        align: 'center',
        render: (_value, record) =>
          `${formatYmdDot(record.periodStart)} ~ ${formatYmdDot(record.periodEnd)}`,
      },
      {
        title: '등록일',
        key: 'createdAt',
        width: 120,
        align: 'center',
        render: (_value, record) => formatCreatedDate(record.createdAt),
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
              openDetail(record)
            }}
          >
            수정
          </CmsButton>
        ),
      },
    ],
    [handleToggleActive, openDetail, totalCount]
  )

  const formLoading =
    formVariant === 'detail' ? updateMutation.isPending : createMutation.isPending

  return (
    <div className="strip-banners-page">
      <div className="admin-list-card">
        <div className="strip-banners-page__filter">
          <div className="strip-banners-page__filter-field strip-banners-page__filter-field--status">
            <p className="strip-banners-page__filter-label">사용 여부</p>
            <CmsSelect
              inputSize="large"
              width="100%"
              value={draftActive}
              onChange={value => setDraftActive((value as ActiveFilterValue) ?? '')}
              options={[
                { label: '전체', value: '' },
                { label: '사용', value: 'true' },
                { label: '미사용', value: 'false' },
              ]}
            />
          </div>
          <div className="strip-banners-page__filter-field strip-banners-page__filter-field--text">
            <p className="strip-banners-page__filter-label">배너 문구</p>
            <CmsInput
              inputSize="large"
              width="100%"
              placeholder="배너 문구를 입력하세요"
              value={draftText}
              onChange={e => setDraftText(e.target.value)}
              onPressEnter={handleSearch}
            />
          </div>
          <div className="strip-banners-page__filter-field strip-banners-page__filter-field--period">
            <p className="strip-banners-page__filter-label">게시 기간</p>
            <CmsDateRangePicker
              inputSize="large"
              width="100%"
              value={draftPeriod}
              onChange={dates => setDraftPeriod(dates ?? [null, null])}
              placeholder={['시작일', '종료일']}
              allowClear
            />
          </div>
          <div className="strip-banners-page__filter-actions">
            <CmsButton variant="primary" size="large" type="button" onClick={handleSearch}>
              조회
            </CmsButton>
          </div>
        </div>
      </div>

      <div className="admin-list-card">
        <div className="admin-list-toolbar">
          <div className="table-header-title--wrapper">
            <span className="table-title">메인 상단 띠배너 목록</span>
            <span className="table-description">
              총 {totalCount.toLocaleString()}건 (배너는 최대 {MAX_ACTIVE_STRIP_BANNERS}
              개까지 동시 사용 가능합니다.)
            </span>
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

        <div className="strip-banners-page__table-scroll">
          <StripBannersSortableTable
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

      <StripBannerFormModal
        open={formOpen}
        variant={formVariant}
        initial={editingBanner}
        confirmLoading={formLoading}
        deleteLoading={removeMutation.isPending}
        onCancel={() => {
          setFormOpen(false)
          setEditingBanner(null)
        }}
        onSubmit={values => {
          void handleFormSubmit(values)
        }}
        onDelete={
          formVariant === 'detail'
            ? () => {
                void handleDetailDelete()
              }
            : undefined
        }
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
