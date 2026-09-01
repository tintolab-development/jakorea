/**
 * 공지사항 목록 페이지
 * Phase 2: 마이페이지 하위 구조 구현
 * 사용자 강사 권한용 공지사항 조회 페이지
 */

import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { Card, List, Typography, Tag, Space, Tabs, Divider } from 'antd'
import { CmsButton, LoadingButton, LabeledSearchInput, EmptyState, ContentModal } from '@/shared/ui'
import { CalendarOutlined, PushpinFilled, EyeOutlined, FileOutlined } from '@ant-design/icons'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { LAYOUT_CONSTANTS } from '@/shared/constants'
import dayjs from 'dayjs'
import { mockNotices, type Notice } from '@/data/mock/notices'

const { Text, Title } = Typography

export function NoticeListPage() {
  const location = useLocation()
  const { params, setParams } = useQueryParams<{ category?: string; q?: string }>()
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // 검색어 로컬 상태 (즉각적인 UI 반영용)
  const [searchInput, setSearchInput] = useState(params.q || '')

  // 필터 상태 (URL과 동기화)
  const categoryFilter = params.category || '전체'
  const searchQuery = params.q || ''

  const categoryName = getCategoryNameByPath(location.pathname, 1) || '공지사항'

  // Debounce 로직: searchInput이 변경되면 500ms 후 URL 파라미터 업데이트
  useEffect(() => {
    const handler = setTimeout(() => {
      setParams({
        q: searchInput || undefined,
      })
    }, 500)

    return () => clearTimeout(handler)
  }, [searchInput, setParams])

  // 필터링 및 정렬 로직
  const filteredNotices = useMemo(() => {
    let result = mockNotices.filter(n => n.status === 'published')

    // 카테고리 필터
    if (categoryFilter !== '전체') {
      result = result.filter(n => n.category === categoryFilter)
    }

    // 검색 필터
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      )
    }

    // 정렬: 중요 공지 상단 -> 최신순
    return result.sort((a, b) => {
      if (a.isImportant && !b.isImportant) return -1
      if (!a.isImportant && b.isImportant) return 1
      return dayjs(b.createdAt).diff(dayjs(a.createdAt))
    })
  }, [categoryFilter, searchQuery])

  const handleCategoryChange = (key: string) => {
    setParams({
      category: key === '전체' ? undefined : key,
    })
  }

  const openDetail = (notice: Notice) => {
    setSelectedNotice(notice)
    setModalOpen(true)
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 헤더 및 검색 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
          <LabeledSearchInput
            label="제목/내용"
            placeholder="공지사항 제목 또는 내용을 입력하세요"
            value={searchInput}
            onChange={setSearchInput}
            width={300}
          />
        </div>

        {/* 카테고리 탭 */}
        <Tabs
          activeKey={categoryFilter}
          onChange={handleCategoryChange}
          items={[
            { key: '전체', label: '전체' },
            { key: '필독', label: '필독' },
            { key: '안내', label: '안내' },
            { key: '정산', label: '정산' },
            { key: '시스템', label: '시스템' },
            { key: '봉사단', label: '봉사단' },
            { key: '강사단', label: '강사단' },
          ]}
        />

        {/* 목록 영역 */}
        <Card styles={{ body: { padding: 0 } }}>
          {filteredNotices.length === 0 ? (
            <div style={{ padding: '40px 0' }}>
              <EmptyState description="검색 결과가 없습니다." />
            </div>
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={filteredNotices}
              renderItem={notice => (
                <List.Item
                  onClick={() => openDetail(notice)}
                  style={{
                    padding: '20px 24px',
                    cursor: 'pointer',
                    backgroundColor: notice.isImportant ? '#fffbe6' : 'transparent',
                    transition: 'all 0.3s',
                  }}
                  className="notice-list-item"
                  actions={[
                    <Space key="meta" size="middle" style={{ color: '#8c8c8c', fontSize: 13 }}>
                      <Space size={4}>
                        <EyeOutlined /> {notice.viewCount.toLocaleString()}
                      </Space>
                      {notice.hasAttachment && <FileOutlined />}
                    </Space>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space size="small">
                        {notice.isImportant && (
                          <Tag color="red" icon={<PushpinFilled />}>
                            중요
                          </Tag>
                        )}
                        <Tag color={notice.category === '정산' ? 'orange' : 'default'}>
                          {notice.category}
                        </Tag>
                        <Text strong style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.lg }}>
                          {notice.title}
                        </Text>
                      </Space>
                    }
                    description={
                      <Space size="middle" style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {notice.author}
                        </Text>
                        <Divider type="vertical" />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          <CalendarOutlined style={{ marginRight: 4 }} />
                          {dayjs(notice.createdAt).format('YYYY.MM.DD')}
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

      {/* 공지사항 상세 Modal */}
      <ContentModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        width={800}
        title={selectedNotice?.title ?? '공지사항'}
        titleContent={
          selectedNotice ? (
            <div style={{ paddingRight: 24 }}>
              <Space size="small" style={{ marginBottom: 4, display: 'flex' }}>
                <Tag color="blue">{selectedNotice.category}</Tag>
                {selectedNotice.isImportant ? <Tag color="red">필독</Tag> : null}
              </Space>
              <Title level={4} style={{ margin: 0 }}>
                {selectedNotice.title}
              </Title>
            </div>
          ) : undefined
        }
        footer={
          <CmsButton variant="primary" size="medium" onClick={() => setModalOpen(false)}>
            확인
          </CmsButton>
        }
      >
        {selectedNotice ? (
          <div>
            <Space
              split={<Divider type="vertical" />}
              style={{ color: '#8c8c8c', marginBottom: 16 }}
            >
              <Text type="secondary">{selectedNotice.author}</Text>
              <Text type="secondary">
                {dayjs(selectedNotice.createdAt).format('YYYY.MM.DD HH:mm')}
              </Text>
              <Text type="secondary">조회수 {selectedNotice.viewCount.toLocaleString()}</Text>
            </Space>

            <Divider style={{ margin: '0 0 24px 0' }} />

            <div
              style={{
                minHeight: 200,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8,
                fontSize: 15,
                color: '#262626',
              }}
            >
              {selectedNotice.content}
            </div>

            {selectedNotice.hasAttachment ? (
              <>
                <Divider style={{ margin: '24px 0' }} />
                <Card
                  size="small"
                  title={
                    <Space>
                      <FileOutlined /> 첨부파일
                    </Space>
                  }
                  styles={{ body: { padding: '8px 12px' } }}
                >
                  <LoadingButton type="link" icon={<FileOutlined />} style={{ padding: 0 }}>
                    [공지] {selectedNotice.category}_관련_서식.pdf (1.2MB)
                  </LoadingButton>
                </Card>
              </>
            ) : null}
          </div>
        ) : (
          <div />
        )}
      </ContentModal>

      <style>{`
        .notice-list-item:hover {
          background-color: #f5f5f5 !important;
        }
      `}</style>
    </div>
  )
}
