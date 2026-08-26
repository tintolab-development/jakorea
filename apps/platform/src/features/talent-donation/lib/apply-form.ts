export const TALENT_APPLY_PAGE_TITLE = '재능기부 신청'
export const TALENT_APPLY_SUBMIT_LABEL = '재능기부 신청하기'

export const TALENT_APPLY_STEP_TITLES = {
  basic: 'STEP 01. 기본 정보',
  talent: 'STEP 02. 재능 소개',
  files: 'STEP 03. 자유 제출 파일',
  privacy: 'STEP 04. 개인정보 수집·이용 동의',
} as const

export const TALENT_APPLY_PLACEHOLDERS = {
  name: '이름을 입력해 주세요',
  birthDate: 'YYYY.MM.DD',
  phone: '휴대폰 번호를 입력해 주세요',
  email: '이메일을 입력해 주세요',
  affiliation: '소속 또는 학교명을 입력해 주세요',
  sido: '시/도',
  sigungu: '시/군/구',
  periodStart: '시작일',
  periodEnd: '종료일',
} as const

export const TALENT_APPLY_FILE_GUIDE =
  '공유해주실 자료가 있다면 자유롭게 첨부해 주세요'

export const TALENT_APPLY_REQUIRED_INCOMPLETE_MESSAGE = '필수 항목을 모두 작성해주세요'

export type TalentApplyGender = 'male' | 'female' | ''
export type TalentApplyJaParticipation = 'yes' | 'no' | ''

export type TalentApplyFormValues = {
  name: string
  birthDate: string
  gender: TalentApplyGender
  phone: string
  email: string
  affiliation: string
  sido: string
  sigungu: string
  periodStart: string
  periodEnd: string
  bio: string
  talentIntro: string
  motivation: string
  jaParticipation: TalentApplyJaParticipation
  privacyAgreed: boolean
}

export type TalentApplyFieldKey = Exclude<keyof TalentApplyFormValues, 'privacyAgreed'> | 'privacy'

export const EMPTY_TALENT_APPLY_FORM_VALUES: TalentApplyFormValues = {
  name: '',
  birthDate: '',
  gender: '',
  phone: '',
  email: '',
  affiliation: '',
  sido: '',
  sigungu: '',
  periodStart: '',
  periodEnd: '',
  bio: '',
  talentIntro: '',
  motivation: '',
  jaParticipation: '',
  privacyAgreed: false,
}

export const GENDER_OPTIONS = [
  { value: 'male' as const, label: '남성' },
  { value: 'female' as const, label: '여성' },
] as const

export const JA_PARTICIPATION_OPTIONS = [
  { value: 'yes' as const, label: '있음' },
  { value: 'no' as const, label: '없음' },
] as const
