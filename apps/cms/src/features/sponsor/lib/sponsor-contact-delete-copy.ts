import { getDataManagementApiErrorMessage } from '@/features/data-management/api/get-data-management-api-error'
import { SIMPLE_DELETE_IRREVERSIBLE_LINE } from '@/shared/constants/simple-delete-confirm'
import { getApiErrorCode } from '@/shared/lib/extract-api-error-message'
import { normalizeDeleteGuideEntityDisplayNames } from '@/shared/ui/delete-guide-messages'

export const SPONSOR_CONTACT_IN_USE_ERROR_CODE = 'SPONSOR_CONTACT_IN_USE'

export const SPONSOR_CONTACT_DELETE_BLOCKED_ALERT_TITLE = '후원 담당자 삭제 불가 안내'

export const SPONSOR_CONTACT_DELETE_IN_USE_MESSAGE =
  '프로그램에 담당자로 지정되어 있는 후원 담당자는 삭제할 수 없습니다.'

export function isSponsorContactInUseDeleteError(error: unknown): boolean {
  return getApiErrorCode(error) === SPONSOR_CONTACT_IN_USE_ERROR_CODE
}

export function resolveSponsorContactDeleteErrorAlert(
  error: unknown,
  fallback: string
): { title: string; content: string } {
  if (isSponsorContactInUseDeleteError(error)) {
    return {
      title: SPONSOR_CONTACT_DELETE_BLOCKED_ALERT_TITLE,
      content: getDataManagementApiErrorMessage(error, SPONSOR_CONTACT_DELETE_IN_USE_MESSAGE),
    }
  }
  return {
    title: '안내',
    content: getDataManagementApiErrorMessage(error, fallback),
  }
}

export type SponsorContactDeleteConfirmCopy = {
  title: string
  line1: string
  line2: string
}

export function resolveSponsorContactDeleteConfirmCopy(
  contactNames: string[]
): SponsorContactDeleteConfirmCopy {
  const displayNames = normalizeDeleteGuideEntityDisplayNames(contactNames)
  const line2 = SIMPLE_DELETE_IRREVERSIBLE_LINE

  if (displayNames.length === 0) {
    return {
      title: '후원사 담당자 삭제 안내',
      line1: '',
      line2,
    }
  }

  if (displayNames.length === 1) {
    return {
      title: '후원사 담당자 삭제 안내',
      line1: `**[${displayNames[0]}]** 담당자를 삭제하시겠습니까?`,
      line2,
    }
  }

  const othersCount = displayNames.length - 1
  return {
    title: '후원사 담당자 일괄 삭제 안내',
    line1: `**[${displayNames[0]}] 님 외 ${othersCount}명**의 담당자를 삭제하시겠습니까?`,
    line2,
  }
}
