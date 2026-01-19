/**
 * FAQ 페이지
 * Phase 2: 마이페이지 하위 구조 구현
 * 사용자 강사 권한용 FAQ 조회 페이지
 */

import { useState, useEffect, useMemo } from 'react'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Collapse,
  Typography,
  Input,
  Space,
  Empty,
  Button,
  Tabs,
  Tag,
  Badge,
  Divider,
  Row,
  Col,
  Tooltip,
} from 'antd'
import {
  FileSearchOutlined,
  LikeOutlined,
  DislikeOutlined,
  MessageOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { mockFAQs } from '@/data/mock/faqs'

const { Text, Title, Paragraph } = Typography
const { Panel } = Collapse
const { Search } = Input

export function FAQPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // 검색어 로컬 상태
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '')

  // 필터 상태
  const activeCategory = searchParams.get('category') || '전체'

  const categoryName = getCategoryNameByPath(location.pathname, 2) || 'FAQ'

  // Debounce 검색어 처리
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchParams(prev => {
        if (!searchInput) prev.delete('q')
        else prev.set('q', searchInput)
        return prev
      }, { replace: true })
    }, 500)
    return () => clearTimeout(handler)
  }, [searchInput, setSearchParams])

  // 필터링된 FAQ 목록
  const filteredFaqs = useMemo(() => {
    const q = searchParams.get('q')?.toLowerCase() || ''
    return mockFAQs
      .filter(faq => faq.status === 'published')
      .filter(faq => {
        const matchCategory = activeCategory === '전체' || faq.category === activeCategory
        const matchSearch = !q || 
          faq.question.toLowerCase().includes(q) || 
          faq.answer.toLowerCase().includes(q) ||
          faq.tags?.some(tag => tag.toLowerCase().includes(q))
        
        return matchCategory && matchSearch
      })
  }, [activeCategory, searchParams])

  const handleCategoryChange = (key: string) => {
    setSearchParams(prev => {
      if (key === '전체') prev.delete('category')
      else prev.set('category', key)
      return prev
    })
  }

  const categories = ['전체', '활동', '봉사시간', '시스템', '정산', '안내']

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 헤더 섹션 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ ...PAGE_HEADER_STYLE, marginBottom: 8 }}>{categoryName}</h1>
            <Text type="secondary">자주 묻는 질문들을 모아두었습니다. 원하는 정보를 찾지 못하셨다면 1:1 문의를 이용해주세요.</Text>
          </div>
          <Button
            type="primary"
            icon={<MessageOutlined />}
            onClick={() => navigate('/notices/inquiries')}
            size="large"
          >
            1:1 문의하기
          </Button>
        </div>

        {/* 검색 섹션 */}
        <Card styles={{ body: { padding: '32px' } }} style={{ background: '#f9f9f9', border: 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={3}>무엇을 도와드릴까요?</Title>
          </div>
          <Search
            placeholder="궁금한 내용을 입력해보세요 (예: 봉사시간, 1365, 파트너...)"
            allowClear
            size="large"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{ maxWidth: 600, margin: '0 auto', display: 'flex' }}
          />
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
                {cat} {cat !== '전체' && <Badge count={mockFAQs.filter(f => f.category === cat).length} offset={[8, -4]} size="small" style={{ backgroundColor: '#bfbfbf' }} />}
              </span>
            )
          }))}
        />

        {/* FAQ 리스트 */}
        <div style={{ minHeight: 400 }}>
          {filteredFaqs.length === 0 ? (
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
              description={
                <Space direction="vertical">
                  <Text type="secondary">검색 결과가 없습니다.</Text>
                  <Button type="link" onClick={() => { setSearchInput(''); handleCategoryChange('전체'); }}>전체 보기</Button>
                </Space>
              } 
              style={{ marginTop: 60 }}
            />
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
                        <Tag color="blue" bordered={false}>{faq.category}</Tag>
                        <Text strong style={{ fontSize: 16 }}>{faq.question}</Text>
                      </Space>
                      {faq.tags && (
                        <div style={{ marginTop: 8, paddingLeft: 60 }}>
                          {faq.tags.map(tag => (
                            <Text key={tag} type="secondary" style={{ fontSize: 12, marginRight: 8 }}>#{tag}</Text>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                  style={{ 
                    marginBottom: 16, 
                    background: '#fff', 
                    border: '1px solid #f0f0f0', 
                    borderRadius: 8,
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '8px 12px 12px 60px' }}>
                    <Paragraph style={{ fontSize: 15, lineHeight: 1.8, color: '#434343', whiteSpace: 'pre-wrap' }}>
                      {faq.answer}
                    </Paragraph>
                    
                    <Divider style={{ margin: '16px 0' }} />
                    
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Space style={{ color: '#8c8c8c', fontSize: 13 }}>
                          <InfoCircleOutlined /> 추가 질문이 있으신가요? 
                          <Button type="link" size="small" onClick={() => navigate('/notices/inquiries')} style={{ padding: 0 }}>상세 문의하기</Button>
                        </Space>
                      </Col>
                      <Col>
                        <Space>
                          <Text type="secondary" style={{ fontSize: 12 }}>도움이 되었나요?</Text>
                          <Tooltip title="도움됨">
                            <Button size="small" icon={<LikeOutlined />} />
                          </Tooltip>
                          <Tooltip title="도움 안됨">
                            <Button size="small" icon={<DislikeOutlined />} />
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
            <Button 
              type="primary" 
              ghost 
              icon={<FileSearchOutlined />} 
              style={{ marginTop: 12 }}
              onClick={() => navigate('/notices/inquiries')}
            >
              1:1 문의 게시판 바로가기
            </Button>
          </Space>
        </Card>
      </Space>
    </div>
  )
}
