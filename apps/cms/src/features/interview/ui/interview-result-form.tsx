/**
 * 면접 결과 입력 폼 컴포넌트
 * Phase 4.3.2: 면접 관리
 */

import { Form, Radio, Input, Button, Space } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { interviewResultSchema, type InterviewResultFormData } from '@/entities/interview/model/schema'
import type { Interview } from '@/types/interview'

const { TextArea } = Input

interface InterviewResultFormProps {
  interview: Interview | null
  onSubmit: (data: { result: 'PASS' | 'FAIL'; notes?: string }) => Promise<void>
  onCancel: () => void
}

export function InterviewResultForm({ interview: _interview, onSubmit, onCancel }: InterviewResultFormProps) {
  // interview는 현재 사용하지 않지만 향후 확장을 위해 유지
  void _interview
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<InterviewResultFormData>({
    resolver: zodResolver(interviewResultSchema),
  })

  const onFormSubmit = async (data: InterviewResultFormData) => {
    await onSubmit({
      result: data.result,
      notes: data.notes,
    })
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
      <Controller
        name="result"
        control={control}
        render={({ field, fieldState }) => (
          <Form.Item
            label="면접 결과"
            required
            validateStatus={fieldState.error ? 'error' : ''}
            help={fieldState.error?.message}
          >
            <Radio.Group {...field}>
              <Radio value="PASS">합격</Radio>
              <Radio value="FAIL">불합격</Radio>
            </Radio.Group>
          </Form.Item>
        )}
      />

      <Controller
        name="notes"
        control={control}
        render={({ field, fieldState }) => (
          <Form.Item
            label="면접 노트"
            validateStatus={fieldState.error ? 'error' : ''}
            help={fieldState.error?.message}
          >
            <TextArea {...field} rows={4} placeholder="면접 노트를 입력해주세요" />
          </Form.Item>
        )}
      />

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            등록
          </Button>
          <Button onClick={onCancel} disabled={isSubmitting}>
            취소
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}

