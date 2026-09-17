import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ProgramBackButton } from '@/features/program'
import {
  educationApplicationDetailPath,
  getMockEducationApplicationById,
  updateMockTeacherApplicationGuidance,
} from '@/features/mypage'
import { TeacherGuidanceEditForm } from '@/features/mypage/education/applications/ui/teacher-guidance-edit'
import { PFFormPage, PFText } from '@/shared/ui'

function applicationTabPath(applicationId: string) {
  return `${educationApplicationDetailPath(applicationId)}?section=application`
}

export function MypageEducationGuidanceEditPage() {
  const navigate = useNavigate()
  const { applicationId = '' } = useParams<{ applicationId: string }>()

  const application = useMemo(
    () => (applicationId ? getMockEducationApplicationById(applicationId) : undefined),
    [applicationId],
  )
  const guidance = application?.teacherApplicationContent?.guidance

  const backPath = applicationId
    ? applicationTabPath(applicationId)
    : educationApplicationDetailPath(applicationId)

  if (!guidance) {
    return (
      <PFFormPage
        aria-label="안내사항 수정하기"
        back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
        title="안내사항 수정하기"
      >
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          안내사항 정보를 찾을 수 없습니다.
        </PFText>
      </PFFormPage>
    )
  }

  return (
    <PFFormPage
      aria-label="안내사항 수정하기"
      back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
      title="안내사항 수정하기"
    >
      <TeacherGuidanceEditForm
        initialGuidance={guidance}
        onSubmit={next => {
          updateMockTeacherApplicationGuidance(applicationId, next)
          navigate(backPath)
        }}
      />
    </PFFormPage>
  )
}
