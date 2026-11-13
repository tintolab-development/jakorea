import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMypageMember } from '@/features/mypage/hooks/use-mypage-member'
import { useSettingsView } from '@/features/mypage/settings/hooks/use-settings-view'
import { isMinorSettingsMember } from '@/features/mypage/settings/lib/consent-visibility'
import {
  PortraitGuardianVerificationCancelledError,
  PORTRAIT_GUARDIAN_VERIFICATION_UNAVAILABLE_MESSAGE,
  startPortraitGuardianVerification,
} from '@/features/mypage/settings/lib/portrait-guardian-verification'
import { validatePortraitGuardianRelation } from '@/features/mypage/settings/lib/portrait-guardian-verification-copy'

export type ReceiptMinorGuardianStep = 'identity' | 'info'

/** 영수증 동의서 작성 페이지가 라우트 state에서 읽는 키 (토큰은 저장·출력하지 않는다) */
export const RECEIPT_GUARDIAN_ROUTE_STATE_KEY = 'receiptGuardian' as const

export type ReceiptGuardianRouteState = {
  [RECEIPT_GUARDIAN_ROUTE_STATE_KEY]?: {
    guardianVerificationToken?: string
    /** 보호자 서명란 서명자 표시용 이름 (기획 A-4). 현재는 등록 보호자 이름, BE가 인증값을 내려주면 그 값으로 교체 */
    guardianName?: string
  }
}

/** `ReceiptGuardianGateModals`에 그대로 넘기는 상태·핸들러 */
export type ReceiptMinorGuardianFlowProps = {
  step: ReceiptMinorGuardianStep | null
  guardianName: string
  guardianPhone: string
  relation: string
  relationError: string | null
  identityError: string | null
  verifying: boolean
  /** 1단계 `보호자 본인인증하기` → 2단계 */
  onOpenInfo: () => void
  /** 1·2단계 닫기/취소 */
  onCancel: () => void
  onRelationChange: (value: string) => void
  /** 2단계 `동의서 작성하기` — 보호자 NICE 후 영수증 사전동의서 작성으로 이동 */
  onConfirmInfo: () => void
}

const EMPTY_VALUE = '-'

/**
 * 만 14세 미만 회원 — 영수증 사전동의 작성 전 보호자 본인인증(회원 세션, purpose RECEIPT_PRE_CONSENT).
 * 성공 시 `consentWritePath`로 이동하며 1회용 토큰은 라우트 state로만 전달한다.
 */
export function useReceiptMinorGuardianGate(options: {
  /** 보호자 인증 성공 후 이동할 영수증 사전동의서 작성 경로 */
  consentWritePath: string | null
}) {
  const navigate = useNavigate()
  const member = useMypageMember()
  const { guardian } = useSettingsView()
  const consentWritePathRef = useRef(options.consentWritePath)
  useEffect(() => {
    consentWritePathRef.current = options.consentWritePath
  })

  const isMinor = !member.isLoading && isMinorSettingsMember(member)
  const guardianName = guardian?.name?.trim() || undefined

  const [step, setStep] = useState<ReceiptMinorGuardianStep | null>(null)
  const [relation, setRelation] = useState('')
  const [relationError, setRelationError] = useState<string | null>(null)
  const [identityError, setIdentityError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  const reset = useCallback(() => {
    setStep(null)
    setRelation('')
    setRelationError(null)
    setIdentityError(null)
    setVerifying(false)
  }, [])

  const start = useCallback(() => {
    setIdentityError(null)
    setStep('identity')
  }, [])

  // 기획 A-5: 회원 정보에 보호자가 없어도 막지 않는다(동의서에는 보호자 인증값·관계를 저장).
  const onOpenInfo = useCallback(() => {
    setIdentityError(null)
    setStep('info')
  }, [])

  const onRelationChange = useCallback((value: string) => {
    setRelation(value)
    setRelationError(null)
  }, [])

  const onConfirmInfo = useCallback(async () => {
    if (verifying) return
    const path = consentWritePathRef.current
    if (!path) return
    const error = validatePortraitGuardianRelation(relation)
    setRelationError(error)
    if (error) return
    setVerifying(true)
    try {
      const result = await startPortraitGuardianVerification({
        relation: relation.trim(),
        purpose: 'RECEIPT_PRE_CONSENT',
      })
      reset()
      navigate(path, {
        state: {
          [RECEIPT_GUARDIAN_ROUTE_STATE_KEY]: {
            guardianVerificationToken: result.verificationToken,
            ...(guardianName ? { guardianName } : {}),
          },
        } satisfies ReceiptGuardianRouteState,
      })
    } catch (err) {
      setVerifying(false)
      if (err instanceof PortraitGuardianVerificationCancelledError) {
        return
      }
      setStep('identity')
      setIdentityError(
        err instanceof Error && err.message
          ? err.message
          : PORTRAIT_GUARDIAN_VERIFICATION_UNAVAILABLE_MESSAGE,
      )
    }
  }, [guardianName, navigate, relation, reset, verifying])

  const flowProps: ReceiptMinorGuardianFlowProps = {
    step,
    guardianName: guardian?.name || EMPTY_VALUE,
    guardianPhone: guardian?.phone || EMPTY_VALUE,
    relation,
    relationError,
    identityError,
    verifying,
    onOpenInfo,
    onCancel: reset,
    onRelationChange,
    onConfirmInfo: () => {
      void onConfirmInfo()
    },
  }

  return { isMinor, isMemberLoading: member.isLoading, start, flowProps }
}
