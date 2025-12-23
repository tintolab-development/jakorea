/**
 * 신청 등록/수정 폼 컴포넌트
 * Phase 2.2: react-hook-form + zod
 */

import { Form, Select, Input, Button, Space, message } from 'antd'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { applicationSchema, type ApplicationFormData } from '@/entities/application/model/schema'
import type { Application } from '@/types/domain'
import { mockPrograms, mockSchools, mockInstructors } from '@/data/mock'
import type { ApplicationSubjectType } from '@/types/domain'

const { Option } = Select
const { TextArea } = Input

interface ApplicationFormProps {
  application?: Application
  onSubmit: (data: ApplicationFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const subjectTypeLabels: Record<ApplicationSubjectType, string> = {
  school: '학교',
  student: '학생',
  instructor: '강사',
}

export function ApplicationForm({ application, onSubmit, onCancel, loading }: ApplicationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: application
      ? {
          programId: application.programId,
          roundId: application.roundId || undefined,
          subjectType: application.subjectType,
          subjectId: application.subjectId,
          status: application.status,
          notes: application.notes || '',
        }
      : {
          status: 'submitted',
        },
  })

  const selectedProgramId = watch('programId')
  const selectedSubjectType = watch('subjectType')
  const selectedProgram = mockPrograms.find(p => p.id === selectedProgramId)

  const onFormSubmit = async (data: ApplicationFormData) => {
    try {
      await onSubmit(data)
      message.success(application ? '신청이 수정되었습니다' : '신청이 등록되었습니다')
    } catch {
      message.error(application ? '수정 중 오류가 발생했습니다' : '등록 중 오류가 발생했습니다')
    }
  }

  // 신청 주체 목록 필터링
  const getSubjectOptions = () => {
    if (!selectedSubjectType) return []

    switch (selectedSubjectType) {
      case 'school':
        return mockSchools.map(school => ({
          value: school.id,
          label: school.name,
        }))
      case 'instructor':
        return mockInstructors.map(instructor => ({
          value: instructor.id,
          label: instructor.name,
        }))
      case 'student':
        // 학생은 별도 목록이 없으므로 빈 배열 (실제로는 학생 목록이 필요)
        return []
      default:
        return []
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
              setValue('roundId', undefined) // 프로그램 변경 시 회차 초기화
            }}
            placeholder="프로그램 선택"
            showSearch
            filterOption={(input, option) => {
              const children = option?.children as string | string[] | undefined
              if (typeof children === 'string') {
                return children.toLowerCase().includes(input.toLowerCase())
              }
              if (Array.isArray(children)) {
                return children.some((child: unknown) => 
                  typeof child === 'string' && child.toLowerCase().includes(input.toLowerCase())
                )
              }
              return false
            }}
          >
            {mockPrograms.map(program => (
              <Option key={program.id} value={program.id}>
                {program.title}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedProgram && selectedProgram.rounds.length > 0 && (
          <Form.Item label="회차" help="회차를 선택하지 않으면 전체 프로그램에 신청됩니다">
            <Select
              value={watch('roundId')}
              onChange={value => setValue('roundId', value || undefined)}
              placeholder="회차 선택 (선택사항)"
              allowClear
            >
              {selectedProgram.rounds.map(round => (
                <Option key={round.id} value={round.id}>
                  {round.roundNumber}회차 ({new Date(round.startDate).toLocaleDateString('ko-KR')} ~{' '}
                  {new Date(round.endDate).toLocaleDateString('ko-KR')})
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item
          label="신청 주체 타입"
          validateStatus={errors.subjectType ? 'error' : ''}
          help={errors.subjectType?.message}
          required
        >
          <Select
            value={watch('subjectType')}
            onChange={value => {
              setValue('subjectType', value)
              setValue('subjectId', '') // 주체 타입 변경 시 주체 초기화
            }}
            placeholder="신청 주체 타입 선택"
          >
            {Object.entries(subjectTypeLabels).map(([value, label]) => (
              <Option key={value} value={value}>
                {label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedSubjectType && (
          <Form.Item
            label="신청 주체"
            validateStatus={errors.subjectId ? 'error' : ''}
            help={errors.subjectId?.message || (selectedSubjectType === 'student' ? '학생은 수동으로 입력해주세요' : '')}
            required
          >
            {selectedSubjectType === 'student' ? (
              <Input
                {...register('subjectId')}
                placeholder="학생 이름 또는 ID를 입력해주세요"
              />
            ) : (
              <Select
                value={watch('subjectId')}
                onChange={value => setValue('subjectId', value)}
                placeholder={`${subjectTypeLabels[selectedSubjectType]} 선택`}
                showSearch
                filterOption={(input, option) => {
                  const children = option?.children as string | string[] | undefined
                  if (typeof children === 'string') {
                    return children.toLowerCase().includes(input.toLowerCase())
                  }
                  if (Array.isArray(children)) {
                    return children.some((child: unknown) => 
                      typeof child === 'string' && child.toLowerCase().includes(input.toLowerCase())
                    )
                  }
                  return false
                }}
              >
                {getSubjectOptions().map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            )}
          </Form.Item>
        )}

        {application && (
          <Form.Item
            label="상태"
            validateStatus={errors.status ? 'error' : ''}
            help={errors.status?.message}
            required
          >
            <Select
              value={watch('status')}
              onChange={value => setValue('status', value)}
              placeholder="상태 선택"
            >
              <Option value="submitted">접수</Option>
              <Option value="reviewing">검토</Option>
              <Option value="approved">확정</Option>
              <Option value="rejected">거절</Option>
              <Option value="cancelled">취소</Option>
            </Select>
          </Form.Item>
        )}

        <Form.Item label="비고">
          <TextArea
            {...register('notes')}
            rows={4}
            placeholder="추가 정보나 메모를 입력해주세요"
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {application ? '수정' : '등록'}
            </Button>
            <Button onClick={onCancel}>취소</Button>
          </Space>
        </Form.Item>
      </Form>
  )
}

