/**
 * CMS에서 공유하는 비로그인 설문은 사용자 Platform에서 열립니다.
 * CMS 오리진(window.location.origin)을 사용하면 관리자 API/화면 주소가
 * 외부 공유 링크에 들어가므로 환경별 Platform 오리진만 허용합니다.
 */
export function getPlatformPublicOrigin(): string | null {
  const raw = import.meta.env.VITE_PLATFORM_PUBLIC_ORIGIN?.trim()
  if (!raw) return null

  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.origin
  } catch {
    return null
  }
}
