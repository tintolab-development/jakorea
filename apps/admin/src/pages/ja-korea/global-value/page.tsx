import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Input, Space, Switch, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { GlobalValueItem } from '@/features/ja-korea/global-value'
import {
  GlobalValueFixedIcon,
  useGlobalValueStore,
} from '@/features/ja-korea/global-value'
import {
  SortableDataTable,
  SortableDragHandle,
} from '@/shared/ui/sortable-data-table'
import styles from './page.module.css'

const { Text, Paragraph } = Typography
const { TextArea } = Input

/**
 * JA Korea > 기관 소개 > JA Global Value
 * Notion: 1-2. JA Global Value 관리
 */
export function GlobalValuePage() {
  const items = useGlobalValueStore(s => s.items)
  const setActive = useGlobalValueStore(s => s.setActive)
  const reorder = useGlobalValueStore(s => s.reorder)
  const saveAll = useGlobalValueStore(s => s.saveAll)

  const [editing, setEditing] = useState(false)
  const [drafts, setDrafts] = useState<GlobalValueItem[]>(items)

  useEffect(() => {
    if (!editing) setDrafts(items.map(row => ({ ...row })))
  }, [editing, items])

  const rows = editing ? drafts : items

  const startEdit = useCallback(() => {
    setDrafts(items.map(row => ({ ...row })))
    setEditing(true)
  }, [items])

  const cancelEdit = useCallback(() => {
    setDrafts(items.map(row => ({ ...row })))
    setEditing(false)
  }, [items])

  const handleSave = useCallback(() => {
    const empty = drafts.find(row => !row.mainText.trim())
    if (empty) {
      message.error('메인 텍스트를 입력해 주세요.')
      return
    }
    saveAll(drafts)
    setEditing(false)
    message.success('JA Global Value가 저장되었습니다.')
  }, [drafts, saveAll])

  const handleToggle = useCallback(
    (row: GlobalValueItem, checked: boolean) => {
      if (editing) {
        setDrafts(prev =>
          prev.map(item => (item.id === row.id ? { ...item, active: checked } : item))
        )
        return
      }
      setActive(row.id, checked)
    },
    [editing, setActive]
  )

  const handleTextChange = useCallback(
    (id: GlobalValueItem['id'], field: 'mainText' | 'subText', value: string) => {
      setDrafts(prev =>
        prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
      )
    },
    []
  )

  const handleReorder = useCallback(
    (reordered: GlobalValueItem[]) => {
      const ids = reordered.map(row => row.id)
      if (editing) {
        setDrafts(reordered.map((row, index) => ({ ...row, order: index })))
        return
      }
      reorder(ids)
    },
    [editing, reorder]
  )

  const columns = useMemo<ColumnsType<GlobalValueItem>>(
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
            onChange={checked => handleToggle(row, checked)}
          />
        ),
      },
      {
        title: '아이콘',
        dataIndex: 'iconKey',
        width: 88,
        align: 'center',
        render: (iconKey: GlobalValueItem['iconKey']) => (
          <GlobalValueFixedIcon iconKey={iconKey} />
        ),
      },
      {
        title: '메인 텍스트',
        dataIndex: 'mainText',
        width: 220,
        render: (mainText: string, row) =>
          editing ? (
            <TextArea
              value={mainText}
              rows={2}
              onChange={e => handleTextChange(row.id, 'mainText', e.target.value)}
              placeholder="메인 텍스트를 입력하세요"
            />
          ) : (
            <Paragraph className={styles.preline}>{mainText || '—'}</Paragraph>
          ),
      },
      {
        title: '서브 텍스트',
        dataIndex: 'subText',
        render: (subText: string, row) =>
          editing ? (
            <TextArea
              value={subText}
              rows={3}
              onChange={e => handleTextChange(row.id, 'subText', e.target.value)}
              placeholder="서브 텍스트를 입력하세요"
            />
          ) : (
            <Paragraph className={styles.preline}>{subText || '—'}</Paragraph>
          ),
      },
    ],
    [editing, handleTextChange, handleToggle]
  )

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Text type="secondary">
          가치 항목은 5개로 고정됩니다. 아이콘은 수정·삭제할 수 없습니다.
        </Text>
        {editing ? (
          <Space>
            <Button onClick={cancelEdit}>취소</Button>
            <Button type="primary" onClick={handleSave}>
              저장
            </Button>
          </Space>
        ) : (
          <Button type="primary" onClick={startEdit}>
            수정
          </Button>
        )}
      </div>

      <div className={styles.tableWrap}>
        <SortableDataTable
          rows={rows}
          columns={columns}
          scrollX={960}
          onRowsReorder={handleReorder}
        />
      </div>
    </div>
  )
}
