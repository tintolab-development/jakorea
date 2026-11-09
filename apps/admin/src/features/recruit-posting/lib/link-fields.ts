/**
 * 채용공고 하단 연결 버튼 (OpenAPI buttonLabel·linkUrl).
 * Admin 상세 GET null → 폼 ''. CREATE/UPDATE는 trim된 ''를 보내 기존 CTA를 지운다(omit 금지).
 * 공개 상세는 linkUrl이 있을 때만 버튼을 노출한다. 버튼명이 비면 플랫폼 기본 문구를 쓴다.
 * 목록 item 스키마에는 CTA가 없다.
 */

import axios from 'axios'
import { readApiErrorField, readApiErrorMessage } from '../../../shared/lib/api-error-message.ts'
import { isCompleteHttpLinkUrl } from '../../../shared/lib/http-link-url.ts'

/** 채용 공고 바로가기 링크가 http(s)가 아닐 때 — 공통 AlertModal */
export const CAREER_POSTING_LINK_URL_FORMAT_ALERT = {
  title: '등록 불가 안내',
  content:
    '채용 공고 바로가기 링크 형식이 올바르지 않습니다.\nhttp:// 또는 https://로 시작하는 전체 주소를 입력해 주세요.',
} as const

export const CAREER_POSTING_BUTTON_LABEL_MAX_LENGTH = 15

/** 공개 상세와 같은 기본 버튼 문구 — 버튼명이 비고 링크만 있을 때 (apps/platform `link-cta.ts`와 동일) */
export const CAREER_POSTING_DEFAULT_BUTTON_LABEL = '채용 공고 바로가기'

export function resolveCareerPostingLinkButtonLabel(buttonLabel: string): string {
  return buttonLabel.trim() || CAREER_POSTING_DEFAULT_BUTTON_LABEL
}

/** 공개 상세와 같은 href 정규화 — javascript: 차단, 스킴 없으면 https:// */
export function careerPostingLinkHref(linkUrl: string): string {
  const url = linkUrl.trim()
  if (!url) return ''
  if (/^javascript:/i.test(url)) return ''
  if (/^(https?:\/\/|mailto:|\/)/i.test(url)) return url
  return `https://${url}`
}

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
  if (linkUrl && !isCompleteHttpLinkUrl(linkUrl)) {
    return CAREER_POSTING_LINK_URL_FORMAT_ALERT.content
  }
  return null
}

/** 값이 있는데 전체 http(s) 주소가 아니면 등록 불가 안내. 빈 값은 미입력으로 통과. */
export function careerPostingLinkUrlFormatAlert(
  linkUrl: string,
): typeof CAREER_POSTING_LINK_URL_FORMAT_ALERT | null {
  const trimmed = linkUrl.trim()
  if (!trimmed) return null
  if (isCompleteHttpLinkUrl(trimmed)) return null
  return CAREER_POSTING_LINK_URL_FORMAT_ALERT
}

export function careerPostingMutationLinkFormatAlert(
  error: unknown,
): typeof CAREER_POSTING_LINK_URL_FORMAT_ALERT | null {
  const field = readApiErrorField(error) ?? ''
  const apiMessage = readApiErrorMessage(error) ?? ''
  const fallbackMessage = error instanceof Error ? error.message : ''
  const message = `${field} ${apiMessage} ${fallbackMessage}`
  if (/linkUrl|바로가기 링크/i.test(message) && /invalid|형식|url|올바르/i.test(message)) {
    return CAREER_POSTING_LINK_URL_FORMAT_ALERT
  }
  if (/^linkUrl$/i.test(field.trim())) return CAREER_POSTING_LINK_URL_FORMAT_ALERT
  if (
    axios.isAxiosError(error) &&
    error.response?.status === 400 &&
    /linkUrl|바로가기|https?:\/\//i.test(JSON.stringify(error.response.data ?? ''))
  ) {
    return CAREER_POSTING_LINK_URL_FORMAT_ALERT
  }
  return null
}
