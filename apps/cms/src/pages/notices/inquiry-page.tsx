/**
 * 문의하기 페이지
 * Phase 2: 마이페이지 하위 구조 구현
 * 사용자 강사 권한용 문의하기 페이지
 */

import { useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import {
  Card,
  List,
  Typography,
  Tag,
  Space,
  Tabs,
  Divider,
  Descriptions,
} from 'antd'
import { CmsButton, LabeledSearchInput, EmptyState, ContentModal, InquiryModal } from '@/shared/ui'
import {
  PlusOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { LAYOUT_CONSTANTS } from '@/shared/constants'
import dayjs from 'dayjs'
import { mockInquiries, type Inquiry } from '@/data/mock/inquiries'

const { Text, Title } = Typography

export function InquiryPage() {
  const location = useLocation()
  const { params, setParams } = useQueryParams<{ status?: string; q?: string }>()
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [writeModalOpen, setWriteModalOpen] = useState(false)

  const activeTab = params.status || 'ALL'
  const searchQuery = params.q || ''

  const categoryName = getCategoryNameByPath(location.pathname, 2) || '문의하기'

  const filteredInquiries = useMemo(() => {
    return mockInquiries
      .filter(item => {
        const matchStatus = activeTab === 'ALL' || item.status === activeTab
        const matchSearch =
          !searchQuery ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.content.toLowerCase().includes(searchQuery.toLowerCase())
        return matchStatus && matchSearch
      })
      .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)))
  }, [activeTab, searchQuery])

  const handleTabChange = (key: string) => {
    setParams({
      status: key === 'ALL' ? undefined : key,
    })
  }


  const openDetail = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    setDetailModalOpen(true)
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 헤더 섹션 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ ...PAGE_HEADER_STYLE, marginBottom: 8 }}>{categoryName}</h1>
            <Text type="secondary">
              궁금하신 사항은 1:1 문의를 남겨주세요. 운영시간(평일 09:00~18:00) 내에 순차적으로
              답변드립니다.
            </Text>
          </div>
          <CmsButton
            variant="primary"
            icon={<PlusOutlined />}
            onClick={() => setWriteModalOpen(true)}
            size="large"
          >
            새 문의 작성
          </CmsButton>
        </div>

        {/* 검색 및 필터 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fff',
            padding: '16px 24px',
            borderRadius: 8,
            border: '1px solid #f0f0f0',
          }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            className="inquiry-tabs"
            items={[
              { key: 'ALL', label: `전체 (${mockInquiries.length})` },
              {
                key: 'PENDING',
                label: `답변대기 (${mockInquiries.filter(i => i.status === 'PENDING').length})`,
              },
              {
                key: 'ANSWERED',
                label: `답변완료 (${mockInquiries.filter(i => i.status === 'ANSWERED').length})`,
              },
            ]}
          />
          <LabeledSearchInput
            label="제목/내용"
            placeholder="문의 제목 또는 내용을 입력하세요"
            value={searchQuery}
            onChange={value => {
              const newParams = { ...params, search: value || undefined }
              setParams(newParams)
            }}
            width={300}
          />
        </div>

        {/* 목록 영역 */}
        <Card styles={{ body: { padding: 0 } }}>
          {filteredInquiries.length === 0 ? (
            <div style={{ padding: '60px 0' }}>
              <EmptyState description="문의 내역이 없습니다." />
            </div>
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={filteredInquiries}
              renderItem={inquiry => (
                <List.Item
                  onClick={() => openDetail(inquiry)}
                  style={{
                    padding: '20px 24px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  className="inquiry-list-item"
                >
                  <List.Item.Meta
                    title={
                      <div style={{ marginBottom: 4 }}>
                        <Space size="small" style={{ marginBottom: 4, display: 'block' }}>
                          <Tag bordered={false} style={{ fontSize: 11, padding: '0 4px' }}>
                            {inquiry.category}
                          </Tag>
                          <Tag
                            color={inquiry.status === 'ANSWERED' ? 'success' : 'default'}
                            style={{ fontSize: 11, padding: '0 4px', borderRadius: 2 }}
                          >
                            {inquiry.status === 'ANSWERED' ? '답변완료' : '답변대기'}
                          </Tag>
                        </Space>
                        <Text strong style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.lg }}>
                          {inquiry.title}
                        </Text>
                      </div>
                    }
                    description={
                      <Space size="middle" style={{ marginTop: 4 }}>
                        <Text
                          type="secondary"
                          style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm + 1 }}
                        >
                          <CalendarOutlined style={{ marginRight: 4 }} />
                          {dayjs(inquiry.createdAt).format('YYYY-MM-DD HH:mm')}
                        </Text>
                        {inquiry.status === 'ANSWERED' && (
                          <Text
                            style={{
                              color: '#52c41a',
                              fontSize: LAYOUT_CONSTANTS.fontSizes.sm + 1,
                            }}
                          >
                            <CheckCircleOutlined style={{ marginRight: 4 }} /> 답변이 등록되었습니다
                          </Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </Space>

      {/* 문의 상세 Modal */}
      <ContentModal
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        width={800}
        title={selectedInquiry?.title ?? '문의 상세'}
        titleContent={
          selectedInquiry ? (
            <div>
              <div style={{ marginBottom: 4 }}>
                <Tag bordered={false} style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm }}>
                  {selectedInquiry.category}
                </Tag>
                <Tag
                  color={selectedInquiry.status === 'ANSWERED' ? 'success' : 'default'}
                  style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm }}
                >
                  {selectedInquiry.status === 'ANSWERED' ? '답변완료' : '답변대기'}
                </Tag>
              </div>
              <Title level={4} style={{ margin: 0 }}>
                {selectedInquiry.title}
              </Title>
            </div>
          ) : undefined
        }
        footer={
          <CmsButton variant="secondary" size="medium" onClick={() => setDetailModalOpen(false)}>
            닫기
          </CmsButton>
        }
      >
        {selectedInquiry ? (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="문의 유형">{selectedInquiry.category}</Descriptions.Item>
              <Descriptions.Item label="작성일시">
                {dayjs(selectedInquiry.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <QuestionCircleOutlined style={{ color: '#1890ff' }} /> 문의 내용
            </Title>
            <div
              style={{
                background: '#f9f9f9',
                padding: '20px',
                borderRadius: 8,
                marginBottom: 32,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
              }}
            >
              {selectedInquiry.content}
            </div>

            {selectedInquiry.answer ? (
              <>
                <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} /> 답변 내용
                </Title>
                <div
                  style={{
                    background: '#f6ffed',
                    padding: '20px',
                    borderRadius: 8,
                    border: '1px solid #b7eb8f',
                    lineHeight: 1.6,
                  }}
                >
                  <div
                    style={{
                      marginBottom: 12,
                      borderBottom: '1px solid #d9f7be',
                      paddingBottom: 8,
                    }}
                  >
                    <Space split={<Divider type="vertical" />}>
                      <Text strong>{selectedInquiry.answer.author}</Text>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        <CalendarOutlined style={{ marginRight: 4 }} />{' '}
                        {dayjs(selectedInquiry.answer.answeredAt).format('YYYY-MM-DD HH:mm')}
                      </Text>
                    </Space>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{selectedInquiry.answer.content}</div>
                </div>
              </>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: '#8c8c8c',
                  background: '#fff7e6',
                  borderRadius: 8,
                }}
              >
                <ClockCircleOutlined style={{ fontSize: 24, marginBottom: 8, color: '#faad14' }} />
                <p>답변을 준비 중입니다. 잠시만 기다려주세요.</p>
              </div>
            )}
          </div>
        ) : (
          <div />
        )}
      </ContentModal>

      {/* 새 문의 작성 Modal */}
      <InquiryModal
        open={writeModalOpen}
        onCancel={() => setWriteModalOpen(false)}
        onSuccess={() => {
          setWriteModalOpen(false)
          // 실제로는 목록 새로고침 로직이 필요함
        }}
      />

      <style>{`
        .inquiry-list-item:hover {
          background-color: #f5f5f5 !important;
        }
        .inquiry-tabs .ant-tabs-nav {
          margin-bottom: 0 !important;
        }
        .inquiry-tabs .ant-tabs-nav::before {
          border-bottom: none !important;
        }
      `}</style>
    </div>
  )
}
