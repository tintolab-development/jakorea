/**
 * 학교 등록/수정 폼 컴포넌트
 * Phase 1.4: react-hook-form + zod
 */
/* eslint-disable react-hooks/incompatible-library -- React Hook Form watch 사용 */

import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import { Form, Input, Select, Space } from 'antd'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsPhoneInput } from '@/shared/ui/cms-phone-input'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { schoolSchema, type SchoolFormData } from '@/entities/school/model/schema'
import type { School } from '@/types/domain'
import { fieldValidationHelp } from '@/shared/utils/error-handler'

const { Option } = Select

interface SchoolFormProps {
  school?: School
  onSubmit: (data: SchoolFormData) => Promise<void>
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

export function SchoolForm({ school, onSubmit, onCancel, loading }: SchoolFormProps) {
  // defaultValues를 useMemo로 계산하여 항상 최신 값 사용
  const defaultValues = useMemo<SchoolFormData | undefined>(() => {
    if (school) {
      return {
        name: school.name,
        region: school.region,
        address: school.address || '',
        contactPerson: school.contactPerson,
        contactPhone: formatKoreanPhoneNumber(school.contactPhone || ''),
        contactEmail: school.contactEmail || '',
      }
    }
    return undefined
  }, [school])

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues,
  })

  // school prop이 변경될 때 폼 값 업데이트
  useEffect(() => {
    if (school) {
      reset({
        name: school.name,
        region: school.region,
        address: school.address || '',
        contactPerson: school.contactPerson,
        contactPhone: formatKoreanPhoneNumber(school.contactPhone || ''),
        contactEmail: school.contactEmail || '',
      })
    } else {
      // school이 없으면 폼 초기화 (등록 모드)
      reset({
        name: '',
        region: '',
        address: '',
        contactPerson: '',
        contactPhone: '',
        contactEmail: '',
      })
    }
  }, [school, reset])

  const onFormSubmit = async (data: SchoolFormData) => {
    await onSubmit(data)
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
      <Form.Item
        label="학교명"
        validateStatus={errors.name ? 'error' : ''}
        help={fieldValidationHelp(errors.name)}
      >
        <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
      </Form.Item>

      <Form.Item
        label="지역"
        validateStatus={errors.region ? 'error' : ''}
        help={fieldValidationHelp(errors.region)}
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

      <Form.Item label="주소">
        <Controller name="address" control={control} render={({ field }) => <Input {...field} />} />
      </Form.Item>

      <Form.Item
        label="담당자"
        validateStatus={errors.contactPerson ? 'error' : ''}
        help={fieldValidationHelp(errors.contactPerson)}
      >
        <Controller
          name="contactPerson"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </Form.Item>

      <Form.Item
        label="연락처"
        validateStatus={errors.contactPhone ? 'error' : ''}
        help={fieldValidationHelp(errors.contactPhone)}
      >
        <Controller
          name="contactPhone"
          control={control}
          render={({ field }) => <CmsPhoneInput {...field} />}
        />
      </Form.Item>

      <Form.Item
        label="이메일"
        validateStatus={errors.contactEmail ? 'error' : ''}
        help={fieldValidationHelp(errors.contactEmail)}
      >
        <Controller
          name="contactEmail"
          control={control}
          render={({ field }) => <Input type="email" {...field} />}
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <CmsButton type="submit" loading={loading}>
            {school ? '수정' : '등록'}
          </CmsButton>
          <CmsButton variant="secondary" onClick={onCancel}>
            취소
          </CmsButton>
        </Space>
      </Form.Item>
    </Form>
  )
}
