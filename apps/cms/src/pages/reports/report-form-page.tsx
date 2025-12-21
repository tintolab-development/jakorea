/**
 * 보고서 작성 화면
 * Phase 5.9: 사용자가 보고서 제출의 의미와 중요성을 이해
 * 참고 화면: U-04-04 보고서 작성
 */

import { useSearchParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Card, Space, Typography, Form, Input, InputNumber, Button, Alert, message } from 'antd'
import { GuideMessage } from '@/shared/ui'
import {
  lectureReportFields,
  volunteerReportFields,
  programReportFields,
  reportSubmissionGuides,
} from '@/data/mock/reports'
import type { ReportType, ReportField } from '@/types/domain'

const { Title, Paragraph } = Typography
const { TextArea } = Input

export function ReportFormPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const reportType = (searchParams.get('type') || 'lecture') as ReportType

  // 보고서 타입에 따른 필드 선택
  const reportFields: ReportField[] =
    reportType === 'lecture'
      ? lectureReportFields
      : reportType === 'volunteer'
        ? volunteerReportFields
        : programReportFields

  // 보고서 제목
  const reportTitle =
    reportType === 'lecture'
      ? '강의보고서 작성'
      : reportType === 'volunteer'
        ? '교육봉사 활동보고서 작성'
        : '프로그램 종료 보고서 작성'

  // 제출 가이드
  const submissionGuide = reportSubmissionGuides[reportType]

  // 필드 렌더링 함수
  const renderField = (field: ReportField) => {
    switch (field.type) {
      case 'textarea':
        return (
          <Form.Item
            key={field.id}
            name={field.id}
            label={field.label}
            rules={[
              {
                required: field.required,
                message: `${field.label}을(를) 입력해주세요.`,
              },
            ]}
          >
            <TextArea
              rows={4}
              placeholder={field.placeholder}
              showCount
              maxLength={2000}
            />
          </Form.Item>
        )
      case 'number':
        return (
          <Form.Item
            key={field.id}
            name={field.id}
            label={field.label}
            rules={[
              {
                required: field.required,
                message: `${field.label}을(를) 입력해주세요.`,
              },
              {
                type: 'number',
                min: field.validation?.min,
                max: field.validation?.max,
                message: `${field.validation?.min || 0} 이상 ${field.validation?.max || '무제한'} 이하의 값을 입력해주세요.`,
              },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder={field.placeholder}
              min={field.validation?.min}
              max={field.validation?.max}
            />
          </Form.Item>
        )
      case 'text':
        return (
          <Form.Item
            key={field.id}
            name={field.id}
            label={field.label}
            rules={[
              {
                required: field.required,
                message: `${field.label}을(를) 입력해주세요.`,
              },
            ]}
          >
            <Input placeholder={field.placeholder} />
          </Form.Item>
        )
      case 'select':
        return (
          <Form.Item
            key={field.id}
            name={field.id}
            label={field.label}
            rules={[
              {
                required: field.required,
                message: `${field.label}을(를) 선택해주세요.`,
              },
            ]}
          >
            <Input placeholder={field.placeholder} />
          </Form.Item>
        )
      default:
        return null
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // TODO: 실제 API 호출
      // const endpoint = reportType === 'lecture' ? '/reports/lecture' : '/reports/volunteer'
      // await fetch(endpoint, { method: 'POST', body: JSON.stringify({ ...values, activityId, programId }) })

      // Mock: 제출 성공 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000))

      message.success('보고서가 제출되었습니다.')
      navigate('/')
    } catch {
      message.error('보고서 제출 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 보고서 안내 영역 (상단) */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Title level={2} style={{ margin: 0 }}>
              {reportTitle}
            </Title>
            {submissionGuide && (
              <Paragraph style={{ margin: 0, fontSize: 16 }}>
                {submissionGuide}
              </Paragraph>
            )}
            <Alert
              message="보고서 제출은 필수 절차입니다"
              description="보고서를 제출하지 않으면 다음 단계로 진행할 수 없습니다."
              type="info"
              showIcon
            />
          </Space>
        </Card>

        {/* 보고서 입력 영역 (핵심) */}
        <Card title="보고서 작성">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{}}
          >
            {reportFields.map(field => renderField(field))}
          </Form>
        </Card>

        {/* 제출 전 주의 안내 영역 */}
        <Card>
          <Alert
            message="제출 전 확인"
            description="보고서 제출 후에는 수정할 수 없습니다. 내용을 다시 한 번 확인해 주세요."
            type="warning"
            showIcon
          />
        </Card>

        {/* 제출 CTA 영역 (단일) */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              onClick={() => form.submit()}
              loading={loading}
              style={{ minWidth: 200 }}
            >
              보고서 제출하기
            </Button>
          </Space>
        </Card>

        {/* 보조 안내 영역 */}
        <Card>
          <GuideMessage
            message={
              reportType === 'lecture'
                ? '보고서 제출 후 정산 절차가 진행됩니다.'
                : reportType === 'volunteer'
                  ? '보고서 제출 후 봉사시간 확정 절차가 진행됩니다.'
                  : '보고서 제출 후 프로그램 이력이 확정됩니다.'
            }
            type="info"
          />
        </Card>
      </Space>
    </div>
  )
}

