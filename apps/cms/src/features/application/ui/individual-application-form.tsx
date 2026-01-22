/**
 * 개인(참여자) 신청서 폼 컴포넌트
 * Phase 0.2.2: 신청서 작성 (FR-C03)
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, Input, Button, Space } from 'antd'
import { individualApplicationSchema, type IndividualApplicationFormData } from '@/entities/application/model/schema'
import type { Program } from '@/types/domain'
import { useAuthStore } from '@/features/auth/model/auth-store'

const { TextArea } = Input

interface IndividualApplicationFormProps {
  program: Program
  applicationPath?: unknown // 향후 사용 예정
  onSubmit: (data: IndividualApplicationFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function IndividualApplicationForm({
  program,
  applicationPath, // 향후 사용 예정
  onSubmit,
  onCancel,
  loading,
}: IndividualApplicationFormProps) {
  // 향후 applicationPath 사용 예정
  void applicationPath
  const { user } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IndividualApplicationFormData>({
    resolver: zodResolver(individualApplicationSchema),
    defaultValues: {
      programId: program.id,
      subjectType: 'student',
      subjectId: user?.id || '',
      status: 'submitted',
    },
  })

  const onFormSubmit = async (data: IndividualApplicationFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('신청 실패:', error)
      throw error
    }
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
      <Form.Item label="프로그램">
        <Input value={program.title} disabled />
      </Form.Item>

      <Form.Item label="지원 동기" validateStatus={errors.motivation ? 'error' : ''} help={errors.motivation?.message}>
        <TextArea
          {...register('motivation')}
          rows={4}
          placeholder="이 프로그램에 지원하는 동기를 입력해주세요"
        />
      </Form.Item>

      <Form.Item label="비고">
        <TextArea {...register('notes')} rows={3} placeholder="추가 정보나 메모를 입력해주세요" />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            신청하기
          </Button>
          <Button onClick={onCancel}>취소</Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
