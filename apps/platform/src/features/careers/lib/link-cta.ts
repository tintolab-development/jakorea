/**
 * 공개 채용공고 상세 하단 연결 버튼.
 * CareerPostingPublicDetail.buttonLabel·linkUrl (GET null → '').
 * 링크(linkUrl)가 있을 때만 노출한다. 라벨만 있으면 버튼 없음. 라벨 비고 링크만 있으면 기본 문구.
 */

export const CAREER_POSTING_DEFAULT_BUTTON_LABEL = '채용 공고 바로가기'

export function careerPostingLinkCtaVisible(linkUrl: string): boolean {
  return careerPostingLinkHref(linkUrl).length > 0
}

export function resolveCareerPostingLinkCtaLabel(buttonLabel: string): string {
  const trimmed = buttonLabel.trim()
  return trimmed || CAREER_POSTING_DEFAULT_BUTTON_LABEL
}

export function careerPostingLinkHref(linkUrl: string): string {
  const url = linkUrl.trim()
  if (!url) return ''
  if (/^javascript:/i.test(url)) return ''
  if (/^(https?:\/\/|mailto:|\/)/i.test(url)) return url
  return `https://${url}`
}

export function readCareerPostingLinkFields(row: {
  buttonLabel?: string | null
  linkUrl?: string | null
}): { buttonLabel: string; linkUrl: string } {
  return {
    buttonLabel: typeof row.buttonLabel === 'string' ? row.buttonLabel.trim() : '',
    linkUrl: typeof row.linkUrl === 'string' ? row.linkUrl.trim() : '',
  }
}
