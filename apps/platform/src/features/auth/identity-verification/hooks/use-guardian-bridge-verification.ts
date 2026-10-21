import { useCallback, useEffect, useRef, useState } from 'react'
import {
  NiceAuthPopupBlockedError,
  openNiceAuthPopupWindow,
  navigateNiceAuthPopup,
  subscribeIdentityCompletion,
  takeIdentityCompletion,
  watchNiceAuthPopupClosed,
  type IdentityMessage,
} from '@jakorea/identity-verification'
import {
  getGuardianSignupStatus,
  postGuardianNiceStart,
} from '@/features/auth/sign-up/api/guardian-signup-bridge/client'
import { resolveGuardianNiceStartAfterConflict } from '@/features/auth/sign-up/lib/guardian/complete-guardian-after-nice'
import {
  isGuardianBridgeConflict,
  resolveGuardianBridgeError,
} from '@/features/auth/sign-up/lib/guardian/guardian-bridge-errors'
import {
  createGuardianNiceIdempotencyKey,
  shouldSkipGuardianNiceStart,
} from '@/features/auth/sign-up/lib/guardian/guardian-bridge-status'
import {
  GUARDIAN_IDENTITY_COMPLETION_PREFIX,
  getGuardianBridgePendingIdentitySession,
  readGuardianSignupBridgeState,
  setGuardianBridgePendingIdentitySession,
} from '@/features/auth/sign-up/lib/guardian-signup-bridge-storage'

type GuardianBridgeVerifySuccess = {
  identitySessionId: number
}

type UseGuardianBridgeVerificationOptions = {
  onSuccess: (result: GuardianBridgeVerifySuccess) => void
}

const POPUP_CLOSE_COMPLETION_GRACE_MS = 250

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
  const verifyingRef = useRef(false)
  const lastSessionIdRef = useRef<number | null>(null)
  const onSuccessRef = useRef(options.onSuccess)
  onSuccessRef.current = options.onSuccess

  const cleanupPopupWatch = useCallback(() => {
    stopWatchPopupRef.current?.()
    stopWatchPopupRef.current = null
    popupRef.current = null
  }, [])

  const applyMessage = useCallback(
    (data: IdentityMessage) => {
      if (completingRef.current) return

      const pending = getGuardianBridgePendingIdentitySession()
      const expectedSessionId = pending?.identitySessionId ?? lastSessionIdRef.current

      if (data.type === 'IDENTITY_CANCELLED') {
        cleanupPopupWatch()
        completingRef.current = false
        verifyingRef.current = false
        setIsVerifying(false)
        return
      }

      if (data.type === 'IDENTITY_FAILED') {
        cleanupPopupWatch()
        completingRef.current = false
        verifyingRef.current = false
        setIsVerifying(false)
        setErrorMessage(
          typeof data.message === 'string' && data.message.trim()
            ? data.message.trim()
            : '보호자 본인인증에 실패했습니다.',
        )
        return
      }

      if (data.type !== 'IDENTITY_VERIFIED') return

      const sessionId = typeof data.sessionId === 'number' ? data.sessionId : Number(data.sessionId)
      if (!sessionId || Number.isNaN(sessionId)) return
      if (expectedSessionId != null && expectedSessionId !== sessionId) return

      completingRef.current = true
      cleanupPopupWatch()
      verifyingRef.current = false
      setIsVerifying(false)
      setErrorMessage(null)
      onSuccessRef.current({ identitySessionId: sessionId })
      completingRef.current = false
    },
    [cleanupPopupWatch],
  )

  const applyMessageRef = useRef(applyMessage)
  applyMessageRef.current = applyMessage

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data
      if (!data || typeof data !== 'object' || typeof data.type !== 'string') return
      applyMessageRef.current(data as IdentityMessage)
    }

    window.addEventListener('message', handleMessage)
    const unsubscribe = subscribeIdentityCompletion(
      GUARDIAN_IDENTITY_COMPLETION_PREFIX,
      message => applyMessageRef.current(message),
    )
    const existing = takeIdentityCompletion(GUARDIAN_IDENTITY_COMPLETION_PREFIX)
    if (existing) {
      applyMessageRef.current(existing)
    }

    return () => {
      window.removeEventListener('message', handleMessage)
      unsubscribe()
    }
  }, [])

  useEffect(() => () => cleanupPopupWatch(), [cleanupPopupWatch])

  const finishWithoutPopup = useCallback(
    (identitySessionId: number) => {
      verifyingRef.current = false
      setIsVerifying(false)
      setErrorMessage(null)
      onSuccessRef.current({ identitySessionId })
    },
    [],
  )

  const verify = useCallback(async () => {
    if (verifyingRef.current) return

    setErrorMessage(null)
    completingRef.current = false

    const bridge = readGuardianSignupBridgeState()
    if (!bridge?.guardianSessionId || !bridge.guardianStatusToken.trim()) {
      setErrorMessage('보호자 인증 정보가 없습니다. 이전 단계부터 다시 진행해 주세요.')
      return
    }

    verifyingRef.current = true
    setIsVerifying(true)
    let popup: Window | null = null

    try {
      const status = await getGuardianSignupStatus({
        guardianSessionId: bridge.guardianSessionId,
        statusToken: bridge.guardianStatusToken,
      })

      const pendingIdentitySessionId =
        getGuardianBridgePendingIdentitySession()?.identitySessionId ??
        bridge.identitySessionId ??
        lastSessionIdRef.current ??
        0

      if (shouldSkipGuardianNiceStart(status)) {
        finishWithoutPopup(pendingIdentitySessionId > 0 ? pendingIdentitySessionId : 1)
        return
      }

      popup = openNiceAuthPopupWindow()

      let start
      try {
        start = await postGuardianNiceStart({
          guardianSessionId: bridge.guardianSessionId,
          statusToken: bridge.guardianStatusToken,
          idempotencyKey: createGuardianNiceIdempotencyKey(bridge.guardianSessionId),
        })
      } catch (error) {
        if (!isGuardianBridgeConflict(error)) {
          throw error
        }
        const afterConflict = await getGuardianSignupStatus({
          guardianSessionId: bridge.guardianSessionId,
          statusToken: bridge.guardianStatusToken,
        })
        const resolved = resolveGuardianNiceStartAfterConflict({
          status: afterConflict,
          identitySessionId: pendingIdentitySessionId,
        })
        if (resolved.kind === 'skip_to_success') {
          popup?.close()
          cleanupPopupWatch()
          finishWithoutPopup(resolved.identitySessionId)
          return
        }
        throw error
      }

      const identitySessionId = start.sessionId
      const authUrl = start.authUrl?.trim()
      if (identitySessionId == null || !authUrl) {
        throw new Error('본인인증 시작 응답이 올바르지 않습니다.')
      }

      const nonce = createChallengeNonce()
      lastSessionIdRef.current = identitySessionId
      setGuardianBridgePendingIdentitySession({ identitySessionId, nonce })

      navigateNiceAuthPopup(popup, authUrl)
      popupRef.current = popup
      stopWatchPopupRef.current = watchNiceAuthPopupClosed(popup, () => {
        window.setTimeout(() => {
          if (completingRef.current) return
          const completion = takeIdentityCompletion(GUARDIAN_IDENTITY_COMPLETION_PREFIX)
          if (completion) {
            applyMessageRef.current(completion)
            return
          }
          verifyingRef.current = false
          setIsVerifying(false)
        }, POPUP_CLOSE_COMPLETION_GRACE_MS)
      })
    } catch (error) {
      cleanupPopupWatch()
      verifyingRef.current = false
      setIsVerifying(false)
      if (error instanceof NiceAuthPopupBlockedError) {
        setErrorMessage(error.message)
        return
      }
      setErrorMessage(
        resolveGuardianBridgeError(error).message ||
          '보호자 본인인증을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      )
    }
  }, [cleanupPopupWatch, finishWithoutPopup])

  return { verify, isVerifying, errorMessage }
}
