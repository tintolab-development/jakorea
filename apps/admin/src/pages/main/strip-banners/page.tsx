import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  DatePicker,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type {
  StripBanner,
  StripBannerDraft,
  StripBannerFilters,
} from '@/features/main/strip-banner/model/types'
import { STRIP_BANNER_MAX_ACTIVE } from '@/features/main/strip-banner/model/types'
import { useStripBannerStore } from '@/features/main/strip-banner/lib/store'
import { filterStripBanners } from '@/features/main/strip-banner/lib/filter'
import { formatPopupPeriod } from '@/features/main/popup/lib/format'
import { StripBannerFormModal } from '@/features/main/strip-banner/ui/form-modal'
import {
  SortableDataTable,
  SortableDragHandle,
} from '@/shared/ui/sortable-data-table'
import styles from './page.module.css'

const { Text } = Typography
const { RangePicker } = DatePicker

const INITIAL_FILTERS: StripBannerFilters = {
  active: 'all',
  text: '',
  startDate: null,
  endDate: null,
}

/**
 * 메인 > 메인 상단 띠배너 관리
 * Notion: 5-1 목록 / 5-2 등록·수정
 */
export function StripBannersPage() {
  const banners = useStripBannerStore(s => s.banners)
  const syncExpiry = useStripBannerStore(s => s.syncExpiry)
  const create = useStripBannerStore(s => s.create)
  const update = useStripBannerStore(s => s.update)
  const remove = useStripBannerStore(s => s.remove)
  const setActive = useStripBannerStore(s => s.setActive)
  const reorder = useStripBannerStore(s => s.reorder)

  const [pendingFilters, setPendingFilters] = useState<StripBannerFilters>(INITIAL_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<StripBannerFilters>(INITIAL_FILTERS)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<StripBanner | null>(null)

  useEffect(() => {
    syncExpiry()
  }, [syncExpiry])

  const filtered = useMemo(
    () => filterStripBanners(banners, appliedFilters),
    [appliedFilters, banners]
  )

  const openCreate = useCallback(() => {
    setModalMode('create')
    setEditing(null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((row: StripBanner) => {
    setModalMode('edit')
    setEditing(row)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditing(null)
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
    setSelectedIds([])
  }, [pendingFilters])

  const handleSubmit = useCallback(
    (draft: StripBannerDraft) => {
      if (modalMode === 'create') {
        const result = create(draft)
        if (!result.ok) {
          message.warning(`동시에 사용 가능한 배너는 최대 ${STRIP_BANNER_MAX_ACTIVE}개입니다.`)
          return
        }
        message.success('띠배너가 등록되었습니다.')
      } else if (editing) {
        const result = update(editing.id, draft)
        if (!result.ok) {
          if (result.reason === 'max-active') {
            message.warning(`동시에 사용 가능한 배너는 최대 ${STRIP_BANNER_MAX_ACTIVE}개입니다.`)
          }
          return
        }
        message.success('띠배너가 수정되었습니다.')
      }
      closeModal()
    },
    [closeModal, create, editing, modalMode, update]
  )

  const handleDeleteFromModal = useCallback(() => {
    if (!editing) return
    Modal.confirm({
      title: '배너 삭제',
      content: '선택한 띠배너를 삭제하시겠습니까?',
      okText: '삭제',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: () => {
        remove([editing.id])
        setSelectedIds(prev => prev.filter(id => id !== editing.id))
        closeModal()
        message.success('띠배너가 삭제되었습니다.')
      },
    })
  }, [closeModal, editing, remove])

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) {
      message.warning('삭제할 띠배너를 선택해 주세요.')
      return
    }
    Modal.confirm({
      title: '선택 삭제',
      content: `선택한 띠배너 ${selectedIds.length}건을 삭제하시겠습니까?`,
      okText: '삭제',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: () => {
        remove(selectedIds)
        setSelectedIds([])
        message.success('선택한 띠배너가 삭제되었습니다.')
      },
    })
  }, [remove, selectedIds])

  const handleToggleActive = useCallback(
    (row: StripBanner, checked: boolean) => {
      const result = setActive(row.id, checked)
      if (!result.ok && result.reason === 'max-active') {
        message.warning(`동시에 사용 가능한 배너는 최대 ${STRIP_BANNER_MAX_ACTIVE}개입니다.`)
      }
    },
    [setActive]
  )

  const columns = useMemo<ColumnsType<StripBanner>>(
    () => [
      {
        title: '순서',
        key: 'sort',
        width: 56,
        align: 'center',
        render: () => <SortableDragHandle />,
      },
      {
        title: 'No.',
        key: 'no',
        width: 56,
        align: 'center',
        render: (_v, _r, index) => index + 1,
      },
      {
        title: '사용 여부',
        dataIndex: 'active',
        width: 100,
        align: 'center',
        render: (active: boolean, row) => (
          <Switch
            checked={active}
            checkedChildren="사용"
            unCheckedChildren="미사용"
            onChange={checked => handleToggleActive(row, checked)}
          />
        ),
      },
      {
        title: '배너 문구',
        dataIndex: 'text',
        ellipsis: true,
        render: (text: string, row) =>
          row.linkEnabled && row.linkUrl ? (
            <a href={row.linkUrl} target="_blank" rel="noreferrer">
              {text}
            </a>
          ) : (
            text
          ),
      },
      {
        title: '게시 기간',
        key: 'period',
        width: 200,
        render: (_v, row) => formatPopupPeriod(row.startDate, row.endDate),
      },
      {
        title: '작성일',
        dataIndex: 'createdAt',
        width: 120,
        render: (iso: string) => dayjs(iso).format('YYYY.MM.DD'),
      },
      {
        title: '관리',
        key: 'actions',
        width: 88,
        align: 'center',
        fixed: 'right',
        render: (_v, row) => (
          <Button type="link" onClick={() => openEdit(row)}>
            수정
          </Button>
        ),
      },
    ],
    [handleToggleActive, openEdit]
  )

  return (
    <div className={styles.page}>
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <label className={styles.filterField}>
            <span>사용 여부</span>
            <Select
              value={pendingFilters.active}
              onChange={value => setPendingFilters(prev => ({ ...prev, active: value }))}
              options={[
                { value: 'all', label: '전체' },
                { value: 'active', label: '사용' },
                { value: 'inactive', label: '미사용' },
              ]}
            />
          </label>
          <label className={styles.filterField}>
            <span>배너 문구</span>
            <Input
              value={pendingFilters.text}
              onChange={e => setPendingFilters(prev => ({ ...prev, text: e.target.value }))}
              placeholder="배너 문구 키워드"
              allowClear
              onPressEnter={handleSearch}
            />
          </label>
          <label className={styles.filterField}>
            <span>게시 기간</span>
            <RangePicker
              value={
                pendingFilters.startDate && pendingFilters.endDate
                  ? [dayjs(pendingFilters.startDate), dayjs(pendingFilters.endDate)]
                  : null
              }
              onChange={dates => {
                setPendingFilters(prev => ({
                  ...prev,
                  startDate: dates?.[0]?.format('YYYY-MM-DD') ?? null,
                  endDate: dates?.[1]?.format('YYYY-MM-DD') ?? null,
                }))
              }}
              style={{ width: '100%' }}
            />
          </label>
        </div>
        <div className={styles.filterActions}>
          <Button type="primary" onClick={handleSearch}>
            조회
          </Button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Text className={styles.count}>
            전체 <strong>{filtered.length}</strong>건
          </Text>
          <Text type="secondary" className={styles.hint}>
            배너는 최대 {STRIP_BANNER_MAX_ACTIVE}개까지 동시 사용 가능합니다.
          </Text>
        </div>
        <Space>
          <Button onClick={handleDeleteSelected}>선택 삭제</Button>
          <Button type="primary" onClick={openCreate}>
            띠배너 등록
          </Button>
        </Space>
      </div>

      <div className={styles.tableWrap}>
        <SortableDataTable
          rows={filtered}
          columns={columns}
          scrollX={1000}
          onRowsReorder={rows => reorder(rows.map(row => row.id))}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: keys => setSelectedIds(keys.map(String)),
          }}
        />
      </div>

      <StripBannerFormModal
        open={modalOpen}
        mode={modalMode}
        banner={editing}
        onCancel={closeModal}
        onSubmit={handleSubmit}
        onDelete={modalMode === 'edit' ? handleDeleteFromModal : undefined}
      />
    </div>
  )
}
