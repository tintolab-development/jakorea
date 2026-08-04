import { useCallback, useMemo, useState } from 'react'
import { Button, Modal, Space, Switch, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { HeroBanner, HeroBannerDraft } from '@/features/main/hero-banner/model/types'
import { useHeroBannerStore } from '@/features/main/hero-banner/lib/store'
import { HeroBannerFormModal } from '@/features/main/hero-banner/ui/form-modal'
import {
  HeroBannerDragHandle,
  HeroBannerSortableTable,
} from '@/features/main/hero-banner/ui/sortable-table'
import styles from './page.module.css'

const { Text } = Typography

/**
 * 메인 > 히어로 배너 관리
 * Notion: 1-1 목록 / 1-2 등록·수정 팝업
 */
export function HeroBannersPage() {
  const banners = useHeroBannerStore(s => s.banners)
  const create = useHeroBannerStore(s => s.create)
  const update = useHeroBannerStore(s => s.update)
  const remove = useHeroBannerStore(s => s.remove)
  const setActive = useHeroBannerStore(s => s.setActive)
  const reorder = useHeroBannerStore(s => s.reorder)

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<HeroBanner | null>(null)

  const openCreate = useCallback(() => {
    setModalMode('create')
    setEditing(null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((row: HeroBanner) => {
    setModalMode('edit')
    setEditing(row)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditing(null)
  }, [])

  const handleSubmit = useCallback(
    (draft: HeroBannerDraft) => {
      if (modalMode === 'create') {
        create(draft)
        message.success('배너가 등록되었습니다.')
      } else if (editing) {
        update(editing.id, draft)
        message.success('배너가 수정되었습니다.')
      }
      closeModal()
    },
    [closeModal, create, editing, modalMode, update]
  )

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) {
      message.warning('삭제할 배너를 선택해 주세요.')
      return
    }
    Modal.confirm({
      title: '선택 삭제',
      content: `선택한 배너 ${selectedIds.length}건을 삭제하시겠습니까?`,
      okText: '삭제',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: () => {
        remove(selectedIds)
        setSelectedIds([])
        message.success('선택한 배너가 삭제되었습니다.')
      },
    })
  }, [remove, selectedIds])

  const handleReorder = useCallback(
    (rows: HeroBanner[]) => {
      reorder(rows.map(row => row.id))
    },
    [reorder]
  )

  const columns = useMemo<ColumnsType<HeroBanner>>(
    () => [
      {
        title: '순서',
        key: 'sort',
        width: 56,
        align: 'center',
        render: () => <HeroBannerDragHandle />,
      },
      {
        title: 'No.',
        key: 'no',
        width: 64,
        align: 'center',
        render: (_value, _row, index) => index + 1,
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
            onChange={checked => setActive(row.id, checked)}
          />
        ),
      },
      {
        title: '배너 이미지',
        dataIndex: 'imageUrl',
        width: 140,
        render: (url: string, row) => (
          <img
            src={url}
            alt={row.imageName ?? '배너'}
            className={styles.thumb}
          />
        ),
      },
      {
        title: '배너 텍스트',
        key: 'texts',
        render: (_value, row) => (
          <div className={styles.textCell}>
            <div className={styles.textRow}>
              <Text type="secondary" className={styles.textLabel}>
                상단
              </Text>
              <span>{row.topText || '—'}</span>
            </div>
            <div className={styles.textRow}>
              <Text type="secondary" className={styles.textLabel}>
                타이틀
              </Text>
              <span>{row.mainTitle || '—'}</span>
            </div>
            <div className={styles.textRow}>
              <Text type="secondary" className={styles.textLabel}>
                하단
              </Text>
              <span>{row.bottomText || '—'}</span>
            </div>
            <div className={styles.textRow}>
              <Text type="secondary" className={styles.textLabel}>
                링크
              </Text>
              {row.linkUrl ? (
                <a href={row.linkUrl} target="_blank" rel="noreferrer">
                  {row.linkUrl}
                </a>
              ) : (
                <span>—</span>
              )}
            </div>
          </div>
        ),
      },
      {
        title: '관리',
        key: 'actions',
        width: 100,
        align: 'center',
        fixed: 'right',
        render: (_value, row) => (
          <Button type="link" onClick={() => openEdit(row)}>
            수정
          </Button>
        ),
      },
    ],
    [openEdit, setActive]
  )

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Text className={styles.count}>
          전체 <strong>{banners.length}</strong>건
        </Text>
        <Space>
          <Button onClick={handleDeleteSelected}>선택 삭제</Button>
          <Button type="primary" onClick={openCreate}>
            배너 등록
          </Button>
        </Space>
      </div>

      <div className={styles.tableWrap}>
        <HeroBannerSortableTable
          rows={banners}
          columns={columns}
          onRowsReorder={handleReorder}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: keys => setSelectedIds(keys.map(String)),
          }}
        />
      </div>

      <HeroBannerFormModal
        open={modalOpen}
        mode={modalMode}
        banner={editing}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
