/**
 * FAQ 페이지
 * Phase 2: 마이페이지 하위 구조 구현
 * 사용자 강사 권한용 FAQ 조회 페이지
 */

import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import {
  Card,
  Collapse,
  Typography,
  Space,
  Tabs,
  Tag,
  Badge,
  Divider,
  Row,
  Col,
  Tooltip,
} from 'antd'
import { CmsButton, LoadingButton, LabeledSearchInput, EmptyState } from '@/shared/ui'
import {
  FileSearchOutlined,
  LikeOutlined,
  DislikeOutlined,
  MessageOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { LAYOUT_CONSTANTS, MESSAGES } from '@/shared/constants'
import { mockFAQs } from '@/data/mock/faqs'

const { Text, Title, Paragraph } = Typography
const { Panel } = Collapse

export function FAQPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { params, setParams } = useQueryParams<{ category?: string; q?: string }>()

  // 검색어 로컬 상태
  const [searchInput, setSearchInput] = useState(params.q || '')

  // 필터 상태
  const activeCategory = params.category || '전체'

  const categoryName = getCategoryNameByPath(location.pathname, 2) || 'FAQ'

  // Debounce 검색어 처리
  useEffect(() => {
    const handler = setTimeout(() => {
      setParams({
        q: searchInput || undefined,
      })
    }, 500)
    return () => clearTimeout(handler)
  }, [searchInput, setParams])

  // 필터링된 FAQ 목록
  const filteredFaqs = useMemo(() => {
    const q = params.q?.toLowerCase() || ''
    return mockFAQs
      .filter(faq => faq.status === 'published')
      .filter(faq => {
        const matchCategory = activeCategory === '전체' || faq.category === activeCategory
        const matchSearch =
          !q ||
          faq.question.toLowerCase().includes(q) ||
          faq.answer.toLowerCase().includes(q) ||
          faq.tags?.some(tag => tag.toLowerCase().includes(q))

        return matchCategory && matchSearch
      })
  }, [activeCategory, params.q])

  const handleCategoryChange = (key: string) => {
    setParams({
      category: key === '전체' ? undefined : key,
    })
  }

  const categories = ['전체', '활동', '봉사시간', '시스템', '정산', '안내']

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 헤더 섹션 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ ...PAGE_HEADER_STYLE, marginBottom: LAYOUT_CONSTANTS.spacing.sm }}>
              {categoryName}
            </h1>
            <Text type="secondary">{MESSAGES.info.faqDescription}</Text>
          </div>
          <CmsButton
            variant="primary"
            icon={<MessageOutlined />}
            onClick={() => navigate('/notices/inquiries')}
            size="large"
          >
            1:1 문의하기
          </CmsButton>
        </div>

        {/* 검색 섹션 */}
        <Card
          styles={{ body: { padding: '32px' } }}
          style={{ background: '#f9f9f9', border: 'none' }}
        >
          <div style={{ textAlign: 'center', marginBottom: LAYOUT_CONSTANTS.margins.xl }}>
            <Title level={3}>{MESSAGES.info.faqSearchTitle}</Title>
          </div>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <LabeledSearchInput
              label="검색"
              placeholder="궁금한 내용을 입력해보세요 (예: 봉사시간, 1365, 파트너...)"
              value={searchInput}
              onChange={setSearchInput}
              width="100%"
            />
          </div>
        </Card>

        {/* 카테고리 탭 */}
        <Tabs
          activeKey={activeCategory}
          onChange={handleCategoryChange}
          centered
          items={categories.map(cat => ({
            key: cat,
            label: (
              <span style={{ padding: '0 12px' }}>
                {cat}{' '}
                {cat !== '전체' && (
                  <Badge
                    count={mockFAQs.filter(f => f.category === cat).length}
                    offset={[8, -4]}
                    size="small"
                    style={{ backgroundColor: '#bfbfbf' }}
                  />
                )}
              </span>
            ),
          }))}
        />

        {/* FAQ 리스트 */}
        <div style={{ minHeight: 400 }}>
          {filteredFaqs.length === 0 ? (
            <div style={{ marginTop: 60 }}>
              <EmptyState
                description={MESSAGES.info.noSearchResults}
                cta={{
                  label: '전체 보기',
                  onClick: () => {
                    setSearchInput('')
                    handleCategoryChange('전체')
                  },
                  type: 'default',
                }}
              />
            </div>
          ) : (
            <Collapse
              accordion
              expandIconPosition="end"
              style={{ background: 'transparent', border: 'none' }}
              ghost
            >
              {filteredFaqs.map(faq => (
                <Panel
                  key={faq.id}
                  header={
                    <div style={{ padding: '4px 0' }}>
                      <Space size="middle">
                        <Tag color="blue" bordered={false}>
                          {faq.category}
                        </Tag>
                        <Text strong style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.lg }}>
                          {faq.question}
                        </Text>
                      </Space>
                      {faq.tags && (
                        <div style={{ marginTop: 8, paddingLeft: 60 }}>
                          {faq.tags.map(tag => (
                            <Text
                              key={tag}
                              type="secondary"
                              style={{
                                fontSize: LAYOUT_CONSTANTS.fontSizes.sm,
                                marginRight: LAYOUT_CONSTANTS.spacing.sm,
                              }}
                            >
                              #{tag}
                            </Text>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                  style={{
                    marginBottom: LAYOUT_CONSTANTS.margins.lg,
                    background: '#fff',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '8px 12px 12px 60px' }}>
                    <Paragraph
                      style={{
                        fontSize: LAYOUT_CONSTANTS.fontSizes.md + 1,
                        lineHeight: 1.8,
                        color: '#434343',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {faq.answer}
                    </Paragraph>

                    <Divider style={{ margin: '16px 0' }} />

                    <Row justify="space-between" align="middle">
                      <Col>
                        <Space
                          style={{ color: '#8c8c8c', fontSize: LAYOUT_CONSTANTS.fontSizes.sm + 1 }}
                        >
                          <InfoCircleOutlined /> 추가 질문이 있으신가요?
                          <LoadingButton
                            type="link"
                            size="small"
                            onClick={() => navigate('/notices/inquiries')}
                            style={{ padding: 0 }}
                          >
                            상세 문의하기
                          </LoadingButton>
                        </Space>
                      </Col>
                      <Col>
                        <Space>
                          <Text
                            type="secondary"
                            style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm }}
                          >
                            도움이 되었나요?
                          </Text>
                          <Tooltip title="도움됨">
                            <LoadingButton size="small" icon={<LikeOutlined />} />
                          </Tooltip>
                          <Tooltip title="도움 안됨">
                            <LoadingButton size="small" icon={<DislikeOutlined />} />
                          </Tooltip>
                        </Space>
                      </Col>
                    </Row>
                  </div>
                </Panel>
              ))}
            </Collapse>
          )}
        </div>

        {/* 하단 안내 섹션 */}
        <Card style={{ marginTop: 40, textAlign: 'center', background: '#f0f5ff', border: 'none' }}>
          <Space direction="vertical" size="small">
            <Title level={5}>찾으시는 내용이 없나요?</Title>
            <Text type="secondary">JAKorea 운영팀에서 친절하게 답변해 드리겠습니다.</Text>
            <CmsButton
              variant="primary"
              ghost
              icon={<FileSearchOutlined />}
              style={{ marginTop: 12 }}
              onClick={() => navigate('/notices/inquiries')}
            >
              1:1 문의 게시판 바로가기
            </CmsButton>
          </Space>
        </Card>
      </Space>
    </div>
  )
}
