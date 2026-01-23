/**
 * 강사 등록/수정 폼 컴포넌트
 * Phase 1.2: react-hook-form + zod
 */
/* eslint-disable react-hooks/incompatible-library -- React Hook Form watch 사용 */

import { Form, Input, Select, Button, Space } from 'antd'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { instructorSchema, type InstructorFormData } from '@/entities/instructor/model/schema'
import type { Instructor } from '@/types/domain'

const { Option } = Select
const { TextArea } = Input

interface InstructorFormProps {
  instructor?: Instructor
  onSubmit: (data: InstructorFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const regions = [
  '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산',
  '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
]

const specialties = [
  'AI/머신러닝', '데이터 분석', '웹 개발', '모바일 개발', '디자인', '마케팅',
  '비즈니스', '언어/문학', '수학', '과학', '예술', '음악', '체육',
  '진로/진학', '창의성', '리더십', '커뮤니케이션', '기업가정신',
]

const banks = [
  '국민은행', '신한은행', '우리은행', '하나은행', 'SC제일은행',
  '기업은행', '농협은행', '카카오뱅크', '토스뱅크', '케이뱅크',
  '새마을금고', '신협', '우체국', '수협은행', '대구은행',
  '부산은행', '경남은행', '광주은행', '전북은행', '제주은행',
]

export function InstructorForm({ instructor, onSubmit, onCancel, loading }: InstructorFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<InstructorFormData>({
    resolver: zodResolver(instructorSchema),
    defaultValues: instructor
      ? {
          name: instructor.name,
          contactPhone: instructor.contactPhone,
          contactEmail: instructor.contactEmail || '',
          region: instructor.region,
          specialty: instructor.specialty,
          availableTime: instructor.availableTime || '',
          experience: instructor.experience || '',
          rating: instructor.rating,
          bankName: instructor.bankName || '',
          bankAccount: instructor.bankAccount || '',
          accountHolder: instructor.accountHolder || '',
        }
      : undefined,
  })

  const selectedSpecialties = watch('specialty') || []

  const onFormSubmit = async (data: InstructorFormData) => {
    await onSubmit(data)
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
        <Form.Item label="이름" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Input {...register('name')} />
        </Form.Item>

        <Form.Item
          label="연락처"
          validateStatus={errors.contactPhone ? 'error' : ''}
          help={errors.contactPhone?.message}
        >
          <Input {...register('contactPhone')} />
        </Form.Item>

        <Form.Item
          label="이메일"
          validateStatus={errors.contactEmail ? 'error' : ''}
          help={errors.contactEmail?.message}
        >
          <Input type="email" {...register('contactEmail')} />
        </Form.Item>

        <Form.Item label="지역" validateStatus={errors.region ? 'error' : ''} help={errors.region?.message} required>
          <Select
            value={watch('region')}
            onChange={value => setValue('region', value, { shouldValidate: true })}
            placeholder="지역 선택"
          >
            {regions.map(region => (
              <Option key={region} value={region}>
                {region}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="전문분야"
          validateStatus={errors.specialty ? 'error' : ''}
          help={errors.specialty?.message}
          required
        >
          <Select
            mode="multiple"
            value={selectedSpecialties}
            onChange={value => setValue('specialty', value, { shouldValidate: true })}
            placeholder="전문분야 선택"
          >
            {specialties.map(specialty => (
              <Option key={specialty} value={specialty}>
                {specialty}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="가능 시간">
          <TextArea {...register('availableTime')} rows={2} />
        </Form.Item>

        <Form.Item label="이력">
          <TextArea {...register('experience')} rows={4} />
        </Form.Item>

        <Form.Item label="평점">
          <Input type="number" min={0} max={5} step={0.1} {...register('rating', { valueAsNumber: true })} />
        </Form.Item>

        <Form.Item
          label="은행명"
          validateStatus={errors.bankName ? 'error' : ''}
          help={errors.bankName?.message}
        >
          <Select
            value={watch('bankName')}
            onChange={value => setValue('bankName', value, { shouldValidate: true })}
            placeholder="은행 선택"
            allowClear
          >
            {banks.map(bank => (
              <Option key={bank} value={bank}>
                {bank}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="계좌번호"
          validateStatus={errors.bankAccount ? 'error' : ''}
          help={errors.bankAccount?.message}
        >
          <Input {...register('bankAccount')} placeholder="'-' 없이 숫자만 입력" />
        </Form.Item>

        <Form.Item label="예금주">
          <Input {...register('accountHolder')} placeholder="예금주명" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {instructor ? '수정' : '등록'}
            </Button>
            <Button onClick={onCancel}>취소</Button>
          </Space>
        </Form.Item>
      </Form>
  )
}

