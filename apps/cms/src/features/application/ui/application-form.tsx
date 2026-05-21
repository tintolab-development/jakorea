/**
 * 신청 등록/수정 폼 컴포넌트
 * Phase 2.2: react-hook-form + zod
 */
/* eslint-disable react-hooks/incompatible-library -- React Hook Form watch 사용 */

import { useEffect, useMemo } from 'react'
import { Form, Select, Input, Button, Space, Alert, Typography } from 'antd'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { applicationSchema, type ApplicationFormData } from '@/entities/application/model/schema'
import type { Application } from '@/types/domain'
import { mockPrograms, mockSchools, mockInstructors } from '@/data/mock'
import { mockUsers } from '@/data/mock/users'
import type { ApplicationSubjectType } from '@/types/domain'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { applicationPathService } from '@/entities/application-path/api/application-path-service'
import { fieldValidationHelp } from '@/shared/utils/error-handler'
import {
  isApplicationAvailable,
  getApplicationUnavailableReason } from '@/features/program/general/lib/program-helpers'

const { Option } = Select
const { Text } = Typography
const { TextArea } = Input

interface ApplicationFormProps {
  application?: Application
  programId?: string // 모달에서 사용할 경우 프로그램 ID 고정
  onSubmit: (data: ApplicationFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const subjectTypeLabels: Record<ApplicationSubjectType, string> = {
  school: '학교',
  student: '학생',
  instructor: '강사',
  volunteer: '봉사자' }

export function ApplicationForm({
  application,
  programId,
  onSubmit,
  onCancel,
  loading }: ApplicationFormProps) {
  const { user } = useAuthStore()
  const userRole = user?.role
  const isAdmin = userRole === 'ADMIN'

  // 로그인한 사용자의 역할에 따른 신청 주체 고정 (관리자 제외)
  const fixedSubject = useMemo<{
    subjectType: ApplicationSubjectType
    subjectId: string
    subjectName: string
    eligibilitySubjectType: Exclude<ApplicationSubjectType, 'volunteer'>
  } | null>(() => {
    if (!userRole || isAdmin || !user) return null

    if (userRole === 'INSTRUCTOR' && user.instructorId) {
      return {
        subjectType: 'instructor',
        subjectId: user.instructorId,
        subjectName: user.name,
        eligibilitySubjectType: 'instructor' }
    }

    if (userRole === 'INDIVIDUAL') {
      return {
        subjectType: 'student',
        subjectId: user.id,
        subjectName: user.name,
        eligibilitySubjectType: 'student' }
    }

    if (userRole === 'SCHOOL') {
      return {
        subjectType: 'school',
        subjectId: user.id,
        subjectName: user.name,
        eligibilitySubjectType: 'school' }
    }

    return null
  }, [userRole, isAdmin, user])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: application
      ? {
          programId: application.programId,
          roundId: application.roundId || undefined,
          subjectType: application.subjectType,
          subjectId: application.subjectId,
          status: application.status,
          notes: application.notes || '' }
      : {
          status: 'submitted',
          programId: programId || undefined, // 모달에서 전달받은 programId 설정
          // subjectType은 아래 useEffect에서 역할 기반으로 설정
        } })

  const selectedProgramId = watch('programId')
  const selectedSubjectType = watch('subjectType')
  const selectedProgram = mockPrograms.find(p => p.id === selectedProgramId)

  // 선택된 프로그램의 신청 경로 정보 (V3 Phase 7)
  const applicationPath = selectedProgramId
    ? applicationPathService.getByProgramIdSync(selectedProgramId)
    : undefined

  // 신청 가능한 프로그램 목록 필터링 (관리자가 아닌 경우)
  const availablePrograms = useMemo(() => {
    if (isAdmin) {
      // 관리자는 모든 프로그램 선택 가능
      return mockPrograms
    }
    // 일반 사용자는 신청 가능한 프로그램만 선택 가능 (로그인한 사용자의 역할에 따라)
    if (fixedSubject) {
      return mockPrograms.filter(program =>
        isApplicationAvailable(program, fixedSubject.eligibilitySubjectType)
      )
    }
    return mockPrograms.filter(program => isApplicationAvailable(program))
  }, [isAdmin, fixedSubject])

  // 선택된 프로그램이 신청 불가능한 경우 경고 표시
  const selectedProgramUnavailable = useMemo(() => {
    if (!selectedProgram) return false
    if (selectedSubjectType) {
      // volunteer는 program-helpers에서 'instructor'로 판단
      const eligibilityType = selectedSubjectType === 'volunteer' ? 'instructor' : selectedSubjectType
      return !isApplicationAvailable(selectedProgram, eligibilityType)
    }
    return !isApplicationAvailable(selectedProgram)
  }, [selectedProgram, selectedSubjectType])

  // Ant Design + react-hook-form 연동을 위해 필드를 명시적으로 등록
  useEffect(() => {
    register('programId')
    register('roundId')
    register('subjectType')
    register('subjectId')
  }, [register])

  // 관리자 이외 역할에서는 로그인한 권한에 따라 신청 주체 타입/ID를 고정
  useEffect(() => {
    if (!application && fixedSubject) {
      setValue('subjectType', fixedSubject.subjectType, { shouldValidate: true })
      setValue('subjectId', fixedSubject.subjectId, { shouldValidate: true })
    }
  }, [application, fixedSubject, setValue])

  // programId가 prop으로 전달된 경우 자동 설정
  useEffect(() => {
    if (!application && programId) {
      setValue('programId', programId, { shouldValidate: true })
    }
  }, [application, programId, setValue])

  const onFormSubmit = async (data: ApplicationFormData) => {
    try {
      // 신청 제출 시 프로그램 상태 검증 (신규 신청만)
      if (!application && data.programId && data.subjectType) {
        const program = mockPrograms.find(p => p.id === data.programId)
        const eligibilityType = data.subjectType === 'volunteer' ? 'instructor' : data.subjectType
        if (program && !isApplicationAvailable(program, eligibilityType)) {
          const _reason = getApplicationUnavailableReason(program, eligibilityType)
          void _reason
          return
        }
      }

      await onSubmit(data)
    } catch (error) {
      console.debug('applicationForm submit failed', error)
    }
  }

  // 신청 주체 목록 필터링 (관리자 전용)
  const getSubjectOptions = () => {
    if (!selectedSubjectType) return []

    switch (selectedSubjectType) {
      case 'school':
        return mockSchools.map(school => ({
          value: school.id,
          label: school.name }))
      case 'instructor':
        return mockInstructors.map(instructor => ({
          value: instructor.id,
          label: instructor.name }))
      case 'volunteer':
        return mockUsers
          .filter(u => u.role === 'INDIVIDUAL')
          .map(volunteer => ({
            value: volunteer.id,
            label: volunteer.name }))
      case 'student':
        // 학생은 별도 목록이 없으므로 빈 배열 (실제로는 학생 목록이 필요)
        return []
      default:
        return []
    }
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
      {selectedProgramUnavailable && (
        <Form.Item>
          <Alert
            type="warning"
            showIcon
            description={
              <Space direction="vertical" size={4}>
                <Text strong>이 프로그램은 현재 신청할 수 없습니다</Text>
                <Text type="secondary">
                  {selectedProgram && selectedSubjectType
                    ? getApplicationUnavailableReason(
                        selectedProgram,
                        selectedSubjectType === 'volunteer' ? 'instructor' : selectedSubjectType
                      ) ||
                      '프로그램 상태로 인해 신청할 수 없습니다.'
                    : selectedProgram
                      ? getApplicationUnavailableReason(selectedProgram) ||
                        '프로그램 상태로 인해 신청할 수 없습니다.'
                      : '프로그램 상태로 인해 신청할 수 없습니다.'}
                </Text>
              </Space>
            }
          />
        </Form.Item>
      )}
      {selectedProgram && applicationPath && (
        <Form.Item>
          <Alert
            type={applicationPath.isActive ? 'info' : 'warning'}
            showIcon
            description={
              <Space direction="vertical" size={4}>
                <Text strong>
                  이 프로그램의 신청 경로:{' '}
                  {applicationPath.pathType === 'google_form' ? '구글폼' : '자동화 프로그램'}
                  {!applicationPath.isActive ? ' (현재 비활성 상태)' : ''}
                </Text>
                {applicationPath.pathType === 'google_form' && applicationPath.googleFormUrl && (
                  <a href={applicationPath.googleFormUrl} target="_blank" rel="noopener noreferrer">
                    구글폼 열기
                  </a>
                )}
                {applicationPath.guideText && (
                  <Text type="secondary">{applicationPath.guideText}</Text>
                )}
              </Space>
            }
          />
        </Form.Item>
      )}
      <Form.Item
        label="프로그램"
        validateStatus={errors.programId ? 'error' : ''}
        help={fieldValidationHelp(errors.programId)}
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
          disabled={!!programId} // programId가 prop으로 전달된 경우 비활성화
          filterOption={(input, option) => {
            const children = option?.children as string | string[] | undefined
            if (typeof children === 'string') {
              return children.toLowerCase().includes(input.toLowerCase())
            }
            if (Array.isArray(children)) {
              return children.some(
                (child: unknown) =>
                  typeof child === 'string' && child.toLowerCase().includes(input.toLowerCase())
              )
            }
            return false
          }}
        >
          {availablePrograms.map(program => (
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

      {isAdmin ? (
        <Form.Item
          label="신청 주체 타입"
          validateStatus={errors.subjectType ? 'error' : ''}
          help={fieldValidationHelp(errors.subjectType)}
          required
        >
          <Select
            value={watch('subjectType')}
            onChange={value => {
              setValue('subjectType', value, { shouldValidate: true })
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
      ) : (
        fixedSubject && (
          <Form.Item label="신청 주체 타입" required>
            <Select value={fixedSubject.subjectType} disabled>
              <Option value={fixedSubject.subjectType}>
                {subjectTypeLabels[fixedSubject.subjectType]}
              </Option>
            </Select>
          </Form.Item>
        )
      )}

      {isAdmin && selectedSubjectType && (
        <Form.Item
          label="신청 주체"
          validateStatus={errors.subjectId ? 'error' : ''}
          help={
            fieldValidationHelp(errors.subjectId) ||
            (selectedSubjectType === 'student' ? '학생은 수동으로 입력해주세요' : '')
          }
          required
          style={{ marginBottom: 30 }}
        >
          {selectedSubjectType === 'student' ? (
            <Input
              value={watch('subjectId')}
              onChange={e => setValue('subjectId', e.target.value, { shouldValidate: true })}
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
                  return children.some(
                    (child: unknown) =>
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

      {!isAdmin && fixedSubject && (
        <Form.Item label="신청 주체" required style={{ marginBottom: 30 }}>
          <Input value={fixedSubject.subjectName} disabled />
        </Form.Item>
      )}

      {application && (
        <Form.Item
          label="상태"
          validateStatus={errors.status ? 'error' : ''}
          help={fieldValidationHelp(errors.status)}
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
        <TextArea {...register('notes')} rows={4} placeholder="추가 정보나 메모를 입력해주세요" />
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
