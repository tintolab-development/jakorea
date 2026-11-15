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

/** 첨부파일 안내 — 시안 2줄 */
export const TALENT_APPLY_FILE_GUIDE_LINES = [
  '공유해주실 자료가 있다면 자유롭게 첨부해 주세요.',
  '파일은 JPG, PNG, HWP, Excel, PDF, Word 형식만 등록 가능하며, 최대 10개(파일당 20MB, 총 100MB)까지 첨부할 수 있습니다.',
] as const

export const TALENT_APPLY_REQUIRED_INCOMPLETE_MESSAGE = '필수 항목을 모두 작성해주세요'

/** 메일 본문·API와 동일 — bio / talentIntro / motivation */
export const TALENT_APPLY_LONG_TEXT_MAX_LENGTH = 1000

export function trimTalentApplyLongText(value: string): string {
  return value.trim().slice(0, TALENT_APPLY_LONG_TEXT_MAX_LENGTH)
}

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

/**
 * 필수 입력 누락 팝업(Figma 14550-2349)에 보이는 항목명 — 화면 표시 순서.
 * 주소·기간처럼 두 칸이 한 항목이면 같은 이름을 쓰고 한 번만 보인다. 개인정보 동의는 미동의 팝업이 따로 있다.
 */
const TALENT_APPLY_FIELD_LABELS: ReadonlyArray<readonly [Exclude<TalentApplyFieldKey, 'privacy'>, string]> = [
  ['name', '이름'],
  ['birthDate', '생년월일'],
  ['gender', '성별'],
  ['phone', '휴대폰 번호'],
  ['email', '이메일'],
  ['affiliation', '소속/학교명'],
  ['sido', '자택 주소'],
  ['sigungu', '자택 주소'],
  ['periodStart', '재능기부 가능 기간'],
  ['periodEnd', '재능기부 가능 기간'],
  ['bio', '간단한 약력 소개'],
  ['talentIntro', '기부 가능한 재능 소개'],
  ['motivation', '참여 동기'],
  ['jaParticipation', 'JA 프로그램 참여 이력'],
]

/** 오류가 난 필수 항목명(중복 제거, 화면 순서) */
export function collectTalentApplyMissingLabels(
  errors: Partial<Record<TalentApplyFieldKey, boolean>>,
): string[] {
  const labels: string[] = []
  for (const [key, label] of TALENT_APPLY_FIELD_LABELS) {
    if (errors[key] && !labels.includes(label)) labels.push(label)
  }
  return labels
}

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
