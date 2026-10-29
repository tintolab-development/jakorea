import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { getPortalProfile } from '@/features/auth/sign-in/api/client'
import { useMypageMember } from '@/features/mypage/hooks/use-mypage-member'
import { settingsConsentWritePath } from '@/features/mypage/lib/constants'
import { useSettingsView } from '@/features/mypage/settings/hooks/use-settings-view'
import { isMinorSettingsMember } from '@/features/mypage/settings/lib/consent-visibility'
import {
  PORTRAIT_GUARDIAN_VERIFICATION_UNAVAILABLE_MESSAGE,
  startPortraitGuardianVerification,
} from '@/features/mypage/settings/lib/portrait-guardian-verification'
import { validatePortraitGuardianRelation } from '@/features/mypage/settings/lib/portrait-guardian-verification-copy'
import { SETTINGS_PORTRAIT_CONSENT_WRITE_KEY } from '@/features/mypage/settings/lib/settings-consent-key'
import { parsePortalProgramId } from '../api/mappers'
import {
  isProgramMinorPortraitAttemptSatisfied,
  markProgramMinorPortraitGuardianVerified,
} from '../lib/program-minor-portrait-attempt'
import { PROGRAM_GUARDIAN_MISSING_MESSAGE } from '../lib/program-minor-portrait-copy'

export type ProgramMinorPortraitStep = 'identity' | 'info'

/** `ProgramApplyGateModals` 에 그대로 넘기는 미성년 보호자 인증 흐름 상태·핸들러 */
export type ProgramMinorPortraitFlowProps = {
  step: ProgramMinorPortraitStep | null
  guardianName: string
  guardianPhone: string
  relation: string
  relationError: string | null
  identityError: string | null
  verifying: boolean
  /** 1단계 하단 시트 `동의서 작성하기` */
  onStart: () => void
  /** 2·3단계 닫기/취소 — 흐름만 초기화(게이트 모달 닫기는 호출 측) */
  onCancel: () => void
  /** 2단계 `보호자 본인인증하기` */
  onOpenInfo: () => void
  onRelationChange: (value: string) => void
  /** 3단계 `확인하기` — 보호자 본인인증 후 프로그램 초상권 동의서로 이동 */
  onConfirmInfo: () => void
}

const EMPTY_VALUE = '-'

/**
 * 만 14세 미만 회원 — 프로그램 신청마다 보호자 본인인증 + 프로그램 초상권 동의서.
 * 성인·비로그인은 `checkPending` 이 항상 `{ isMinor: false, pending: false }`.
 */
export function useProgramMinorPortraitGate(
  programId: string | null | undefined,
  options: { onLeave: () => void },
) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const member = useMypageMember()
  const { guardian } = useSettingsView()
  const memberRef = useRef(member)
  const onLeaveRef = useRef(options.onLeave)
  useEffect(() => {
    memberRef.current = member
    onLeaveRef.current = options.onLeave
  })

  const [step, setStep] = useState<ProgramMinorPortraitStep | null>(null)
  const [relation, setRelation] = useState('')
  const [relationError, setRelationError] = useState<string | null>(null)
  const [identityError, setIdentityError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  /** 동의서 완료 후 돌아갈 신청서 경로 / 동의서 화면 뒤로가기 경로 */
  const returnToRef = useRef<string | null>(null)
  const backToRef = useRef<string | null>(null)

  const currentPath = `${location.pathname}${location.search}`

  const resolveIsMinor = useCallback(async (): Promise<boolean> => {
    const current = memberRef.current
    if (!current.isRemoteSession || !current.isLoading) {
      return isMinorSettingsMember(current)
    }
    // 프로필이 아직 로딩 중이면 한 번 읽어 판단한다(실패 시 현재 값으로).
    try {
      const profile = await queryClient.fetchQuery({
        queryKey: platformQueryKeys.auth.memberProfile(),
        queryFn: ({ signal }) => getPortalProfile(signal),
        staleTime: 5 * 60_000,
      })
      return isMinorSettingsMember({
        under14: profile?.under14,
        ageGroup: profile?.ageGroup,
        birthDate: profile?.birthDate,
      })
    } catch {
      return isMinorSettingsMember(current)
    }
  }, [queryClient])

  /** 미성년이고 이번 신청 시도의 보호자 인증·동의서가 아직이면 pending */
  const checkPending = useCallback(async () => {
    const isMinor = await resolveIsMinor()
    if (!isMinor) return { isMinor: false, pending: false }
    return { isMinor: true, pending: !isProgramMinorPortraitAttemptSatisfied(programId) }
  }, [programId, resolveIsMinor])

  /** 게이트 시작 시점에 돌아갈 경로를 기억한다(상세: 신청서 경로, 신청서: 현재 경로). */
  const rememberReturnTo = useCallback(
    (returnTo?: string) => {
      returnToRef.current = returnTo ?? currentPath
      backToRef.current = currentPath
    },
    [currentPath],
  )

  const reset = useCallback(() => {
    setStep(null)
    setRelation('')
    setRelationError(null)
    setIdentityError(null)
    setVerifying(false)
  }, [])

  const onStart = useCallback(() => {
    setIdentityError(null)
    setStep('identity')
  }, [])

  const onOpenInfo = useCallback(() => {
    if (!guardian) {
      setIdentityError(PROGRAM_GUARDIAN_MISSING_MESSAGE)
      return
    }
    setIdentityError(null)
    setStep('info')
  }, [guardian])

  const onRelationChange = useCallback((value: string) => {
    setRelation(value)
    setRelationError(null)
  }, [])

  const onConfirmInfo = useCallback(async () => {
    if (verifying) return
    const numericId = parsePortalProgramId(programId)
    if (numericId == null) return
    const error = validatePortraitGuardianRelation(relation)
    setRelationError(error)
    if (error) return
    setVerifying(true)
    try {
      // TODO(BE): 보호자 본인인증(NICE) 실 API 연결 — 현재 어댑터는 dev mock 외에는 '진행 불가' 를 던진다.
      const result = await startPortraitGuardianVerification({
        relation: relation.trim(),
        purpose: 'PROGRAM_APPLICATION',
        programId: numericId,
      })
      markProgramMinorPortraitGuardianVerified(numericId, result.verifiedAt)
      const returnTo = returnToRef.current ?? currentPath
      const backTo = backToRef.current ?? currentPath
      const params = new URLSearchParams({
        programId: String(numericId),
        returnTo,
        backTo,
      })
      reset()
      onLeaveRef.current()
      navigate(`${settingsConsentWritePath(SETTINGS_PORTRAIT_CONSENT_WRITE_KEY)}?${params}`, {
        state: { programMinorPortrait: { guardianVerificationToken: result.verificationToken } },
      })
    } catch (err) {
      setVerifying(false)
      setStep('identity')
      setIdentityError(
        err instanceof Error && err.message
          ? err.message
          : PORTRAIT_GUARDIAN_VERIFICATION_UNAVAILABLE_MESSAGE,
      )
    }
  }, [currentPath, navigate, programId, relation, reset, verifying])

  const flowProps: ProgramMinorPortraitFlowProps = {
    step,
    guardianName: guardian?.name || EMPTY_VALUE,
    guardianPhone: guardian?.phone || EMPTY_VALUE,
    relation,
    relationError,
    identityError,
    verifying,
    onStart,
    onCancel: reset,
    onOpenInfo,
    onRelationChange,
    onConfirmInfo: () => {
      void onConfirmInfo()
    },
  }

  return { checkPending, rememberReturnTo, flowProps }
}
