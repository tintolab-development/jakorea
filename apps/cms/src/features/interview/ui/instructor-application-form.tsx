/**
 * 강사/수강자 신청 폼 컴포넌트
 * Phase 4.3.1: 강사/수강자 신청
 */
/* eslint-disable react-hooks/incompatible-library -- React Hook Form watch 사용 */

import { Form, Input, Select, Button, Card, Space, Alert, Divider } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  instructorApplicationFormSchema,
  type InstructorApplicationFormData,
} from '@/entities/interview/model/schema'
import { InterviewStatusBadge } from '@/shared/components/interview-status-badge'
import type { InterviewStatus } from '@/types/user'

const { Option } = Select
const { TextArea } = Input

interface InstructorApplicationFormProps {
  onSubmit: (data: InstructorApplicationFormData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

// 지역 옵션
const regionOptions = [
  { value: '서울', label: '서울' },
  { value: '경기', label: '경기' },
  { value: '인천', label: '인천' },
  { value: '강원', label: '강원' },
  { value: '충북', label: '충북' },
  { value: '충남', label: '충남' },
  { value: '대전', label: '대전' },
  { value: '세종', label: '세종' },
  { value: '부산', label: '부산' },
  { value: '울산', label: '울산' },
  { value: '경남', label: '경남' },
  { value: '경북', label: '경북' },
  { value: '대구', label: '대구' },
  { value: '광주', label: '광주' },
  { value: '전남', label: '전남' },
  { value: '전북', label: '전북' },
  { value: '제주', label: '제주' },
]

// 전문분야 옵션
const specialtyOptions = [
  { value: '경제', label: '경제' },
  { value: '금융', label: '금융' },
  { value: '창업', label: '창업' },
  { value: '마케팅', label: '마케팅' },
  { value: '디자인', label: '디자인' },
  { value: 'IT', label: 'IT' },
  { value: '언어', label: '언어' },
  { value: '기타', label: '기타' },
]

/**
 * 면접 필요 여부 판단
 * 참여이력이 0개이면 면접 필요, 1개 이상이면 면접 불필요
 */
function determineInterviewStatus(participationHistory: number): InterviewStatus {
  return participationHistory === 0 ? 'PENDING' : 'NOT_REQUIRED'
}

export function InstructorApplicationForm({
  onSubmit,
  onCancel,
  loading,
}: InstructorApplicationFormProps) {
  const {
    control,
    handleSubmit,
    watch,
  } = useForm<InstructorApplicationFormData>({
    resolver: zodResolver(instructorApplicationFormSchema),
    defaultValues: {
      participationHistory: 0,
      specialty: [],
      role: 'INSTRUCTOR',
    },
  })

  const participationHistory = watch('participationHistory')
  const interviewStatus = determineInterviewStatus(participationHistory || 0)

  const onFormSubmit = async (data: InstructorApplicationFormData) => {
    await onSubmit(data)
  }

  return (
    <Card>
      <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
        {/* 면접 필요 여부 안내 */}
        {participationHistory !== undefined && (
          <Alert
            message={
              <Space>
                <span>예상 상태:</span>
                <InterviewStatusBadge status={interviewStatus} />
                {interviewStatus === 'PENDING' ? (
                  <span>참여이력이 없어 면접이 필요합니다.</span>
                ) : (
                  <span>참여이력이 있어 면접 없이 자동 승인될 수 있습니다.</span>
                )}
              </Space>
            }
            type={interviewStatus === 'PENDING' ? 'warning' : 'info'}
            style={{ marginBottom: 24 }}
          />
        )}

        {/* 기본 정보 */}
        <Divider orientation="left">기본 정보</Divider>

        <Controller
          name="role"
          control={control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="신청 유형"
              required
              validateStatus={fieldState.error ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <Select {...field} style={{ width: '100%' }}>
                <Option value="INSTRUCTOR">강사</Option>
                <Option value="INDIVIDUAL">개인(참여자)</Option>
                <Option value="SCHOOL">학교</Option>
              </Select>
            </Form.Item>
          )}
        />

        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="이름"
              required
              validateStatus={fieldState.error ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <Input {...field} placeholder="이름을 입력해주세요" />
            </Form.Item>
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="이메일"
              required
              validateStatus={fieldState.error ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <Input type="email" {...field} placeholder="이메일을 입력해주세요" />
            </Form.Item>
          )}
        />

        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="연락처"
              required
              validateStatus={fieldState.error ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <Input {...field} placeholder="연락처를 입력해주세요" />
            </Form.Item>
          )}
        />

        <Controller
          name="region"
          control={control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="지역"
              required
              validateStatus={fieldState.error ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <Select {...field} placeholder="지역을 선택해주세요" style={{ width: '100%' }}>
                {regionOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
        />

        <Controller
          name="specialty"
          control={control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="전문분야"
              required
              validateStatus={fieldState.error ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <Select
                {...field}
                mode="multiple"
                placeholder="전문분야를 선택해주세요"
                style={{ width: '100%' }}
              >
                {specialtyOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
        />

        {/* 참여이력 */}
        <Divider orientation="left">참여이력</Divider>

        <Controller
          name="participationHistory"
          control={control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="이전 프로그램 참여 횟수"
              required
              validateStatus={fieldState.error ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <Input
                type="number"
                min={0}
                {...field}
                value={field.value}
                onChange={e => {
                  const value = parseInt(e.target.value) || 0
                  field.onChange(value)
                }}
                placeholder="0"
              />
              <div style={{ marginTop: 8, fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                참여이력이 0개이면 면접이 필요하며, 1개 이상이면 면접 없이 자동 승인될 수 있습니다.
              </div>
            </Form.Item>
          )}
        />

        {/* 추가 정보 */}
        <Divider orientation="left">추가 정보 (선택사항)</Divider>

        <Controller
          name="experience"
          control={control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="이력"
              validateStatus={fieldState.error ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <TextArea {...field} rows={4} placeholder="관련 경력이나 이력을 입력해주세요" />
            </Form.Item>
          )}
        />

        <Controller
          name="availableTime"
          control={control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="가능 시간"
              validateStatus={fieldState.error ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <Input {...field} placeholder="예: 평일 오후, 주말" />
            </Form.Item>
          )}
        />

        {/* 버튼 */}
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              신청하기
            </Button>
            {onCancel && (
              <Button onClick={onCancel} disabled={loading}>
                취소
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}

