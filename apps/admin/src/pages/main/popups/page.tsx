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
import type { MainPopup, MainPopupDraft, MainPopupFilters } from '@/features/main/popup/model/types'
import { MAIN_POPUP_MAX_ACTIVE } from '@/features/main/popup/model/types'
import { useMainPopupStore } from '@/features/main/popup/lib/store'
import { filterMainPopups } from '@/features/main/popup/lib/filter'
import { formatPopupDateTime, formatPopupPeriod } from '@/features/main/popup/lib/format'
import { MainPopupFormModal } from '@/features/main/popup/ui/form-modal'
import {
  SortableDataTable,
  SortableDragHandle,
} from '@/shared/ui/sortable-data-table'
import styles from './page.module.css'

const { Text } = Typography
const { RangePicker } = DatePicker

const INITIAL_FILTERS: MainPopupFilters = {
  active: 'all',
  name: '',
  altText: '',
  startDate: null,
  endDate: null,
}

/**
 * 메인 > 팝업 관리
 * Notion: 4-1 목록 / 4-2 등록·수정
 */
export function PopupsPage() {
  const popups = useMainPopupStore(s => s.popups)
  const syncExpiry = useMainPopupStore(s => s.syncExpiry)
  const create = useMainPopupStore(s => s.create)
  const update = useMainPopupStore(s => s.update)
  const remove = useMainPopupStore(s => s.remove)
  const setActive = useMainPopupStore(s => s.setActive)
  const reorder = useMainPopupStore(s => s.reorder)

  const [pendingFilters, setPendingFilters] = useState<MainPopupFilters>(INITIAL_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<MainPopupFilters>(INITIAL_FILTERS)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<MainPopup | null>(null)

  useEffect(() => {
    syncExpiry()
  }, [syncExpiry])

  const filtered = useMemo(
    () => filterMainPopups(popups, appliedFilters),
    [appliedFilters, popups]
  )

  const openCreate = useCallback(() => {
    setModalMode('create')
    setEditing(null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((row: MainPopup) => {
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
    (draft: MainPopupDraft) => {
      if (modalMode === 'create') {
        const result = create(draft)
        if (!result.ok) {
          message.warning(`동시에 사용 가능한 팝업은 최대 ${MAIN_POPUP_MAX_ACTIVE}개입니다.`)
          return
        }
        message.success('팝업이 등록되었습니다.')
      } else if (editing) {
        const result = update(editing.id, draft)
        if (!result.ok) {
          if (result.reason === 'max-active') {
            message.warning(`동시에 사용 가능한 팝업은 최대 ${MAIN_POPUP_MAX_ACTIVE}개입니다.`)
          }
          return
        }
        message.success('팝업이 수정되었습니다.')
      }
      closeModal()
    },
    [closeModal, create, editing, modalMode, update]
  )

  const handleDeleteFromModal = useCallback(() => {
    if (!editing) return
    Modal.confirm({
      title: '팝업 삭제',
      content: `"${editing.name}" 팝업을 삭제하시겠습니까?`,
      okText: '삭제',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: () => {
        remove([editing.id])
        setSelectedIds(prev => prev.filter(id => id !== editing.id))
        closeModal()
        message.success('팝업이 삭제되었습니다.')
      },
    })
  }, [closeModal, editing, remove])

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) {
      message.warning('삭제할 팝업을 선택해 주세요.')
      return
    }
    Modal.confirm({
      title: '선택 삭제',
      content: `선택한 팝업 ${selectedIds.length}건을 삭제하시겠습니까?`,
      okText: '삭제',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: () => {
        remove(selectedIds)
        setSelectedIds([])
        message.success('선택한 팝업이 삭제되었습니다.')
      },
    })
  }, [remove, selectedIds])

  const handleToggleActive = useCallback(
    (row: MainPopup, checked: boolean) => {
      const result = setActive(row.id, checked)
      if (!result.ok && result.reason === 'max-active') {
        message.warning(`동시에 사용 가능한 팝업은 최대 ${MAIN_POPUP_MAX_ACTIVE}개입니다.`)
      }
    },
    [setActive]
  )

  const columns = useMemo<ColumnsType<MainPopup>>(
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
        title: '이미지',
        dataIndex: 'imageUrl',
        width: 120,
        render: (url: string, row) => (
          <img src={url} alt={row.altText || row.name} className={styles.thumb} />
        ),
      },
      {
        title: '팝업명',
        dataIndex: 'name',
        width: 160,
        ellipsis: true,
        render: (name: string, row) =>
          row.linkEnabled && row.linkUrl ? (
            <a href={row.linkUrl} target="_blank" rel="noreferrer">
              {name}
            </a>
          ) : (
            name
          ),
      },
      {
        title: '대체 텍스트 (설명)',
        dataIndex: 'altText',
        ellipsis: true,
        render: (text: string) => text || '—',
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
        width: 180,
        render: (iso: string) => formatPopupDateTime(iso),
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
            <span>팝업명</span>
            <Input
              value={pendingFilters.name}
              onChange={e => setPendingFilters(prev => ({ ...prev, name: e.target.value }))}
              placeholder="팝업명 키워드"
              allowClear
              onPressEnter={handleSearch}
            />
          </label>
          <label className={styles.filterField}>
            <span>대체 텍스트 (설명)</span>
            <Input
              value={pendingFilters.altText}
              onChange={e => setPendingFilters(prev => ({ ...prev, altText: e.target.value }))}
              placeholder="대체 텍스트 키워드"
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
            팝업은 최대 {MAIN_POPUP_MAX_ACTIVE}개까지 동시 사용 가능합니다.
          </Text>
        </div>
        <Space>
          <Button onClick={handleDeleteSelected}>선택 삭제</Button>
          <Button type="primary" onClick={openCreate}>
            팝업 등록
          </Button>
        </Space>
      </div>

      <div className={styles.tableWrap}>
        <SortableDataTable
          rows={filtered}
          columns={columns}
          scrollX={1200}
          onRowsReorder={rows => reorder(rows.map(row => row.id))}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: keys => setSelectedIds(keys.map(String)),
          }}
        />
      </div>

      <MainPopupFormModal
        open={modalOpen}
        mode={modalMode}
        popup={editing}
        onCancel={closeModal}
        onSubmit={handleSubmit}
        onDelete={modalMode === 'edit' ? handleDeleteFromModal : undefined}
      />
    </div>
  )
}
