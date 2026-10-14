import { useCallback, useEffect, useRef, useState } from 'react'
import {
  NiceAuthPopupBlockedError,
  openNiceAuthPopupWindow,
  navigateNiceAuthPopup,
  watchNiceAuthPopupClosed,
} from '@jakorea/identity-verification'
import { postGuardianNiceStart } from '@/features/auth/sign-up/api/guardian-signup-bridge/client'
import {
  getGuardianBridgePendingIdentitySession,
  readGuardianSignupBridgeState,
  setGuardianBridgePendingIdentitySession,
} from '@/features/auth/sign-up/lib/guardian-signup-bridge-storage'
import { getSignupApiErrorMessage } from '@/features/auth/sign-up/lib/helpers'

type GuardianBridgeVerifySuccess = {
  identitySessionId: number
}

type UseGuardianBridgeVerificationOptions = {
  onSuccess: (result: GuardianBridgeVerifySuccess) => void
}

function createChallengeNonce(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `nonce-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useGuardianBridgeVerification(options: UseGuardianBridgeVerificationOptions) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const popupRef = useRef<Window | null>(null)
  const stopWatchPopupRef = useRef<(() => void) | null>(null)
  const completingRef = useRef(false)
  const onSuccessRef = useRef(options.onSuccess)
  onSuccessRef.current = options.onSuccess

  const cleanupPopupWatch = useCallback(() => {
    stopWatchPopupRef.current?.()
    stopWatchPopupRef.current = null
    popupRef.current = null
  }, [])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data
      if (!data || typeof data !== 'object' || typeof data.type !== 'string') return

      const pending = getGuardianBridgePendingIdentitySession()
      if (!pending) return

      if (data.type === 'IDENTITY_CANCELLED') {
        cleanupPopupWatch()
        completingRef.current = false
        setIsVerifying(false)
        return
      }

      if (data.type === 'IDENTITY_FAILED') {
        if (completingRef.current) return
        cleanupPopupWatch()
        completingRef.current = false
        setIsVerifying(false)
        setErrorMessage(
          typeof data.message === 'string' && data.message.trim()
            ? data.message.trim()
            : '보호자 본인인증에 실패했습니다.',
        )
        return
      }

      if (data.type === 'IDENTITY_VERIFIED') {
        const sessionId = typeof data.sessionId === 'number' ? data.sessionId : Number(data.sessionId)
        if (!sessionId || sessionId !== pending.identitySessionId) return
        if (completingRef.current) return
        completingRef.current = true
        cleanupPopupWatch()
        setIsVerifying(false)
        setErrorMessage(null)
        onSuccessRef.current({ identitySessionId: sessionId })
        completingRef.current = false
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [cleanupPopupWatch])

  useEffect(() => () => cleanupPopupWatch(), [cleanupPopupWatch])

  const verify = useCallback(async () => {
    setErrorMessage(null)
    completingRef.current = false

    const bridge = readGuardianSignupBridgeState()
    if (!bridge?.guardianSessionId || !bridge.guardianStatusToken.trim()) {
      setErrorMessage('보호자 인증 정보가 없습니다. 이전 단계부터 다시 진행해 주세요.')
      return
    }

    setIsVerifying(true)
    let popup: Window | null = null

    try {
      popup = openNiceAuthPopupWindow()
      const start = await postGuardianNiceStart({
        guardianSessionId: bridge.guardianSessionId,
        statusToken: bridge.guardianStatusToken,
      })
      const identitySessionId = start.sessionId
      const authUrl = start.authUrl?.trim()
      if (identitySessionId == null || !authUrl) {
        throw new Error('본인인증 시작 응답이 올바르지 않습니다.')
      }

      const nonce = createChallengeNonce()
      setGuardianBridgePendingIdentitySession({ identitySessionId, nonce })

      navigateNiceAuthPopup(popup, authUrl)
      popupRef.current = popup
      stopWatchPopupRef.current = watchNiceAuthPopupClosed(popup, () => {
        if (completingRef.current) return
        setIsVerifying(false)
      })
    } catch (error) {
      cleanupPopupWatch()
      setIsVerifying(false)
      if (error instanceof NiceAuthPopupBlockedError) {
        setErrorMessage(error.message)
        return
      }
      setErrorMessage(
        getSignupApiErrorMessage(error, '보호자 본인인증을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.'),
      )
    }
  }, [cleanupPopupWatch])

  return { verify, isVerifying, errorMessage }
}
