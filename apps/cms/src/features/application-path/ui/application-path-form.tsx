/**
 * 신청 경로 등록/수정 폼 컴포넌트
 * V3 Phase 7: 신청 경로 관리
 */

import { Form, Select, Input, Button, Space, Switch } from 'antd'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { applicationPathSchema, type ApplicationPathFormData } from '@/entities/application-path/model/schema'
import type { ApplicationPath } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'

const { Option } = Select
const { TextArea } = Input

interface ApplicationPathFormProps {
  path?: ApplicationPath
  onSubmit: (data: ApplicationPathFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const pathTypeLabels: Record<ApplicationPath['pathType'], string> = {
  google_form: '구글폼',
  internal: '자동화 프로그램',
}

export function ApplicationPathForm({
  path,
  onSubmit,
  onCancel,
  loading,
}: ApplicationPathFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ApplicationPathFormData>({
    resolver: zodResolver(applicationPathSchema),
    defaultValues: path
      ? {
          programId: path.programId,
          pathType: path.pathType,
          googleFormUrl: path.googleFormUrl || '',
          guideMessage: path.guideMessage || '',
          isActive: path.isActive,
        }
      : {
          isActive: true,
        },
  })

  const selectedPathType = watch('pathType')
  const programs = programService.getAllSync()

  const onFormSubmit = async (data: ApplicationPathFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Failed to submit application path:', error)
    }
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
      <Form.Item
        label="프로그램"
        validateStatus={errors.programId ? 'error' : ''}
        help={errors.programId?.message}
        required
      >
        <Select
          value={watch('programId')}
          onChange={value => {
            setValue('programId', value)
          }}
          placeholder="프로그램을 선택하세요"
          disabled={!!path} // 수정 시에는 프로그램 변경 불가
        >
          {programs.map(program => (
            <Option key={program.id} value={program.id}>
              {program.title}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="신청 경로"
        validateStatus={errors.pathType ? 'error' : ''}
        help={errors.pathType?.message}
        required
      >
        <Select
          value={watch('pathType')}
          onChange={value => {
            setValue('pathType', value)
            // 구글폼이 아닌 경우 URL 초기화
            if (value !== 'google_form') {
              setValue('googleFormUrl', '')
            }
          }}
          placeholder="신청 경로를 선택하세요"
        >
          <Option value="google_form">{pathTypeLabels.google_form}</Option>
          <Option value="internal">{pathTypeLabels.internal}</Option>
        </Select>
      </Form.Item>

      {selectedPathType === 'google_form' && (
        <Form.Item
          label="구글폼 링크"
          validateStatus={errors.googleFormUrl ? 'error' : ''}
          help={errors.googleFormUrl?.message}
          required
        >
          <Input
            {...register('googleFormUrl')}
            placeholder="https://docs.google.com/forms/..."
            type="url"
          />
        </Form.Item>
      )}

      <Form.Item
        label="안내 문구"
        validateStatus={errors.guideMessage ? 'error' : ''}
        help={errors.guideMessage?.message}
      >
        <TextArea
          {...register('guideMessage')}
          rows={4}
          placeholder="신청 경로별 안내 문구를 입력하세요"
        />
      </Form.Item>

      <Form.Item label="활성화">
        <Switch
          checked={watch('isActive')}
          onChange={checked => {
            setValue('isActive', checked)
          }}
        />
        <span style={{ marginLeft: 8 }}>
          {watch('isActive') ? '활성' : '비활성'}
        </span>
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {path ? '수정' : '등록'}
          </Button>
          <Button onClick={onCancel}>취소</Button>
        </Space>
      </Form.Item>
    </Form>
  )
}

