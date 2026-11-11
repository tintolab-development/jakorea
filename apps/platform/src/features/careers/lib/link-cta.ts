/**
 * 공개 채용공고 상세 하단 연결 버튼.
 * CareerPostingPublicDetail.buttonLabel·linkUrl (GET null → '').
 * 버튼명(buttonLabel)을 입력한 공고에만 노출한다(어드민 등록 창 안내와 동일). 이동할 링크가 없으면 버튼을 만들지 않는다.
 */

export function careerPostingLinkCtaVisible(link: { buttonLabel: string; linkUrl: string }): boolean {
  return link.buttonLabel.trim().length > 0 && careerPostingLinkHref(link.linkUrl).length > 0
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
