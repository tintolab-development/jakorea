/**
 * E2E 로깅 — 테스트 진행 탭
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { e2eTestLogMockApi } from '@/features/e2e-test-log/api/e2e-test-log-mock-api'
import type { E2eTestLogEntry } from '@/features/e2e-test-log/model/types'
import { CopyablePre } from './copyable-pre'

const PAGE_CHUNK = 40
const TABLE_BODY_MIN_Y = 240
const TABLE_CHROME_PX = 55

function statusColor(status: string): string {
  switch (status) {
    case 'passed':
      return 'success'
    case 'failed':
    case 'timedOut':
    case 'interrupted':
      return 'error'
    case 'skipped':
      return 'default'
    case 'started':
      return 'processing'
    case 'api':
      return 'blue'
    case 'note':
      return 'gold'
    default:
      return 'default'
  }
}

function formatDuration(ms?: number) {
  if (ms == null || !Number.isFinite(ms)) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatTime(value: string) {
  try {
    const d = new Date(value)
    return d.toLocaleString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return value
  }
}

type Props = {
  active: boolean
}

export function E2eTestLogPanel({ active }: Props) {
  const [items, setItems] = useState<E2eTestLogEntry[]>([])
  const [byStatus, setByStatus] = useState<Record<string, number>>({})
  const [summary, setSummary] = useState<
    Awaited<ReturnType<typeof e2eTestLogMockApi.list>>['data']['summary'] | null
  >(null)
  const [loading, setLoading] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_CHUNK)
  const [tableScrollY, setTableScrollY] = useState(420)
  const [banner, setBanner] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(
    null
  )
  const tableWrapRef = useRef<HTMLDivElement>(null)

  const reload = useCallback(async (options?: { showLoading?: boolean }) => {
    const showLoading = options?.showLoading === true
    if (showLoading) setLoading(true)
    try {
      const res = await e2eTestLogMockApi.list()
      setItems(res.data.items)
      setByStatus(res.data.byStatus)
      setSummary(res.data.summary)
      setVisibleCount(prev => {
        const total = res.data.items.length
        if (total === 0) return PAGE_CHUNK
        return Math.min(Math.max(prev, PAGE_CHUNK), total)
      })
    } catch {
      setBanner({ type: 'error', text: '테스트 로그를 불러오지 못했습니다.' })
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!active) return
    // 탭 전환·폴링은 버튼 loading 을 켜지 않음 (너비 시프트 방지)
    void reload()
    const timer = window.setInterval(() => {
      void reload()
    }, 3_000)
    return () => window.clearInterval(timer)
  }, [active, reload])

  useEffect(() => {
    if (!active) return
    const el = tableWrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      setTableScrollY(Math.max(TABLE_BODY_MIN_Y, el.clientHeight - TABLE_CHROME_PX))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [active])

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
    const res = await e2eTestLogMockApi.clear()
    setBanner({ type: 'success', text: `${res.data.cleared}건 삭제` })
    setVisibleCount(PAGE_CHUNK)
    await reload({ showLoading: true })
  }

  const statusChips = useMemo(
    () =>
      Object.entries(byStatus)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status)),
    [byStatus]
  )

  const columns: ColumnsType<E2eTestLogEntry> = [
    {
      title: '시각',
      dataIndex: 'occurredAt',
      width: 132,
      ellipsis: true,
      render: (value: string) => <span title={value}>{formatTime(value)}</span>,
    },
    {
      title: '상태',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag>,
    },
    {
      title: '테스트 / 단계',
      key: 'titlePhase',
      ellipsis: { showTitle: true },
      render: (_, row) => (
        <span title={row.title}>
          {row.phase ? <Tag>{row.phase}</Tag> : null}
          {row.title}
        </span>
      ),
    },
    {
      title: '요청',
      key: 'request',
      width: 220,
      ellipsis: true,
      render: (_, row) => {
        if (!row.method && !row.requestPath) return '—'
        const full = `${row.method ?? ''} ${row.requestPath ?? ''}`.trim()
        return (
          <span className="e2e-error-log-page__mono" title={full}>
            {full}
          </span>
        )
      },
    },
    {
      title: 'HTTP',
      dataIndex: 'httpStatus',
      width: 64,
      align: 'center',
      render: (v: number | null | undefined) => v ?? '—',
    },
    {
      title: '소요',
      dataIndex: 'durationMs',
      width: 72,
      render: (v?: number) => formatDuration(v),
    },
    {
      title: 'payload',
      key: 'payload',
      width: 88,
      align: 'center',
      render: (_, row) =>
        row.requestPayload ? (
          <Tag color="geekblue">있음</Tag>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
  ]

  return (
    <div className="e2e-error-log-page__panel">
      <div className="e2e-error-log-page__panel-toolbar">
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0, flex: 1 }}>
          DEV Mock API(<code>/__dev__/e2e-test-logs</code>) · Playwright가 테스트 시작/종료·mutation
          POST payload·지표·수정 시 변경/미수정 필드 note를 기록합니다.
        </Typography.Paragraph>
        <Space wrap>
          <Button
            className="e2e-error-log-page__refresh-btn"
            onClick={() => void reload({ showLoading: true })}
            loading={loading}
          >
            새로고침
          </Button>
          <Button danger onClick={() => void handleClear()} disabled={items.length === 0}>
            전체 삭제
          </Button>
        </Space>
      </div>

      {banner ? (
        <Alert
          type={banner.type}
          showIcon
          closable
          onClose={() => setBanner(null)}
          style={{ marginBottom: 12 }}
          description={banner.text}
        />
      ) : null}

      <section className="e2e-error-log-page__summary" aria-label="테스트 진행 요약">
        <Typography.Text strong>진행 현황</Typography.Text>
        <div className="e2e-error-log-page__chips e2e-error-log-page__chips--single-line">
          {summary ? (
            <>
              <Tag color="default">실행 {summary.runCount}</Tag>
              <Tag color="success">통과 {summary.passed}</Tag>
              <Tag color="error">실패 {summary.failed}</Tag>
              <Tag>스킵 {summary.skipped}</Tag>
              <Tag color="blue">
                평균 소요 {summary.avgDurationMs != null ? formatDuration(summary.avgDurationMs) : '—'}
              </Tag>
              <Tag color="cyan">API 호출 {summary.apiCallTotal}</Tag>
              <Tag color="geekblue">mutation {summary.mutationTotal}</Tag>
            </>
          ) : (
            <Typography.Text type="secondary">요약 없음</Typography.Text>
          )}
          {statusChips.map(row => (
            <Tag key={row.status} color={statusColor(row.status)}>
              {row.status} × {row.count}
            </Tag>
          ))}
        </div>
      </section>

      <div className="e2e-error-log-page__list-meta">
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
                <CopyablePre label="테스트" text={row.title} />
                {row.phase ? <CopyablePre label="단계" text={row.phase} /> : null}
                {row.message ? <CopyablePre label="메시지" text={row.message} /> : null}
                {row.method || row.requestPath ? (
                  <CopyablePre
                    label="요청"
                    text={`${row.method ?? ''} ${row.requestPath ?? ''}`.trim()}
                  />
                ) : null}
                {row.requestPayload ? (
                  <CopyablePre
                    label={row.status === 'note' ? '상세' : 'request payload'}
                    text={row.requestPayload}
                  />
                ) : null}
                {row.responsePreview ? (
                  <CopyablePre label="response" text={row.responsePreview} />
                ) : null}
                {row.metrics ? (
                  <CopyablePre label="지표" text={JSON.stringify(row.metrics, null, 2)} />
                ) : null}
                {row.errorMessage ? <CopyablePre label="에러" text={row.errorMessage} /> : null}
                {row.file ? <CopyablePre label="파일" text={row.file} /> : null}
              </div>
            ),
          }}
          locale={{ emptyText: '기록된 테스트 진행 로그가 없습니다. E2E를 실행해 보세요.' }}
        />
      </div>
    </div>
  )
}
