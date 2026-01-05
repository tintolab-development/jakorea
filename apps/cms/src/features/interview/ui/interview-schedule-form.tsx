/**
 * 면접 일정 등록 폼 컴포넌트
 * Phase 4.3.2: 면접 관리
 */

import { Form, DatePicker, Input, Button, Space } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { interviewScheduleSchema, type InterviewScheduleFormData } from '@/entities/interview/model/schema'
import dayjs from 'dayjs'
import type { Interview } from '@/types/interview'

const { TextArea } = Input

interface InterviewScheduleFormProps {
  interview: Interview | null
  onSubmit: (data: { scheduledAt: string; location?: string; notes?: string }) => Promise<void>
  onCancel: () => void
}

export function InterviewScheduleForm({ interview, onSubmit, onCancel }: InterviewScheduleFormProps) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<InterviewScheduleFormData>({
    resolver: zodResolver(interviewScheduleSchema),
    defaultValues: {
      location: interview?.location || '',
      notes: '',
    },
  })

  const onFormSubmit = async (data: InterviewScheduleFormData) => {
    await onSubmit({
      scheduledAt: data.scheduledAt.toISOString(),
      location: data.location,
      notes: data.notes,
    })
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
      <Controller
        name="scheduledAt"
        control={control}
        render={({ field, fieldState }) => (
          <Form.Item
            label="면접 일정"
            required
            validateStatus={fieldState.error ? 'error' : ''}
            help={fieldState.error?.message}
          >
            <DatePicker
              {...field}
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              value={field.value ? dayjs(field.value) : undefined}
              onChange={(date) => field.onChange(date?.toDate())}
            />
          </Form.Item>
        )}
      />

      <Controller
        name="location"
        control={control}
        render={({ field, fieldState }) => (
          <Form.Item
            label="면접 장소"
            validateStatus={fieldState.error ? 'error' : ''}
            help={fieldState.error?.message}
          >
            <Input {...field} placeholder="면접 장소를 입력해주세요" />
          </Form.Item>
        )}
      />

      <Controller
        name="notes"
        control={control}
        render={({ field, fieldState }) => (
          <Form.Item
            label="메모"
            validateStatus={fieldState.error ? 'error' : ''}
            help={fieldState.error?.message}
          >
            <TextArea {...field} rows={4} placeholder="면접 관련 메모를 입력해주세요" />
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

