/**
 * 한글·영문(대소문자)·숫자·공백·_·- 만 허용. 입력 중 한글 자모는 조합을 위해 허용.
 * 공백: 시안 트리 예시(「전체 공지」「test 01」)와 사용자 결정(2026-11-10)에 따라 허용.
 */
const CATEGORY_NAME_ALLOWED = /^[0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ\u1100-\u11FF _-]+$/
const CATEGORY_NAME_DISALLOWED = /[^0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ\u1100-\u11FF _-]/g

export const CATEGORY_NAME_INPUT_HINT =
  '한글, 영문(대소문자), 숫자, 공백, _, -만 입력 가능합니다.'

/** 시안 카테고리 추가·수정 안내문 및 「카테고리명 사용 불가 안내」 본문 */
export const CATEGORY_NAME_RULE_MESSAGE =
  '카테고리명에는 한글, 영문 대소문자, 숫자, 공백, _, -만 입력 가능합니다.'

export const CATEGORY_NAME_INVALID_TITLE = '카테고리명 사용 불가 안내'

export function sanitizeCategoryNameInput(raw: string): string {
  return raw.replace(CATEGORY_NAME_DISALLOWED, '')
}

export function isValidCategoryName(name: string): boolean {
  const trimmed = name.trim()
  if (!trimmed) return false
  return CATEGORY_NAME_ALLOWED.test(trimmed)
}
