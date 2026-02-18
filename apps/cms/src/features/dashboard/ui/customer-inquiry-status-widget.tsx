/**
 * 고객 문의 현황 위젯
 * Phase: 관리자 홈 화면 - 고객 문의 현황 위젯
 */

import { Card, Typography, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { mockInquiries } from '@/data/mock/inquiries'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import '@/shared/ui/widget-more-button.css'
import './customer-inquiry-status-widget.css'

const { Text } = Typography

export function CustomerInquiryStatusWidget() {
  const navigate = useNavigate()

  const inquiryStats = useMemo(() => {
    const pending = mockInquiries.filter(inq => inq.status === 'PENDING').length
    const answered = mockInquiries.filter(inq => inq.status === 'ANSWERED').length
    const total = mockInquiries.length

    return { pending, answered, total }
  }, [])

  const handleViewAll = () => {
    navigate('/admin/posts/inquiries')
  }

  return (
    <Card
      title={
        <WidgetTitleWithHandle>
          <span>고객 문의 현황</span>
        </WidgetTitleWithHandle>
      }
      extra={
        <Button type="link" size="small" onClick={handleViewAll} className="widget-more-button">
          더보기
        </Button>
      }
      className="customer-inquiry-status-widget"
    >
      <div className="customer-inquiry-status-widget__cards">
        <div className="customer-inquiry-status-widget__stat-card customer-inquiry-status-widget__stat-card--pending">
          <Text className="customer-inquiry-status-widget__stat-label">답변 대기</Text>
          <Text className="customer-inquiry-status-widget__stat-count">
            {inquiryStats.pending}건
          </Text>
        </div>
        <div className="customer-inquiry-status-widget__stat-card customer-inquiry-status-widget__stat-card--answered">
          <Text className="customer-inquiry-status-widget__stat-label">답변 완료</Text>
          <Text className="customer-inquiry-status-widget__stat-count">
            {inquiryStats.answered}건
          </Text>
        </div>
        <div className="customer-inquiry-status-widget__divider" role="separator" />
        <div className="customer-inquiry-status-widget__stat-card customer-inquiry-status-widget__stat-card--total">
          <Text className="customer-inquiry-status-widget__stat-label">전체 Q&A</Text>
          <Text className="customer-inquiry-status-widget__stat-count">{inquiryStats.total}건</Text>
        </div>
      </div>
    </Card>
  )
}
