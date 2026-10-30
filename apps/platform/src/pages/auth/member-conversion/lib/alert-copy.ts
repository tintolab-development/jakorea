export const MEMBER_CONVERSION_ALERT = {
  fail: {
    title: '본인인증을 완료하지 못했어요.',
    description: '정보를 확인한 뒤 다시 시도해 주세요.',
  },
  under14: {
    title: '아직 회원 전환을 할 수 없어요.',
    description:
      '본인인증 결과 만 14세 미만으로 확인돼요.\n가입한 생년월일이 잘못되었다면 문의해 주세요.',
  },
  mismatch: {
    title: '가입 정보와 인증 정보가\n일치하지 않아요.',
    description:
      '회원 본인 명의의 휴대폰으로 다시 인증해 주세요.\n가입 정보가 잘못되었다면 문의해 주세요.',
  },
  duplicate: {
    title: '이미 가입된 계정이 있어요.',
    description:
      '같은 명의로 가입된 다른 계정이 있어\n회원 전환을 할 수 없어요. 관리자에게 문의해 주세요.',
  },
} as const

export type MemberConversionAlertKind = keyof typeof MEMBER_CONVERSION_ALERT
