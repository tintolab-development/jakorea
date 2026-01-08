/**
 * 문의하기 페이지
 * Phase 2: 마이페이지 하위 구조 구현
 * 사용자 강사 권한용 문의하기 페이지
 */

import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, Form, Input, Button, Select, Space, message } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'

const { TextArea } = Input
const { Option } = Select

interface InquiryFormData {
  category: string
  title: string
  content: string
  contactEmail?: string
  contactPhone?: string
}

export function InquiryPage() {
  const location = useLocation()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  
  // 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '문의하기'

  const handleSubmit = async (_values: InquiryFormData) => {
    setSubmitting(true)
    try {
      // TODO: API 연동 필요
      // await submitInquiry(values)
      message.success('문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.')
      form.resetFields()
    } catch (error) {
      message.error('문의 접수 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
        </div>

        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}
          >
            <Form.Item
              label="문의 유형"
              name="category"
              rules={[{ required: true, message: '문의 유형을 선택해주세요' }]}
            >
              <Select placeholder="문의 유형을 선택하세요">
                <Option value="settlement">정산 관련</Option>
                <Option value="program">프로그램 관련</Option>
                <Option value="account">계정 관련</Option>
                <Option value="technical">기술 지원</Option>
                <Option value="other">기타</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="제목"
              name="title"
              rules={[{ required: true, message: '제목을 입력해주세요' }]}
            >
              <Input placeholder="문의 제목을 입력하세요" />
            </Form.Item>

            <Form.Item
              label="문의 내용"
              name="content"
              rules={[{ required: true, message: '문의 내용을 입력해주세요' }]}
            >
              <TextArea
                rows={8}
                placeholder="문의 내용을 상세히 입력해주세요"
                showCount
                maxLength={2000}
              />
            </Form.Item>

            <Form.Item label="연락처 이메일 (선택)" name="contactEmail">
              <Input type="email" placeholder="답변 받을 이메일 주소 (선택사항)" />
            </Form.Item>

            <Form.Item label="연락처 전화번호 (선택)" name="contactPhone">
              <Input placeholder="답변 받을 전화번호 (선택사항)" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={submitting} size="large" block>
                문의 접수
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </div>
  )
}
