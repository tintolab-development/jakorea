/**
 * 프로그램 신청서 작성 페이지
 * Phase 0.2.2: 신청서 작성 (FR-C03)
 * 역할별 신청서 폼 분기
 */

import { useParams, useNavigate } from 'react-router-dom'
import { getProgramAdminDetailUrlDefault } from '@/features/program/general/lib/program-admin-detail-url'
import { useEffect, useState } from 'react'
import { Card, Spin, Typography } from 'antd'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useProgramStore } from '@/features/program/general/model/program-store'
import { applicationPathService } from '@/entities/application-path/api/application-path-service'
// Phase 0.2.2: 역할별 신청서 폼 컴포넌트
import { IndividualApplicationForm } from '@/features/application/ui/individual-application-form'
import { SchoolApplicationForm } from '@/features/application/ui/school-application-form'
import { InstructorApplicationForm } from '@/features/application/ui/instructor-application-form'
import { useApplicationStore } from '@/features/application/model/application-store'
import type { ApplicationFormData } from '@/entities/application/model/schema'

const { Title } = Typography

export function ProgramApplicationPage() {
  const { id: programId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const { programs, fetchPrograms } = useProgramStore()
  const { createApplication } = useApplicationStore()
  const [loading, setLoading] = useState(false)
  const [programLoading, setProgramLoading] = useState(true)

  // Phase 0.2.1: FR-C01 - 비로그인 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated || !user) {
      const redirectPath = programId ? `/programs/${programId}/apply` : '/programs'
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true })
    }
  }, [isAuthenticated, user, navigate, programId])

  // 프로그램 정보 로드
  useEffect(() => {
    const loadProgram = async () => {
      if (!programId) {
        navigate('/programs', { replace: true })
        return
      }

      setProgramLoading(true)
      try {
        await fetchPrograms()
      } catch (error) {
        console.error('프로그램 로드 실패:', error)
        navigate('/programs', { replace: true })
      } finally {
        setProgramLoading(false)
      }
    }

    if (isAuthenticated && user) {
      loadProgram()
    }
  }, [programId, isAuthenticated, user, fetchPrograms, navigate])

  const program = programs.find(p => p.id === programId)
  // Phase 0.2.2: applicationPath는 향후 역할별 폼에서 사용 예정
  const applicationPath = programId
    ? applicationPathService.getByProgramIdSync(programId)
    : undefined

  // 역할별 신청서 폼 분기
  // Phase 0.2.2: ApplicationFormData를 Application 타입으로 변환
  const handleSubmit = async (data: ApplicationFormData) => {
    if (!programId || !user) return

    setLoading(true)
    try {
      // ApplicationFormData에서 Application 타입으로 변환
      const applicationData: Parameters<typeof createApplication>[0] = {
        programId: data.programId,
        roundId: data.roundId,
        subjectType: data.subjectType,
        subjectId: data.subjectId,
        status: data.status,
        notes: data.notes,
      }
      // Phase 0.2.2: 개인 신청 시 템플릿 기반 customFields 전달 (FR-C03)
      if (data.subjectType === 'student' && 'customFields' in data && data.customFields) {
        applicationData.customFields = data.customFields
      }
      // Phase 0.2.2: 학교 신청 시 엑셀 파일 업로드 처리 (FR-C03)
      if (data.subjectType === 'school' && 'studentListFile' in data && data.studentListFile) {
        const { fileUploadService } = await import('@/entities/application/api/file-upload-service')
        const uploadResult = await fileUploadService.upload(data.studentListFile, 'studentList')
        applicationData.studentListFileUrl = uploadResult.url
      }
      await createApplication(applicationData)
      // Phase 0.2.3: 신청 완료 페이지로 이동
      navigate(`/programs/${programId}/apply/complete`, { replace: true })
    } catch (error) {
      console.error('신청 실패:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (programId) {
      navigate(getProgramAdminDetailUrlDefault(programId), { replace: true })
    } else {
      navigate('/programs', { replace: true })
    }
  }

  // 로딩 중
  if (programLoading || !isAuthenticated || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    )
  }

  // 프로그램이 없으면 에러
  if (!program) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
        <Card>
          <Typography.Title level={4}>프로그램을 찾을 수 없습니다.</Typography.Title>
        </Card>
      </div>
    )
  }

  // Phase 0.2.2: 역할별 신청서 폼 분기
  const renderApplicationForm = () => {
    if (!user || user.role === 'ADMIN') {
      return (
        <Card>
          <Typography.Text type="danger">
            신청할 수 있는 권한이 없습니다. (관리자는 신청할 수 없습니다)
          </Typography.Text>
        </Card>
      )
    }

    switch (user.role) {
      case 'SCHOOL':
        return (
          <SchoolApplicationForm
            program={program}
            applicationPath={applicationPath}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        )
      case 'INSTRUCTOR':
        return (
          <InstructorApplicationForm
            program={program}
            applicationPath={applicationPath}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        )
      case 'INDIVIDUAL':
        return (
          <IndividualApplicationForm
            program={program}
            applicationPath={applicationPath}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        )
      default:
        return (
          <Card>
            <Typography.Text type="danger">
              신청할 수 있는 권한이 없습니다.
            </Typography.Text>
          </Card>
        )
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Card>
        <Title level={2} style={{ marginBottom: 24 }}>
          {program.title} 신청하기
        </Title>
        {renderApplicationForm()}
      </Card>
    </div>
  )
}
