import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  buildSettlementTabPath,
  buildSettlementWritePath,
  clearSettlementWriteDraft,
  EducationSettlementConfirmView,
  getMockEducationSettlements,
  loadSettlementWriteDraft,
  type SettlementWriteDraftLocationState,
} from '@/features/mypage/education/settlements'
import { getMockEducationApplicationById } from '@/features/mypage'
import { PFFormPage } from '@/shared/ui'
import styles from './page.module.css'

export function MypageEducationSettlementConfirmPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { applicationId = '' } = useParams<{ applicationId: string }>()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId') ?? ''

  const application = useMemo(
    () => (applicationId ? getMockEducationApplicationById(applicationId) : undefined),
    [applicationId]
  )
  const session = useMemo(() => {
    if (!application) return undefined
    const items = getMockEducationSettlements(application.programId)
    return items.find(item => item.id === sessionId)
  }, [application, sessionId])

  const draft = useMemo(() => {
    const state = location.state as SettlementWriteDraftLocationState | null
    if (state?.draft && state.draft.meta.applicationId === applicationId) {
      return state.draft
    }
    if (!applicationId || !sessionId) return null
    return loadSettlementWriteDraft(applicationId, sessionId)
  }, [applicationId, location.state, sessionId])

  useEffect(() => {
    if (!applicationId || !sessionId) {
      navigate(buildSettlementTabPath(applicationId), { replace: true })
      return
    }
    if (!draft) {
      navigate(buildSettlementWritePath({ applicationId, sessionId }), { replace: true })
    }
  }, [applicationId, draft, navigate, sessionId])

  if (!draft) {
    return null
  }

  const handleComplete = () => {
    clearSettlementWriteDraft(applicationId, sessionId)
    navigate(buildSettlementTabPath(applicationId))
  }

  const handleBack = () => {
    navigate(buildSettlementWritePath({ applicationId, sessionId }), {
      state: { draft },
    })
  }

  return (
    <PFFormPage
      aria-label="지급조서 신청 내용 확인"
      className={styles.page}
      innerClassName={styles.inner}
      title="지급조서 신청 전에 정보가 맞는지 확인해 주세요."
    >
      <EducationSettlementConfirmView
        draft={draft}
        programTitle={application?.title}
        session={session}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    </PFFormPage>
  )
}
