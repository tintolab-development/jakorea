// 백엔드 공개 이미지(content) 경로만 보정합니다.
// download는 JSON 등 별도 계약일 수 있으므로 범위에서 제외합니다.
const PUBLIC_FILE_IMAGE_PATH =
  /^\/api\/portal\/public\/files\/[1-9]\d*\/content(?:[?#]|$)/

export function applyPortalPublicFileImageOrigin(url: string, apiOrigin: string): string {
  if (!PUBLIC_FILE_IMAGE_PATH.test(url)) return url
  const origin = apiOrigin.replace(/\/+$/, '')
  return origin ? `${origin}${url}` : url
}
