/**
 * 강사 등록/수정 폼 컴포넌트
 * Phase 1.2: react-hook-form + zod
 */
/* eslint-disable react-hooks/incompatible-library -- React Hook Form watch 사용 */

import { useEffect, useMemo } from 'react'
import { Form, Input, Select, Button, Space } from 'antd'
import { useForm, Controller } from 'react-hook-form'
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
  '서울',
  '경기',
  '인천',
  '부산',
  '대구',
  '광주',
  '대전',
  '울산',
  '세종',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
]

const specialties = [
  'AI/머신러닝',
  '데이터 분석',
  '웹 개발',
  '모바일 개발',
  '디자인',
  '마케팅',
  '비즈니스',
  '언어/문학',
  '수학',
  '과학',
  '예술',
  '음악',
  '체육',
  '진로/진학',
  '창의성',
  '리더십',
  '커뮤니케이션',
  '기업가정신',
]

const banks = [
  '국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  'SC제일은행',
  '기업은행',
  '농협은행',
  '카카오뱅크',
  '토스뱅크',
  '케이뱅크',
  '새마을금고',
  '신협',
  '우체국',
  '수협은행',
  '대구은행',
  '부산은행',
  '경남은행',
  '광주은행',
  '전북은행',
  '제주은행',
]

export function InstructorForm({ instructor, onSubmit, onCancel, loading }: InstructorFormProps) {
  // defaultValues를 useMemo로 계산하여 항상 최신 값 사용
  const defaultValues = useMemo<InstructorFormData | undefined>(() => {
    if (instructor) {
      return {
        name: instructor.name,
        contactPhone: instructor.contactPhone || '',
        contactEmail: instructor.contactEmail || '',
        region: instructor.region,
        specialty: instructor.specialty || [],
        availableTime: instructor.availableTime || '',
        experience: instructor.experience || '',
        rating: instructor.rating,
        bankName: instructor.bankName || '',
        bankAccount: instructor.bankAccount || '',
        accountHolder: instructor.accountHolder || '',
      }
    }
    return undefined
  }, [instructor])

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InstructorFormData>({
    resolver: zodResolver(instructorSchema),
    defaultValues,
  })

  // instructor prop이 변경될 때 폼 값 업데이트
  useEffect(() => {
    if (instructor) {
      reset({
        name: instructor.name,
        contactPhone: instructor.contactPhone || '',
        contactEmail: instructor.contactEmail || '',
        region: instructor.region,
        specialty: instructor.specialty || [],
        availableTime: instructor.availableTime || '',
        experience: instructor.experience || '',
        rating: instructor.rating,
        bankName: instructor.bankName || '',
        bankAccount: instructor.bankAccount || '',
        accountHolder: instructor.accountHolder || '',
      })
    } else {
      // instructor가 없으면 폼 초기화 (등록 모드)
      reset({
        name: '',
        contactPhone: '',
        contactEmail: '',
        region: '',
        specialty: [],
        availableTime: '',
        experience: '',
        rating: undefined,
        bankName: '',
        bankAccount: '',
        accountHolder: '',
      })
    }
  }, [instructor, reset])

  const onFormSubmit = async (data: InstructorFormData) => {
    await onSubmit(data)
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
      <Form.Item
        label="이름"
        validateStatus={errors.name ? 'error' : ''}
        help={errors.name?.message}
      >
        <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
      </Form.Item>

      <Form.Item
        label="연락처"
        validateStatus={errors.contactPhone ? 'error' : ''}
        help={errors.contactPhone?.message}
      >
        <Controller
          name="contactPhone"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </Form.Item>

      <Form.Item
        label="이메일"
        validateStatus={errors.contactEmail ? 'error' : ''}
        help={errors.contactEmail?.message}
      >
        <Controller
          name="contactEmail"
          control={control}
          render={({ field }) => <Input type="email" {...field} />}
        />
      </Form.Item>

      <Form.Item
        label="지역"
        validateStatus={errors.region ? 'error' : ''}
        help={errors.region?.message}
        required
      >
        <Controller
          name="region"
          control={control}
          render={({ field }) => (
            <Select {...field} placeholder="지역 선택">
              {regions.map(region => (
                <Option key={region} value={region}>
                  {region}
                </Option>
              ))}
            </Select>
          )}
        />
      </Form.Item>

      <Form.Item
        label="전문분야"
        validateStatus={errors.specialty ? 'error' : ''}
        help={errors.specialty?.message}
        required
      >
        <Controller
          name="specialty"
          control={control}
          render={({ field }) => (
            <Select mode="multiple" {...field} placeholder="전문분야 선택">
              {specialties.map(specialty => (
                <Option key={specialty} value={specialty}>
                  {specialty}
                </Option>
              ))}
            </Select>
          )}
        />
      </Form.Item>

      <Form.Item label="가능 시간">
        <Controller
          name="availableTime"
          control={control}
          render={({ field }) => <TextArea {...field} rows={2} />}
        />
      </Form.Item>

      <Form.Item label="이력">
        <Controller
          name="experience"
          control={control}
          render={({ field }) => <TextArea {...field} rows={4} />}
        />
      </Form.Item>

      <Form.Item label="평점">
        <Controller
          name="rating"
          control={control}
          render={({ field }) => (
            <Input
              type="number"
              min={0}
              max={5}
              step={0.1}
              {...field}
              value={field.value ?? ''}
              onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
            />
          )}
        />
      </Form.Item>

      <Form.Item
        label="은행명"
        validateStatus={errors.bankName ? 'error' : ''}
        help={errors.bankName?.message}
      >
        <Controller
          name="bankName"
          control={control}
          render={({ field }) => (
            <Select {...field} placeholder="은행 선택" allowClear>
              {banks.map(bank => (
                <Option key={bank} value={bank}>
                  {bank}
                </Option>
              ))}
            </Select>
          )}
        />
      </Form.Item>

      <Form.Item
        label="계좌번호"
        validateStatus={errors.bankAccount ? 'error' : ''}
        help={errors.bankAccount?.message}
      >
        <Controller
          name="bankAccount"
          control={control}
          render={({ field }) => <Input {...field} placeholder="'-' 없이 숫자만 입력" />}
        />
      </Form.Item>

      <Form.Item label="예금주">
        <Controller
          name="accountHolder"
          control={control}
          render={({ field }) => <Input {...field} placeholder="예금주명" />}
        />
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
