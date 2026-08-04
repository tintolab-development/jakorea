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
import type { AwardDraft, AwardFilters, AwardItem, AwardSort } from '@/features/ja-korea/award'
import {
  AwardFormModal,
  filterAwardItems,
  sortAwardItems,
  useAwardStore,
} from '@/features/ja-korea/award'
import styles from './page.module.css'

const { Text } = Typography
const { RangePicker } = DatePicker

const INITIAL_FILTERS: AwardFilters = {
  visibility: 'all',
  title: '',
  organization: '',
  awardedFrom: null,
  awardedTo: null,
  createdFrom: null,
  createdTo: null,
}

function formatDateTime(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DD HH:mm')
}

/**
 * JA Korea > 기관 소개 > 수상
 * Notion: 1-5. 연혁·수상·인증 관리_수상
 */
export function AwardsPage() {
  const items = useAwardStore(s => s.items)
  const create = useAwardStore(s => s.create)
  const update = useAwardStore(s => s.update)
  const remove = useAwardStore(s => s.remove)
  const setVisibility = useAwardStore(s => s.setVisibility)

  const [pendingFilters, setPendingFilters] = useState<AwardFilters>(INITIAL_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<AwardFilters>(INITIAL_FILTERS)
  const [sort, setSort] = useState<AwardSort>('awarded-desc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<AwardItem | null>(null)

  const filtered = useMemo(() => {
    const matched = filterAwardItems(items, appliedFilters)
    return sortAwardItems(matched, sort)
  }, [appliedFilters, items, sort])

  const openCreate = useCallback(() => {
    setModalMode('create')
    setEditing(null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((row: AwardItem) => {
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
    (draft: AwardDraft) => {
      if (modalMode === 'create') {
        create(draft)
        message.success('수상이 등록되었습니다.')
      } else if (editing) {
        update(editing.id, draft)
        message.success('수상이 수정되었습니다.')
      }
      closeModal()
    },
    [closeModal, create, editing, modalMode, update]
  )

  const handleDeleteFromModal = useCallback(() => {
    if (!editing) return
    Modal.confirm({
      title: '수상 삭제',
      content: `"${editing.title}" 수상 정보를 삭제하시겠습니까?`,
      okText: '삭제',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: () => {
        remove([editing.id])
        setSelectedIds(prev => prev.filter(id => id !== editing.id))
        closeModal()
        message.success('수상이 삭제되었습니다.')
      },
    })
  }, [closeModal, editing, remove])

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) {
      message.warning('삭제할 수상을 선택해 주세요.')
      return
    }
    Modal.confirm({
      title: '선택 삭제',
      content: `선택한 수상 ${selectedIds.length}건을 삭제하시겠습니까?`,
      okText: '삭제',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: () => {
        remove(selectedIds)
        setSelectedIds([])
        message.success('선택한 수상이 삭제되었습니다.')
      },
    })
  }, [remove, selectedIds])

  const columns = useMemo<ColumnsType<AwardItem>>(
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
        render: (visibility: AwardItem['visibility'], row) => (
          <Switch
            checked={visibility === 'public'}
            checkedChildren="공개"
            unCheckedChildren="비공개"
            onChange={checked => setVisibility(row.id, checked ? 'public' : 'private')}
          />
        ),
      },
      {
        title: '상명',
        dataIndex: 'title',
        ellipsis: true,
      },
      {
        title: '수여 기관명',
        dataIndex: 'organization',
        width: 180,
        ellipsis: true,
      },
      {
        title: '수상일',
        dataIndex: 'awardedOn',
        width: 120,
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
            <span>상명</span>
            <Input
              value={pendingFilters.title}
              onChange={e => setPendingFilters(prev => ({ ...prev, title: e.target.value }))}
              placeholder="상명을 입력하세요"
              allowClear
              onPressEnter={handleSearch}
            />
          </label>
          <label className={styles.filterField}>
            <span>수여 기관명</span>
            <Input
              value={pendingFilters.organization}
              onChange={e =>
                setPendingFilters(prev => ({ ...prev, organization: e.target.value }))
              }
              placeholder="수여 기관명을 입력하세요"
              allowClear
              onPressEnter={handleSearch}
            />
          </label>
          <label className={styles.filterField}>
            <span>수상일</span>
            <RangePicker
              value={
                pendingFilters.awardedFrom && pendingFilters.awardedTo
                  ? [dayjs(pendingFilters.awardedFrom), dayjs(pendingFilters.awardedTo)]
                  : null
              }
              onChange={dates => {
                setPendingFilters(prev => ({
                  ...prev,
                  awardedFrom: dates?.[0]?.format('YYYY-MM-DD') ?? null,
                  awardedTo: dates?.[1]?.format('YYYY-MM-DD') ?? null,
                }))
              }}
              style={{ width: '100%' }}
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
            수상 목록 전체 <strong>{filtered.length}</strong>건
          </Text>
          <Select
            value={sort}
            style={{ width: 140 }}
            onChange={value => setSort(value)}
            options={[
              { value: 'awarded-desc', label: '수상일 순' },
              { value: 'created-desc', label: '작성일 순' },
            ]}
          />
        </div>
        <Space>
          <Button onClick={handleDeleteSelected}>선택 삭제</Button>
          <Button type="primary" onClick={openCreate}>
            수상 등록
          </Button>
        </Space>
      </div>

      <div className={styles.tableWrap}>
        <Table<AwardItem>
          className="admin-data-table"
          rowKey="id"
          dataSource={filtered}
          columns={columns}
          pagination={false}
          scroll={{ x: 1000 }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: keys => setSelectedIds(keys.map(String)),
          }}
        />
      </div>

      <AwardFormModal
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
