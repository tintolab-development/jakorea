import { useCallback, useEffect, useRef, useState } from 'react'

import type { IdentityVerificationClient } from '../client'
import { NiceAuthPopupBlockedError } from '../popup'
import type { IdentityChallengeCompleteResult } from '../types'

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
  onSuccess: (result: IdentityChallengeCompleteResult) => void
  /** 생년월일·성별 미입력 시 */
  missingInputMessage?: string
}

export function useIdentityVerification({
  client,
  birthDate,
  gender,
  onSuccess,
  missingInputMessage = '생년월일과 성별을 먼저 입력해 주세요.',
}: UseIdentityVerificationOptions) {
  const [status, setStatus] = useState<IdentityVerificationHookStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const popupRef = useRef<Window | null>(null)
  const stopWatchPopupRef = useRef<(() => void) | null>(null)
  const completingRef = useRef(false)

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

      if (event.data.type === 'IDENTITY_CANCELLED') {
        handleCancel()
        return
      }

      if (event.data.type === 'IDENTITY_FAILED') {
        cleanupPopupWatch()
        client.state.clearPendingChallenge()
        completingRef.current = false
        setStatus('error')
        setErrorMessage(event.data.message ?? '본인인증에 실패했습니다.')
        return
      }

      if (event.data.type === 'IDENTITY_VERIFIED') {
        if (completingRef.current) {
          return
        }
        completingRef.current = true
        cleanupPopupWatch()
        client.state.clearPendingChallenge()
        setStatus('completing')
        setErrorMessage(null)

        const verified = event.data
        onSuccess({
          sessionId: verified.sessionId,
          sessionUuid: verified.sessionUuid,
          verifiedName: verified.verifiedName,
          verifiedPhone: verified.verifiedPhone,
          verifiedBirthDate: verified.verifiedBirthDate,
          verifiedAt: verified.verifiedAt,
        })
        setStatus('idle')
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [cleanupPopupWatch, client, handleCancel, onSuccess])

  useEffect(() => {
    return () => {
      cleanupPopupWatch()
    }
  }, [cleanupPopupWatch])

  const verify = useCallback(async () => {
    if (!birthDate || !gender) {
      setStatus('error')
      setErrorMessage(missingInputMessage)
      return
    }

    resetError()
    setStatus('loading')

    let popup: Window | null = null

    try {
      popup = client.popup.openWindow()
      const challenge = await client.startChallenge({ birthDate, gender })
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
      if (error instanceof NiceAuthPopupBlockedError) {
        setErrorMessage(error.message)
        return
      }
      setErrorMessage(
        error instanceof Error ? error.message : '본인인증을 시작할 수 없습니다.'
      )
    }
  }, [birthDate, cleanupPopupWatch, client, gender, handleCancel, missingInputMessage, resetError])

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
