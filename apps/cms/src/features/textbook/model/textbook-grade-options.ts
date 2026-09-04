/**
 * 교재 관리 — 대상 학년 셀렉트 옵션 (필터·등록 공통)
 * @see apps/cms/src/pages/data-management/textbook-page.tsx
 */

export type TextbookGradeOption = { label: string; value: string }

const ALL_OPTION: TextbookGradeOption = { label: '전체', value: 'ALL' }

const GRADE_1_TO_3: TextbookGradeOption[] = ['1학년', '2학년', '3학년'].map(g => ({
  label: g,
  value: g,
}))

const GRADE_1_TO_6: TextbookGradeOption[] = [
  '1학년',
  '2학년',
  '3학년',
  '4학년',
  '5학년',
  '6학년',
].map(g => ({ label: g, value: g }))

/**
 * 목록 필터용. 교육 대상별 `전체`(ALL) 포함 여부는 기존 화면 동작과 동일하다.
 */
export function textbookFilterGradeOptions(educationTarget: string): TextbookGradeOption[] {
  switch (educationTarget) {
    case '유아':
      return [ALL_OPTION, { label: '유아', value: '유아' }, { label: '유치원생', value: '유치원생' }]
    case '초등학교':
      return [{ label: '전학년', value: '전학년' }, ...GRADE_1_TO_6]
    case '중학교':
    case '고등학교':
      return [{ label: '전학년', value: '전학년' }, ...GRADE_1_TO_3]
    case '대학교':
      return [ALL_OPTION]
    default:
      return [
        ALL_OPTION,
        { label: '유아', value: '유아' },
        { label: '유치원생', value: '유치원생' },
        { label: '전학년', value: '전학년' },
        ...GRADE_1_TO_6,
      ]
  }
}

/**
 * 등록·수정용. 필터와 동일 라벨·값이며 `전체`(ALL)는 제외한다.
 * 대학교는 필터에 ALL만 있으므로 등록 값은 `전학년`으로 둔다.
 */
export function textbookRegisterGradeOptions(educationTarget: string): TextbookGradeOption[] {
  if (educationTarget === '대학교') {
    return [{ label: '전학년', value: '전학년' }]
  }
  return textbookFilterGradeOptions(educationTarget).filter(opt => opt.value !== 'ALL')
}
