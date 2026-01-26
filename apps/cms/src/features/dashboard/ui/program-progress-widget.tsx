/**
 * 프로그램 진행 현황 위젯
 * Phase 4.5: 전체 프로그램 진행 현황 (상태별 집계)
 * 개선: 파이 차트 + 단계별 타임라인으로 시각화 개선
 */

import { Card, Row, Col, Statistic, Timeline, Space } from 'antd'
import { BookOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import {
  getProgramProgressSummary,
  type ProgramProgressSummary,
} from '../api/admin-dashboard-service'
import { handleError } from '@/shared/utils/error-handler'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts'

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

  // 파이 차트용 데이터 변환
  const pieData = useMemo(() => {
    if (!progress) return []
    return Object.entries(progress.byStatus)
      .map(([status, count]) => ({
        name: statusLabels[status as keyof ProgramProgressSummary['byStatus']],
        value: count,
        status: status as keyof ProgramProgressSummary['byStatus'],
      }))
      .filter(item => item.value > 0)
  }, [progress])

  // 단계별 타임라인 데이터
  const timelineData = useMemo(() => {
    if (!progress) return []

    return [
      {
        label: '접수',
        count: progress.byStatus.RECEIVED,
        status: 'RECEIVED',
        color: statusColors.RECEIVED,
      },
      {
        label: '매칭',
        count: progress.byStatus.MATCHING_IN_PROGRESS + progress.byStatus.MATCHING_COMPLETED,
        statuses: ['MATCHING_IN_PROGRESS', 'MATCHING_COMPLETED'],
        color: statusColors.MATCHING_IN_PROGRESS,
      },
      {
        label: '교재',
        count: progress.byStatus.MATERIAL_PREPARING + progress.byStatus.MATERIAL_SHIPPED,
        statuses: ['MATERIAL_PREPARING', 'MATERIAL_SHIPPED'],
        color: statusColors.MATERIAL_PREPARING,
      },
      {
        label: '교육',
        count: progress.byStatus.IN_PROGRESS,
        status: 'IN_PROGRESS',
        color: statusColors.IN_PROGRESS,
      },
      {
        label: '완료',
        count: progress.byStatus.SURVEY_SUBMITTED + progress.byStatus.REPORT_SUBMITTED,
        statuses: ['SURVEY_SUBMITTED', 'REPORT_SUBMITTED'],
        color: statusColors.REPORT_SUBMITTED,
      },
    ]
  }, [progress])

  // ProgramProgressSummary 상태를 ProgramLifecycleStatus로 매핑
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _mapProgressStatusToLifecycleStatus = (
    _status: keyof ProgramProgressSummary['byStatus']
  ): ProgramLifecycleStatus | null => {
    const statusMap: Record<keyof ProgramProgressSummary['byStatus'], ProgramLifecycleStatus[]> = {
      RECEIVED: ['recruiting_students', 'recruiting_instructors', 'recruitment_completed_waiting'],
      MATCHING_IN_PROGRESS: ['matching_completed_waiting'],
      MATCHING_COMPLETED: ['matching_completed_waiting'],
      MATERIAL_PREPARING: ['matching_completed_waiting'],
      MATERIAL_SHIPPED: ['matching_completed_waiting'],
      IN_PROGRESS: ['in_progress'],
      SURVEY_SUBMITTED: ['completed'],
      REPORT_SUBMITTED: ['completed'],
    }
    // 첫 번째 매핑된 상태 반환 (여러 상태가 매핑된 경우 가장 일반적인 상태 사용)
    return statusMap[_status]?.[0] || null
  }

  // 파이 차트 섹션 클릭 핸들러
  const handlePieClick = (data: { status: keyof ProgramProgressSummary['byStatus'] }) => {
    // progressStatus 파라미터로 전달하여 여러 lifecycleStatus를 모두 포함하도록 함
    navigate(`/programs?progressStatus=${data.status}`)
  }

  // 타임라인 단계 클릭 핸들러
  const handleTimelineClick = (item: (typeof timelineData)[0]) => {
    if (item.status) {
      // progressStatus 파라미터로 전달하여 여러 lifecycleStatus를 모두 포함하도록 함
      navigate(`/programs?progressStatus=${item.status}`)
    } else if (item.statuses && item.statuses.length > 0) {
      // 여러 상태가 있는 경우 첫 번째 상태로 매핑
      navigate(`/programs?progressStatus=${item.statuses[0]}`)
    }
  }

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const percentage =
        progress && progress.total > 0 ? ((data.value / progress.total) * 100).toFixed(1) : '0'
      return (
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: 4,
            padding: '8px 12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>{data.name}</p>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>
            {data.value}개 ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  if (!progress) {
    return (
      <Card loading={loading} title="전체 프로그램 진행 현황">
        <div style={{ height: 400 }} />
      </Card>
    )
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOutlined />
          <span>전체 프로그램 진행 현황</span>
        </div>
      }
      loading={loading}
      extra={
        <Space>
          <span style={{ fontSize: 12, color: '#666' }}>상세 보기</span>
          <RightOutlined
            onClick={e => {
              e.stopPropagation()
              navigate('/programs')
            }}
            style={{ cursor: 'pointer' }}
          />
        </Space>
      }
    >
      <Row gutter={[16, 24]}>
        {/* 전체 프로그램 수 */}
        <Col span={24}>
          <Statistic
            title="전체 프로그램"
            value={progress.total}
            suffix="개"
            valueStyle={{ color: '#000000', fontWeight: 'bold', fontSize: 28 }}
          />
        </Col>

        {/* 라이프사이클 단계(왼쪽)와 차트(오른쪽)를 나란히 배치 */}
        <Row gutter={[24, 0]} style={{ width: '100%' }}>
          {/* 단계별 타임라인 - 왼쪽 */}
          <Col span={12}>
            <div style={{ marginTop: 8 }}>
              <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 14, color: '#666' }}>
                프로그램 라이프사이클 단계
              </div>
              <Timeline
                mode="left"
                items={timelineData.map(item => {
                  const percentage =
                    progress.total > 0 ? ((item.count / progress.total) * 100).toFixed(1) : '0'
                  return {
                    color: item.color,
                    children: (
                      <div
                        onClick={() => handleTimelineClick(item)}
                        style={{
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: 4,
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {item.count}개 ({percentage}%)
                        </div>
                      </div>
                    ),
                  }
                })}
              />
            </div>
          </Col>

          {/* 파이 차트 - 오른쪽 */}
          <Col span={12}>
            <div style={{ width: '100%', height: 300, marginTop: 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry: any) => {
                      const percentage =
                        progress.total > 0
                          ? ((entry.payload.value / progress.total) * 100).toFixed(1)
                          : '0'
                      return `${value} (${percentage}%)`
                    }}
                  />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={({ percent }) =>
                      percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    onClick={handlePieClick}
                    style={{ cursor: 'pointer' }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.status]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Col>
        </Row>
      </Row>
    </Card>
  )
}
