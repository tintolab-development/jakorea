/**
 * 개인(참여자) 신청서 폼 컴포넌트
 * Phase 0.2.2: 신청서 작성 (FR-C03) + 템플릿 기반 동적 폼
 */

import { useMemo, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, Input, Button, Space } from 'antd'
import { individualApplicationSchema, type IndividualApplicationFormData } from '@/entities/application/model/schema'
import type { Program } from '@/types/domain'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getFormTemplateByProgramId } from '@/data/mock/form-templates'
import {
  DynamicApplicationForm,
  validateDynamicFields,
} from './dynamic-application-form'

const { TextArea } = Input

interface IndividualApplicationFormProps {
  program: Program
  applicationPath?: unknown
  onSubmit: (data: IndividualApplicationFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function IndividualApplicationForm({
  program,
  applicationPath,
  onSubmit,
  onCancel,
  loading,
}: IndividualApplicationFormProps) {
  void applicationPath
  const { user } = useAuthStore()
  const template = useMemo(() => getFormTemplateByProgramId(program.id), [program.id])
  const [customFieldErrors, setCustomFieldErrors] = useState<Record<string, string>>({})

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<IndividualApplicationFormData>({
    resolver: zodResolver(individualApplicationSchema),
    defaultValues: {
      programId: program.id,
      subjectType: 'student',
      subjectId: user?.id || '',
      status: 'submitted',
      customFields: {},
    },
  })

  const customFieldsValue = watch('customFields') ?? {}

  const handleCustomFieldsChange = useCallback(
    (value: Record<string, unknown>) => {
      setValue('customFields', value, { shouldDirty: true })
      setCustomFieldErrors(prev => (Object.keys(prev).length ? {} : prev))
    },
    [setValue]
  )

  const onFormSubmit = async (data: IndividualApplicationFormData) => {
    const customErrors = validateDynamicFields(
      template.customFields,
      data.customFields ?? {}
    )
    if (Object.keys(customErrors).length > 0) {
      setCustomFieldErrors(customErrors)
      return
    }
    setCustomFieldErrors({})
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

      <DynamicApplicationForm
        fields={template.customFields}
        value={customFieldsValue}
        onChange={handleCustomFieldsChange}
        fieldErrors={customFieldErrors}
      />

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
