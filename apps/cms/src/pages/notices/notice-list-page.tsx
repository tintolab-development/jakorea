/**
 * 공지사항 목록 페이지
 * Phase 2: 마이페이지 하위 구조 구현
 * 사용자 강사 권한용 공지사항 조회 페이지
 */

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, List, Typography, Tag, Space, Empty } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import dayjs from 'dayjs'

const { Text } = Typography

interface Notice {
  id: string
  title: string
  content: string
  category: string
  createdAt: string
  isImportant: boolean
}

// TODO: API 연동 필요
const mockNotices: Notice[] = [
  {
    id: '1',
    title: '2025년 1월 정산 일정 안내',
    content: '2025년 1월 정산 신청 기간은 1월 25일까지입니다.',
    category: '정산',
    createdAt: '2025-01-15T10:00:00',
    isImportant: true,
  },
  {
    id: '2',
    title: '프로그램 신청 가이드 업데이트',
    content: '프로그램 신청 절차가 개선되었습니다. 자세한 내용은 FAQ를 참고해주세요.',
    category: '안내',
    createdAt: '2025-01-10T14:00:00',
    isImportant: false,
  },
]

export function NoticeListPage() {
  const location = useLocation()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  
  // 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 1) || '공지사항'

  useEffect(() => {
    // TODO: API 연동
    const loadNotices = async () => {
      setLoading(true)
      try {
        // const data = await getNotices()
        setNotices(mockNotices)
      } catch (error) {
        console.error('Failed to load notices:', error)
      } finally {
        setLoading(false)
      }
    }

    loadNotices()
  }, [])

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
        </div>

        <Card>
          {notices.length === 0 ? (
            <Empty description="공지사항이 없습니다" />
          ) : (
            <List
              loading={loading}
              dataSource={notices}
              renderItem={notice => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        {notice.title}
                        {notice.isImportant && <Tag color="red">중요</Tag>}
                        <Tag>{notice.category}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text>{notice.content}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <CalendarOutlined /> {dayjs(notice.createdAt).format('YYYY-MM-DD HH:mm')}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </Space>
    </div>
  )
}
