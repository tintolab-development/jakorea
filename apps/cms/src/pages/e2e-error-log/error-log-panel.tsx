/**
 * E2E 로깅 — 에러 로깅 탭 (기존 백엔드 에러 Mock 뷰)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import { e2eErrorLogMockApi } from '@/features/e2e-error-log/api/e2e-error-log-mock-api'
import {
  buildE2eErrorLogMdFilename,
  formatE2eErrorLogMarkdown,
} from '@/features/e2e-error-log/lib/format-e2e-error-log-markdown'
import type { E2eErrorLogEntry } from '@/features/e2e-error-log/model/types'

const PAGE_CHUNK = 30
const TABLE_BODY_MIN_Y = 240
const TABLE_CHROME_PX = 55

function downloadMarkdownFile(markdown: string, filename: string) {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

type Props = {
  active: boolean
}

export function E2eErrorLogPanel({ active }: Props) {
  const [items, setItems] = useState<E2eErrorLogEntry[]>([])
  const [byErrorCode, setByErrorCode] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_CHUNK)
  const [tableScrollY, setTableScrollY] = useState(420)
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'warning' | 'error'
    text: string
  } | null>(null)
  const tableWrapRef = useRef<HTMLDivElement>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const res = await e2eErrorLogMockApi.list()
      setItems(res.data.items)
      setByErrorCode(res.data.byErrorCode)
      setVisibleCount(prev => {
        const total = res.data.items.length
        if (total === 0) return PAGE_CHUNK
        return Math.min(Math.max(prev, PAGE_CHUNK), total)
      })
    } catch {
      setStatusBanner({ type: 'error', text: '로그를 불러오지 못했습니다.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!active) return
    void reload()
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'cms.jakorea.e2eErrorLogs.v1') {
        void reload()
      }
    }
    window.addEventListener('storage', onStorage)
    const timer = window.setInterval(() => {
      void reload()
    }, 3_000)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.clearInterval(timer)
    }
  }, [active, reload])

  useEffect(() => {
    if (!active) return
    const el = tableWrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const measure = () => {
      const next = Math.max(TABLE_BODY_MIN_Y, el.clientHeight - TABLE_CHROME_PX)
      setTableScrollY(next)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [active])

  const codeSummaries = useMemo(
    () =>
      Object.entries(byErrorCode)
        .map(([errorCode, count]) => ({ errorCode, count }))
        .sort((a, b) => b.count - a.count || a.errorCode.localeCompare(b.errorCode)),
    [byErrorCode]
  )

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount])
  const hasMore = visibleCount < items.length
  const loadingMoreRef = useRef(false)

  useEffect(() => {
    if (!active) return
    const body = tableWrapRef.current?.querySelector('.ant-table-body')
    if (!(body instanceof HTMLElement)) return

    const onScroll = () => {
      if (!hasMore || loadingMoreRef.current) return
      const remaining = body.scrollHeight - body.scrollTop - body.clientHeight
      if (remaining > 80) return
      loadingMoreRef.current = true
      setVisibleCount(prev => Math.min(prev + PAGE_CHUNK, items.length))
      window.requestAnimationFrame(() => {
        loadingMoreRef.current = false
      })
    }

    body.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => body.removeEventListener('scroll', onScroll)
  }, [active, hasMore, items.length, visibleItems.length])

  const handleClear = async () => {
    const res = await e2eErrorLogMockApi.clear()
    setStatusBanner({ type: 'success', text: `${res.data.cleared}건 삭제` })
    setVisibleCount(PAGE_CHUNK)
    await reload()
  }

  const handleDownloadMd = () => {
    if (items.length === 0) {
      setStatusBanner({ type: 'warning', text: '다운로드할 로그가 없습니다.' })
      return
    }
    const markdown = formatE2eErrorLogMarkdown(items)
    const filename = buildE2eErrorLogMdFilename()
    downloadMarkdownFile(markdown, filename)
    setStatusBanner({
      type: 'success',
      text: `${items.length}건 Markdown 다운로드 (${filename})`,
    })
  }

  const columns: ColumnsType<E2eErrorLogEntry> = [
    {
      title: '발생 시각',
      dataIndex: 'occurredAt',
      width: 148,
      ellipsis: true,
      render: (value: string) => {
        try {
          const d = new Date(value)
          const label = d.toLocaleString('ko-KR', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })
          return <span title={d.toLocaleString('ko-KR')}>{label}</span>
        } catch {
          return value
        }
      },
    },
    {
      title: '상황',
      dataIndex: 'situation',
      ellipsis: { showTitle: true },
    },
    {
      title: '에러 코드',
      dataIndex: 'errorCode',
      width: 148,
      ellipsis: true,
      render: (code: string) => (
        <Tag color="error" className="e2e-error-log-page__code-tag" title={code}>
          {code}
        </Tag>
      ),
    },
    {
      title: 'HTTP',
      dataIndex: 'httpStatus',
      width: 64,
      align: 'center',
      render: (status: number | null) => status ?? '—',
    },
    {
      title: '요청',
      key: 'request',
      ellipsis: { showTitle: false },
      render: (_, row) => {
        const full = `${row.method} ${row.requestPath}`
        const pathOnly = row.requestPath.split('?')[0] || row.requestPath
        const short = `${row.method} ${pathOnly}`
        return (
          <span className="e2e-error-log-page__mono" title={full}>
            {short}
          </span>
        )
      },
    },
    {
      title: '메시지',
      dataIndex: 'message',
      ellipsis: { showTitle: true },
    },
    {
      title: 'traceId',
      dataIndex: 'traceId',
      width: 120,
      ellipsis: true,
      render: (value?: string) => {
        if (!value) return '—'
        const short = value.length > 12 ? `${value.slice(0, 10)}…` : value
        return (
          <span className="e2e-error-log-page__mono" title={value}>
            {short}
          </span>
        )
      },
    },
  ]

  return (
    <div className="e2e-error-log-page__panel">
      <div className="e2e-error-log-page__panel-toolbar">
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0, flex: 1 }}>
          DEV Mock API(<code>/__dev__/e2e-error-logs</code>)에 상황·에러 코드를 기록합니다.
          Playwright E2E와 이 페이지가 <strong>같은 디스크 스토어</strong>를 공유합니다.
        </Typography.Paragraph>
        <Space wrap>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadMd}
            disabled={items.length === 0}
          >
            MD 다운로드
          </Button>
          <Button onClick={() => void reload()} loading={loading}>
            새로고침
          </Button>
          <Button danger onClick={() => void handleClear()} disabled={items.length === 0}>
            전체 삭제
          </Button>
        </Space>
      </div>

      {statusBanner ? (
        <Alert
          type={statusBanner.type}
          showIcon
          closable
          onClose={() => setStatusBanner(null)}
          style={{ marginBottom: 12 }}
          description={statusBanner.text}
        />
      ) : null}

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        description={
          <>
            <Typography.Text strong>기록 조건</Typography.Text>
            <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
              <li>
                DEV에서 axios 백엔드 에러(4xx/5xx)가 나면 자동 기록됩니다 (
                <code>test-results/e2e-error-log-store.json</code>).
              </li>
              <li>
                Playwright E2E 실패 시에도 같은 스토어에 남으므로, 테스트 후 이 탭을 새로고침하면
                <code>DATABASE_ERROR</code> 등을 확인할 수 있습니다.
              </li>
            </ul>
          </>
        }
      />

      <section className="e2e-error-log-page__summary" aria-label="에러 코드별 건수">
        <Typography.Text strong>에러 코드별 건수</Typography.Text>
        <div className="e2e-error-log-page__chips">
          {codeSummaries.length === 0 ? (
            <Typography.Text type="secondary">아직 기록된 에러가 없습니다.</Typography.Text>
          ) : (
            codeSummaries.map(row => (
              <Tag key={row.errorCode} color="volcano">
                {row.errorCode} × {row.count}
              </Tag>
            ))
          )}
        </div>
      </section>

      <div className="e2e-error-log-page__list-meta" aria-live="polite">
        <Typography.Text type="secondary">
          {items.length === 0
            ? '0건'
            : `${Math.min(visibleCount, items.length)} / ${items.length}건 표시`}
          {hasMore ? ' · 스크롤하면 더 불러옵니다' : items.length > 0 ? ' · 전체 로드됨' : null}
        </Typography.Text>
      </div>

      <div ref={tableWrapRef} className="e2e-error-log-page__table-wrap">
        <Table
          className="e2e-error-log-page__table"
          rowKey="id"
          size="middle"
          loading={loading && items.length === 0}
          columns={columns}
          dataSource={visibleItems}
          pagination={false}
          scroll={{ y: tableScrollY }}
          tableLayout="fixed"
          expandable={{
            columnWidth: 48,
            expandedRowRender: row => (
              <div className="e2e-error-log-page__detail">
                <div>
                  <Typography.Text type="secondary">상황</Typography.Text>
                  <pre>{row.situation}</pre>
                </div>
                <div>
                  <Typography.Text type="secondary">요청</Typography.Text>
                  <pre>{`${row.method} ${row.requestPath}`}</pre>
                </div>
                <div>
                  <Typography.Text type="secondary">메시지</Typography.Text>
                  <pre>{row.message || '—'}</pre>
                </div>
                {row.traceId ? (
                  <div>
                    <Typography.Text type="secondary">traceId</Typography.Text>
                    <pre>{row.traceId}</pre>
                  </div>
                ) : null}
                <div>
                  <Typography.Text type="secondary">route</Typography.Text>
                  <pre>{row.route || '—'}</pre>
                </div>
                {row.requestBodyPreview ? (
                  <div>
                    <Typography.Text type="secondary">request body</Typography.Text>
                    <pre>{row.requestBodyPreview}</pre>
                  </div>
                ) : null}
                {row.responseBodyPreview ? (
                  <div>
                    <Typography.Text type="secondary">response body</Typography.Text>
                    <pre>{row.responseBodyPreview}</pre>
                  </div>
                ) : null}
              </div>
            ),
          }}
          locale={{ emptyText: '기록된 백엔드 에러가 없습니다.' }}
        />
      </div>
    </div>
  )
}
