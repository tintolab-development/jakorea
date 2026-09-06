/** 한글·영문(대소문자)·숫자·_·- 만 허용. 입력 중 한글 자모는 조합을 위해 허용. */
const CATEGORY_NAME_ALLOWED = /^[0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ\u1100-\u11FF_-]+$/
const CATEGORY_NAME_DISALLOWED = /[^0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ\u1100-\u11FF_-]/g

export const CATEGORY_NAME_INPUT_HINT =
  '한글, 영문(대소문자), 숫자, _, -만 입력 가능합니다.'

export function sanitizeCategoryNameInput(raw: string): string {
  return raw.replace(CATEGORY_NAME_DISALLOWED, '')
}

export function isValidCategoryName(name: string): boolean {
  const trimmed = name.trim()
  if (!trimmed) return false
  return CATEGORY_NAME_ALLOWED.test(trimmed)
}
