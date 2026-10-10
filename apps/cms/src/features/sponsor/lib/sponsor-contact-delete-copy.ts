import { SIMPLE_DELETE_IRREVERSIBLE_LINE } from '@/shared/constants/simple-delete-confirm'
import { normalizeDeleteGuideEntityDisplayNames } from '@/shared/ui/delete-guide-messages'

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
      line1: `[${displayNames[0]}] 담당자를 삭제하시겠습니까?`,
      line2,
    }
  }

  const othersCount = displayNames.length - 1
  return {
    title: '후원사 담당자 일괄 삭제 안내',
    line1: `[${displayNames[0]}] 님 외 ${othersCount}명의 담당자를 삭제하시겠습니까?`,
    line2,
  }
}
