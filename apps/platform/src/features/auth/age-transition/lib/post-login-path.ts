import {
  MEMBER_CONVERSION_PATH,
  readMemberConversionLaterPath,
  withMemberConversionRedirect,
} from '@/pages/auth/member-conversion/lib/paths'
import { getAgeTransitionStatus } from '../api/client'
import { isAgeTransitionEvidencePending, shouldPromptAge14Transition } from './eligibility'
import { isAgeTransitionNoticeDismissedThisLogin } from './notice-session'

export async function resolvePostLoginPath(intendedPath: string): Promise<string> {
  const fallback = readMemberConversionLaterPath(intendedPath)
  if (isAgeTransitionNoticeDismissedThisLogin()) {
    return fallback
  }

  try {
    const status = await getAgeTransitionStatus()
    if (isAgeTransitionEvidencePending(status)) {
      return fallback
    }
    if (shouldPromptAge14Transition(status)) {
      return withMemberConversionRedirect(MEMBER_CONVERSION_PATH, fallback)
    }
  } catch {
    return fallback
  }

  return fallback
}
