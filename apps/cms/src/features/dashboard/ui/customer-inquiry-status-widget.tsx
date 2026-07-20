/**
 * 프로그램 별 문의 현황 위젯
 * 프로그램별 답변 대기 / 답변 완료 / 전체 건수를 테이블로 표시
 */

import { Card, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingButton } from '@/shared/ui'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import { DashboardWidgetQueryError } from './dashboard-widget-query-error'
import { useDashboardSettingsStore } from '../model/dashboard-settings-store'
import { useProgramInquiryStatusList } from '../hooks/use-program-inquiry-status-list'
import type { ProgramInquiryRow } from '../api/adapters/dashboard-adapters'
import '@/shared/ui/widget-more-button.css'
import './dashboard-widget-table.css'

const { Text } = Typography

/** 게시글 관리 · 문의내역 — `inq_prog`로 프로그램명 필터(부분 일치) */
const ADMIN_POSTS_INQUIRIES_PATH = '/admin/posts/inquiries'

const WIDGET_KEY = 'customer-inquiry-status-widget'
const EMPTY_IDS: string[] = []

export function CustomerInquiryStatusWidget() {
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)
  const [halfColumn, setHalfColumn] = useState(false)
  const allowedProgramIds =
    useDashboardSettingsStore(s => s.widgetProgramIds[WIDGET_KEY]) ?? EMPTY_IDS
  const inquiryNotificationReadProgramKeys =
    useDashboardSettingsStore(s => s.inquiryNotificationReadProgramKeys) ?? {}

  const { data = [], isLoading: loading, isError } = useProgramInquiryStatusList(allowedProgramIds)

  const totalCount = data.length
  const equalWidth = halfColumn ? '25%' : undefined

  useLayoutEffect(() => {
    const root = cardRef.current
    if (!root) {
      setHalfColumn(false)
      return
    }
    const slot = root.closest('.dashboard-widget-slot')
    if (!slot) {
      setHalfColumn(false)
      return
    }
    const sync = () => setHalfColumn(slot.getAttribute('data-col-span') === '12')
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(slot, { attributes: true, attributeFilter: ['data-col-span'] })
    return () => mo.disconnect()
  }, [])

  const goToInquiryListForProgram = useCallback(
    (record: ProgramInquiryRow) => {
      const search = new URLSearchParams()
      search.set('inq_prog', record.programName)
      navigate(`${ADMIN_POSTS_INQUIRIES_PATH}?${search.toString()}`)
    },
    [navigate]
  )

  const handleMoreClick = useCallback(() => {
    navigate(ADMIN_POSTS_INQUIRIES_PATH)
  }, [navigate])

  const columns: ColumnsType<ProgramInquiryRow> = useMemo(
    () => [
      {
        title: '프로그램명',
        dataIndex: 'programName',
        key: 'programName',
        ellipsis: true,
        width: equalWidth ?? '50%',
        align: 'center',
        render: (value: string) => (
          <span className="dashboard-widget-table__program-name" title={value}>
            {value}
          </span>
        ),
      },
      {
        title: '답변 대기',
        dataIndex: 'pending',
        key: 'pending',
        width: equalWidth ?? '17%',
        align: 'center',
        render: (value: number, record: ProgramInquiryRow) =>
          value > 0 ? (
            <span className="dashboard-widget-table__pending-btn" role="presentation">
              <span className="dashboard-widget-table__pending-inner">
                <span className="dashboard-widget-table__pending-text">{value}건</span>
                {!inquiryNotificationReadProgramKeys[record.key] && (
                  <span className="dashboard-widget-table__pending-dot" aria-hidden />
                )}
              </span>
            </span>
          ) : (
            <span className="dashboard-widget-table__count--muted">0건</span>
          ),
      },
      {
        title: '답변 완료',
        dataIndex: 'answered',
        key: 'answered',
        width: equalWidth ?? '17%',
        align: 'center',
        render: (value: number) => (
          <span className="dashboard-widget-table__count--muted">{value}건</span>
        ),
      },
      {
        title: '전체',
        dataIndex: 'total',
        key: 'total',
        width: equalWidth ?? '16%',
        align: 'center',
        render: (value: number) => (
          <span className="dashboard-widget-table__count--muted">{value}건</span>
        ),
      },
    ],
    [equalWidth, inquiryNotificationReadProgramKeys]
  )

  return (
    <Card
      ref={cardRef}
      className="dashboard-widget-table dashboard-widget-table--customer-inquiry"
      title={
        <WidgetTitleWithHandle>
          <span className="widget-card-title">프로그램 별 문의 현황</span>
          <Text type="secondary" className="dashboard-widget-table__header-total-count">
            총 {totalCount}건
          </Text>
        </WidgetTitleWithHandle>
      }
      extra={
        <LoadingButton type="link" size="small" onClick={handleMoreClick} className="widget-more-button">
          더보기
        </LoadingButton>
      }
    >
      {isError ? (
        <DashboardWidgetQueryError />
      ) : (
        <Table<ProgramInquiryRow>
          columns={columns}
          dataSource={data}
          rowKey="key"
          pagination={false}
          loading={loading}
          className="dashboard-widget-table__data"
          onRow={record => ({
            onClick: () => goToInquiryListForProgram(record),
          })}
        />
      )}
    </Card>
  )
}
