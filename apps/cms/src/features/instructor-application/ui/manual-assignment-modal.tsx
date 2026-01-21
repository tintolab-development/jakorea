/**
 * 추가 배정 모달
 * Phase 4.3: 모집 종료 후 추가 배정 (FR-F02)
 */

import { Modal, Form, Select, Input, Space, Radio } from 'antd'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ManualAssignmentData } from '@/entities/instructor-application/api/instructor-application-service'
import { mockInstructors } from '@/data/mock/instructors'
import { mockPrograms } from '@/data/mock/programs'
import { useAuthStore } from '@/features/auth/model/auth-store'

const { Option } = Select
const { TextArea } = Input

const assignmentSchema = z.object({
  programId: z.string().min(1, '프로그램을 선택해주세요'),
  assignmentType: z.enum(['existing', 'new']),
  instructorId: z.string().optional(),
  newInstructor: z
    .object({
      name: z.string().min(1, '이름을 입력해주세요'),
      phone: z.string().min(1, '전화번호를 입력해주세요'),
      email: z.string().email('올바른 이메일 형식이 아닙니다'),
    })
    .optional(),
  notes: z.string().optional(),
})

type AssignmentFormData = z.infer<typeof assignmentSchema>

interface ManualAssignmentModalProps {
  open: boolean
  onCancel: () => void
  onSuccess: (data: ManualAssignmentData) => Promise<void>
  loading?: boolean
}

export function ManualAssignmentModal({
  open,
  onCancel,
  onSuccess,
  loading = false,
}: ManualAssignmentModalProps) {
  const { user } = useAuthStore()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      assignmentType: 'existing',
    },
  })

  const assignmentType = watch('assignmentType')

  const onSubmit = async (data: AssignmentFormData) => {
    if (!user?.id) {
      return
    }

    const assignmentData: ManualAssignmentData = {
      programId: data.programId,
      scheduleIds: [], // TODO: 일정 선택 기능 추가
      assignedBy: user.id,
      notes: data.notes,
    }

    if (data.assignmentType === 'existing' && data.instructorId) {
      assignmentData.instructorId = data.instructorId
    } else if (data.assignmentType === 'new' && data.newInstructor) {
      assignmentData.newInstructor = data.newInstructor
    }

    await onSuccess(assignmentData)
    reset()
  }

  const handleCancel = () => {
    reset()
    onCancel()
  }

  return (
    <Modal
      title="추가 배정"
      open={open}
      onOk={handleSubmit(onSubmit)}
      onCancel={handleCancel}
      okText="배정하기"
      cancelText="취소"
      confirmLoading={loading}
      width={600}
    >
      <Form layout="vertical">
        <Form.Item label="프로그램" required>
          <Select
            {...register('programId')}
            placeholder="프로그램을 선택해주세요"
            status={errors.programId ? 'error' : ''}
          >
            {mockPrograms.map(program => (
              <Option key={program.id} value={program.id}>
                {program.title}
              </Option>
            ))}
          </Select>
          {errors.programId && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {errors.programId.message}
            </div>
          )}
        </Form.Item>

        <Form.Item label="배정 방식" required>
          <Radio.Group
            value={assignmentType}
            onChange={e => setValue('assignmentType', e.target.value)}
          >
            <Radio value="existing">기존 강사 선택</Radio>
            <Radio value="new">신규 강사 정보 입력</Radio>
          </Radio.Group>
        </Form.Item>

        {assignmentType === 'existing' && (
          <Form.Item label="강사 선택" required>
            <Select
              {...register('instructorId')}
              placeholder="강사를 선택해주세요"
              status={errors.instructorId ? 'error' : ''}
            >
              {mockInstructors.map(instructor => (
                <Option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </Option>
              ))}
            </Select>
            {errors.instructorId && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                {errors.instructorId.message}
              </div>
            )}
          </Form.Item>
        )}

        {assignmentType === 'new' && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Form.Item label="이름" required>
              <Input
                {...register('newInstructor.name')}
                placeholder="이름을 입력해주세요"
                status={errors.newInstructor?.name ? 'error' : ''}
              />
              {errors.newInstructor?.name && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {errors.newInstructor.name.message}
                </div>
              )}
            </Form.Item>
            <Form.Item label="전화번호" required>
              <Input
                {...register('newInstructor.phone')}
                placeholder="전화번호를 입력해주세요"
                status={errors.newInstructor?.phone ? 'error' : ''}
              />
              {errors.newInstructor?.phone && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {errors.newInstructor.phone.message}
                </div>
              )}
            </Form.Item>
            <Form.Item label="이메일" required>
              <Input
                {...register('newInstructor.email')}
                placeholder="이메일을 입력해주세요"
                status={errors.newInstructor?.email ? 'error' : ''}
              />
              {errors.newInstructor?.email && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {errors.newInstructor.email.message}
                </div>
              )}
            </Form.Item>
          </Space>
        )}

        <Form.Item label="비고">
          <TextArea
            {...register('notes')}
            placeholder="비고를 입력해주세요 (선택사항)"
            rows={3}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
