export const CAREERS_TALENT_APPLY_SUBMIT_LABEL = '인재 정보 등록하기'

export const CAREERS_TALENT_APPLY_STEP_TITLES = {
  job: 'STEP 01. 관심 직무',
  basic: 'STEP 02. 기본 정보',
  education: 'STEP 03. 학력 정보',
  career: 'STEP 04. 경력 정보',
  privacy: 'STEP 05. 개인정보 수집·이용 동의',
} as const

export const CAREERS_TALENT_APPLY_PLACEHOLDERS = {
  name: '이름을 입력해 주세요',
  phone: '휴대폰 번호를 입력해 주세요',
  email: '이메일을 입력해 주세요',
  addressRoad: '주소를 검색해 주세요',
  addressDetail: '상세주소를 입력해 주세요',
  educationLevel: '최종 학력을 선택해 주세요',
  schoolName: '학교명',
  major: '학부/과',
  /** 2줄 안내 — `.fileGuide`가 `white-space: pre-line`으로 줄을 나눈다 */
  evidenceFile:
    '경력 증빙 서류를 첨부해 주세요.\n파일은 PDF, JPG, PNG 형식만 등록 가능하며, 최대 10개(파일당 20MB, 총 100MB)까지 첨부할 수 있습니다.',
} as const

export const CAREERS_TALENT_APPLY_REQUIRED_INCOMPLETE_MESSAGE = '필수 항목을 모두 작성해주세요'

export const CAREERS_TALENT_APPLY_SUBMIT_SUCCESS_MESSAGE = '인재 정보 등록이 접수되었습니다.'


export type CareersTalentJobInterest =
  | 'managementPlanning'
  | 'prDesign'
  | 'accounting'
  | 'hrAdmin'
  | 'educationOps'
  | 'other'

export type CareersTalentCareerType = 'newbie' | 'experienced'

export type CareersTalentEducationLevel =
  | 'highSchool'
  | 'college'
  | 'university'
  | 'master'
  | 'doctor'
  | 'other'

export type CareersTalentApplyFormValues = {
  jobInterest: CareersTalentJobInterest | ''
  name: string
  phone: string
  email: string
  addressRoad: string
  addressDetail: string
  educationLevel: CareersTalentEducationLevel | ''
  schoolName: string
  major: string
  educationInfo: string
  careerType: CareersTalentCareerType | ''
  careerInfo: string
  privacyAgreed: boolean
}

export type CareersTalentApplyFieldKey =
  | Exclude<keyof CareersTalentApplyFormValues, 'privacyAgreed'>
  | 'privacy'

/**
 * 필수 입력 누락 팝업(Figma 14550-2349)에 보이는 항목명 — 화면 표시 순서.
 * 학교명·학부/과는 선택 항목이라 넣지 않는다. 개인정보 동의는 미동의 팝업이 따로 있다.
 */
const CAREERS_TALENT_APPLY_FIELD_LABELS: ReadonlyArray<
  readonly [Exclude<CareersTalentApplyFieldKey, 'privacy'>, string]
> = [
  ['jobInterest', '관심 직무/분야'],
  ['name', '이름'],
  ['phone', '휴대폰 번호'],
  ['email', '이메일'],
  ['addressRoad', '자택 주소'],
  ['addressDetail', '자택 주소'],
  ['educationLevel', '최종학력'],
  ['educationInfo', '학력정보'],
  ['careerType', '경력'],
  ['careerInfo', '경력/경험/자격정보'],
]

/** 오류가 난 필수 항목명(중복 제거, 화면 순서) */
export function collectCareersTalentApplyMissingLabels(
  errors: Partial<Record<CareersTalentApplyFieldKey, boolean>>,
): string[] {
  const labels: string[] = []
  for (const [key, label] of CAREERS_TALENT_APPLY_FIELD_LABELS) {
    if (errors[key] && !labels.includes(label)) labels.push(label)
  }
  return labels
}

/** 경력 증빙 첨부 허용 형식 — 안내 문구(PDF, JPG, PNG)와 같다 */
export const CAREERS_TALENT_EVIDENCE_FORMATS_LABEL = 'PDF, JPG, PNG'

const CAREERS_TALENT_EVIDENCE_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const CAREERS_TALENT_EVIDENCE_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png'])

export function isCareersTalentEvidenceFileTypeAllowed(file: { name: string; type: string }): boolean {
  const mime = file.type.trim().toLowerCase()
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return CAREERS_TALENT_EVIDENCE_MIME.has(mime) || CAREERS_TALENT_EVIDENCE_EXTENSIONS.has(extension)
}

export const EMPTY_CAREERS_TALENT_APPLY_FORM_VALUES: CareersTalentApplyFormValues = {
  jobInterest: '',
  name: '',
  phone: '',
  email: '',
  addressRoad: '',
  addressDetail: '',
  educationLevel: '',
  schoolName: '',
  major: '',
  educationInfo: '',
  careerType: '',
  careerInfo: '',
  privacyAgreed: false,
}

export const CAREERS_TALENT_JOB_OPTIONS = [
  { value: 'managementPlanning' as const, label: '경영/기획' },
  { value: 'prDesign' as const, label: '홍보/디자인' },
  { value: 'accounting' as const, label: '회계' },
  { value: 'hrAdmin' as const, label: '인사/총무' },
  { value: 'educationOps' as const, label: '교육운영' },
  { value: 'other' as const, label: '기타' },
] as const

export const CAREERS_TALENT_CAREER_OPTIONS = [
  { value: 'newbie' as const, label: '신입' },
  { value: 'experienced' as const, label: '경력' },
] as const

/** 시안에 옵션 목록 미표기 — 일반 학력 옵션으로 임시 정의 */
export const CAREERS_TALENT_EDUCATION_LEVEL_OPTIONS = [
  { value: 'highSchool' as const, label: '고등학교 졸업' },
  { value: 'college' as const, label: '전문대학 졸업' },
  { value: 'university' as const, label: '대학교 졸업' },
  { value: 'master' as const, label: '석사 졸업' },
  { value: 'doctor' as const, label: '박사 졸업' },
  { value: 'other' as const, label: '기타' },
] as const
