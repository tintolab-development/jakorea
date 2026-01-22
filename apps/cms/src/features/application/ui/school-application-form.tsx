/**
 * 학교 신청서 폼 컴포넌트
 * Phase 0.2.2: 신청서 작성 (FR-C03)
 * §3.1 학교 신청 프로세스 - 신청서 작성
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, Input, InputNumber, Button, Space, Upload, message, Alert } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { schoolApplicationSchema, type SchoolApplicationFormData } from '@/entities/application/model/schema'
import type { Program } from '@/types/domain'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { UploadFile } from 'antd/es/upload/interface'

const { TextArea } = Input

interface SchoolApplicationFormProps {
  program: Program
  applicationPath?: unknown // 향후 사용 예정
  onSubmit: (data: SchoolApplicationFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

// Phase 0.2.2: 파일 업로드 정책 (FR-C03)
const UPLOAD_POLICY = {
  studentList: {
    allowedExtensions: ['.xlsx', '.xls'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
}

export function SchoolApplicationForm({
  program,
  applicationPath, // 향후 사용 예정
  onSubmit,
  onCancel,
  loading,
}: SchoolApplicationFormProps) {
  // 향후 applicationPath 사용 예정
  void applicationPath
  const { user } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SchoolApplicationFormData>({
    resolver: zodResolver(schoolApplicationSchema),
    defaultValues: {
      programId: program.id,
      subjectType: 'school',
      subjectId: user?.id || '',
      status: 'submitted',
      schoolName: user?.schoolInfo?.schoolName || '',
      address: user?.schoolInfo?.address || '',
    },
  })

  // 엑셀 파일 업로드 핸들러
  const handleFileUpload = (file: File) => {
    // 파일 확장자 검증
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!UPLOAD_POLICY.studentList.allowedExtensions.includes(fileExtension)) {
      message.error('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.')
      return false
    }

    // 파일 크기 검증
    if (file.size > UPLOAD_POLICY.studentList.maxSize) {
      message.error('파일 크기는 5MB 이하여야 합니다.')
      return false
    }

    setValue('studentListFile', file)
    message.success('파일이 선택되었습니다.')
    return false // 자동 업로드 방지
  }

  const onFormSubmit = async (data: SchoolApplicationFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('신청 실패:', error)
      throw error
    }
  }

  const studentListFile = watch('studentListFile')

  return (
    <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
      <Form.Item label="프로그램">
        <Input value={program.title} disabled />
      </Form.Item>

      <Form.Item
        label="학교명"
        validateStatus={errors.schoolName ? 'error' : ''}
        help={errors.schoolName?.message}
        required
      >
        <Input {...register('schoolName')} placeholder="학교명을 입력해주세요" />
      </Form.Item>

      <Form.Item
        label="주소"
        validateStatus={errors.address ? 'error' : ''}
        help={errors.address?.message}
        required
      >
        <Input {...register('address')} placeholder="학교 주소를 입력해주세요" />
      </Form.Item>

      <Form.Item label="대상 학년" validateStatus={errors.targetGrade ? 'error' : ''} help={errors.targetGrade?.message}>
        <Input {...register('targetGrade')} placeholder="예: 3학년" />
      </Form.Item>

      <Form.Item label="학급 수" validateStatus={errors.classCount ? 'error' : ''} help={errors.classCount?.message}>
        <InputNumber
          min={1}
          placeholder="학급 수를 입력해주세요"
          style={{ width: '100%' }}
          onChange={value => setValue('classCount', value as number)}
        />
      </Form.Item>

      <Form.Item
        label="학급별 인원"
        validateStatus={errors.studentsPerClass ? 'error' : ''}
        help={errors.studentsPerClass?.message}
      >
        <InputNumber
          min={1}
          placeholder="학급별 인원을 입력해주세요"
          style={{ width: '100%' }}
          onChange={value => setValue('studentsPerClass', value as number)}
        />
      </Form.Item>

      <Form.Item
        label="강사 대기장소"
        validateStatus={errors.instructorWaitingRoom ? 'error' : ''}
        help={errors.instructorWaitingRoom?.message}
      >
        <Input {...register('instructorWaitingRoom')} placeholder="강사 대기장소를 입력해주세요" />
      </Form.Item>

      {/* Phase 0.2.2: FR-C03 - 학생 명단 엑셀 업로드 */}
      <Form.Item
        label="참여학생 리스트 (엑셀)"
        validateStatus={errors.studentListFile ? 'error' : ''}
        help={errors.studentListFile?.message || '엑셀 파일(.xlsx, .xls)을 업로드해주세요. (최대 5MB)'}
      >
        <Upload
          beforeUpload={handleFileUpload}
          maxCount={1}
          accept=".xlsx,.xls"
          fileList={
            studentListFile
              ? [
                  {
                    uid: '1',
                    name: studentListFile.name,
                    size: studentListFile.size,
                  } as UploadFile,
                ]
              : []
          }
          onRemove={() => {
            setValue('studentListFile', undefined)
          }}
        >
          <Button icon={<UploadOutlined />}>엑셀 파일 선택</Button>
        </Upload>
        <Alert
          type="info"
          message="학생 명단 엑셀 파일을 업로드해주세요"
          description="엑셀 파일에는 학생 이름, 학년, 반 등의 정보가 포함되어야 합니다."
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
