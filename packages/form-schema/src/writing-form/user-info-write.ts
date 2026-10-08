import type {
  FormTitleNumberingStyle,
  UserInfoParagraph,
  WritingFormParagraph,
} from './draft-schema.js'

export type UserInfoFieldEntry = { key: string; label: string }

export type SurveyWriteTitleSlot = {
  paragraphId: string
}

/** 설문자 정보 칩 카탈로그 — CMS 편집·write 펼침이 같은 라벨을 씀 */
export const DEFAULT_USER_INFO_FIELD_CATALOG: UserInfoFieldEntry[] = [
  { key: 'name', label: '이름' },
  { key: 'gender', label: '성별' },
  { key: 'birthDate', label: '생년월일' },
  { key: 'phone', label: '연락처' },
  { key: 'email', label: '이메일' },
  { key: 'addressRegion', label: '자택 주소지(지역)' },
  { key: 'addressDetail', label: '자택 주소지(상세)' },
  { key: 'affiliation', label: '소속' },
  { key: 'applicantType', label: '신청자 유형' },
  { key: 'programName', label: '프로그램명' },
  { key: 'period', label: '교육 진행 일정(진행 기간)' },
  { key: 'institutionName', label: '기관명' },
  { key: 'institutionRegion', label: '기관 소재지(시군구)' },
  { key: 'educationTarget', label: '교육 대상(담당 대상)' },
  { key: 'educationGrade', label: '교육 학년(담당 학년)' },
  { key: 'teamName', label: '팀 명' },
  { key: 'teamPartnerName', label: '팀원/파트너 명' },
]

export function isUserInfoParagraph(
  paragraph: WritingFormParagraph
): paragraph is UserInfoParagraph {
  return paragraph.kind === 'single_item' && paragraph.variant === 'user_info'
}

function userInfoFieldCatalog(paragraph: UserInfoParagraph): UserInfoFieldEntry[] {
  return paragraph.userFields?.length ? paragraph.userFields : DEFAULT_USER_INFO_FIELD_CATALOG
}

/** `selectedUserFieldKeys` 순서. 카탈로그에 없는 key는 건너뜀 */
export function getUserInfoSelectedEntries(paragraph: UserInfoParagraph): UserInfoFieldEntry[] {
  const catalog = userInfoFieldCatalog(paragraph)
  const byKey = new Map(catalog.map(entry => [entry.key, entry]))
  const keys = paragraph.selectedUserFieldKeys ?? []
  const entries: UserInfoFieldEntry[] = []
  for (const key of keys) {
    const entry = byKey.get(key)
    if (entry != null) entries.push(entry)
  }
  return entries
}

export function formatFormTitleNumberToken(
  style: FormTitleNumberingStyle,
  sequence: number
): string {
  if (style === 'none') return ''
  if (style === 'numeric') return `${sequence}`
  if (style === 'alpha') {
    let n = sequence
    let s = ''
    while (n > 0) {
      const rem = (n - 1) % 26
      s = String.fromCharCode(65 + rem) + s
      n = Math.floor((n - 1) / 26)
    }
    return s
  }
  if (style === 'q_repeat') return 'Q'
  if (style === 'q123') return `Q${sequence}`
  return `${sequence}`
}

export function formatFormTitleNumberPrefix(
  style: FormTitleNumberingStyle,
  sequence: number
): string | undefined {
  if (style === 'none') return undefined
  const token = formatFormTitleNumberToken(style, sequence)
  if (!token) return undefined
  return `${token}. `
}

/**
 * 설문 write 번호. `user_info`는 템플릿과 같이 자동입력 표 1문항으로 순번 1개를 쓴다.
 * 선택 0개면 해당 단락은 노출되지 않으므로 번호를 쓰지 않는다.
 */
export function getSurveyWriteTitleSequence(
  paragraphs: WritingFormParagraph[],
  slot: SurveyWriteTitleSlot
): number | null {
  let n = 0
  for (const paragraph of paragraphs) {
    if (!paragraph.participatesInTitleNumbering) continue

    if (isUserInfoParagraph(paragraph) && getUserInfoSelectedEntries(paragraph).length === 0) {
      if (paragraph.id === slot.paragraphId) return null
      continue
    }

    n += 1
    if (paragraph.id === slot.paragraphId) return n
  }
  return null
}

export function getSurveyWriteTitleNumberPrefix(
  paragraphs: WritingFormParagraph[],
  slot: SurveyWriteTitleSlot,
  style: FormTitleNumberingStyle
): string | undefined {
  const sequence = getSurveyWriteTitleSequence(paragraphs, slot)
  if (sequence == null) return undefined
  return formatFormTitleNumberPrefix(style, sequence)
}
