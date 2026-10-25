/**
 * 채용공고 하단 연결 버튼 — 기획 15자, 미설정은 빈 문자열.
 * OpenAPI CareerPosting* 스키마에는 아직 키가 없다. 저장 왕복은 BE가 동일 키를 받을 때만 성립한다.
 */

export const CAREER_POSTING_BUTTON_LABEL_MAX_LENGTH = 15

export type CareerPostingLinkFields = {
  buttonLabel: string
  linkUrl: string
}

export function readOptionalText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function readCareerPostingLinkFields(row: object | null | undefined): CareerPostingLinkFields {
  if (!row) return { buttonLabel: '', linkUrl: '' }
  const record = row as Record<string, unknown>
  return {
    buttonLabel: readOptionalText(record.buttonLabel).trim(),
    linkUrl: readOptionalText(record.linkUrl).trim(),
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
