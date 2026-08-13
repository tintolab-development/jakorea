/**
 * 오시는 길 저장 검증 · 실패 알림
 * BE: KakaoRoughmapPolicy / DirectionsUpdateRequest / VersionGuard
 */

import type { DirectionsInfo } from '@/entities/directions/model/types'
import {
  isOptimisticLockConflictError,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'

export type DirectionsAlert = {
  title: string
  content: string
}

/** BE KakaoRoughmapPolicy.GENERATED 와 동일 (charset 포함 생성 스니펫) */
const KAKAO_ROUGHMAP_SNIPPET =
  /^\s*<div\s+id="daumRoughmapContainer(?<idts>[0-9]{8,32})"\s+class="root_daum_roughmap root_daum_roughmap_landing"><\/div>\s*<script\s+charset="UTF-8"\s+class="daum_roughmap_loader_script"\s+src="https:\/\/ssl\.daumcdn\.net\/dmaps\/map_js_init\/roughmapLoader\.js"><\/script>\s*<script\s+charset="UTF-8">\s*new\s+daum\.roughmap\.Lander\(\s*\{\s*"timestamp"\s*:\s*"(?<timestamp>[0-9]{8,32})"\s*,\s*"key"\s*:\s*"(?<key>[A-Za-z0-9_-]{1,128})"\s*,\s*"mapWidth"\s*:\s*"(?<width>[0-9]{3,4})"\s*,\s*"mapHeight"\s*:\s*"(?<height>[0-9]{3,4})"\s*\}\s*\)\.render\(\);\s*<\/script>\s*$/s

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FIELD_LIMITS = {
  addressKo: 1000,
  addressEn: 1000,
  kakaoMapHtml: 10_000,
  phone: 100,
  fax: 100,
  email: 320,
} as const

export function kakaoMapHtmlFormatAlert(): DirectionsAlert {
  return {
    title: '카카오맵 HTML 형식 오류',
    content:
      '카카오맵 HTML은 카카오에서 생성한 Roughmap 코드를 수정 없이 붙여넣어야 합니다.\n(권장 지도 크기: 1440×728)',
  }
}

export function isValidKakaoRoughmapHtml(html: string): boolean {
  const normalized = html.trim().replace(/<!--[\s\S]*?-->/g, '').trim()
  if (!normalized) return true
  const lower = normalized.toLowerCase()
  if (
    lower.includes('<iframe') ||
    lower.includes('javascript:') ||
    lower.includes('onerror=') ||
    lower.includes('onclick=') ||
    lower.includes('document.') ||
    lower.includes('window.') ||
    lower.includes('eval(') ||
    lower.includes('fetch(')
  ) {
    return false
  }
  const match = KAKAO_ROUGHMAP_SNIPPET.exec(normalized)
  if (!match?.groups) return false
  if (match.groups.timestamp !== match.groups.idts) return false
  const width = Number(match.groups.width)
  const height = Number(match.groups.height)
  return width >= 200 && width <= 2000 && height >= 200 && height <= 2000
}

/** 저장 전 클라이언트 검증 — 실패 필드/원인을 알림으로 반환 */
export function validateDirectionsBeforeSave(data: DirectionsInfo): DirectionsAlert | null {
  const addressKo = data.addressKo.trimEnd()
  const addressEn = data.addressEn.trimEnd()
  const kakaoMapHtml = data.kakaoMapHtml.trimEnd()
  const phone = data.phone.trimEnd()
  const fax = data.fax.trimEnd()
  const email = data.email.trimEnd()

  if (addressKo.length > FIELD_LIMITS.addressKo) {
    return {
      title: '국문 주소지 입력 오류',
      content: `국문 주소지는 ${FIELD_LIMITS.addressKo}자 이내로 입력해 주세요.`,
    }
  }
  if (addressEn.length > FIELD_LIMITS.addressEn) {
    return {
      title: '영문 주소지 입력 오류',
      content: `영문 주소지는 ${FIELD_LIMITS.addressEn}자 이내로 입력해 주세요.`,
    }
  }
  if (kakaoMapHtml.length > FIELD_LIMITS.kakaoMapHtml) {
    return {
      title: '카카오맵 HTML 입력 오류',
      content: `카카오맵 HTML은 ${FIELD_LIMITS.kakaoMapHtml.toLocaleString()}자 이내로 입력해 주세요.`,
    }
  }
  if (kakaoMapHtml && !isValidKakaoRoughmapHtml(kakaoMapHtml)) {
    return kakaoMapHtmlFormatAlert()
  }
  if (phone.length > FIELD_LIMITS.phone) {
    return {
      title: '전화번호 입력 오류',
      content: `전화번호는 ${FIELD_LIMITS.phone}자 이내로 입력해 주세요.`,
    }
  }
  if (fax.length > FIELD_LIMITS.fax) {
    return {
      title: 'Fax 번호 입력 오류',
      content: `Fax 번호는 ${FIELD_LIMITS.fax}자 이내로 입력해 주세요.`,
    }
  }
  if (email.length > FIELD_LIMITS.email) {
    return {
      title: '이메일 주소 입력 오류',
      content: `이메일 주소는 ${FIELD_LIMITS.email}자 이내로 입력해 주세요.`,
    }
  }
  if (email && !EMAIL_RE.test(email)) {
    return {
      title: '이메일 주소 형식 오류',
      content: '올바른 이메일 주소 형식으로 입력해 주세요.',
    }
  }
  return null
}

/** API 저장 실패 — 필드/원인별 한글 알림 */
export function directionsSaveFailureAlert(error: unknown): DirectionsAlert {
  if (isOptimisticLockConflictError(error)) {
    return {
      title: '저장 실패',
      content: '다른 관리자가 내용을 수정했습니다.\n새로고침 후 다시 시도해 주세요.',
    }
  }

  const message = readApiErrorMessage(error) ?? ''

  if (/Kakao map HTML/i.test(message)) {
    return kakaoMapHtmlFormatAlert()
  }
  if (/koreanAddress|korean.?address/i.test(message)) {
    return {
      title: '국문 주소지 입력 오류',
      content: '국문 주소지 입력을 확인해 주세요.',
    }
  }
  if (/englishAddress|english.?address/i.test(message)) {
    return {
      title: '영문 주소지 입력 오류',
      content: '영문 주소지 입력을 확인해 주세요.',
    }
  }
  if (/\bemail\b/i.test(message)) {
    return {
      title: '이메일 주소 형식 오류',
      content: '올바른 이메일 주소 형식으로 입력해 주세요.',
    }
  }
  if (/\bphone\b/i.test(message)) {
    return {
      title: '전화번호 입력 오류',
      content: '전화번호 입력을 확인해 주세요.',
    }
  }
  if (/\bfax\b/i.test(message)) {
    return {
      title: 'Fax 번호 입력 오류',
      content: 'Fax 번호 입력을 확인해 주세요.',
    }
  }
  if (/Permission is denied|FORBIDDEN/i.test(message)) {
    return {
      title: '저장 실패',
      content: '오시는 길 저장 권한이 없습니다. 관리자에게 문의해 주세요.',
    }
  }

  return {
    title: '저장 실패',
    content: '오시는 길 정보 저장에 실패했습니다. 다시 시도해 주세요.',
  }
}
