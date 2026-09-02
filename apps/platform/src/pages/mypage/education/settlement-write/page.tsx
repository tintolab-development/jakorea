import { useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ProgramBackButton } from '@/features/program'
import {
  buildSettlementTabPath,
  EducationSettlementWriteForm,
  getMockEducationSettlements,
} from '@/features/mypage/education/settlements'
import {
  educationApplicationDetailPath,
  getMockEducationApplicationById,
} from '@/features/mypage'
import { PFFormPage } from '@/shared/ui'

export function MypageEducationSettlementWritePage() {
  const navigate = useNavigate()
  const { applicationId = '' } = useParams<{ applicationId: string }>()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId') ?? ''

  const application = useMemo(
    () => (applicationId ? getMockEducationApplicationById(applicationId) : undefined),
    [applicationId],
  )
  const session = useMemo(() => {
    if (!application) return undefined
    const items = getMockEducationSettlements(application.programId)
    return items.find(item => item.id === sessionId)
  }, [application, sessionId])

  const backPath = applicationId
    ? buildSettlementTabPath(applicationId)
    : educationApplicationDetailPath(applicationId)

  return (
    <PFFormPage
      aria-label="지급조서 작성하기"
      back={
        <ProgramBackButton
          size="small"
          label="이전으로"
          onClick={() => navigate(backPath)}
        />
      }
      title="지급조서 작성하기"
    >
      <EducationSettlementWriteForm programTitle={application?.title} session={session} />
    </PFFormPage>
  )
}
