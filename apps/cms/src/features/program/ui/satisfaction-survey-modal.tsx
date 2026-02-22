/**
 * 만족도 조사 모달 컴포넌트
 * FSD: features/program으로 이동 (shared는 entities 미참조)
 */

import { Modal, Form, Rate, Input, Button, message } from 'antd'
import { FormOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { MESSAGES } from '@/shared/constants'
import type { MyProgram } from '@/entities/program/api/instructor-program-service'
import dayjs from 'dayjs'

const { TextArea } = Input

interface SatisfactionFormData {
  programRating: number
  contentRating: number
  instructorRating: number
  overallRating: number
  strengths?: string
  improvements?: string
  additionalComments?: string
}

interface SatisfactionSurveyModalProps {
  open: boolean
  program: MyProgram | null
  existingRecord?: {
    ratings: SatisfactionFormData
    submittedAt: string
  }
  onCancel: () => void
  onSuccess?: () => void
}

export function SatisfactionSurveyModal({
  open,
  program,
  existingRecord,
  onCancel,
  onSuccess,
}: SatisfactionSurveyModalProps) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && existingRecord) {
      form.setFieldsValue(existingRecord.ratings)
    } else if (open) {
      form.resetFields()
    }
  }, [open, existingRecord, form])

  const handleSubmit = async (values: SatisfactionFormData) => {
    if (!program) return

    setSubmitting(true)
    try {
      // TODO: API 연동 필요
      console.log('Submitting satisfaction survey:', values)
      message.success(MESSAGES.success.satisfactionSurveySubmittedWithThanks)
      form.resetFields()
      onSuccess?.()
      onCancel()
    } catch (e) {
      console.error('Failed to submit satisfaction survey:', e)
      message.error(MESSAGES.error.satisfactionSurveySubmitFailed)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  if (!program) {
    return null
  }

  return (
    <Modal
      open={open}
      title={
        <span>
          <FormOutlined /> 만족도 조사 - {program.title}
        </span>
      }
      onCancel={handleCancel}
      footer={null}
      width={700}
      destroyOnHidden
    >
      {existingRecord && (
        <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
          이전에 제출한 만족도 조사가 있습니다. (
          {dayjs(existingRecord.submittedAt).format('YYYY-MM-DD HH:mm')})
        </div>
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 24 }}>
        <Form.Item
          label="프로그램 만족도"
          name="programRating"
          rules={[{ required: true, message: '프로그램 만족도를 선택해주세요' }]}
        >
          <Rate allowClear />
        </Form.Item>

        <Form.Item
          label="내용 만족도"
          name="contentRating"
          rules={[{ required: true, message: '내용 만족도를 선택해주세요' }]}
        >
          <Rate allowClear />
        </Form.Item>

        <Form.Item
          label="강사 만족도"
          name="instructorRating"
          rules={[{ required: true, message: '강사 만족도를 선택해주세요' }]}
        >
          <Rate allowClear />
        </Form.Item>

        <Form.Item
          label="종합 만족도"
          name="overallRating"
          rules={[{ required: true, message: '종합 만족도를 선택해주세요' }]}
        >
          <Rate allowClear />
        </Form.Item>

        <Form.Item label="장점" name="strengths">
          <TextArea
            rows={3}
            placeholder="이 프로그램의 장점을 입력해주세요"
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item label="개선사항" name="improvements">
          <TextArea
            rows={3}
            placeholder="개선이 필요한 부분을 입력해주세요"
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item label="추가 의견" name="additionalComments">
          <TextArea
            rows={4}
            placeholder="기타 의견이나 제안사항을 입력해주세요"
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={handleCancel}>취소</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              제출하기
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  )
}
