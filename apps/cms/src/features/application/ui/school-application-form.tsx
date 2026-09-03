/**
 * 학교 신청서 폼 컴포넌트
 * Phase 0.2.2: 신청서 작성 (FR-C03)
 * Task 3.2.1: FR-F01 - 신청서 수정 기능 (수정 모드 지원)
 * §3.1 학교 신청 프로세스 - 신청서 작성
 */

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, Input, Space, Upload, Alert, Button } from 'antd'
import { CmsButton } from '@/shared/ui/cms-button'
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons'
import { downloadBlob } from '@/shared/utils/file-download'
import { schoolApplicationSchema, type SchoolApplicationFormData } from '@/entities/application/model/schema'
import type { Program, Application } from '@/types/domain'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { UploadFile } from 'antd/es/upload/interface'
import { MESSAGES } from '@/shared/constants'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { fieldValidationHelp, handleError, unknownErrorText } from '@/shared/utils/error-handler'

const { TextArea } = Input

interface SchoolApplicationFormProps {
  program: Program
  application?: Application // 수정 모드: 기존 신청서 데이터
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
  } }

export function SchoolApplicationForm({
  program,
  application,
  applicationPath, // 향후 사용 예정
  onSubmit,
  onCancel,
  loading }: SchoolApplicationFormProps) {
  // 향후 applicationPath 사용 예정
  void applicationPath
  const { user } = useAuthStore()
  const isEditMode = !!application
  const [uploadAlert, setUploadAlert] = useState<{ type: 'error' | 'warning' | 'info'; text: string } | null>(
    null
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset } = useForm<SchoolApplicationFormData>({
    resolver: zodResolver(schoolApplicationSchema),
    defaultValues: {
      programId: program.id,
      subjectType: 'school',
      subjectId: application?.subjectId || user?.id || '',
      status: application?.status || 'submitted',
      schoolName: user?.schoolInfo?.schoolName || '',
      address: user?.schoolInfo?.address || '',
      notes: application?.notes || '' } })

  // 수정 모드: Application 데이터로 폼 초기화
  useEffect(() => {
    if (application) {
      reset({
        programId: application.programId,
        subjectType: 'school',
        subjectId: application.subjectId,
        status: application.status,
        schoolName: user?.schoolInfo?.schoolName || '',
        address: user?.schoolInfo?.address || '',
        notes: application.notes || '' })
    }
  }, [application, user, reset])

  const handleSampleDownload = async () => {
    try {
      const { fileUploadService } = await import('@/entities/application/api/file-upload-service')
      const blob = await fileUploadService.createSampleStudentListBlob()
      const filename = `참여학생명단_샘플_${new Date().toISOString().split('T')[0]}.xlsx`
      await downloadBlob(blob, filename)
    } catch (error) {
      handleError(error, { context: 'schoolApplicationForm.sampleDownload' })
    }
  }

  // 엑셀 파일 업로드 핸들러 (FR-C03: 엑셀 파일 파싱 및 검증, ExcelJS 활용)
  const handleFileUpload = async (file: File) => {
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!UPLOAD_POLICY.studentList.allowedExtensions.includes(fileExtension)) {
      setUploadAlert({ type: 'error', text: MESSAGES.warning.fileType })
      return false
    }
    if (file.size > UPLOAD_POLICY.studentList.maxSize) {
      setUploadAlert({ type: 'error', text: MESSAGES.warning.fileSizeMax5MB })
      return false
    }

    try {
      const { fileUploadService } = await import('@/entities/application/api/file-upload-service')
      const parseResult = await fileUploadService.parseStudentList(file)

      if (parseResult.errors.length > 0) {
        setUploadAlert({
          type: 'warning',
          text: MESSAGES.warning.parseWarning(parseResult.errors.join(', ')),
        })
      }
      if (parseResult.totalCount === 0) {
        setUploadAlert({ type: 'error', text: MESSAGES.warning.studentInfoNotFound })
        return false
      }

      setValue('studentListFile', file)
      setUploadAlert({ type: 'info', text: MESSAGES.info.studentsFound(parseResult.totalCount) })
    } catch (error: unknown) {
      handleError(error, { context: 'schoolApplicationForm.parseStudentList' })
      setUploadAlert({
        type: 'error',
        text: unknownErrorText(error, '엑셀 파일 파싱에 실패했습니다.'),
      })
      return false
    }

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
        help={fieldValidationHelp(errors.schoolName)}
        required
      >
        <Input {...register('schoolName')} placeholder="학교명을 입력해주세요" />
      </Form.Item>

      <Form.Item
        label="주소"
        validateStatus={errors.address ? 'error' : ''}
        help={fieldValidationHelp(errors.address)}
        required
      >
        <Input {...register('address')} placeholder="학교 주소를 입력해주세요" />
      </Form.Item>

      <Form.Item label="대상 학년" validateStatus={errors.targetGrade ? 'error' : ''} help={fieldValidationHelp(errors.targetGrade)}>
        <Input {...register('targetGrade')} placeholder="예: 3학년" />
      </Form.Item>

      <Form.Item label="학급 수" validateStatus={errors.classCount ? 'error' : ''} help={fieldValidationHelp(errors.classCount)}>
        <CmsNumericInput
          mode="integer"
          min={1}
          value={String(watch('classCount') ?? '')}
          placeholder="학급 수를 입력해주세요"
          style={{ width: '100%' }}
          onValueChange={value => setValue('classCount', value === '' ? undefined : Number(value))}
        />
      </Form.Item>

      <Form.Item
        label="학급별 인원"
        validateStatus={errors.studentsPerClass ? 'error' : ''}
        help={fieldValidationHelp(errors.studentsPerClass)}
      >
        <CmsNumericInput
          mode="integer"
          min={1}
          value={String(watch('studentsPerClass') ?? '')}
          placeholder="학급별 인원을 입력해주세요"
          style={{ width: '100%' }}
          onValueChange={value =>
            setValue('studentsPerClass', value === '' ? undefined : Number(value))
          }
        />
      </Form.Item>

      <Form.Item
        label="강사 대기장소"
        validateStatus={errors.instructorWaitingRoom ? 'error' : ''}
        help={fieldValidationHelp(errors.instructorWaitingRoom)}
      >
        <Input {...register('instructorWaitingRoom')} placeholder="강사 대기장소를 입력해주세요" />
      </Form.Item>

      {/* Phase 0.2.2: FR-C03 - 학생 명단 엑셀 업로드 (ExcelJS 파싱, 샘플 양식 다운로드) */}
      <Form.Item
        label="참여학생 리스트 (엑셀)"
        validateStatus={errors.studentListFile ? 'error' : ''}
        help={fieldValidationHelp(errors.studentListFile) || '엑셀 파일(.xlsx, .xls)을 업로드해주세요. (최대 5MB)'}
        required={false}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space wrap>
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
                        size: studentListFile.size } as UploadFile,
                    ]
                  : []
              }
              onRemove={() => {
                setValue('studentListFile', undefined)
                setUploadAlert(null)
              }}
            >
              <Button icon={<UploadOutlined />}>엑셀 파일 선택</Button>
            </Upload>
            {uploadAlert ? (
              <Alert type={uploadAlert.type} description={uploadAlert.text} showIcon />
            ) : null}
            <Button type="link" icon={<DownloadOutlined />} onClick={handleSampleDownload}>
              샘플 양식 다운로드
            </Button>
          </Space>
          <Alert
            type="info"
            description="엑셀 파일에는 '이름'(필수), '학년', '반', '번호' 컬럼을 포함해주세요. 샘플 양식을 다운로드하여 형식을 확인할 수 있습니다."
            showIcon
            style={{ marginTop: 0 }}
          />
        </Space>
      </Form.Item>

      <Form.Item label="비고">
        <TextArea {...register('notes')} rows={3} placeholder="추가 정보나 메모를 입력해주세요" />
      </Form.Item>

      <Form.Item>
        <Space>
          <CmsButton type="submit" loading={loading}>
            {isEditMode ? '수정하기' : '신청하기'}
          </CmsButton>
          <CmsButton variant="secondary" onClick={onCancel}>
            취소
          </CmsButton>
        </Space>
      </Form.Item>
    </Form>
  )
}
