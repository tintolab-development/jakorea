/**
 * 봉사 교육 계획서 작성 페이지
 * Phase: 봉사 정보 > 교육 계획서 작성
 */

import { useLocation } from 'react-router-dom'
import { Card, Space, Typography, Form, Input, DatePicker, Select, Button, message } from 'antd'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { MESSAGES } from '@/shared/constants'

const { Paragraph } = Typography
const { RangePicker } = DatePicker
const { TextArea } = Input
const { Option } = Select

export default function VolunteerEducationPlanPage() {
  const location = useLocation()
  const [form] = Form.useForm()

  const categoryName = getCategoryNameByPath(location.pathname, 3) || '교육 계획서 작성'

  const handleSubmit = async () => {
    try {
      await form.validateFields()
      message.success(MESSAGES.success.educationPlanSaved)
    } catch {
      message.error(MESSAGES.error.checkRequiredFields)
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
          <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
            봉사 활동에 필요한 교육 계획서를 작성해주세요.
          </Paragraph>
        </div>

        <Card>
          <Form form={form} layout="vertical">
            <Form.Item
              name="programTitle"
              label="프로그램명"
              rules={[{ required: true, message: MESSAGES.validation.programNameRequired }]}
            >
              <Input placeholder="예: 서울초등학교 금융교육 봉사" />
            </Form.Item>

            <Space size={16} style={{ display: 'flex' }}>
              <Form.Item
                name="period"
                label="진행 기간"
                rules={[{ required: true, message: MESSAGES.validation.periodRequired }]}
                style={{ flex: 1 }}
              >
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name="target"
                label="수강 대상"
                rules={[{ required: true, message: MESSAGES.validation.targetRequired }]}
                style={{ flex: 1 }}
              >
                <Select placeholder="대상 선택">
                  <Option value="individual">개인 학생</Option>
                  <Option value="school">학교(선생님)</Option>
                </Select>
              </Form.Item>
            </Space>

            <Form.Item
              name="objectives"
              label="교육 목표"
              rules={[{ required: true, message: MESSAGES.validation.goalRequired }]}
            >
              <TextArea rows={3} placeholder="교육 목표를 입력해주세요" />
            </Form.Item>

            <Form.Item
              name="contents"
              label="교육 내용"
              rules={[{ required: true, message: MESSAGES.validation.contentRequired }]}
            >
              <TextArea rows={6} placeholder="교육 내용 및 진행 순서를 입력해주세요" />
            </Form.Item>

            <Form.Item name="materials" label="준비물">
              <Input placeholder="예: 교재, 필기도구" />
            </Form.Item>

            <Form.Item name="notes" label="기타 참고사항">
              <TextArea rows={3} placeholder="추가 안내사항이 있다면 입력해주세요" />
            </Form.Item>

            <Space>
              <Button type="primary" onClick={handleSubmit}>
                저장하기
              </Button>
              <Button onClick={() => form.resetFields()}>
                초기화
              </Button>
            </Space>
          </Form>
        </Card>
      </Space>
    </div>
  )
}
