/**
 * 이력 목록 화면
 * Phase 5.10: 사용자가 완료된 프로그램/강의/봉사 이력을 한눈에 확인
 * 참고 화면: U-05-01 이력 목록
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Space, Typography, List, Tag, Button } from 'antd'
import { HistoryOutlined, EyeOutlined } from '@ant-design/icons'
import { EmptyState, GuideMessage } from '@/shared/ui'
import { mockUserHistories, mockProgramsMap } from '@/data/mock/mypage'
import dayjs from 'dayjs'
import type { UserHistory } from '@/types/domain'

const { Title, Paragraph, Text } = Typography

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

export function HistoryListPage() {
  const navigate = useNavigate()
  const [histories, setHistories] = useState<UserHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHistories = () => {
      try {
        // 완료된 이력만 필터링 (CANCELLED 제외)
        const completedHistories = mockUserHistories.filter(
          h => h.finalStatus !== 'CANCELLED'
        )
        // 완료 일시 기준 내림차순 정렬
        completedHistories.sort((a, b) =>
          dayjs(b.completedAt).diff(dayjs(a.completedAt))
        )
        setHistories(completedHistories)
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
          <Title level={2} style={{ margin: 0 }}>
            이력
          </Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
            완료된 참여 이력만 표시됩니다.
          </Paragraph>
        </div>

        {/* 이력 리스트 영역 (핵심) */}
        {loading ? (
          <div>로딩 중...</div>
        ) : histories.length === 0 ? (
          <EmptyState
            description="현재 완료된 이력이 없습니다."
            cta={{
              label: '프로그램 보기',
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
                          <Text type="secondary">완료 일시: </Text>
                          <Text>
                            {dayjs(history.completedAt).format('YYYY년 MM월 DD일')}
                          </Text>
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
            message="이력 및 증빙 문서는 공식 기록으로 보관됩니다."
            type="info"
          />
        </Card>
      </Space>
    </div>
  )
}

