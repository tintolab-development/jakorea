/**
 * 스폰서 등록/수정 폼 컴포넌트
 * Phase 1.3: react-hook-form + zod
 */

import { useEffect, useMemo } from 'react'
import { Form, Input, Button, Space } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sponsorSchema, type SponsorFormData } from '@/entities/sponsor/model/schema'
import type { Sponsor } from '@/types/domain'

const { TextArea } = Input

interface SponsorFormProps {
  sponsor?: Sponsor
  onSubmit: (data: SponsorFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function SponsorForm({ sponsor, onSubmit, onCancel, loading }: SponsorFormProps) {
  const defaultValues = useMemo<SponsorFormData | undefined>(() => {
    if (sponsor) {
      return {
        name: sponsor.name,
        description: sponsor.description || '',
        contactInfo: sponsor.contactInfo || '',
        securityMemo: sponsor.securityMemo || '',
      }
    }
    return undefined
  }, [sponsor])

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SponsorFormData>({
    resolver: zodResolver(sponsorSchema),
    defaultValues,
  })

  // sponsor prop이 변경될 때 폼 값 업데이트
  useEffect(() => {
    if (sponsor) {
      reset({
        name: sponsor.name,
        description: sponsor.description || '',
        contactInfo: sponsor.contactInfo || '',
        securityMemo: sponsor.securityMemo || '',
      })
    } else {
      reset({
        name: '',
        description: '',
        contactInfo: '',
        securityMemo: '',
      })
    }
  }, [sponsor, reset])

  const onFormSubmit = async (data: SponsorFormData) => {
    await onSubmit(data)
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
      <Form.Item
        label="스폰서명"
        validateStatus={errors.name ? 'error' : ''}
        help={errors.name?.message}
      >
        <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
      </Form.Item>

      <Form.Item label="설명">
        <Controller
          name="description"
          control={control}
          render={({ field }) => <TextArea {...field} rows={4} />}
        />
      </Form.Item>

      <Form.Item label="연락처">
        <Controller
          name="contactInfo"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </Form.Item>

      <Form.Item label="보안 메모">
        <Controller
          name="securityMemo"
          control={control}
          render={({ field }) => <TextArea {...field} rows={3} placeholder="보안/정책 관련 메모" />}
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {sponsor ? '수정' : '등록'}
          </Button>
          <Button onClick={onCancel}>취소</Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
