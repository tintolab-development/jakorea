/**
 * 채용공고 하단 연결 버튼 — 기획 15자, 미설정은 빈 문자열.
 *
 * OpenAPI CareerPostingCreateRequest / UpdateRequest / AdminDetail / PublicDetail
 * 에 buttonLabel·linkUrl (nullable string)이 있다.
 * FE 입력은 둘 다 비움 또는 둘 다 입력만 허용한다 (FE_ONLY_VALIDATION).
 * BE 부분 입력 조회는 빈 문자열로 hydrate 하고 오류를 내지 않는다.
 */

export const CAREER_POSTING_BUTTON_LABEL_MAX_LENGTH = 15

export type CareerPostingLinkFields = {
  buttonLabel: string
  linkUrl: string
}

export type CareerPostingLinkSource = {
  buttonLabel?: string | null
  linkUrl?: string | null
}

export function readCareerPostingLinkFields(
  row: CareerPostingLinkSource | null | undefined,
): CareerPostingLinkFields {
  if (!row) return { buttonLabel: '', linkUrl: '' }
  return {
    buttonLabel: typeof row.buttonLabel === 'string' ? row.buttonLabel.trim() : '',
    linkUrl: typeof row.linkUrl === 'string' ? row.linkUrl.trim() : '',
  }
}

export function normalizeCareerPostingLinkFields(input: CareerPostingLinkFields): CareerPostingLinkFields {
  return {
    buttonLabel: input.buttonLabel.trim(),
    linkUrl: input.linkUrl.trim(),
  }
}

export function careerPostingLinkButtonVisible(buttonLabel: string): boolean {
  return buttonLabel.trim().length > 0
}

/** 통과 시 null. 미설정(둘 다 공백)은 허용. */
export function validateCareerPostingLinkFields(input: CareerPostingLinkFields): string | null {
  const { buttonLabel, linkUrl } = normalizeCareerPostingLinkFields(input)
  if (buttonLabel.length > CAREER_POSTING_BUTTON_LABEL_MAX_LENGTH) {
    return `버튼명은 최대 ${CAREER_POSTING_BUTTON_LABEL_MAX_LENGTH}자까지 입력할 수 있습니다.`
  }
  if (buttonLabel && !linkUrl) {
    return '버튼 링크를 입력해 주세요.'
  }
  if (linkUrl && !buttonLabel) {
    return '버튼명을 입력해 주세요.'
  }
  return null
}
