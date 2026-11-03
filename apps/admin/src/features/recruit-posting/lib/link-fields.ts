/**
 * 채용공고 하단 연결 버튼 (OpenAPI buttonLabel·linkUrl).
 * Admin 상세 GET null → 폼 ''. CREATE/UPDATE는 trim된 ''를 보내 기존 CTA를 지운다(omit 금지).
 * 공개 상세는 linkUrl이 있을 때만 버튼을 노출한다. 버튼명이 비면 플랫폼 기본 문구를 쓴다.
 * 목록 item 스키마에는 CTA가 없다.
 */

import { HTTP_LINK_URL_FORMAT_ALERT, isValidHttpLinkUrl } from '../../../shared/lib/http-link-url.ts'

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

export function careerPostingLinkButtonVisible(input: CareerPostingLinkFields | string): boolean {
  const linkUrl = typeof input === 'string' ? input : input.linkUrl
  return linkUrl.trim().length > 0
}

/** 통과 시 null. 미설정(둘 다 공백)과 링크만 있는 경우는 허용. */
export function validateCareerPostingLinkFields(input: CareerPostingLinkFields): string | null {
  const { buttonLabel, linkUrl } = normalizeCareerPostingLinkFields(input)
  if (buttonLabel.length > CAREER_POSTING_BUTTON_LABEL_MAX_LENGTH) {
    return `버튼명은 최대 ${CAREER_POSTING_BUTTON_LABEL_MAX_LENGTH}자까지 입력할 수 있습니다.`
  }
  if (buttonLabel && !linkUrl) {
    return '채용 공고 바로가기 링크를 입력해 주세요.'
  }
  if (linkUrl && !isValidHttpLinkUrl(linkUrl)) {
    return HTTP_LINK_URL_FORMAT_ALERT.content
  }
  return null
}
