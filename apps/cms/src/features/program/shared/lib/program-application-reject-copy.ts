export type ProgramApplicationRejectAudience = 'institution' | 'member'
export type ProgramApplicationRejectVariant = 'single' | 'bulk'

export type ProgramApplicationRejectCopyInput = {
  audience: ProgramApplicationRejectAudience
  variant: ProgramApplicationRejectVariant
  subjectName: string
  selectionCount?: number
}

const SINGLE_TITLE = '프로그램 신청 반려 안내'
const BULK_TITLE = '프로그램 신청 일괄 반려 안내'

function resolveSubjectName(
  audience: ProgramApplicationRejectAudience,
  subjectName: string
): string {
  const trimmed = subjectName.trim()
  if (trimmed) return trimmed
  return audience === 'institution' ? '기관' : '회원'
}

function otherCount(selectionCount: number | undefined): number {
  return Math.max(0, (selectionCount ?? 0) - 1)
}

export function buildProgramApplicationRejectCopy({
  audience,
  variant,
  subjectName,
  selectionCount,
}: ProgramApplicationRejectCopyInput): { title: string; message: string } {
  const name = resolveSubjectName(audience, subjectName)

  if (variant === 'single') {
    if (audience === 'institution') {
      return {
        title: SINGLE_TITLE,
        message: `**[${name}]**의 프로그램 신청을 반려하시겠습니까?\n반려 시 입력하신 사유가 담당 교사에게 반려 사유로 안내되며, 알림이 발송됩니다.`,
      }
    }
    return {
      title: SINGLE_TITLE,
      message: `**[${name}]** 님의 프로그램 신청을 반려하시겠습니까?\n반려 시 입력하신 사유가 회원에게 반려 사유로 안내되며, 알림이 발송됩니다.`,
    }
  }

  const rest = otherCount(selectionCount)
  if (audience === 'institution') {
    return {
      title: BULK_TITLE,
      message: `**[${name}] 외 ${rest}개**의 프로그램 신청을 반려하시겠습니까?\n반려 시 입력하신 사유가 담당 교사에게 반려 사유로 안내되며, 알림이 발송됩니다.`,
    }
  }
  return {
    title: BULK_TITLE,
    message: `**[${name}] 님 외 ${rest}명**의 프로그램 신청을 반려하시겠습니까?\n반려 시 입력하신 사유가 회원에게 반려 사유로 안내되며, 알림이 발송됩니다.`,
  }
}
