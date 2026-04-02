/**
 * 프로그램 별 문의 현황 위젯
 * 프로그램별 답변 대기 / 답변 완료 / 전체 건수를 테이블로 표시
 */

import { Card, Button, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import { useDashboardSettingsStore } from '../model/dashboard-settings-store'
import { WIDGET_MORE_ALERT_MESSAGE } from '@/shared/constants/widget-styles'
import '@/shared/ui/widget-more-button.css'
import './dashboard-widget-table.css'

const WIDGET_KEY = 'customer-inquiry-status-widget'
const EMPTY_IDS: string[] = []

interface ProgramInquiryRow {
  key: string
  programName: string
  pending: number
  answered: number
  total: number
}

const MOCK_PROGRAM_INQUIRIES: ProgramInquiryRow[] = [
  {
    key: '1',
    programName: 'HSBC/HKU Business Case Competition 2026 모집 안내',
    pending: 1,
    answered: 30,
    total: 31,
  },
  {
    key: '2',
    programName: '2026 JA Korea 대학생경제교육봉사단 UJAT 36기 모집',
    pending: 0,
    answered: 9,
    total: 9,
  },
  {
    key: '3',
    programName: 'EY한영-JA Korea Growth to Professional 2026 대학생 참가자 모집',
    pending: 2,
    answered: 15,
    total: 17,
  },
  {
    key: '4',
    programName: '2026년 JA Korea 초등 경제교육 대상학교 모집',
    pending: 5,
    answered: 6,
    total: 11,
  },
  {
    key: '5',
    programName: '2026 SAP-함께 성장하는AI 참여 고등학생 모집 안내 (IT, SW 멘토링)',
    pending: 0,
    answered: 2,
    total: 2,
  },
]

export function CustomerInquiryStatusWidget() {
  const navigate = useNavigate()
  const allowedProgramIds =
    useDashboardSettingsStore(s => s.widgetProgramIds[WIDGET_KEY]) ?? EMPTY_IDS
  const inquiryNotificationReadProgramKeys =
    useDashboardSettingsStore(s => s.inquiryNotificationReadProgramKeys) ?? {}
  const setInquiryNotificationReadProgramKey = useDashboardSettingsStore(
    s => s.setInquiryNotificationReadProgramKey
  )

  const data = useMemo(() => {
    if (allowedProgramIds.length === 0) return MOCK_PROGRAM_INQUIRIES
    return MOCK_PROGRAM_INQUIRIES
  }, [allowedProgramIds])

  const handlePendingClick = (programKey: string) => {
    console.log('handlePendingClick programKey', programKey)
    window.alert('준비 중입니다.')
    // setInquiryNotificationReadProgramKey(programKey)
    // navigate('/admin/posts/inquiries?status=PENDING')
  }

  const handleMoreClick = () => {
    window.alert(WIDGET_MORE_ALERT_MESSAGE)
  }

  const columns: ColumnsType<ProgramInquiryRow> = useMemo(
    () => [
      {
        title: '프로그램명',
        dataIndex: 'programName',
        key: 'programName',
        ellipsis: true,
        width: '50%',
        align: 'center',
      },
      {
        title: '답변 대기',
        dataIndex: 'pending',
        key: 'pending',
        width: '17%',
        align: 'center',
        render: (value: number, record: ProgramInquiryRow) =>
          value > 0 ? (
            <button
              type="button"
              className="dashboard-widget-table__pending-btn"
              onClick={() => handlePendingClick(record.key)}
            >
              <span className="dashboard-widget-table__pending-inner">
                <span className="dashboard-widget-table__pending-text">{value}건</span>
                {!inquiryNotificationReadProgramKeys[record.key] && (
                  <span className="dashboard-widget-table__pending-dot" aria-hidden />
                )}
              </span>
            </button>
          ) : (
            <span className="dashboard-widget-table__count--muted">0건</span>
          ),
      },
      {
        title: '답변 완료',
        dataIndex: 'answered',
        key: 'answered',
        width: '17%',
        align: 'center',
        render: (value: number) => (
          <span className="dashboard-widget-table__count--muted">{value}건</span>
        ),
      },
      {
        title: '전체',
        dataIndex: 'total',
        key: 'total',
        width: '16%',
        align: 'center',
        render: (value: number) => (
          <span className="dashboard-widget-table__count--muted">{value}건</span>
        ),
      },
    ],
    [navigate, inquiryNotificationReadProgramKeys, setInquiryNotificationReadProgramKey]
  )

  return (
    <Card
      className="dashboard-widget-table dashboard-widget-table--customer-inquiry"
      title={
        <WidgetTitleWithHandle>
          <span className="widget-card-title">프로그램 별 문의 현황</span>
        </WidgetTitleWithHandle>
      }
      extra={
        <Button type="link" size="small" onClick={handleMoreClick} className="widget-more-button">
          더보기
        </Button>
      }
    >
      <Table<ProgramInquiryRow>
        columns={columns}
        dataSource={data}
        pagination={false}
        className="dashboard-widget-table__data"
      />
    </Card>
  )
}
