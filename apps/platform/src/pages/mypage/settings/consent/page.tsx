import { useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { ConsentWriteFormPage } from '@/features/mypage/consent/ui/consent-write-form-page'
import {
  getInstructorApplyConsentPageDescription,
  getInstructorApplyConsentPageTitle,
  InstructorApplyConsentWriteForm,
  isDocumentConsentWriteKey,
  MYPAGE_SETTINGS_CONSENTS_TAB,
} from '@/features/mypage'
import { MEMBER_CONSENT_TEMPLATE_MAP } from '@jakorea/form-schema/consent'
import {
  isSettingsConsentWriteKey,
  SETTINGS_PORTRAIT_CONSENT_WRITE_KEY,
} from '@/features/mypage/settings/lib/settings-consent-key'
import { MypagePortraitConsentWriteForm } from '@/features/mypage/settings/ui/mypage-portrait-consent-write-form'
import { parseSafeInternalPath } from '@/features/mypage/lib/safe-internal-path'
import { parsePortalProgramId } from '@/features/program/api/mappers'
import {
  markProgramMinorPortraitConsentCompleted,
  readProgramMinorPortraitAttempt,
} from '@/features/program/lib/program-minor-portrait-attempt'

/** 보호자 본인인증 직후 라우트 state (토큰은 저장·출력하지 않는다) */
type PortraitGuardianRouteState = {
  guardianVerificationToken?: string
  portraitGuardian?: { guardianVerificationToken?: string }
  programMinorPortrait?: { guardianVerificationToken?: string }
} | null

export function MypageSettingsConsentPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { consentKey = '' } = useParams<{ consentKey: string }>()
  const [searchParams] = useSearchParams()
  const isValidKey = isSettingsConsentWriteKey(consentKey)
  const isPortraitKey = consentKey === SETTINGS_PORTRAIT_CONSENT_WRITE_KEY
  const returnTo =
    parseSafeInternalPath(searchParams.get('returnTo')) ?? MYPAGE_SETTINGS_CONSENTS_TAB
  const isView = searchParams.get('mode') === 'view'
  const location = useLocation()
  // 미성년 프로그램 신청: `?programId=` 가 있으면 프로그램 단위 초상권 동의서로 작성한다.
  const minorProgramId = isPortraitKey ? parsePortalProgramId(searchParams.get('programId')) : null
  const minorBackTo = parseSafeInternalPath(searchParams.get('backTo')) ?? returnTo
  const minorGuardianVerified =
    minorProgramId != null && readProgramMinorPortraitAttempt(minorProgramId) != null
  const routeState = location.state as PortraitGuardianRouteState
  const minorGuardianVerificationToken =
    routeState?.guardianVerificationToken ??
    routeState?.portraitGuardian?.guardianVerificationToken ??
    routeState?.programMinorPortrait?.guardianVerificationToken

  useEffect(() => {
    if (!isValidKey) {
      navigate(MYPAGE_SETTINGS_CONSENTS_TAB, { replace: true })
    }
  }, [isValidKey, navigate])

  // 보호자 본인인증 없이 URL 로 직접 들어온 경우 — 신청 흐름 처음으로 돌려보낸다.
  useEffect(() => {
    if (minorProgramId != null && !minorGuardianVerified) {
      navigate(minorBackTo, { replace: true })
    }
  }, [minorBackTo, minorGuardianVerified, minorProgramId, navigate])

  if (!isValidKey) {
    return null
  }

  const title = isPortraitKey
    ? MEMBER_CONSENT_TEMPLATE_MAP.consentPortrait.modalTitle
    : isDocumentConsentWriteKey(consentKey)
      ? getInstructorApplyConsentPageTitle(consentKey)
      : ''
  const description = isDocumentConsentWriteKey(consentKey)
    ? getInstructorApplyConsentPageDescription(consentKey)
    : undefined

  const handleComplete = () => {
    void queryClient.invalidateQueries({ queryKey: platformQueryKeys.mypage.consents() })
    if (minorProgramId != null) {
      // 이번 신청 시도의 동의 완료 → 신청서로 (replace: 뒤로가기로 동의서 재제출 방지)
      markProgramMinorPortraitConsentCompleted(minorProgramId)
      navigate(returnTo, { replace: true })
      return
    }
    navigate(returnTo)
  }
  const [titleAside, setTitleAside] = useState<ReactNode>(null)

  return (
    <ConsentWriteFormPage
      ariaLabel={title}
      title={title}
      description={description}
      titleAside={titleAside}
      onBack={() => navigate(minorProgramId != null ? minorBackTo : returnTo)}
    >
      {isPortraitKey ? (
        <MypagePortraitConsentWriteForm
          onComplete={handleComplete}
          onTitleAside={setTitleAside}
          programTarget={
            minorProgramId != null ? { programId: minorProgramId } : undefined
          }
          guardianVerificationToken={minorGuardianVerificationToken}
        />
      ) : isDocumentConsentWriteKey(consentKey) ? (
        <InstructorApplyConsentWriteForm
          consentKey={consentKey}
          readOnly={isView}
          submitContext="mypageSettings"
          onTitleAside={setTitleAside}
          onComplete={handleComplete}
        />
      ) : null}
    </ConsentWriteFormPage>
  )
}
