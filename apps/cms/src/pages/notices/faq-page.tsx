/**
 * FAQ 페이지
 * Phase 2: 마이페이지 하위 구조 구현
 * 사용자 강사 권한용 FAQ 조회 페이지
 */

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, Collapse, Typography, Input, Space, Empty, Button } from 'antd'
import { SearchOutlined, FileSearchOutlined } from '@ant-design/icons'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { InquiryModal } from '@/shared/ui'

const { Text } = Typography
const { Panel } = Collapse
const { Search } = Input

interface FAQ {
  id: string
  category: string
  question: string
  answer: string
}

// TODO: API 연동 필요
const mockFAQs: FAQ[] = [
  {
    id: '1',
    category: '정산',
    question: '정산 신청은 언제까지 해야 하나요?',
    answer: '매월 25일까지 해당 월의 정산 신청을 완료해주세요. 신청 기간을 놓치면 다음 달로 이월됩니다.',
  },
  {
    id: '2',
    category: '정산',
    question: '정산 지급은 언제 이루어지나요?',
    answer: '정산 신청 후 관리자 확인을 거쳐 승인되면, 익월 10일경에 지급됩니다.',
  },
  {
    id: '3',
    category: '프로그램',
    question: '프로그램 중복 신청이 가능한가요?',
    answer: '동일한 정보의 프로그램은 중복 신청할 수 없습니다. 학교 프로그램의 경우, 동일 학교에서 다른 학년/날짜/신청자로 신청할 수 있습니다.',
  },
  {
    id: '4',
    category: '프로그램',
    question: '프로그램 신청 후 취소가 가능한가요?',
    answer: '프로그램 신청 후 관리자 승인 전까지는 취소가 가능합니다. 승인 후에는 관리자에게 문의해주세요.',
  },
]

export function FAQPage() {
  const location = useLocation()
  const [faqs] = useState<FAQ[]>(mockFAQs)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>(mockFAQs)
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false)
  
  // 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || 'FAQ'

  useEffect(() => {
    if (!searchQuery) {
      setFilteredFaqs(faqs)
      return
    }

    const filtered = faqs.filter(
      faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredFaqs(filtered)
  }, [searchQuery, faqs])

  // 카테고리별로 그룹화
  const faqsByCategory = filteredFaqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = []
    }
    acc[faq.category].push(faq)
    return acc
  }, {} as Record<string, FAQ[]>)

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
          <Button
            type="primary"
            icon={<FileSearchOutlined />}
            onClick={() => setInquiryModalOpen(true)}
          >
            문의하기
          </Button>
        </div>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Search
              placeholder="FAQ 검색"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />

            {filteredFaqs.length === 0 ? (
              <Empty description="검색 결과가 없습니다" />
            ) : (
              <Collapse>
                {Object.entries(faqsByCategory).map(([category, categoryFaqs]) => (
                  <Panel header={`${category} (${categoryFaqs.length})`} key={category}>
                    <Collapse ghost>
                      {categoryFaqs.map(faq => (
                        <Panel
                          header={<Text strong>{faq.question}</Text>}
                          key={faq.id}
                        >
                          <Text>{faq.answer}</Text>
                        </Panel>
                      ))}
                    </Collapse>
                  </Panel>
                ))}
              </Collapse>
            )}
          </Space>
        </Card>
      </Space>

      <InquiryModal
        open={inquiryModalOpen}
        onCancel={() => setInquiryModalOpen(false)}
        onSuccess={() => {
          // 필요시 목록 새로고침
        }}
      />
    </div>
  )
}
