/** 만 14세 미만 회원 초상권 동의 — 보호자(법정대리인) 본인인증 단계 문구·검증 */

/** 미성년 회원 초상권 카드 — 미동의(만료 포함) 상태 */
export const PORTRAIT_GUARDIAN_CARD_COPY = {
  writeLabel: '보호자 본인인증',
  notAgreedHint: '만 14세 미만 회원은 보호자 본인인증 이후 동의서 작성이 가능해요.',
} as const

export const PORTRAIT_GUARDIAN_CONFIRM_COPY = {
  title: '초상권 수집·이용에 동의하시겠어요?',
  description: '만 14세 미만 회원이 초상권 수집·이용 동의하려면\n보호자 본인인증이 필요해요.',
  confirmLabel: '보호자 본인인증',
} as const

export const PORTRAIT_GUARDIAN_INFO_COPY = {
  title: '보호자 정보 입력 안내',
  description:
    '프로그램 신청 회원과의 관계를 입력해 주세요.\n확인 시 초상권 수집·이용 동의서 작성 화면으로 이동돼요.',
  nameLabel: '보호자님 이름',
  phoneLabel: '보호자님 휴대폰 번호',
  relationLabel: '신청 회원과의 관계',
  relationPlaceholder: '신청 회원과의 관계를 입력해 주세요',
  relationRequiredMessage: '신청 회원과의 관계를 입력해 주세요.',
  relationMaxLengthMessage: '신청 회원과의 관계는 64자 이내로 입력해 주세요.',
  cancelLabel: '취소',
  confirmLabel: '확인하기',
} as const

export const PORTRAIT_GUARDIAN_VERIFIED_COPY = {
  title: '법정대리인 본인인증이 완료되었어요.',
  dateLabel: '본인인증 완료일시',
  guide: '초상권 수집·이용 동의서를 작성 완료 시 동의가 완료됩니다.',
  confirmLabel: '초상권 수집·이용 동의서 작성하기',
} as const

export const PORTRAIT_GUARDIAN_ERROR_TITLE = '보호자 본인인증 실패'
export const PORTRAIT_GUARDIAN_MISSING_MESSAGE =
  '등록된 보호자 정보를 확인할 수 없어요. 회원정보 수정에서 보호자 정보를 확인해 주세요.'

export const PORTRAIT_GUARDIAN_RELATION_MAX_LENGTH = 64

export function validatePortraitGuardianRelation(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return PORTRAIT_GUARDIAN_INFO_COPY.relationRequiredMessage
  if (trimmed.length > PORTRAIT_GUARDIAN_RELATION_MAX_LENGTH) {
    return PORTRAIT_GUARDIAN_INFO_COPY.relationMaxLengthMessage
  }
  return null
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

/** `verifiedAt`(ISO-8601) → KST `YYYY.MM.DD`. 파싱 실패 시 null */
export function formatPortraitGuardianVerifiedDate(
  verifiedAt: string | null | undefined
): string | null {
  if (!verifiedAt?.trim()) return null
  const time = Date.parse(verifiedAt)
  if (Number.isNaN(time)) return null
  const kst = new Date(time + KST_OFFSET_MS)
  const yyyy = kst.getUTCFullYear()
  const mm = String(kst.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(kst.getUTCDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}
