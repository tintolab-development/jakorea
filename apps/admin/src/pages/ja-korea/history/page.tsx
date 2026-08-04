import { useCallback, useMemo, useState } from 'react'
import {
  Button,
  DatePicker,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type {
  HistoryDraft,
  HistoryFilters,
  HistoryItem,
  HistorySort,
} from '@/features/ja-korea/history'
import {
  HistoryFormModal,
  filterHistoryItems,
  sortHistoryItems,
  useHistoryStore,
} from '@/features/ja-korea/history'
import styles from './page.module.css'

const { Text, Paragraph } = Typography
const { RangePicker } = DatePicker

const INITIAL_FILTERS: HistoryFilters = {
  visibility: 'all',
  year: 'all',
  month: 'all',
  content: '',
  createdFrom: null,
  createdTo: null,
}

function formatDateTime(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DD HH:mm')
}

/**
 * JA Korea > 기관 소개 > 연혁
 * Notion: 1-4. 연혁·수상·인증 관리_연혁
 */
export function HistoryPage() {
  const items = useHistoryStore(s => s.items)
  const create = useHistoryStore(s => s.create)
  const update = useHistoryStore(s => s.update)
  const remove = useHistoryStore(s => s.remove)
  const setVisibility = useHistoryStore(s => s.setVisibility)

  const [pendingFilters, setPendingFilters] = useState<HistoryFilters>(INITIAL_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<HistoryFilters>(INITIAL_FILTERS)
  const [sort, setSort] = useState<HistorySort>('history-desc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<HistoryItem | null>(null)

  const yearOptions = useMemo(() => {
    const years = new Set(items.map(item => item.year))
    return [...years].sort((a, b) => b - a)
  }, [items])

  const filtered = useMemo(() => {
    const matched = filterHistoryItems(items, appliedFilters)
    return sortHistoryItems(matched, sort)
  }, [appliedFilters, items, sort])

  const openCreate = useCallback(() => {
    setModalMode('create')
    setEditing(null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((row: HistoryItem) => {
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
    (draft: HistoryDraft) => {
      if (modalMode === 'create') {
        create(draft)
        message.success('연혁이 등록되었습니다.')
      } else if (editing) {
        update(editing.id, draft)
        message.success('연혁이 수정되었습니다.')
      }
      closeModal()
    },
    [closeModal, create, editing, modalMode, update]
  )

  const handleDeleteFromModal = useCallback(() => {
    if (!editing) return
    Modal.confirm({
      title: '연혁 삭제',
      content: '이 연혁을 삭제하시겠습니까?',
      okText: '삭제',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: () => {
        remove([editing.id])
        setSelectedIds(prev => prev.filter(id => id !== editing.id))
        closeModal()
        message.success('연혁이 삭제되었습니다.')
      },
    })
  }, [closeModal, editing, remove])

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) {
      message.warning('삭제할 연혁을 선택해 주세요.')
      return
    }
    Modal.confirm({
      title: '선택 삭제',
      content: `선택한 연혁 ${selectedIds.length}건을 삭제하시겠습니까?`,
      okText: '삭제',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: () => {
        remove(selectedIds)
        setSelectedIds([])
        message.success('선택한 연혁이 삭제되었습니다.')
      },
    })
  }, [remove, selectedIds])

  const columns = useMemo<ColumnsType<HistoryItem>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: 64,
        align: 'center',
        render: (_v, _r, index) => index + 1,
      },
      {
        title: '공개 여부',
        dataIndex: 'visibility',
        width: 110,
        align: 'center',
        render: (visibility: HistoryItem['visibility'], row) => (
          <Switch
            checked={visibility === 'public'}
            checkedChildren="공개"
            unCheckedChildren="비공개"
            onChange={checked => setVisibility(row.id, checked ? 'public' : 'private')}
          />
        ),
      },
      {
        title: '연혁년도/월',
        key: 'yearMonth',
        width: 120,
        render: (_v, row) => `${row.year}년 ${row.month}월`,
      },
      {
        title: '내용',
        dataIndex: 'content',
        render: (content: string) => (
          <Paragraph className={styles.preline} ellipsis={{ rows: 2, tooltip: content }}>
            {content}
          </Paragraph>
        ),
      },
      {
        title: '작성일시',
        dataIndex: 'createdAt',
        width: 160,
        render: (iso: string) => formatDateTime(iso),
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
    [openEdit, setVisibility]
  )

  return (
    <div className={styles.page}>
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <label className={styles.filterField}>
            <span>공개 여부</span>
            <Select
              value={pendingFilters.visibility}
              onChange={value => setPendingFilters(prev => ({ ...prev, visibility: value }))}
              options={[
                { value: 'all', label: '전체' },
                { value: 'public', label: '공개' },
                { value: 'private', label: '비공개' },
              ]}
            />
          </label>
          <label className={styles.filterField}>
            <span>연혁년도</span>
            <Select
              value={pendingFilters.year}
              onChange={value => setPendingFilters(prev => ({ ...prev, year: value }))}
              options={[
                { value: 'all', label: '년도 전체' },
                ...yearOptions.map(year => ({ value: year, label: `${year}년` })),
              ]}
            />
          </label>
          <label className={styles.filterField}>
            <span>연혁월</span>
            <Select
              value={pendingFilters.month}
              onChange={value => setPendingFilters(prev => ({ ...prev, month: value }))}
              options={[
                { value: 'all', label: '월 전체' },
                ...Array.from({ length: 12 }, (_, i) => ({
                  value: i + 1,
                  label: `${i + 1}월`,
                })),
              ]}
            />
          </label>
          <label className={styles.filterField}>
            <span>내용</span>
            <Input
              value={pendingFilters.content}
              onChange={e => setPendingFilters(prev => ({ ...prev, content: e.target.value }))}
              placeholder="검색어를 입력하세요"
              allowClear
              onPressEnter={handleSearch}
            />
          </label>
          <label className={styles.filterField}>
            <span>작성일</span>
            <RangePicker
              value={
                pendingFilters.createdFrom && pendingFilters.createdTo
                  ? [dayjs(pendingFilters.createdFrom), dayjs(pendingFilters.createdTo)]
                  : null
              }
              onChange={dates => {
                setPendingFilters(prev => ({
                  ...prev,
                  createdFrom: dates?.[0]?.format('YYYY-MM-DD') ?? null,
                  createdTo: dates?.[1]?.format('YYYY-MM-DD') ?? null,
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
            연혁 목록 전체 <strong>{filtered.length}</strong>건
          </Text>
          <Select
            value={sort}
            style={{ width: 140 }}
            onChange={value => setSort(value)}
            options={[
              { value: 'history-desc', label: '연혁일 순' },
              { value: 'created-desc', label: '작성일 순' },
            ]}
          />
        </div>
        <Space>
          <Button onClick={handleDeleteSelected}>선택 삭제</Button>
          <Button type="primary" onClick={openCreate}>
            연혁 등록
          </Button>
        </Space>
      </div>

      <div className={styles.tableWrap}>
        <Table<HistoryItem>
          className="admin-data-table"
          rowKey="id"
          dataSource={filtered}
          columns={columns}
          pagination={false}
          scroll={{ x: 960 }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: keys => setSelectedIds(keys.map(String)),
          }}
        />
      </div>

      <HistoryFormModal
        open={modalOpen}
        mode={modalMode}
        item={editing}
        onCancel={closeModal}
        onSubmit={handleSubmit}
        onDelete={modalMode === 'edit' ? handleDeleteFromModal : undefined}
      />
    </div>
  )
}
