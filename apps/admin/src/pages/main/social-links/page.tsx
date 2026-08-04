import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Input, Space, Switch, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { SocialLink } from '@/features/main/social-link/model/types'
import { useSocialLinkStore } from '@/features/main/social-link/lib/store'
import {
  SortableDataTable,
  SortableDragHandle,
} from '@/shared/ui/sortable-data-table'
import styles from './page.module.css'

const { Text } = Typography

/**
 * 메인 > 소셜 링크 관리
 * Notion: 2. 메인 소셜 링크 관리
 */
export function SocialLinksPage() {
  const links = useSocialLinkStore(s => s.links)
  const setActive = useSocialLinkStore(s => s.setActive)
  const reorder = useSocialLinkStore(s => s.reorder)
  const saveAll = useSocialLinkStore(s => s.saveAll)

  const [editing, setEditing] = useState(false)
  const [drafts, setDrafts] = useState<SocialLink[]>(links)

  useEffect(() => {
    if (!editing) setDrafts(links)
  }, [editing, links])

  const rows = editing ? drafts : links

  const startEdit = useCallback(() => {
    setDrafts(links.map(row => ({ ...row })))
    setEditing(true)
  }, [links])

  const cancelEdit = useCallback(() => {
    setDrafts(links.map(row => ({ ...row })))
    setEditing(false)
  }, [links])

  const handleSave = useCallback(() => {
    const result = saveAll(drafts)
    if (!result.ok) {
      const names = drafts
        .filter(row => result.missingIds.includes(row.id))
        .map(row => row.name)
        .join(', ')
      message.error(`사용 중인 채널의 연결 링크는 필수입니다. (${names})`)
      return
    }
    setEditing(false)
    message.success('소셜 링크가 저장되었습니다.')
  }, [drafts, saveAll])

  const handleToggle = useCallback(
    (row: SocialLink, checked: boolean) => {
      if (editing) {
        setDrafts(prev =>
          prev.map(item => (item.id === row.id ? { ...item, active: checked } : item))
        )
        return
      }
      if (checked && !row.linkUrl.trim()) {
        message.warning('연결 링크를 먼저 저장한 뒤 사용할 수 있습니다. [수정]에서 URL을 입력해 주세요.')
        return
      }
      setActive(row.id, checked)
    },
    [editing, setActive]
  )

  const handleUrlChange = useCallback((id: SocialLink['id'], linkUrl: string) => {
    setDrafts(prev => prev.map(item => (item.id === id ? { ...item, linkUrl } : item)))
  }, [])

  const handleReorder = useCallback(
    (reordered: SocialLink[]) => {
      const ids = reordered.map(row => row.id)
      if (editing) {
        setDrafts(reordered.map((row, index) => ({ ...row, order: index })))
        return
      }
      reorder(ids)
    },
    [editing, reorder]
  )

  const columns = useMemo<ColumnsType<SocialLink>>(
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
        title: '소셜 매체명',
        dataIndex: 'name',
        width: 160,
      },
      {
        title: '연결 링크',
        dataIndex: 'linkUrl',
        render: (linkUrl: string, row) =>
          editing ? (
            <Input
              value={linkUrl}
              onChange={e => handleUrlChange(row.id, e.target.value)}
              placeholder="연결 링크를 입력하세요"
              status={row.active && !linkUrl.trim() ? 'error' : undefined}
            />
          ) : linkUrl ? (
            <a href={linkUrl} target="_blank" rel="noreferrer">
              {linkUrl}
            </a>
          ) : (
            <Text type="secondary">—</Text>
          ),
      },
    ],
    [editing, handleToggle, handleUrlChange]
  )

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Text type="secondary">
          관리 채널은 고정 항목입니다. 신규 채널 추가는 제공하지 않습니다.
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
          scrollX={900}
          onRowsReorder={handleReorder}
        />
      </div>
    </div>
  )
}
