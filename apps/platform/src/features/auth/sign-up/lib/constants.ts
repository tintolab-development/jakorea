import illustHouseUrl from '@/shared/assets/illustration/illust-house.svg'
import illustPeopleUrl from '@/shared/assets/illustration/illust-people.svg'
import type { AgreementItem, MemberTypeOption, GuardianAgreementItem } from '../model/sign-up.types'

export const MIN_GENERAL_MEMBER_AGE = 14
export const SIGN_UP_TOTAL_STEPS = 7
export const SIGN_UP_UNDER_AGE_TOTAL_STEPS = 8

export const SIGN_IN_PATH = '/auth/sign-in'
export const SIGN_UP_COMPLETE_PATH = '/auth/sign-up/complete'

export const MOCK_VERIFIED_NAME = '홍길동'
export const MOCK_VERIFIED_PHONE = '010-1234-5678'
export const MOCK_DUPLICATE_EMAIL = 'ja@gmail.com'

export const schoolGradeOptions = [
  '1학년',
  '2학년',
  '3학년',
  '4학년',
  '5학년',
  '6학년',
  '7학년',
  '8학년',
  '9학년',
  '10학년',
  '11학년',
  '12학년',
] as const

export type SchoolGrade = (typeof schoolGradeOptions)[number]

export const memberTypeOptions: MemberTypeOption[] = [
  {
    type: 'general',
    title: '일반회원',
    primaryDescription: 'JA Korea 프로그램과\n소식을 확인하고 참여할 수\n있어요.',
    secondaryDescription: '학생, 청소년, 일반 참여자라면\n일반회원으로 가입해 주세요.',
    imageUrl: illustPeopleUrl,
  },
  {
    type: 'teacher',
    title: '교사회원',
    primaryDescription: '학교나 기관에서\n교육 활동을 함께하는\n선생님을 위한 가입이에요.',
    secondaryDescription: '만 14세 이상만 가입할 수 있어요.\n가입 후 바로 이용이 가능해요.',
    imageUrl: illustHouseUrl,
  },
]

export const agreementItems: AgreementItem[] = [
  { key: 'service', required: true, label: '서비스 이용약관' },
  { key: 'privacy', required: true, label: '개인정보 수집·이용 동의' },
  { key: 'marketing', required: false, label: '마케팅 정보 수신 동의' },
  {
    key: 'portrait',
    required: false,
    label: '초상권 수집·이용 동의',
    guide: '* 미동의 시 프로그램 참여가 불가능해요.',
  },
]

export const guardianAgreementItems: GuardianAgreementItem[] = [
  { key: 'service', required: true, label: '서비스 이용약관' },
  { key: 'privacy', required: true, label: '개인정보 수집·이용 동의' },
  {
    key: 'guardianLegal',
    required: true,
    label: '만 14세 미만 아동 회원가입 및 개인정보 수집·이용에 대한 법정대리인 동의',
  },
  { key: 'marketing', required: false, label: '마케팅 정보 수신 동의' },
  {
    key: 'portrait',
    required: false,
    label: '초상권 수집·이용 동의 항목',
    guide: '* 미동의 시 프로그램 참여가 불가능해요.',
  },
]
