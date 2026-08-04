import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Input, Space, Table, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { WorldwideContent, WorldwideRegion } from '@/features/ja-korea/worldwide'
import {
  cloneWorldwideContent,
  useWorldwideStore,
} from '@/features/ja-korea/worldwide'
import styles from './page.module.css'

const { Text, Paragraph, Title } = Typography
const { TextArea } = Input

/**
 * JA Korea > 기관 소개 > JA Worldwide
 * Notion: 1-3. JA Worldwide 관리
 */
export function WorldwidePage() {
  const content = useWorldwideStore(s => s.content)
  const save = useWorldwideStore(s => s.save)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<WorldwideContent>(() => cloneWorldwideContent(content))

  useEffect(() => {
    if (!editing) setDraft(cloneWorldwideContent(content))
  }, [editing, content])

  const rows = editing ? draft.regions : content.regions
  const notice = editing ? draft.notice : content.notice

  const startEdit = useCallback(() => {
    setDraft(cloneWorldwideContent(content))
    setEditing(true)
  }, [content])

  const cancelEdit = useCallback(() => {
    setDraft(cloneWorldwideContent(content))
    setEditing(false)
  }, [content])

  const handleSave = useCallback(() => {
    save(draft)
    setEditing(false)
    message.success('JA Worldwide가 저장되었습니다.')
  }, [draft, save])

  const handleUrlChange = useCallback((id: WorldwideRegion['id'], linkUrl: string) => {
    setDraft(prev => ({
      ...prev,
      regions: prev.regions.map(row => (row.id === id ? { ...row, linkUrl } : row)),
    }))
  }, [])

  const columns = useMemo<ColumnsType<WorldwideRegion>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: 64,
        align: 'center',
        render: (_v, _r, index) => index + 1,
      },
      {
        title: '국가·지역명',
        dataIndex: 'name',
        width: 200,
        render: (name: string) => <Text>{name}</Text>,
      },
      {
        title: '연결 링크',
        dataIndex: 'linkUrl',
        render: (linkUrl: string, row) =>
          editing ? (
            <Input
              value={linkUrl}
              onChange={e => handleUrlChange(row.id, e.target.value)}
              placeholder="연결 링크(URL)를 입력하세요"
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
    [editing, handleUrlChange]
  )

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Text type="secondary">
          국가·지역명은 고정 항목입니다. 연결 링크와 하단 안내 문구만 수정할 수 있습니다.
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
        <Table<WorldwideRegion>
          className="admin-data-table"
          rowKey="id"
          dataSource={rows}
          columns={columns}
          pagination={false}
        />
      </div>

      <section className={styles.noticeCard}>
        <Title level={5} className={styles.noticeTitle}>
          안내 문구
        </Title>
        {editing ? (
          <TextArea
            value={notice}
            rows={4}
            onChange={e => setDraft(prev => ({ ...prev, notice: e.target.value }))}
            placeholder="하단 안내 문구를 입력하세요"
          />
        ) : (
          <Paragraph className={styles.preline}>{notice.trim() ? notice : '—'}</Paragraph>
        )}
      </section>
    </div>
  )
}
