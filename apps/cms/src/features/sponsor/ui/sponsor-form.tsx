/**
 * 스폰서 등록/수정 폼 컴포넌트
 * Phase 1.3: react-hook-form + zod
 */

import { Form, Input, Button, Card, Space } from 'antd'
import { useForm } from 'react-hook-form'
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SponsorFormData>({
    resolver: zodResolver(sponsorSchema),
    defaultValues: sponsor
      ? {
          name: sponsor.name,
          description: sponsor.description || '',
          contactInfo: sponsor.contactInfo || '',
          securityMemo: sponsor.securityMemo || '',
        }
      : undefined,
  })

  const onFormSubmit = async (data: SponsorFormData) => {
    await onSubmit(data)
  }

  return (
    <Card title={sponsor ? '스폰서 수정' : '스폰서 등록'}>
      <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
        <Form.Item label="스폰서명" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Input {...register('name')} />
        </Form.Item>

        <Form.Item label="설명">
          <TextArea {...register('description')} rows={4} />
        </Form.Item>

        <Form.Item label="연락처">
          <Input {...register('contactInfo')} />
        </Form.Item>

        <Form.Item label="보안 메모">
          <TextArea {...register('securityMemo')} rows={3} placeholder="보안/정책 관련 메모" />
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
    </Card>
  )
}





