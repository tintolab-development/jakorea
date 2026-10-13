import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ProgramBackButton } from '@/features/program'
import {
  getMockEducationApplicationById,
  useMyProgramApplicationDetail,
} from '@/features/mypage/education/applications'
import { EducationProgramNoticeWriteForm } from '@/features/mypage/education/notices/ui/notice-write-form'
import { educationProgramNoticeTabPath } from '@/features/mypage/education/notices/lib/notice-path'
import { shouldShowTeacherInstitutionGuidanceWrite } from '@/features/mypage/education/applications/lib/teacher-institution-guidance'
import { useMypageMember } from '@/features/mypage/hooks/use-mypage-member'
import { isSchoolTeacherMypageProfile } from '@/features/mypage/lib/member-profile'
import { useProgramDetail } from '@/features/program'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { PFFormPage, PFText } from '@/shared/ui'

export function MypageEducationProgramNoticeWritePage() {
  const navigate = useNavigate()
  const { applicationId = '' } = useParams<{ applicationId: string }>()
  const member = useMypageMember()
  const isTeacher = isSchoolTeacherMypageProfile(member.profile)

  const mockApplication = useMemo(
    () => (applicationId ? getMockEducationApplicationById(applicationId) : undefined),
    [applicationId],
  )
  const remoteEnabled = isRemoteApiConfigured()
  const applicationType = mockApplication?.applicationType ?? 'ORGANIZATION'
  const remoteQuery = useMyProgramApplicationDetail(
    remoteEnabled ? applicationType : null,
    remoteEnabled ? applicationId : null,
  )
  const application = remoteEnabled ? remoteQuery.application ?? mockApplication : mockApplication
  const programId = application?.programId ?? ''
  const programQuery = useProgramDetail(programId)
  const program = programQuery.program

  const backPath = educationProgramNoticeTabPath(applicationId)
  const canCompose =
    isTeacher &&
    application != null &&
    program?.programAudience === 'organization' &&
    shouldShowTeacherInstitutionGuidanceWrite({
      isTeacher: true,
      programAudience: program?.programAudience,
      displayStatus: application.displayStatus,
    })

  if (!isTeacher) {
    return (
      <PFFormPage
        aria-label="안내사항 작성하기"
        back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
        title="안내사항 작성하기"
      >
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          교사 회원만 안내사항을 작성할 수 있습니다.
        </PFText>
      </PFFormPage>
    )
  }

  if (!canCompose) {
    return (
      <PFFormPage
        aria-label="안내사항 작성하기"
        back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
        title="안내사항 작성하기"
      >
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          지금은 안내사항을 작성할 수 없습니다.
        </PFText>
      </PFFormPage>
    )
  }

  const authorDisplayName = member.displayName
    ? `${member.displayName} 담당교사님`
    : '담당교사님'

  return (
    <PFFormPage
      aria-label="안내사항 작성하기"
      back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
      title="안내사항 작성하기"
    >
      <EducationProgramNoticeWriteForm
        applicationId={applicationId}
        applicationType={applicationType}
        programId={programId}
        authorDisplayName={authorDisplayName}
      />
    </PFFormPage>
  )
}
