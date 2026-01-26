/**
 * 강사 신청서 폼 컴포넌트
 * Phase 0.2.2: 신청서 작성 (FR-C03)
 * §3.2 강사 프로세스 - 강의 신청
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, Input, Button, Space, Upload, message, Alert } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { instructorApplicationSchema, type InstructorApplicationFormData } from '@/entities/application/model/schema'
import type { Program } from '@/types/domain'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { UploadFile } from 'antd/es/upload/interface'
import { MESSAGES } from '@/shared/constants'

const { TextArea } = Input

interface InstructorApplicationFormProps {
  program: Program
  applicationPath?: unknown // 향후 사용 예정
  onSubmit: (data: InstructorApplicationFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

// Phase 0.2.2: 파일 업로드 정책 (FR-C03)
const UPLOAD_POLICY = {
  documents: {
    allowedExtensions: ['.pdf', '.doc', '.docx', '.hwp'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
}

export function InstructorApplicationForm({
  program,
  applicationPath, // 향후 사용 예정
  onSubmit,
  onCancel,
  loading,
}: InstructorApplicationFormProps) {
  // 향후 applicationPath 사용 예정
  void applicationPath
  const { user } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<InstructorApplicationFormData>({
    resolver: zodResolver(instructorApplicationSchema),
    defaultValues: {
      programId: program.id,
      subjectType: 'instructor',
      subjectId: user?.instructorId || '',
      status: 'submitted',
    },
  })

  // 서류 파일 업로드 핸들러
  const handleDocumentUpload = (file: File, type: 'resume' | 'crimeCheckConsent') => {
    // 파일 확장자 검증
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!UPLOAD_POLICY.documents.allowedExtensions.includes(fileExtension)) {
      message.error(MESSAGES.warning.fileTypeDocuments)
      return false
    }

    // 파일 크기 검증
    if (file.size > UPLOAD_POLICY.documents.maxSize) {
      message.error(MESSAGES.warning.fileSizeMax10MB)
      return false
    }

    setValue(type, file)
    message.success(MESSAGES.success.fileSelected)
    return false // 자동 업로드 방지
  }

  const onFormSubmit = async (data: InstructorApplicationFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('신청 실패:', error)
      throw error
    }
  }

  const resume = watch('resume')
  const crimeCheckConsent = watch('crimeCheckConsent')

  return (
    <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
      <Form.Item label="프로그램">
        <Input value={program.title} disabled />
      </Form.Item>

      <Form.Item
        label="선호 일정"
        validateStatus={errors.preferredSchedule ? 'error' : ''}
        help={errors.preferredSchedule?.message}
      >
        <TextArea
          {...register('preferredSchedule')}
          rows={3}
          placeholder="선호하는 강의 일정을 입력해주세요 (예: 월요일 오전, 수요일 오후)"
        />
      </Form.Item>

      <Form.Item
        label="강의 경력"
        validateStatus={errors.experience ? 'error' : ''}
        help={errors.experience?.message}
      >
        <TextArea
          {...register('experience')}
          rows={4}
          placeholder="강의 경력 및 관련 경험을 입력해주세요"
        />
      </Form.Item>

      {/* Phase 0.2.2: FR-C03 - 제출 서류 업로드 */}
      <Form.Item
        label="이력서"
        validateStatus={errors.resume ? 'error' : ''}
        help={errors.resume?.message || 'PDF, DOC, DOCX, HWP 파일을 업로드해주세요. (최대 10MB)'}
      >
        <Upload
          beforeUpload={file => handleDocumentUpload(file, 'resume')}
          maxCount={1}
          accept=".pdf,.doc,.docx,.hwp"
          fileList={
            resume
              ? [
                  {
                    uid: 'resume',
                    name: resume.name,
                    size: resume.size,
                  } as UploadFile,
                ]
              : []
          }
          onRemove={() => {
            setValue('resume', undefined)
          }}
        >
          <Button icon={<UploadOutlined />}>이력서 파일 선택</Button>
        </Upload>
      </Form.Item>

      <Form.Item
        label="성범죄조회동의서"
        validateStatus={errors.crimeCheckConsent ? 'error' : ''}
        help={errors.crimeCheckConsent?.message || 'PDF, DOC, DOCX, HWP 파일을 업로드해주세요. (최대 10MB)'}
      >
        <Upload
          beforeUpload={file => handleDocumentUpload(file, 'crimeCheckConsent')}
          maxCount={1}
          accept=".pdf,.doc,.docx,.hwp"
          fileList={
            crimeCheckConsent
              ? [
                  {
                    uid: 'crimeCheckConsent',
                    name: crimeCheckConsent.name,
                    size: crimeCheckConsent.size,
                  } as UploadFile,
                ]
              : []
          }
          onRemove={() => {
            setValue('crimeCheckConsent', undefined)
          }}
        >
          <Button icon={<UploadOutlined />}>성범죄조회동의서 파일 선택</Button>
        </Upload>
        <Alert
          type="info"
          message="성범죄조회동의서는 필수 제출 서류입니다"
          showIcon
          style={{ marginTop: 8 }}
        />
      </Form.Item>

      <Form.Item label="비고">
        <TextArea {...register('notes')} rows={3} placeholder="추가 정보나 메모를 입력해주세요" />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            신청하기
          </Button>
          <Button onClick={onCancel}>취소</Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
