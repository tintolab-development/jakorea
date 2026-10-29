import {
  NiceAuthPopupBlockedError,
  navigateNiceAuthPopup,
  openNiceAuthPopupWindow,
  subscribeIdentityCompletion,
  watchNiceAuthPopupClosed,
  type IdentityMessage,
} from '@jakorea/identity-verification'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import {
  createMemberGuardianVerification,
  getMemberGuardianVerification,
  isGuardianNiceAlreadyStartedError,
  startMemberGuardianVerificationNice,
} from '../api/guardian-verifications'
import {
  interpretMemberGuardianVerificationGet,
  PORTRAIT_GUARDIAN_VERIFICATION_UNAVAILABLE_MESSAGE,
  PortraitGuardianVerificationUnavailableError,
} from './interpret-member-guardian-verification'
import {
  buildMemberGuardianVerificationFrontendReturnUrl,
  MEMBER_GUARDIAN_VERIFICATION_COMPLETION_PREFIX,
} from './member-guardian-verification-callback'
import type {
  PortraitGuardianVerificationPurpose,
  PortraitGuardianVerificationResult,
} from './portrait-guardian-verification-result'

export type { PortraitGuardianVerificationPurpose, PortraitGuardianVerificationResult }
export {
  interpretMemberGuardianVerificationGet,
  PORTRAIT_GUARDIAN_VERIFICATION_UNAVAILABLE_MESSAGE,
  PortraitGuardianVerificationUnavailableError,
}

/**
 * 만 14세 미만 회원 초상권 동의 — 보호자(법정대리인) 본인인증.
 *
 * POST /api/portal/me/guardian-verifications
 * POST .../{sessionId}/nice/start  (X-Verification-Status-Token = create statusToken)
 * GET  .../{sessionId} 폴링 → VERIFIED 시 { verifiedAt, verificationToken }
 * 회원가입용 보호자 Bridge (`/api/auth/verification-sessions/guardian*`) 는 호출하지 않는다.
 */

/** 팝업을 닫아 인증을 중단한 경우. 호출부는 알림 없이 입력 모달을 유지한다. */
export class PortraitGuardianVerificationCancelledError extends Error {
  constructor() {
    super('')
    this.name = 'PortraitGuardianVerificationCancelledError'
  }
}

/** 로컬 dev mock(원격 API 미설정)에서만 인증 성공을 흉내 낸다. */
function isPortraitGuardianVerificationMockMode(): boolean {
  return import.meta.env.DEV && !isRemoteApiConfigured()
}

const MOCK_DELAY_MS = 400
const POLL_INTERVAL_MS = 750
const POLL_MAX_ATTEMPTS = 240
const POLL_AFTER_POPUP_CLOSE = 6

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms)
  })
}

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `gv-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

async function pollUntilVerified(input: {
  sessionId: number
  statusToken: string
  popup: Window | null
}): Promise<PortraitGuardianVerificationResult> {
  let popupClosed = false
  const stopWatch = input.popup
    ? watchNiceAuthPopupClosed(input.popup, () => {
        popupClosed = true
      })
    : () => {}

  let wake = false
  let callbackFailed: string | null = null
  const unsubscribe = subscribeIdentityCompletion(
    MEMBER_GUARDIAN_VERIFICATION_COMPLETION_PREFIX,
    (message: IdentityMessage) => {
      if (message.type === 'IDENTITY_FAILED') {
        callbackFailed =
          typeof message.message === 'string' && message.message.trim()
            ? message.message.trim()
            : PORTRAIT_GUARDIAN_VERIFICATION_UNAVAILABLE_MESSAGE
        wake = true
        return
      }
      if (message.type === 'IDENTITY_VERIFIED') {
        wake = true
      }
    },
  )

  let attemptsAfterClose = POLL_AFTER_POPUP_CLOSE
  try {
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
      if (callbackFailed) {
        throw new PortraitGuardianVerificationUnavailableError(callbackFailed)
      }
      const snapshot = await getMemberGuardianVerification({
        sessionId: input.sessionId,
        statusToken: input.statusToken,
      })
      const interpreted = interpretMemberGuardianVerificationGet(snapshot)
      if (interpreted.kind === 'verified') {
        return interpreted.result
      }
      if (interpreted.kind === 'failed') {
        throw interpreted.error
      }
      if (popupClosed) {
        attemptsAfterClose -= 1
        if (attemptsAfterClose <= 0) {
          throw new PortraitGuardianVerificationCancelledError()
        }
      }
      const waitMs = wake ? 0 : POLL_INTERVAL_MS
      wake = false
      if (waitMs > 0 && attempt < POLL_MAX_ATTEMPTS - 1) {
        await delay(waitMs)
      }
    }
    throw new PortraitGuardianVerificationUnavailableError()
  } finally {
    stopWatch()
    unsubscribe()
  }
}

export async function startPortraitGuardianVerification(input: {
  relation: string
  /** 기본값: `PORTRAIT_RIGHTS` (마이페이지) */
  purpose?: PortraitGuardianVerificationPurpose
  /** `PROGRAM_APPLICATION` 일 때 대상 프로그램 */
  programId?: number
}): Promise<PortraitGuardianVerificationResult> {
  const purpose = input.purpose ?? 'PORTRAIT_RIGHTS'
  const relation = input.relation.trim()

  if (isPortraitGuardianVerificationMockMode()) {
    await delay(MOCK_DELAY_MS)
    return { verifiedAt: new Date().toISOString() }
  }

  if (purpose === 'PROGRAM_APPLICATION' && input.programId == null) {
    throw new PortraitGuardianVerificationUnavailableError()
  }

  let popup: Window | null = null
  try {
    popup = openNiceAuthPopupWindow()
  } catch (error) {
    if (error instanceof NiceAuthPopupBlockedError) {
      throw error
    }
    throw new PortraitGuardianVerificationUnavailableError()
  }

  const frontendReturnUrl = buildMemberGuardianVerificationFrontendReturnUrl()

  try {
    const created = await createMemberGuardianVerification(
      {
        purpose,
        guardianRelation: relation,
        ...(purpose === 'PROGRAM_APPLICATION' && input.programId != null
          ? { programId: input.programId }
          : {}),
        ...(frontendReturnUrl ? { frontendReturnUrl } : {}),
      },
      createIdempotencyKey(),
    )

    let authUrl: string | undefined
    try {
      const started = await startMemberGuardianVerificationNice({
        sessionId: created.sessionId,
        statusToken: created.statusToken,
        body: frontendReturnUrl ? { frontendReturnUrl } : undefined,
      })
      authUrl = started.authUrl?.trim()
    } catch (error) {
      if (!isGuardianNiceAlreadyStartedError(error)) {
        throw error
      }
    }

    if (authUrl) {
      navigateNiceAuthPopup(popup, authUrl)
    }

    const result = await pollUntilVerified({
      sessionId: created.sessionId,
      statusToken: created.statusToken,
      popup,
    })
    popup.close()
    return result
  } catch (error) {
    popup.close()
    throw error
  }
}
