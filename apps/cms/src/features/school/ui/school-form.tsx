/**
 * 학교 등록/수정 폼 컴포넌트
 * Phase 1.4: react-hook-form + zod
 */

import { Form, Input, Select, Button, Card, Space } from 'antd'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { schoolSchema, type SchoolFormData } from '@/entities/school/model/schema'
import type { School } from '@/types/domain'

const { Option } = Select

interface SchoolFormProps {
  school?: School
  onSubmit: (data: SchoolFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const regions = [
  '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산',
  '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
]

export function SchoolForm({ school, onSubmit, onCancel, loading }: SchoolFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: school
      ? {
          name: school.name,
          region: school.region,
          address: school.address || '',
          contactPerson: school.contactPerson,
          contactPhone: school.contactPhone || '',
          contactEmail: school.contactEmail || '',
        }
      : undefined,
  })

  const onFormSubmit = async (data: SchoolFormData) => {
    await onSubmit(data)
  }

  return (
    <Card title={school ? '학교 수정' : '학교 등록'}>
      <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
        <Form.Item label="학교명" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Input {...register('name')} />
        </Form.Item>

        <Form.Item label="지역" validateStatus={errors.region ? 'error' : ''} help={errors.region?.message}>
          <Select
            value={watch('region')}
            onChange={value => setValue('region', value)}
            placeholder="지역 선택"
          >
            {regions.map(region => (
              <Option key={region} value={region}>
                {region}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="주소">
          <Input {...register('address')} />
        </Form.Item>

        <Form.Item
          label="담당자"
          validateStatus={errors.contactPerson ? 'error' : ''}
          help={errors.contactPerson?.message}
        >
          <Input {...register('contactPerson')} />
        </Form.Item>

        <Form.Item label="연락처">
          <Input {...register('contactPhone')} />
        </Form.Item>

        <Form.Item
          label="이메일"
          validateStatus={errors.contactEmail ? 'error' : ''}
          help={errors.contactEmail?.message}
        >
          <Input type="email" {...register('contactEmail')} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {school ? '수정' : '등록'}
            </Button>
            <Button onClick={onCancel}>취소</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}







