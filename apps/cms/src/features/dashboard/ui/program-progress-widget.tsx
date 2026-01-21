/**
 * 프로그램 진행 현황 위젯
 * Phase 4.5: 전체 프로그램 진행 현황 (상태별 집계)
 */

import { Card, Row, Col, Statistic, Progress } from 'antd'
import { BookOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getProgramProgressSummary, type ProgramProgressSummary } from '../api/admin-dashboard-service'
import { handleError } from '@/shared/utils/error-handler'

const statusLabels: Record<keyof ProgramProgressSummary['byStatus'], string> = {
  RECEIVED: '접수 완료',
  MATCHING_IN_PROGRESS: '매칭 진행중',
  MATCHING_COMPLETED: '매칭 완료',
  MATERIAL_PREPARING: '교재 배송 준비중',
  MATERIAL_SHIPPED: '교재 발송 완료',
  IN_PROGRESS: '교육 실시',
  SURVEY_SUBMITTED: '만족도 조사 제출',
  REPORT_SUBMITTED: '강의보고서 제출',
}

const statusColors: Record<keyof ProgramProgressSummary['byStatus'], string> = {
  RECEIVED: '#1890ff',
  MATCHING_IN_PROGRESS: '#faad14',
  MATCHING_COMPLETED: '#52c41a',
  MATERIAL_PREPARING: '#722ed1',
  MATERIAL_SHIPPED: '#13c2c2',
  IN_PROGRESS: '#eb2f96',
  SURVEY_SUBMITTED: '#f5222d',
  REPORT_SUBMITTED: '#fa8c16',
}

export function ProgramProgressWidget() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState<ProgramProgressSummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const data = await getProgramProgressSummary()
        setProgress(data)
      } catch (error) {
        handleError(error, { defaultMessage: '프로그램 진행 현황을 불러오는데 실패했습니다' })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (!progress) {
    return (
      <Card loading={loading} title="전체 프로그램 진행 현황">
        <div style={{ height: 200 }} />
      </Card>
    )
  }

  const statusEntries = Object.entries(progress.byStatus) as [
    keyof ProgramProgressSummary['byStatus'],
    number
  ][]

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOutlined />
          <span>전체 프로그램 진행 현황</span>
        </div>
      }
      loading={loading}
      hoverable
      onClick={() => navigate('/programs')}
      style={{ cursor: 'pointer' }}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Statistic
            title="전체 프로그램"
            value={progress.total}
            suffix="개"
            valueStyle={{ color: '#000000', fontWeight: 'bold', fontSize: 24 }}
          />
        </Col>
        <Col span={24}>
          <div style={{ marginTop: 16 }}>
            {statusEntries.map(([status, count]) => {
              const percentage = progress.total > 0 ? (count / progress.total) * 100 : 0
              return (
                <div key={status} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: statusColors[status], fontWeight: 500 }}>
                      {statusLabels[status]}
                    </span>
                    <span style={{ fontWeight: 600 }}>{count}개</span>
                  </div>
                  <Progress
                    percent={percentage}
                    strokeColor={statusColors[status]}
                    showInfo={false}
                    size="small"
                  />
                </div>
              )
            })}
          </div>
        </Col>
      </Row>
    </Card>
  )
}
