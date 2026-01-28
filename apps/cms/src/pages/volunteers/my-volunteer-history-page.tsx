/**
 * 봉사단 참여 이력 페이지
 * Phase: 봉사단 권한 마이그레이션
 */

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, Space, Typography, List, Tag, Button } from 'antd'
import { HistoryOutlined, EyeOutlined } from '@ant-design/icons'
import { EmptyState, GuideMessage } from '@/shared/ui'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { mockUserHistories, mockProgramsMap } from '@/data/mock/mypage'
import dayjs from 'dayjs'
import type { UserHistory } from '@/types/domain'

const { Paragraph, Text } = Typography

// 참여 역할 라벨
const roleLabels: Record<string, string> = {
  INSTRUCTOR: '강사',
  VOLUNTEER: '봉사자',
  PARTICIPANT: '참여자',
}

// 완료 상태 라벨
const finalStatusLabels: Record<string, string> = {
  COMPLETED: '완료',
  CONFIRMED: '확정',
  CANCELLED: '취소',
}

// 완료 상태 색상
const finalStatusColors: Record<string, string> = {
  COMPLETED: 'success',
  CONFIRMED: 'success',
  CANCELLED: 'error',
}

export default function MyVolunteerHistoryPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [histories, setHistories] = useState<UserHistory[]>([])
  const [loading, setLoading] = useState(true)
  
  const categoryName = getCategoryNameByPath(location.pathname, 3) || '봉사단 참여 이력'

  useEffect(() => {
    const loadHistories = () => {
      try {
        // 봉사자 이력만 필터링하고 완료된 것만 표시
        const volunteerHistories = mockUserHistories.filter(
          // Phase 0.1.1: INDIVIDUAL 추가 (봉사 이력은 개인 참여자도 포함)
          // UserHistory.role은 ParticipationRole 타입이므로 UserRole과 직접 비교 불가
          // role 필드가 'VOLUNTEER'이거나 'PARTICIPANT'인 경우 필터링
          h => (h.role === 'VOLUNTEER' || h.role === 'PARTICIPANT') && h.finalStatus !== 'CANCELLED'
        )
        // 완료 일시 기준 내림차순 정렬
        volunteerHistories.sort((a, b) =>
          dayjs(b.completedAt).diff(dayjs(a.completedAt))
        )
        setHistories(volunteerHistories)
      } catch (error) {
        console.error('Failed to load histories:', error)
      } finally {
        setLoading(false)
      }
    }

    loadHistories()
  }, [])

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 페이지 헤더 영역 */}
        <div>
          <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
          <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
            봉사 활동이 완료된 이력만 표시됩니다.
          </Paragraph>
        </div>

        {/* 이력 리스트 영역 */}
        {loading ? (
          <div>로딩 중...</div>
        ) : histories.length === 0 ? (
          <EmptyState
            description="참여한 봉사 이력이 없습니다."
            cta={{
              label: '봉사 프로그램 찾기',
              targetUrl: '/programs',
              type: 'primary',
            }}
          />
        ) : (
          <List
            dataSource={histories}
            renderItem={history => {
              const program = mockProgramsMap.get(history.programId)

              return (
                <List.Item
                  style={{
                    padding: '16px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}
                >
                  <Card
                    style={{ width: '100%' }}
                    styles={{ body: { padding: '16px' } }}
                  >
                    <Space
                      direction="vertical"
                      size="middle"
                      style={{ width: '100%' }}
                    >
                      {/* 프로그램명 및 상태 */}
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space>
                          <HistoryOutlined style={{ color: '#1890ff' }} />
                          <Text strong style={{ fontSize: 16 }}>
                            {program?.title || '알 수 없는 프로그램'}
                          </Text>
                        </Space>
                        <Tag color={finalStatusColors[history.finalStatus]}>
                          {finalStatusLabels[history.finalStatus]}
                        </Tag>
                      </Space>

                      {/* 이력 정보 */}
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div>
                          <Text type="secondary">참여 역할: </Text>
                          <Tag color="blue">{roleLabels[history.role]}</Tag>
                        </div>
                        <div>
                          <Text type="secondary">봉사 일시: </Text>
                          <Text>
                            {dayjs(history.completedAt).format('YYYY년 MM월 DD일')}
                          </Text>
                        </div>
                        {/* 봉사 시간 정보 (가상) */}
                        <div>
                          <Text type="secondary">봉사 시간: </Text>
                          <Text strong color="orange">4시간</Text>
                        </div>
                      </Space>

                      {/* 이력 상세 이동 영역 */}
                      <div style={{ textAlign: 'right' }}>
                        <Button
                          type="primary"
                          icon={<EyeOutlined />}
                          onClick={() => navigate(`/histories/${history.id}`)}
                        >
                          이력 상세 보기
                        </Button>
                      </div>
                    </Space>
                  </Card>
                </List.Item>
              )
            }}
          />
        )}

        {/* 보조 안내 영역 */}
        <Card>
          <GuideMessage
            message="봉사 시간은 활동 보고서 승인 후 1365 자원봉사포털에 자동으로 등록됩니다."
            type="info"
          />
        </Card>
      </Space>
    </div>
  )
}
