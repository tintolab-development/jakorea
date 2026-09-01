/**
 * 추가 배정 모달
 * Phase 4.3: 모집 종료 후 추가 배정 (FR-F02)
 */

import { CmsRadio, ContentModal, CmsButton, CmsPhoneInput } from '@/shared/ui'
import { Form, Select, Input, Space } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  type ManualAssignmentData,
  validateManualAssignment } from '@/entities/instructor-application/api/instructor-application-service'
import { mockInstructors } from '@/data/mock/instructors'
import { mockPrograms } from '@/data/mock/programs'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { fieldValidationHelp } from '@/shared/utils/error-handler'
import { isValidKoreanPhoneNumber } from '@/shared/utils/phone-validation'

const { Option } = Select
const { TextArea } = Input

const assignmentSchema = z
  .object({
    programId: z.string().min(1, '프로그램을 선택해주세요'),
    assignmentType: z.enum(['existing', 'new']),
    instructorId: z.string().optional(),
    newInstructor: z
      .object({
        name: z.string().min(1, '이름을 입력해주세요').max(50, '이름은 50자 이하로 입력해주세요'),
        phone: z
          .string()
          .min(1, '전화번호를 입력해주세요')
          .refine(isValidKoreanPhoneNumber, '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'),
        email: z.string().email('올바른 이메일 형식이 아닙니다') })
      .optional(),
    notes: z.string().optional() })
  .refine(
    data => {
      // assignmentType이 'existing'일 때 instructorId는 필수
      if (data.assignmentType === 'existing') {
        return !!data.instructorId && data.instructorId.trim().length > 0
      }
      return true
    },
    {
      message: '강사를 선택해주세요',
      path: ['instructorId'],
    }
  )
  .refine(
    data => {
      // assignmentType이 'new'일 때 newInstructor는 필수
      if (data.assignmentType === 'new') {
        return (
          !!data.newInstructor &&
          !!data.newInstructor.name &&
          !!data.newInstructor.phone &&
          !!data.newInstructor.email
        )
      }
      return true
    },
    {
      message: '신규 강사 정보를 모두 입력해주세요',
      path: ['newInstructor'],
    }
  )

type AssignmentFormData = z.infer<typeof assignmentSchema>

interface ManualAssignmentModalProps {
  open: boolean
  onCancel: () => void
  onSuccess: (data: ManualAssignmentData) => Promise<void>
  loading?: boolean
  fixedProgramId?: string // 프로그램 상세에서 열 때 고정된 programId
}

export function ManualAssignmentModal({
  open,
  onCancel,
  onSuccess,
  loading = false,
  fixedProgramId }: ManualAssignmentModalProps) {
  const { user } = useAuthStore()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
    reset } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      assignmentType: 'existing',
      programId: fixedProgramId || '' } })

  // 모달이 열릴 때 폼 초기화 및 fixedProgramId 설정
  useEffect(() => {
    if (open) {
      reset({
        assignmentType: 'existing',
        programId: fixedProgramId || '',
        instructorId: undefined,
        newInstructor: undefined,
        notes: undefined })
      if (fixedProgramId) {
        setValue('programId', fixedProgramId)
      }
    }
  }, [open, fixedProgramId, reset, setValue])

  const assignmentType = watch('assignmentType')

  const onSubmit = async (data: AssignmentFormData) => {
    if (!user?.id) {
      return
    }

    const programId = fixedProgramId || data.programId
    if (!programId || programId.trim().length === 0) {
      return
    }

    // 배정 방식별 필수 필드 검증
    if (data.assignmentType === 'existing') {
      if (!data.instructorId || data.instructorId.trim().length === 0) {
        return
      }
    } else if (data.assignmentType === 'new') {
      if (!data.newInstructor) {
        return
      }
      if (!data.newInstructor.name || data.newInstructor.name.trim().length === 0) {
        return
      }
      if (!data.newInstructor.phone || data.newInstructor.phone.trim().length === 0) {
        return
      }
      if (!data.newInstructor.email || data.newInstructor.email.trim().length === 0) {
        return
      }
    }

    const assignmentData: ManualAssignmentData = {
      programId,
      scheduleIds: [], // TODO: 일정 선택 기능 추가
      assignedBy: user.id,
      notes: data.notes }

    if (data.assignmentType === 'existing' && data.instructorId) {
      assignmentData.instructorId = data.instructorId
    } else if (data.assignmentType === 'new' && data.newInstructor) {
      assignmentData.newInstructor = {
        name: data.newInstructor.name.trim(),
        phone: data.newInstructor.phone.trim(),
        email: data.newInstructor.email.trim() }
    }

    // 서버 측 검증
    const validation = validateManualAssignment(assignmentData)
    if (!validation.valid) {
      return
    }

    try {
      await onSuccess(assignmentData)
      reset()
    } catch (error) {
      // onSuccess에서 에러 처리하므로 여기서는 로깅만
      console.error('배정 처리 중 오류:', error)
    }
  }

  const handleCancel = () => {
    reset()
    onCancel()
  }

  const footer = (
    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
      <CmsButton variant="secondary" onClick={handleCancel} disabled={loading}>
        취소
      </CmsButton>
      <CmsButton variant="primary" onClick={handleSubmit(onSubmit)} loading={loading}>
        배정하기
      </CmsButton>
    </Space>
  )

  return (
    <ContentModal
      title="추가 배정"
      open={open}
      onCancel={handleCancel}
      footer={footer}
      size="compact"
    >
      <Form layout="vertical">
        {!fixedProgramId && (
          <Form.Item label="프로그램" required validateStatus={errors.programId ? 'error' : ''}>
            <Controller
              name="programId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="프로그램을 선택해주세요"
                  status={errors.programId ? 'error' : ''}
                >
                  {mockPrograms.map(program => (
                    <Option key={program.id} value={program.id}>
                      {program.title}
                    </Option>
                  ))}
                </Select>
              )}
            />
            {errors.programId && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                {fieldValidationHelp(errors.programId)}
              </div>
            )}
          </Form.Item>
        )}

        <Form.Item label="배정 방식" required>
          <CmsRadio.Group
            value={assignmentType}
            onChange={e => setValue('assignmentType', e.target.value)}
          >
            <CmsRadio value="existing">기존 강사 선택</CmsRadio>
            <CmsRadio value="new">신규 강사 정보 입력</CmsRadio>
          </CmsRadio.Group>
        </Form.Item>

        {assignmentType === 'existing' && (
          <Form.Item label="강사 선택" required validateStatus={errors.instructorId ? 'error' : ''}>
            <Controller
              name="instructorId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="강사를 선택해주세요"
                  status={errors.instructorId ? 'error' : ''}
                  allowClear
                >
                  {mockInstructors.map(instructor => (
                    <Option key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </Option>
                  ))}
                </Select>
              )}
            />
            {errors.instructorId && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                {fieldValidationHelp(errors.instructorId)}
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
              <Controller
                name="newInstructor.phone"
                control={control}
                render={({ field }) => (
                  <CmsPhoneInput
                    {...field}
                    value={field.value ?? ''}
                    placeholder="전화번호를 입력해주세요 (예: 010-1234-5678)"
                    status={errors.newInstructor?.phone ? 'error' : undefined}
                  />
                )}
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
          <TextArea {...register('notes')} placeholder="비고를 입력해주세요 (선택사항)" rows={3} />
        </Form.Item>
      </Form>
    </ContentModal>
  )
}
