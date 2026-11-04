/**
 * 소셜 링크 연결 URL 검증 — BE SafeExternalUrl / ck_main_social_url_shape 정합
 */
import { isValidHttpLinkUrl } from '@/shared/lib/http-link-url'
import { REQUIRED_FIELDS_INCOMPLETE_ALERT } from '@/shared/ui'

type LinkRow = {
  id: string
  name: string
  linkUrl: string
}

export function findInvalidHttpLinkChannels(rows: LinkRow[]): string[] {
  return rows
    .filter(row => {
      const url = row.linkUrl.trim()
      return url.length > 0 && !isValidHttpLinkUrl(url)
    })
    .map(row => row.name)
}

export function socialLinkUrlFormatAlert(channelNames: string[]) {
  const targets = channelNames.join(', ')
  return {
    title: '연결 링크 형식 오류',
    content: `${targets}의 연결 링크는 http:// 또는 https://로 시작하는 주소를 입력해 주세요.`,
  } as const
}

export function socialLinkUrlRequiredAlert(_channelNames: string[]) {
  return REQUIRED_FIELDS_INCOMPLETE_ALERT
}
