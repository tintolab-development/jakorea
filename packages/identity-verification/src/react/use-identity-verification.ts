import { useCallback, useEffect, useRef, useState } from 'react'

import type { IdentityVerificationClient } from '../client'
import { IdentityVerificationApiError } from '../errors'
import { NiceAuthPopupBlockedError } from '../popup'
import type { IdentityChallengeCompleteResult } from '../types'

const DEFAULT_START_FAILED_MESSAGE = '본인인증을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.'

/** BE ClientErrorMessageResolver가 INVALID_CREDENTIALS에 쓰는 로그인 카피 */
function isLoginCredentialsCopy(message: string): boolean {
  return message.includes('이메일 또는 비밀번호')
}

function toStartChallengeErrorMessage(error: unknown): string {
  if (error instanceof NiceAuthPopupBlockedError) {
    return error.message
  }
  if (error instanceof IdentityVerificationApiError) {
    if (error.code === 'INVALID_CREDENTIALS' || isLoginCredentialsCopy(error.message)) {
      return DEFAULT_START_FAILED_MESSAGE
    }
    return error.message.trim() || DEFAULT_START_FAILED_MESSAGE
  }
  if (error instanceof Error && error.message.trim()) {
    if (isLoginCredentialsCopy(error.message)) {
      return DEFAULT_START_FAILED_MESSAGE
    }
    return error.message.trim()
  }
  return DEFAULT_START_FAILED_MESSAGE
}

function isAbortLikeMessage(message: string | undefined): boolean {
  if (!message) {
    return false
  }

  const normalized = message.trim().toLowerCase()
  return normalized === 'request aborted' || normalized === 'canceled'
}

export type IdentityVerificationHookStatus =
  | 'idle'
  | 'loading'
  | 'popup_open'
  | 'completing'
  | 'error'

export interface UseIdentityVerificationOptions {
  client: IdentityVerificationClient
  birthDate?: string
  gender?: string
  name?: string
  onSuccess: (result: IdentityChallengeCompleteResult) => void
  /** 생년월일·성별 미입력 시 (requireBirthGender=true일 때) */
  missingInputMessage?: string
  /** false면 이름만으로 본인인증 시작 가능 (이메일 찾기 등) */
  requireBirthGender?: boolean
  /** requireBirthGender=false일 때 이름 필수 여부 (비밀번호 찾기 등) */
  requireName?: boolean
  /** requireBirthGender=false일 때 이름 미입력 메시지 */
  missingNameMessage?: string
}

export interface VerifyIdentityOverride {
  name?: string
  birthDate?: string
  gender?: string
}

export function useIdentityVerification({
  client,
  birthDate,
  gender,
  name,
  onSuccess,
  missingInputMessage = '생년월일과 성별을 먼저 입력해 주세요.',
  requireBirthGender = true,
  requireName = true,
  missingNameMessage = '이름을 먼저 입력해 주세요.',
}: UseIdentityVerificationOptions) {
  const [status, setStatus] = useState<IdentityVerificationHookStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const popupRef = useRef<Window | null>(null)
  const stopWatchPopupRef = useRef<(() => void) | null>(null)
  const completingRef = useRef(false)
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  const resetError = useCallback(() => {
    setErrorMessage(null)
    if (status === 'error') {
      setStatus('idle')
    }
  }, [status])

  const cleanupPopupWatch = useCallback(() => {
    stopWatchPopupRef.current?.()
    stopWatchPopupRef.current = null
    popupRef.current = null
  }, [])

  const handleCancel = useCallback(() => {
    cleanupPopupWatch()
    client.state.clearPendingChallenge()
    completingRef.current = false
    setStatus('idle')
  }, [cleanupPopupWatch, client])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return
      }

      if (!client.state.isIdentityMessage(event.data)) {
        return
      }

      const pendingChallenge = client.state.getPendingChallenge()

      if (event.data.type === 'IDENTITY_CANCELLED') {
        if (!pendingChallenge) {
          return
        }
        handleCancel()
        return
      }

      if (event.data.type === 'IDENTITY_FAILED') {
        if (!pendingChallenge) {
          return
        }
        if (completingRef.current) {
          return
        }

        const failedMessage = event.data.message ?? '본인인증에 실패했습니다.'
        if (isAbortLikeMessage(failedMessage)) {
          return
        }

        cleanupPopupWatch()
        client.state.clearPendingChallenge()
        completingRef.current = false
        setStatus('error')
        setErrorMessage(failedMessage)
        return
      }

      if (event.data.type === 'IDENTITY_VERIFIED') {
        const verified = event.data
        if (
          !pendingChallenge ||
          pendingChallenge.sessionId !== verified.sessionId
        ) {
          return
        }
        if (completingRef.current) {
          return
        }
        completingRef.current = true
        cleanupPopupWatch()
        client.state.clearPendingChallenge()
        setStatus('completing')
        setErrorMessage(null)

        onSuccessRef.current({
          sessionId: verified.sessionId,
          sessionUuid: verified.sessionUuid,
          profileToken: verified.profileToken,
          verifiedName: verified.verifiedName,
          verifiedPhone: verified.verifiedPhone,
          verifiedBirthDate: verified.verifiedBirthDate,
          verifiedGender: verified.verifiedGender,
          verifiedAt: verified.verifiedAt,
        })
        setStatus('idle')
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [cleanupPopupWatch, client, handleCancel])

  useEffect(() => {
    return () => {
      cleanupPopupWatch()
    }
  }, [cleanupPopupWatch])

  const verify = useCallback(async (override?: VerifyIdentityOverride) => {
    const resolvedBirthDate = override?.birthDate ?? birthDate
    const resolvedGender = override?.gender ?? gender
    const resolvedName = (override?.name ?? name)?.trim()

    if (requireBirthGender) {
      if (!resolvedBirthDate || !resolvedGender) {
        setStatus('error')
        setErrorMessage(missingInputMessage)
        return
      }
    } else if (requireName && !resolvedName) {
      setStatus('error')
      setErrorMessage(missingNameMessage)
      return
    }

    resetError()
    completingRef.current = false
    setStatus('loading')

    let popup: Window | null = null

    try {
      popup = client.popup.openWindow()
      const challenge = await client.startChallenge({
        birthDate: resolvedBirthDate,
        gender: resolvedGender,
        name: resolvedName,
      })
      client.popup.navigate(popup, challenge.authUrl)
      popupRef.current = popup
      setStatus('popup_open')

      stopWatchPopupRef.current = client.popup.watchClosed(popup, () => {
        if (completingRef.current) {
          return
        }
        handleCancel()
      })
    } catch (error) {
      popup?.close()
      cleanupPopupWatch()
      client.state.clearPendingChallenge()
      completingRef.current = false
      setStatus('error')
      setErrorMessage(toStartChallengeErrorMessage(error))
    }
  }, [
    birthDate,
    cleanupPopupWatch,
    client,
    gender,
    handleCancel,
    missingInputMessage,
    missingNameMessage,
    name,
    requireBirthGender,
    requireName,
    resetError,
  ])

  const isVerifying =
    status === 'loading' || status === 'popup_open' || status === 'completing'

  return {
    verify,
    status,
    isVerifying,
    errorMessage,
    resetError,
    cancel: handleCancel,
  }
}
